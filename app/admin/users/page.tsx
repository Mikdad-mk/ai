"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, getUserProfile } from "@/lib/auth-service"
import { getAllUsers, updateUserRole, type UserData } from "@/lib/admin-service"
import { ArrowLeft, User, Trash2 } from "lucide-react"
import Link from "next/link"

export default function UserManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserData[]>([])

  useEffect(() => {
    checkAdminAndLoadUsers()
  }, [])

  const checkAdminAndLoadUsers = async () => {
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

      await loadUsers()
    } catch (error) {
      console.error("[v0] Error loading users:", error)
      router.push("/admin")
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch (error) {
      console.error("[v0] Error fetching users:", error)
    }
  }

  const handleRoleChange = async (userId: string, newRole: "user" | "admin") => {
    try {
      await updateUserRole(userId, newRole)
      await loadUsers()
    } catch (error) {
      console.error("[v0] Error updating role:", error)
      alert("Failed to update user role")
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
            <h1 className="text-xl font-bold text-gray-900">User Management</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
            <h2 className="text-lg font-semibold text-gray-900">All Users ({users.length})</h2>
            <p className="text-sm text-gray-600 mt-1">Manage user accounts, roles, and permissions</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.full_name || "Anonymous"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as "user" | "admin")}
                        className={`text-sm font-medium px-3 py-1 rounded-full border-2 ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800 border-purple-200"
                            : "bg-gray-100 text-gray-800 border-gray-200"
                        }`}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete user (coming soon)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
