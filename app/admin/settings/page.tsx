"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, getUserProfile } from "@/lib/auth-service"
import { ArrowLeft, Settings, Save } from "lucide-react"
import Link from "next/link"

export default function SystemSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    appName: "AI Ustad",
    enableSignup: true,
    requireEmailVerification: false,
    maxChatHistory: 50,
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
    } catch (error) {
      console.error("[v0] Error checking admin access:", error)
      router.push("/admin")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = () => {
    // TODO: Implement settings save to database
    alert("Settings saved successfully!")
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
            <h1 className="text-xl font-bold text-gray-900">System Settings</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Settings className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Application Settings</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Application Name</label>
              <input
                type="text"
                value={settings.appName}
                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">Enable User Signup</label>
                <p className="text-xs text-gray-500 mt-1">Allow new users to create accounts</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, enableSignup: !settings.enableSignup })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enableSignup ? "bg-purple-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enableSignup ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">Require Email Verification</label>
                <p className="text-xs text-gray-500 mt-1">Users must verify email before login</p>
              </div>
              <button
                onClick={() =>
                  setSettings({ ...settings, requireEmailVerification: !settings.requireEmailVerification })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.requireEmailVerification ? "bg-purple-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.requireEmailVerification ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Chat History Messages</label>
              <input
                type="number"
                value={settings.maxChatHistory}
                onChange={(e) => setSettings({ ...settings, maxChatHistory: Number.parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum number of messages to include in AI context</p>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
