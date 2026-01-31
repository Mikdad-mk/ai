"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { X, Menu, Plus, Trash2, MessageCircle, Edit2, Save, User, LogOut } from "lucide-react"
import { getCurrentUser, getUserProfile, updateUserProfile } from "@/lib/auth-service"
import { getChatSessions, deleteChatSession, renameChatSession } from "@/lib/chat-service"

interface SidebarProps {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  onMinimizedChange?: (isMinimized: boolean) => void
}

interface ChatItem {
  id: string
  title: string
  created_at: string
}

const getUserInitials = (name: string): string => {
  const names = name.split(" ")
  return names.map((n) => n.charAt(0).toUpperCase()).join("")
}

export default function Sidebar({ isSidebarOpen, toggleSidebar, onMinimizedChange }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [chats, setChats] = useState<ChatItem[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [userName, setUserName] = useState("User")
  const [userInitials, setUserInitials] = useState("AU")
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingChatTitle, setEditingChatTitle] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)

  const loadChatHistory = useCallback(async () => {
    if (!userId) return

    try {
      const sessions = await getChatSessions(userId)
      setChats(sessions)
    } catch (error) {
      console.error("[v0] Error loading chat history:", error)
    }
  }, [userId])

  useEffect(() => {
    const initializeSidebar = async () => {
      if (isInitializing) return
      setIsInitializing(true)

      try {
        console.log("[v0] Initializing sidebar...")
        const user = await getCurrentUser()

        if (user) {
          setUserId(user.id)

          // Load chat history
          const sessions = await getChatSessions(user.id)
          setChats(sessions)

          // Load user profile
          const profile = await getUserProfile(user.id)
          if (profile) {
            setUserName(profile.name || "User")
            setUserInitials(profile.initials || "AU")
            setUserAvatar(profile.avatar_url || null)

            localStorage.setItem("ai_ustad_user_name", profile.name || "User")
            localStorage.setItem("ai_ustad_user_initials", profile.initials || "AU")
            if (profile.avatar_url) {
              localStorage.setItem("ai_ustad_user_avatar", profile.avatar_url)
            }
          }
        }

        // Load minimized state
        const saved = localStorage.getItem("ai_ustad_sidebar_minimized")
        if (saved) {
          setIsMinimized(JSON.parse(saved))
        }
      } catch (error) {
        console.error("[v0] Error initializing sidebar:", error)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeSidebar()
  }, [])

  useEffect(() => {
    if (!userId) return

    const handleStorageChange = () => {
      loadChatHistory()
    }

    window.addEventListener("storage", handleStorageChange)
    const interval = setInterval(loadChatHistory, 30000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [userId, loadChatHistory])

  useEffect(() => {
    localStorage.setItem("ai_ustad_sidebar_minimized", JSON.stringify(isMinimized))
  }, [isMinimized])

  const handleNewChat = async () => {
    try {
      if (!userId) {
        const user = await getCurrentUser()
        if (!user) {
          router.push("/login")
          return
        }
        setUserId(user.id)
      }

      router.push(`/chat/new`)
      toggleSidebar()
      // Refresh chat history after a short delay
      setTimeout(() => {
        loadChatHistory()
      }, 100)
    } catch (error) {
      console.error("[v0] Error creating new chat:", error)
    }
  }

  const handleSelectChat = (id: string) => {
    router.push(`/chat/${id}`)
    toggleSidebar()
  }

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      try {
        await deleteChatSession(userId!)
        localStorage.clear()
        router.push("/login")
      } catch (error) {
        console.error("[v0] Logout error:", error)
        localStorage.clear()
        router.push("/login")
      }
    }
  }

  const handleUpdateProfile = async () => {
    if (!editName.trim()) return

    try {
      if (userId) {
        const initials = getUserInitials(editName)

        const updatedProfile = await updateUserProfile(userId, {
          name: editName,
          initials,
        })

        localStorage.setItem("ai_ustad_user_name", updatedProfile.name)
        localStorage.setItem("ai_ustad_user_initials", updatedProfile.initials)
        if (updatedProfile.avatar_url) {
          localStorage.setItem("ai_ustad_user_avatar", updatedProfile.avatar_url)
        }
        setUserName(updatedProfile.name)
        setUserInitials(updatedProfile.initials)
        setIsEditingProfile(false)
      }
    } catch (error) {
      console.error("[v0] Error updating profile:", error)
    }
  }

  const handleRenameChat = async (chatId: string) => {
    if (!editingChatTitle.trim()) return

    try {
      await renameChatSession(chatId, editingChatTitle.trim())
      setEditingChatId(null)
      setEditingChatTitle("")
      loadChatHistory()
    } catch (error) {
      console.error("[v0] Error renaming chat:", error)
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChatSession(chatId)
      loadChatHistory()
    } catch (error) {
      console.error("[v0] Error deleting chat:", error)
    }
  }

  const startEditingChat = (chat: ChatItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingChatId(chat.id)
    setEditingChatTitle(chat.title)
  }

  const cancelEditingChat = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingChatId(null)
    setEditingChatTitle("")
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else if (date.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString("en-US", { weekday: "short" })
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
  }

  const currentChatId = pathname.split("/").pop()

  const handleMinimizeToggle = () => {
    const newMinimized = !isMinimized
    setIsMinimized(newMinimized)
    onMinimizedChange?.(newMinimized)
  }

  return (
    <>
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-1/2 -translate-y-1/2 left-0 z-50 lg:hidden bg-gradient-to-r from-[oklch(0.55_0.12_75)] to-[oklch(0.50_0.14_75)] p-2 pl-1 rounded-r-full shadow-lg hover:shadow-xl transition-all duration-300 hover:pl-2 group"
          aria-label="Open sidebar"
        >
          <svg
            className="w-5 h-5 text-white transition-transform group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={toggleSidebar} aria-hidden="true" />
      )}

      {/* Sidebar - Made fixed on all screen sizes */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-card border-r border-border shadow-xl transition-all duration-300 z-40 flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isMinimized ? "w-20" : "w-64"}`}
      >
        <div className="p-4 border-b border-border bg-card/60 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            {isMinimized && (
              <button
                onClick={toggleSidebar}
                className="flex items-center justify-center w-6 h-6 rounded hover:bg-muted transition-colors text-primary"
                aria-label="Close sidebar"
              ></button>
            )}
            {!isMinimized && (
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto overflow-hidden">
                <img
                  src="https://res.cloudinary.com/dqliogfsg/image/upload/v1764522883/AI_USTAD-01_fsgefv.png"
                  alt="AI Ustad Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSidebar}
                className="lg:hidden flex items-center justify-center w-6 h-6 rounded hover:bg-muted transition-colors text-primary"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={handleMinimizeToggle}
                className={`hidden lg:flex items-center justify-center transition-colors ${isMinimized ? "mx-auto w-10 h-10 rounded-full overflow-hidden" : "w-6 h-6 rounded hover:bg-muted"}`}
                title={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
              >
                {isMinimized ? (
                  <img
                    src="https://res.cloudinary.com/dqliogfsg/image/upload/v1764522883/AI_USTAD-01_fsgefv.png"
                    alt="AI Ustad Logo"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <Menu className="w-5 h-5 text-primary" />
                )}
              </button>
            </div>
          </div>

          {!isMinimized && (
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-accent text-primary-foreground font-semibold py-2 px-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>New Chat</span>
            </button>
          )}
        </div>

        {!isMinimized && (
          <div className="flex-1 min-h-0 overflow-y-auto py-4 px-2 space-y-2 justify-start">
            {chats.length > 0
              ? chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`w-full rounded-lg transition-all duration-300 group ${
                      currentChatId === chat.id
                        ? "bg-muted text-foreground"
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {!isMinimized && editingChatId === chat.id ? (
                      <div className="p-2 flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingChatTitle}
                          onChange={(e) => setEditingChatTitle(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-border rounded focus:ring-1 focus:ring-ring focus:border-transparent bg-card"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameChat(chat.id)
                            if (e.key === "Escape") setEditingChatId(null)
                          }}
                        />
                        <button
                          onClick={() => handleRenameChat(chat.id)}
                          className="p-1 hover:bg-green-100 rounded text-green-600"
                          title="Save"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditingChat}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectChat(chat.id)}
                        className="w-full text-left p-3 flex items-center justify-between"
                        title={isMinimized ? chat.title : undefined}
                      >
                        {!isMinimized && (
                          <div className="flex-1 min-w-0 mr-2">
                            <div className="truncate font-medium text-sm">{chat.title}</div>
                            <div className="text-xs text-gray-500 mt-1">{formatDate(chat.created_at)}</div>
                          </div>
                        )}
                        {isMinimized && (
                          <div className="flex items-center justify-center w-full">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                currentChatId === chat.id ? "bg-primary" : "bg-primary/60"
                              }`}
                            />
                          </div>
                        )}
                        {!isMinimized && (
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => startEditingChat(chat, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted-foreground/20 rounded transition-all"
                              title="Rename chat"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteChat(chat.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                              title="Delete chat"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </button>
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                ))
              : !isMinimized && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No chats yet</p>
                    <p className="text-gray-400 text-xs mt-2">Start a new chat to begin</p>
                  </div>
                )}
          </div>
        )}
        {/* </CHANGE> */}
      </aside>

      {showProfile && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in-95">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto text-white font-bold text-2xl shadow-lg mb-4 overflow-hidden">
                {userAvatar ? (
                  <img src={userAvatar || "/placeholder.svg"} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  userInitials
                )}
              </div>

              {isEditingProfile ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Enter new name"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateProfile}
                      className="flex-1 flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-gray-900">{userName}</h3>
                  <p className="text-sm text-gray-500 mt-1">AI Ustad Assistant</p>
                </>
              )}
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />

            <div className="space-y-2">
              <button
                onClick={() => {
                  setEditName(userName)
                  setIsEditingProfile(true)
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-50 transition-colors group text-left"
              >
                <User className="w-5 h-5 text-amber-600 group-hover:text-amber-700" />
                <div>
                  <div className="font-medium text-gray-900">Edit Profile</div>
                  <div className="text-xs text-gray-500">Update your name</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowProfile(false)
                  setShowSettings(true)
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-50 transition-colors group text-left"
              >
                <MessageCircle className="w-5 h-5 text-amber-600 group-hover:text-amber-700" />
                <div>
                  <div className="font-medium text-gray-900">Settings</div>
                  <div className="text-xs text-gray-500">Preferences & account</div>
                </div>
              </button>

              <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-amber-50 transition-colors group text-left">
                <Edit2 className="w-5 h-5 text-amber-600 group-hover:text-amber-700" />
                <div>
                  <div className="font-medium text-gray-900">Help & Support</div>
                  <div className="text-xs text-gray-500">Get assistance</div>
                </div>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 transition-colors group text-left"
              >
                <LogOut className="w-5 h-5 text-red-600 group-hover:text-red-700" />
                <div>
                  <div className="font-medium text-red-900">Log Out</div>
                  <div className="text-xs text-red-600">Sign out from AI Ustad</div>
                </div>
              </button>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />

            <button
              onClick={() => {
                setShowProfile(false)
                setIsEditingProfile(false)
              }}
              className="w-full mt-4 py-2 px-4 bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 text-amber-900 font-semibold rounded-lg transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Settings</h3>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />

            <div className="space-y-4 text-center py-4">
              <p className="text-gray-600">More settings coming soon!</p>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-4 py-2 px-4 bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 text-amber-900 font-semibold rounded-lg transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
