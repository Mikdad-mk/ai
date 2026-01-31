"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, getUserProfile } from "@/lib/auth-service"
import { getAdminStats, getChatAnalytics } from "@/lib/admin-service"
import { ArrowLeft, Download, FileText } from "lucide-react"
import Link from "next/link"

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
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
    } catch (error) {
      console.error("[v0] Error checking admin access:", error)
      router.push("/admin")
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async (type: string) => {
    try {
      const stats = await getAdminStats()
      const analytics = await getChatAnalytics()

      const report = {
        generatedAt: new Date().toISOString(),
        type,
        statistics: stats,
        analytics,
      }

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `ai-ustad-report-${type}-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("[v0] Error generating report:", error)
      alert("Failed to generate report")
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
            <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">Generate Reports</h2>
          </div>

          <p className="text-gray-600 mb-8">Download detailed usage and performance reports in JSON format</p>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">User Activity Report</h3>
              <p className="text-sm text-gray-600 mb-4">
                Comprehensive report including total users, active users, and engagement metrics
              </p>
              <button
                onClick={() => generateReport("user-activity")}
                className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Report</span>
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat Analytics Report</h3>
              <p className="text-sm text-gray-600 mb-4">
                Detailed analytics on chat sessions, messages, and usage patterns
              </p>
              <button
                onClick={() => generateReport("chat-analytics")}
                className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Report</span>
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete System Report</h3>
              <p className="text-sm text-gray-600 mb-4">
                Full report including all statistics, analytics, and system health metrics
              </p>
              <button
                onClick={() => generateReport("complete-system")}
                className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Report</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
