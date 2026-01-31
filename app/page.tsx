"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, getUserProfile } from "@/lib/auth-service"

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthAndRedirect()
  }, [])

  const checkAuthAndRedirect = async () => {
    try {
      console.log("[v0] Home page: checking auth...")
      const user = await getCurrentUser()

      if (!user) {
        console.log("[v0] Home page: no user, redirecting to login")
        router.push("/login")
        return
      }

      console.log("[v0] Home page: user found:", user.id)
      const profile = await getUserProfile(user.id)
      console.log("[v0] Home page: profile:", profile)

      if (!profile) {
        const storedProfile = localStorage.getItem("ai_ustad_user_profile")
        const parsedProfile = storedProfile ? JSON.parse(storedProfile) : null

        if (parsedProfile?.role === "admin") {
          console.log("[v0] Home page: redirecting to admin (from localStorage)")
          router.push("/admin")
        } else {
          console.log("[v0] Home page: redirecting to chat (no profile, using default)")
          router.push("/chat/general")
        }
        return
      }

      if (profile?.role === "admin") {
        console.log("[v0] Home page: redirecting to admin")
        router.push("/admin")
      } else {
        console.log("[v0] Home page: redirecting to chat")
        router.push("/chat/general")
      }
    } catch (error) {
      console.error("[v0] Unexpected error during auth check:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-primary font-medium">Loading AI Ustad...</p>
        </div>
      </div>
    )
  }

  return null
}
