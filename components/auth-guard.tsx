"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, getUserProfile } from "@/lib/auth-service"

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser()

      if (!user) {
        router.push("/login")
        return
      }

      if (requireAdmin) {
        const profile = await getUserProfile(user.id)
        if (profile?.role !== "admin") {
          router.push("/")
          return
        }
      }

      setAuthorized(true)
    } catch (error) {
      console.error("[v0] Auth guard error:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return <>{children}</>
}
