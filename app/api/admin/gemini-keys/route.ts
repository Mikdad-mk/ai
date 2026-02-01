
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { GeminiKeyService } from "@/lib/gemini-key-service"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

// Helper to check admin status
async function isAdmin() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Check profile
    // Note: We use a separate admin client to check role to be safe, or just trust the profile table policies if visible
    // But strictly, we should verify role.
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await supabaseAdmin.from("user_profiles").select("role").eq("id", user.id).single()
    return profile?.role === "admin"
}

export async function GET() {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { data, error } = await GeminiKeyService.getAllKeys()
        if (error) throw error
        return NextResponse.json(data)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { key, label } = await req.json()
        if (!key) return NextResponse.json({ error: "Key is required" }, { status: 400 })

        const { data, error } = await GeminiKeyService.addKey(key, label)
        if (error) throw error
        return NextResponse.json(data)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 })

        const { error } = await GeminiKeyService.deleteKey(id)
        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { id, action } = await req.json()

        if (action === "set_primary") {
            const { error } = await GeminiKeyService.setPrimary(id)
            if (error) throw error
        } else if (action === "toggle_active") {
            // We need current state, but let's just pass a param or fetch it. 
            // For simplicity, let's assume the client sends the current state to flip, or we request fetch.
            // The service `toggleActive` needs the current state.
            // Actually service assumes "toggle" logic might be improved if we just pass desired state.
            // Let's fetch it first.
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            )
            const { data } = await supabaseAdmin.from("gemini_api_keys").select("is_active").eq("id", id).single()
            if (data) {
                await GeminiKeyService.toggleActive(id, data.is_active)
            }
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
