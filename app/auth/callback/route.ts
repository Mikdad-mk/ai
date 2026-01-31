import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("[v0] OAuth callback error:", error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    if (data.user) {
      // Check if user profile exists, create or update with OAuth data
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle()

      // Extract Google profile data from user_metadata
      const fullName =
        data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User"
      const avatarUrl = data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null

      if (!profile && !profileError) {
        // Create profile for new OAuth user
        await supabase.from("user_profiles").insert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          avatar_url: avatarUrl,
          role: "user",
        })
      } else if (profile) {
        // Update existing profile with latest OAuth data
        await supabase
          .from("user_profiles")
          .update({
            full_name: fullName,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.user.id)
      }

      // Redirect to main app
      return NextResponse.redirect(`${origin}/chat/new`)
    }
  }

  // If no code or error, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
