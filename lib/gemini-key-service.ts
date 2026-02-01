import { createClient } from "@supabase/supabase-js"

// Initialize a Supabase client with Service Role Key for secure backend access
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface GeminiKey {
    id: string
    key_value: string
    label?: string
    is_active: boolean
    is_primary: boolean
    error_count: number
    last_used_at?: string
    created_at: string
}

export const GeminiKeyService = {
    /**
     * Fetches all active keys, prioritized by Primary first, then by error count (ascending).
     * Falls back to environment variables if no keys are found in DB.
     */
    async getAvailableKeys(): Promise<string[]> {
        try {
            // 1. Try to fetch from DB
            const { data: dbKeys, error } = await supabaseAdmin
                .from("gemini_api_keys")
                .select("key_value")
                .eq("is_active", true)
                .order("is_primary", { ascending: false }) // Primary first
                .order("error_count", { ascending: true }) // Then least errors
                .order("last_used_at", { ascending: true }) // Then least recently used (optional round robin effect)

            if (!error && dbKeys && dbKeys.length > 0) {
                return dbKeys.map((k) => k.key_value)
            }

            console.warn("[GeminiKeyService] No DB keys found or error, falling back to env vars", error?.message)
        } catch (err) {
            console.error("[GeminiKeyService] Error fetching keys:", err)
        }

        // 2. Fallback to Environment Variables
        const envKeys = [
            process.env.GEMINI_API_KEY,
            process.env.GEMINI_API_KEY_2,
            process.env.GEMINI_API_KEY_3,
            process.env.GEMINI_API_KEY_4,
            process.env.GEMINI_API_KEY_5,
            "AIzaSyAMzJeZTkDIapDQxZnS8nSRBtxySXmf2vE", // Legacy hardcoded fallback
        ].filter((key): key is string => !!key && key.trim().length > 0)

        return Array.from(new Set(envKeys)) // Deduplicate
    },

    /**
     * Reports an error for a specific key.
     * Increments error count. If count exceeds threshold, could auto-disable (logic optional).
     */
    async reportError(keyValue: string) {
        // Only attempt to update if looks like a DB-managed key (not checking source explicitly here for speed, but benign if fails for env key)
        try {
            // We first find the ID to avoid updating non-existent records
            const { data } = await supabaseAdmin
                .from("gemini_api_keys")
                .select("id, error_count")
                .eq("key_value", keyValue)
                .single()

            if (data) {
                await supabaseAdmin
                    .from("gemini_api_keys")
                    .update({
                        error_count: (data.error_count || 0) + 1,
                        last_used_at: new Date().toISOString(),
                    })
                    .eq("id", data.id)
            }
        } catch (err) {
            // Ignore errors (e.g. if key was from env var)
        }
    },

    /**
     * Reports successful usage for a key.
     * Resets error count (optional strategy) or just updates timestamp.
     */
    async reportSuccess(keyValue: string) {
        try {
            const { data } = await supabaseAdmin
                .from("gemini_api_keys")
                .select("id")
                .eq("key_value", keyValue)
                .single()

            if (data) {
                await supabaseAdmin.from("gemini_api_keys").update({
                    last_used_at: new Date().toISOString(),
                    // Optional: decrease error count on success? 
                    // error_count: 0 // Resetting on success is generous but risky if intermittent. Let's keep cumulative or logic elsewhere.
                }).eq("id", data.id)
            }
        } catch (error) {
            // Ignore
        }
    },

    // -- Admin Management Methods --

    async getAllKeys() {
        return await supabaseAdmin
            .from("gemini_api_keys")
            .select("*")
            .order("created_at", { ascending: false })
    },

    async addKey(keyValue: string, label?: string) {
        // Check if it's the first key, make it primary if so
        const { count } = await supabaseAdmin.from("gemini_api_keys").select("*", { count: 'exact', head: true })
        const isPrimary = count === 0;

        return await supabaseAdmin.from("gemini_api_keys").insert({
            key_value: keyValue,
            label,
            is_primary: isPrimary
        }).select().single()
    },

    async deleteKey(id: string) {
        return await supabaseAdmin.from("gemini_api_keys").delete().eq("id", id)
    },

    async setPrimary(id: string) {
        // Unset current primary
        await supabaseAdmin.from("gemini_api_keys").update({ is_primary: false }).neq("id", "00000000-0000-0000-0000-000000000000")
        // Set new primary
        return await supabaseAdmin.from("gemini_api_keys").update({ is_primary: true }).eq("id", id)
    },

    async toggleActive(id: string, currentState: boolean) {
        return await supabaseAdmin.from("gemini_api_keys").update({ is_active: !currentState }).eq("id", id)
    }
}
