"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInUser, signInWithGoogle } from "@/lib/auth-service"
import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      console.log("[v0] Login: attempting signin...")
      const { user, profile } = await signInUser(email, password)
      console.log("[v0] Login: signin successful, user:", user.id, "profile:", profile)

      localStorage.setItem("ai_ustad_user_profile", JSON.stringify(profile))
      localStorage.setItem("ai_ustad_user_id", user.id)

      await new Promise((resolve) => setTimeout(resolve, 100))

      if (profile.role === "admin") {
        console.log("[v0] Login: redirecting to admin...")
        router.push("/admin")
      } else {
        console.log("[v0] Login: redirecting to chat...")
        router.push("/chat/general")
      }
    } catch (err: any) {
      console.error("[v0] Login error:", err)

      if (err.message?.includes("Supabase configuration")) {
        setError("System configuration error. Please contact support.")
      } else if (err.message?.includes("Invalid login credentials")) {
        setError("Invalid email or password. Don't have an account yet? Sign up first!")
      } else if (err.message?.includes("Email not confirmed")) {
        setError("Please confirm your email before signing in. Check your inbox for the confirmation link.")
      } else {
        setError(err.message || "Failed to login. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError("")
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err: any) {
      console.error("[v0] Google login error:", err)
      setError("Failed to login with Google. Please try again.")
      setLoading(false)
    }
  }

  const fillAdminCredentials = () => {
    setEmail("admin@aiustad.app")
    setPassword("admin9745")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-3xl shadow-2xl p-8 space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden">
              <img
                src="https://res.cloudinary.com/dqliogfsg/image/upload/v1764522883/AI_USTAD-01_fsgefv.png"
                alt="AI Ustad Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
            <p className="text-muted-foreground mt-2">Sign in to AI Ustad</p>
          </div>

          {error && error.includes("System configuration") && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-destructive text-sm font-semibold">Supabase configuration is missing</p>
                </div>
              </div>
            </div>
          )}

          {error && !error.includes("System configuration") && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-card border-2 border-border hover:border-primary/50 text-foreground font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-4 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[oklch(0.60_0.14_80)] to-[oklch(0.55_0.12_75)] hover:from-[oklch(0.65_0.15_80)] hover:to-[oklch(0.60_0.14_80)] text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-border">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary hover:text-accent font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
