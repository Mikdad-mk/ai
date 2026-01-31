"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, getUserProfile } from "@/lib/auth-service"
import { getAllSupportRequests, updateSupportRequestStatus, type SupportRequest } from "@/lib/support-service"
import { MessageSquare, ArrowLeft, Filter } from "lucide-react"
import Link from "next/link"

export default function AdminSupportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "resolved">("all")
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null)
  const [adminResponse, setAdminResponse] = useState("")

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

      await loadRequests()
    } catch (error) {
      console.error("Error checking admin access:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const loadRequests = async () => {
    try {
      const data = await getAllSupportRequests()
      setRequests(data)
    } catch (error) {
      console.error("Error loading support requests:", error)
    }
  }

  const handleUpdateStatus = async (requestId: string, status: "pending" | "in_progress" | "resolved") => {
    try {
      await updateSupportRequestStatus(requestId, status, adminResponse || undefined)
      setAdminResponse("")
      setSelectedRequest(null)
      await loadRequests()
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update request status")
    }
  }

  const filteredRequests = requests.filter((req) => (filter === "all" ? true : req.status === filter))

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
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
            <Link href="/admin">
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-xl font-bold text-gray-900">User Responses & Requests</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <div className="flex space-x-2">
            {["all", "pending", "in_progress", "resolved"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Requests Found</h3>
            <p className="text-gray-600">
              There are no {filter !== "all" ? filter : ""} support requests at the moment.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{request.subject}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}
                      >
                        {request.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">From:</span> {request.user_name} ({request.user_email})
                      </p>
                      <p>
                        <span className="font-medium">Date:</span> {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700">{request.message}</p>
                </div>

                {request.admin_response && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4 border-l-4 border-blue-500">
                    <p className="text-sm font-medium text-blue-900 mb-1">Admin Response:</p>
                    <p className="text-gray-700">{request.admin_response}</p>
                  </div>
                )}

                {selectedRequest?.id === request.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      placeholder="Add admin response (optional)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateStatus(request.id, "in_progress")}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Mark In Progress
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(request.id, "resolved")}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Mark Resolved
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(null)
                          setAdminResponse("")
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold py-2 rounded-lg transition-colors"
                  >
                    Respond to Request
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
