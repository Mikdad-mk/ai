import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

export function createClient() {
  // Return existing client if already created
  if (client) {
    return client
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Supabase environment variables are missing. Please check your environment variables.")
    console.error("[v0] NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl || "missing")
    console.error("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "exists" : "missing")
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return client
}
