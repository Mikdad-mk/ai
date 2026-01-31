"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, getUserProfile } from "@/lib/auth-service"
import { getChatAnalytics, type ChatAnalytics } from "@/lib/admin-service"
import { ArrowLeft, MessageSquare, TrendingUp, Calendar, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function ChatAnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<ChatAnalytics>({
    totalMessages: 0,
    averageMessagesPerChat: 0,
    chatsCreatedToday: 0,
    messagesCreatedToday: 0,
  })

  useEffect(() => {
    checkAdminAndLoadAnalytics()
  }, [])

  const checkAdminAndLoadAnalytics = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push("/login")
        return
      }

      const profile = await getUserProfile(user.id)
      if (!profile || profile.role !== "admin") {
        router.push("/")
        return
      }

      await loadAnalytics()
    } catch (error) {
      console.error("[v0] Error loading analytics:", error)
      router.push("/admin")
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      const data = await getChatAnalytics()
      setAnalytics(data)
    } catch (error) {
      console.error("[v0] Error fetching analytics:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 space-x-4">
            <Link
              href="/admin"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-xl font-bold text-gray-900">Chat Analytics</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalMessages}</p>
              </div>
              <MessageSquare className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Messages/Chat</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.averageMessagesPerChat}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chats Today</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.chatsCreatedToday}</p>
              </div>
              <Calendar className="w-12 h-12 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages Today</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.messagesCreatedToday}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Usage Patterns</h2>
          <p className="text-gray-600 mb-6">
            View detailed chat history and usage patterns. Advanced analytics features coming soon.
          </p>
          <div className="h-64 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 text-lg">Chart visualization coming soon</p>
          </div>
        </div>
      </main>
    </div>
  )
}
