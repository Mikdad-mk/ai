"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getCurrentUser, getUserProfile } from "@/lib/auth-service"
import { ArrowRight, Book, MessageCircle, Mic, Shield, CheckCircle, Sparkles, ScrollText, Play } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        setIsAuthenticated(true)
        // If user is already logged in, we can optionally redirect them immediately
        // or let them see the landing page with a "Go to Dashboard" button.
        // For "never affect functioning", let's redirect specific roles as before, 
        // but maybe give a slight delay or just redirect immediately if that was the old behavior.
        // The old behavior forced redirect. Let's respect "Landing Page" request by showing it
        // but changing the CTA to "Go to Dashboard".
        // Actually, usually a landing page is for public. If I am logged in, I usually want to go to app.
        // Let's redirect if logged in, to preserve "functioning" for existing users who expect to go to chat.

        const profile = await getUserProfile(user.id)
        if (profile?.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/chat/general")
        }
      } else {
        // Not logged in, stay on landing page
        setLoading(false)
      }
    } catch (error) {
      console.error("Auth check failed", error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f5f2] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative w-20 h-20 mb-4 animate-pulse">
            <img
              src="https://res.cloudinary.com/dqliogfsg/image/upload/v1764522883/AI_USTAD-01_fsgefv.png"
              alt="Loading"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="h-1 w-32 bg-amber-200 rounded-full overflow-hidden">
            <div className="h-full bg-amber-600 animate-progress"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fbf9f6] text-slate-800 font-sans selection:bg-amber-100 selection:text-amber-900">

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-amber-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-200 shadow-sm">
                <img
                  src="https://res.cloudinary.com/dqliogfsg/image/upload/v1764522883/AI_USTAD-01_fsgefv.png"
                  alt="AI Ustad"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-700 to-amber-900">
                AI USTHAD
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-amber-700 transition-colors hidden sm:block">
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm font-medium hover:shadow-lg hover:shadow-amber-600/20 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 inset-0 z-0 opacity-40">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-amber-200/20 blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-orange-100/30 blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* Text Content */}
            <div className="lg:w-1/2 text-center lg:text-left space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold tracking-wide uppercase shadow-sm">
                <Sparkles className="w-3 h-3" />
                <span>Scholar Intelligence V2.5</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                Your Intelligent <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                  Islamic Scholar
                </span>
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                AI Ustad delivers authentic Islamic knowledge rooted in the principles of <span className="font-semibold text-amber-800">Ahlussunnah wal Jama'a</span>.
                Trained on the authoritative text of <span className="italic font-serif text-slate-800">Fathul Mueen</span>, it provides accurate, context-aware guidance for your questions.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
                >
                  <MessageCircle className="w-5 h-5" />
                  Start Asking Now
                </Link>
                <Link
                  href="#features"
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-700 border border-slate-200 font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Watch Demo
                </Link>
              </div>

              <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                {/* Trusted Badges Placeholder */}
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Verified Sources</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Ahlussunnah Compliant</span>
                </div>
              </div>
            </div>

            {/* Visual Content */}
            <div className="lg:w-1/2 relative">
              <div className="relative z-10 bg-white p-2 rounded-3xl shadow-2xl border border-slate-100 transform rotate-[-2deg] hover:rotate-0 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent rounded-3xl" />
                <div className="relative rounded-2xl overflow-hidden bg-slate-50 aspect-[4/3] flex items-center justify-center group">
                  {/* Abstract Representation of AI Scholar Interface */}
                  <div className="absolute inset-0 bg-[url('/images/ponnani-makhdoom-mosque.webp')] bg-cover bg-center opacity-10 group-hover:scale-105 transition-transform duration-700"></div>
                  <div className="relative z-20 text-center p-8">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Book className="w-10 h-10 text-amber-700" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Fathul Mueen</h3>
                    <p className="text-slate-500 text-sm">The Foundation of Knowledge</p>

                    <div className="mt-8 flex justify-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative card */}
              <div className="absolute -bottom-10 -left-10 z-20 bg-white p-4 rounded-xl shadow-xl border border-slate-100 max-w-xs animate-in slide-in-from-bottom-5 fade-in duration-1000 delay-300">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Authentic Guidance</p>
                    <p className="text-[10px] text-slate-500 leading-tight mt-1">Every response is cross-referenced with established Fiqh methodology.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Scholarly Depth, Modern Accessibility</h2>
            <p className="text-slate-600">Bridging the gap between traditional Islamic scholarship and contemporary artificial intelligence.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-300">
              <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ScrollText className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Kitab-Based Reasoning</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Unlike generic AI, AI Ustad is grounded in the texts of <span className="font-semibold text-amber-700">Fathul Mueen</span>, ensuring answers adhere to the Shafi'i madhhab requirements.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-300">
              <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Mic className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Natural Interaction</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Ask questions using your voice or text. Experience fluid conversations that feel like consulting a knowledgeable friend.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-300">
              <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Verified Methodology</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Built strictly on the methodology of <span className="font-semibold text-amber-700">Ahlussunnah wal Jama'a</span>, protecting you from unverified or deviant opinions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 px-6 py-16 md:px-16 md:py-20 text-center">

            {/* Glow effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-500/20 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to seek knowledge?</h2>
              <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
                Join thousands of users trusting AI Ustad for their daily Islamic queries. Accurate, Private, and Available 24/7.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup" className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-amber-500/25">
                  Create Free Account
                </Link>
                <Link href="/login" className="px-8 py-4 bg-transparent border border-slate-600 text-white hover:bg-slate-800 rounded-full font-bold text-lg transition-all">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
              <img
                src="https://res.cloudinary.com/dqliogfsg/image/upload/v1764522883/AI_USTAD-01_fsgefv.png"
                alt="AI Ustad"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-semibold text-slate-900">AI USTHAD</span>
          </div>

          <div className="text-sm text-slate-500">
            © {new Date().getFullYear()} AI Ustad. All rights reserved.
          </div>

          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-amber-600 transition-colors">Privacy</a>
            <a href="#" className="text-slate-400 hover:text-amber-600 transition-colors">Terms</a>
            <a href="#" className="text-slate-400 hover:text-amber-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
