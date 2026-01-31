"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, getUserProfile, logoutUser } from "@/lib/auth-service"
import { getAdminStats, type AdminStats } from "@/lib/admin-service"
import { Users, MessageSquare, Settings, LogOut, BarChart3, Shield, Book, HelpCircle } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState("Admin")
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalChats: 0,
    activeToday: 0,
  })

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

      setAdminName(profile.full_name || "Admin")
      await loadStats()
    } catch (error) {
      console.error("[v0] Error checking admin access:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await getAdminStats()
      setStats(data)
    } catch (error) {
      console.error("[v0] Error loading stats:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
      router.push("/login")
    } catch (error) {
      console.error("[v0] Logout error:", error)
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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{adminName}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Chats</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalChats}</p>
              </div>
              <MessageSquare className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Today</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeToday}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Link href="/admin/users">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">User Management</h2>
              </div>
              <p className="text-gray-600 mb-4">Manage user accounts, roles, and permissions</p>
              <div className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold py-3 rounded-lg transition-colors text-center">
                View All Users
              </div>
            </div>
          </Link>

          <Link href="/admin/analytics">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3 mb-4">
                <MessageSquare className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">Chat Analytics</h2>
              </div>
              <p className="text-gray-600 mb-4">View chat history and usage patterns</p>
              <div className="w-full bg-green-50 hover:bg-green-100 text-green-600 font-semibold py-3 rounded-lg transition-colors text-center">
                View Analytics
              </div>
            </div>
          </Link>

          <Link href="/admin/settings">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3 mb-4">
                <Settings className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">System Settings</h2>
              </div>
              <p className="text-gray-600 mb-4">Configure application settings and features</p>
              <div className="w-full bg-purple-50 hover:bg-purple-100 text-purple-600 font-semibold py-3 rounded-lg transition-colors text-center">
                Configure Settings
              </div>
            </div>
          </Link>

          <Link href="/admin/reports">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3 mb-4">
                <BarChart3 className="w-6 h-6 text-orange-600" />
                <h2 className="text-xl font-bold text-gray-900">Reports</h2>
              </div>
              <p className="text-gray-600 mb-4">Generate detailed usage and performance reports</p>
              <div className="w-full bg-orange-50 hover:bg-orange-100 text-orange-600 font-semibold py-3 rounded-lg transition-colors text-center">
                Generate Reports
              </div>
            </div>
          </Link>

          <Link href="/admin/knowledge">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3 mb-4">
                <Book className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Knowledge Base</h2>
              </div>
              <p className="text-gray-600 mb-4">Upload and manage centralized knowledge documents for AI Ustad</p>
              <div className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold py-3 rounded-lg transition-colors text-center">
                Manage Knowledge Base
              </div>
            </div>
          </Link>

          <Link href="/admin/support">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3 mb-4">
                <HelpCircle className="w-6 h-6 text-pink-600" />
                <h2 className="text-xl font-bold text-gray-900">User Responses & Requests</h2>
              </div>
              <p className="text-gray-600 mb-4">View and respond to user support requests</p>
              <div className="w-full bg-pink-50 hover:bg-pink-100 text-pink-600 font-semibold py-3 rounded-lg transition-colors text-center">
                View Support Requests
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
