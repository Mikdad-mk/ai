"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signUpUser, signInWithGoogle } from "@/lib/auth-service"
import { User, Mail, Lock, Eye, EyeOff, UserPlus, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      const { user, profile } = await signUpUser(email, password, name)

      localStorage.setItem("ai_ustad_user_profile", JSON.stringify(profile))
      localStorage.setItem("ai_ustad_user_id", user.id)

      setSuccess(true)

      setTimeout(() => {
        router.push("/chat/general")
      }, 1500)
    } catch (err: any) {
      console.error("[v0] Signup error:", err)

      if (err.message?.includes("already registered") || err.message?.includes("already exists")) {
        setError("This email is already registered. Please try logging in instead.")
      } else if (err.message?.includes("invalid email")) {
        setError("Invalid email address. Please check and try again.")
      } else if (err.message?.includes("weak password") || err.message?.includes("password")) {
        setError("Password is too weak. Please use at least 6 characters.")
      } else {
        setError(err.message || "Failed to create account. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError("")
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err: any) {
      console.error("[v0] Google signup error:", err)
      setError("Failed to sign up with Google. Please try again.")
      setLoading(false)
    }
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
            <h1 className="text-3xl font-bold text-foreground">Join AI Ustad</h1>
            <p className="text-muted-foreground mt-2">Create your account</p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-600 dark:text-green-400 text-sm">
                Account created successfully! Redirecting to chat...
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignup}
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

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

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

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
                  placeholder="••••••••"
                  required
                />
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
                  <UserPlus className="w-5 h-5" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-border">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:text-accent font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
