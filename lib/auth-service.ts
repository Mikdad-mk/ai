import { createClient } from "./supabase/client"

export interface UserProfile {
  id: string
  email: string
  name: string
  initials: string
  role: "user" | "admin"
  created_at: string
  avatar_url?: string | null
}

const ADMIN_EMAIL = "admin@aiustad.app"
const ADMIN_PASSWORD = "admin9745"

export function getUserInitials(name: string): string {
  return (
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || "AU"
  )
}

export async function signUpUser(email: string, password: string, name: string) {
  const supabase = createClient()

  const initials = getUserInitials(name)

  const role = email === ADMIN_EMAIL ? "admin" : "user"

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: (() => {
        let origin = window.location.origin
        if (window.location.hostname === "localhost" && process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL) {
          origin = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
        }
        return `${origin.replace(/\/$/, "")}/`
      })(),
      data: {
        full_name: name,
        initials,
        role,
      },
    },
  })

  if (error) throw error
  if (!data.user) throw new Error("Failed to create user")

  const { error: insertError } = await supabase.from("user_profiles").insert({
    id: data.user.id,
    email: data.user.email || email,
    full_name: name,
    avatar_url: null,
    role: role,
  })

  if (insertError) {
    console.warn("[v0] Failed to create profile, will use metadata:", insertError)
  }

  await new Promise((resolve) => setTimeout(resolve, 1000))

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle()

  if (profileError || !profile) {
    console.warn("[v0] Profile fetch error:", profileError)
    return {
      user: data.user,
      profile: {
        id: data.user.id,
        email: data.user.email || email,
        name,
        initials,
        role,
        created_at: new Date().toISOString(),
        avatar_url: null,
      },
    }
  }

  return {
    user: data.user,
    profile: {
      id: profile.id,
      email: profile.email,
      name: profile.full_name || email.split("@")[0],
      initials: initials,
      role: profile.role as "user" | "admin",
      created_at: profile.created_at,
      avatar_url: profile.avatar_url,
    },
  }
}

export async function signInUser(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  if (!data.user) throw new Error("Failed to sign in")

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle()

  if (!profile) {
    console.log("[v0] No profile found, creating one...")
    const initials = (data.user.email || email).substring(0, 2).toUpperCase()
    const fullName = data.user.user_metadata?.full_name || email.split("@")[0]
    const role = email === ADMIN_EMAIL ? "admin" : data.user.user_metadata?.role || "user"

    const { data: newProfile, error: insertError } = await supabase
      .from("user_profiles")
      .insert({
        id: data.user.id,
        email: data.user.email || email,
        full_name: fullName,
        avatar_url: data.user.user_metadata?.avatar_url || null,
        role: role,
      })
      .select()
      .maybeSingle()

    if (insertError || !newProfile) {
      console.warn("[v0] Failed to create profile on signin, using metadata:", insertError)
      return {
        user: data.user,
        profile: {
          id: data.user.id,
          email: data.user.email || email,
          name: fullName,
          initials,
          role: role as "user" | "admin",
          created_at: data.user.created_at || new Date().toISOString(),
          avatar_url: data.user.user_metadata?.avatar_url || null,
        },
      }
    }

    return {
      user: data.user,
      profile: {
        id: newProfile.id,
        email: newProfile.email,
        name: newProfile.full_name || email.split("@")[0],
        initials,
        role: newProfile.role as "user" | "admin",
        created_at: newProfile.created_at,
        avatar_url: newProfile.avatar_url,
      },
    }
  }

  return {
    user: data.user,
    profile: {
      id: profile.id,
      email: profile.email,
      name: profile.full_name || email.split("@")[0],
      initials: (profile.full_name || email).substring(0, 2).toUpperCase(),
      role: profile.role as "user" | "admin",
      created_at: profile.created_at,
      avatar_url: profile.avatar_url,
    },
  }
}

export async function logoutUser() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function signOutUser() {
  return logoutUser()
}

export async function getCurrentUser() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      // Only log actual errors, not missing sessions
      if (error.message !== "Auth session missing!") {
        console.error("[v0] Auth error:", error.message)
      }
      return null
    }

    return user
  } catch (error) {
    console.error("[v0] Failed to get current user:", error)
    return null
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!uid || uid === "undefined") {
    console.error("[v0] Error fetching profile: invalid or missing user ID")
    return null
  }

  const supabase = createClient()

  const { data: profile, error } = await supabase.from("user_profiles").select("*").eq("id", uid).maybeSingle()

  if (error) {
    console.error("[v0] Error fetching profile:", error)
    return null
  }

  if (!profile) {
    console.warn("[v0] No profile found for user:", uid)
    return null
  }

  return {
    id: profile.id,
    email: profile.email,
    name: profile.full_name || profile.email.split("@")[0],
    initials: (profile.full_name || profile.email).substring(0, 2).toUpperCase(),
    role: profile.role as "user" | "admin",
    created_at: profile.created_at,
    avatar_url: profile.avatar_url,
  }
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>) {
  const supabase = createClient()

  const dbUpdates: any = {}
  if (updates.name) dbUpdates.full_name = updates.name
  if (updates.email) dbUpdates.email = updates.email
  if (updates.role) dbUpdates.role = updates.role
  if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url

  const { data, error } = await supabase.from("user_profiles").update(dbUpdates).eq("id", uid).select().single()

  if (error) throw error

  return {
    id: data.id,
    email: data.email,
    name: data.full_name || data.email.split("@")[0],
    initials: (data.full_name || data.email).substring(0, 2).toUpperCase(),
    role: data.role as "user" | "admin",
    created_at: data.created_at,
    avatar_url: data.avatar_url,
  }
}

export async function signInWithGoogle() {
  const supabase = createClient()

  let origin = window.location.origin
  // Only use the environment override if we are on localhost (dev mode)
  // This prevents production deployments from accidentally redirecting to localhost if the env var is set
  if (window.location.hostname === "localhost" && process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL) {
    origin = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
  }
  origin = origin.replace(/\/$/, "")
  const redirectTo = `${origin}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  })
  if (error) throw error
  return data
}
