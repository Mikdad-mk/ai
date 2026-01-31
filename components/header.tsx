"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, User, Save, SettingsIcon, HelpCircle, LogOut, Sun, Moon } from "lucide-react"
import { signOutUser, getUserInitials, getCurrentUser, updateUserProfile, getUserProfile } from "@/lib/auth-service"
import { useTheme } from "@/contexts/theme-context"
import HelpSupportModal from "./help-support-modal"

export default function Header() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [userName, setUserName] = useState("User")
  const [userInitials, setUserInitials] = useState("AU")
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHelpSupport, setShowHelpSupport] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editName, setEditName] = useState("")
  const [isLoadingAuth, setIsLoadingAuth] = useState(false)

  const DEFAULT_AVATAR = "https://avatar.iran.liara.run/public/boy"

  const getVectorAvatar = (name: string) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
  }

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    if (isLoadingAuth) return
    setIsLoadingAuth(true)

    try {
      const user = await getCurrentUser()
      if (user) {
        setUserId(user.id)
        const profile = await getUserProfile(user.id)
        if (profile) {
          const displayName = profile.name || "User"
          setUserName(displayName)
          setUserInitials(profile.initials || "AU")
          setUserAvatar(profile.avatar_url || getVectorAvatar(displayName))

          localStorage.setItem(
            "ai_ustad_user_profile",
            JSON.stringify({
              name: profile.name,
              initials: profile.initials,
              avatar_url: profile.avatar_url || getVectorAvatar(displayName),
            }),
          )
        } else {
          setUserAvatar(getVectorAvatar("User"))
        }
      } else {
        const saved = localStorage.getItem("ai_ustad_user_profile")
        if (saved) {
          try {
            const profile = JSON.parse(saved)
            const displayName = profile.name || "User"
            setUserName(displayName)
            setUserInitials(profile.initials || "AU")
            setUserAvatar(profile.avatar_url || getVectorAvatar(displayName))
          } catch (error) {
            console.error("[v0] Error parsing saved profile:", error)
            setUserAvatar(getVectorAvatar("User"))
          }
        } else {
          setUserAvatar(getVectorAvatar("User"))
        }
      }
    } catch (error) {
      console.error("[v0] Error loading user profile:", error)
      setUserAvatar(getVectorAvatar("User"))
    } finally {
      setIsLoadingAuth(false)
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

        localStorage.setItem("ai_ustad_user_profile", JSON.stringify(updatedProfile))
        setUserName(updatedProfile.name)
        setUserInitials(updatedProfile.initials)
        setIsEditingProfile(false)
      }
    } catch (error) {
      console.error("[v0] Error updating profile:", error)
    }
  }

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      try {
        await signOutUser()
        localStorage.clear()
        router.push("/login")
      } catch (error) {
        console.error("[v0] Logout error:", error)
        localStorage.clear()
        router.push("/login")
      }
    }
  }

  return (
    <>
      <header className="flex items-center justify-between py-3 px-4 sm:px-6 bg-card border-b border-border">
        <h1 className="text-lg sm:text-xl font-semibold text-foreground">AI Ustad</h1>

        <button
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-muted transition-colors group"
        >
          <span className="text-sm text-muted-foreground hidden sm:inline">{userName}</span>
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-[oklch(0.60_0.14_80)] to-[oklch(0.55_0.12_75)] rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-md overflow-hidden">
            <img
              src={userAvatar || DEFAULT_AVATAR}
              alt={userName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none"
                e.currentTarget.parentElement!.textContent = userInitials
              }}
            />
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors hidden sm:block" />
        </button>
      </header>

      {showProfile && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in-95 border border-border">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[oklch(0.60_0.14_80)] to-[oklch(0.55_0.12_75)] rounded-full flex items-center justify-center mx-auto text-white font-bold text-2xl shadow-lg mb-4 overflow-hidden">
                <img src={userAvatar || DEFAULT_AVATAR} alt={userName} className="w-full h-full object-cover" />
              </div>

              {isEditingProfile ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 border border-border bg-secondary text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter new name"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateProfile}
                      className="flex-1 flex items-center justify-center space-x-2 bg-primary hover:bg-accent text-primary-foreground px-4 py-2 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 bg-secondary hover:bg-muted text-foreground px-4 py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-foreground">{userName}</h3>
                  <p className="text-sm text-muted-foreground mt-1">AI Ustad Assistant</p>
                </>
              )}
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="space-y-2">
              <button
                onClick={() => {
                  setEditName(userName)
                  setIsEditingProfile(true)
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors group text-left"
              >
                <User className="w-5 h-5 text-primary group-hover:text-accent" />
                <div>
                  <div className="font-medium text-foreground">Edit Profile</div>
                  <div className="text-xs text-muted-foreground">Update your name</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowProfile(false)
                  setShowSettings(true)
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors group text-left"
              >
                <SettingsIcon className="w-5 h-5 text-primary group-hover:text-accent" />
                <div>
                  <div className="font-medium text-foreground">Settings</div>
                  <div className="text-xs text-muted-foreground">Preferences & account</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowProfile(false)
                  setShowHelpSupport(true)
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors group text-left"
              >
                <HelpCircle className="w-5 h-5 text-primary group-hover:text-accent" />
                <div>
                  <div className="font-medium text-foreground">Help & Support</div>
                  <div className="text-xs text-muted-foreground">Get assistance</div>
                </div>
              </button>

              <div className="h-px bg-border my-2" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-destructive/10 transition-colors group text-left"
              >
                <LogOut className="w-5 h-5 text-destructive group-hover:text-destructive" />
                <div>
                  <div className="font-medium text-destructive">Logout</div>
                  <div className="text-xs text-muted-foreground">Sign out of your account</div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowProfile(false)}
              className="w-full mt-4 bg-secondary hover:bg-muted text-foreground px-4 py-3 rounded-xl transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {theme === "light" ? (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Sun className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Moon className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground">Appearance</h3>
                      <p className="text-sm text-muted-foreground">{theme === "light" ? "Light mode" : "Dark mode"}</p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                      theme === "dark"
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600"
                        : "bg-gradient-to-r from-amber-400 to-orange-500"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                        theme === "dark" ? "translate-x-7" : "translate-x-1"
                      }`}
                    >
                      {theme === "light" ? (
                        <Sun className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Moon className="w-4 h-4 text-indigo-500" />
                      )}
                    </div>
                  </button>
                </div>

                {/* Theme Options */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTheme("light")}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                      theme === "light" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="w-12 h-8 rounded-md bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-center">
                      <Sun className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                      theme === "dark" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="w-12 h-8 rounded-md bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600 flex items-center justify-center">
                      <Moon className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Dark</span>
                  </button>
                </div>
              </div>

              {/* Other Settings */}
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <h3 className="font-semibold text-foreground mb-2">More Settings</h3>
                <p className="text-sm text-muted-foreground">Additional preferences coming soon...</p>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-6 btn-gold text-white font-semibold py-3 rounded-xl transition-all duration-300"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {showHelpSupport && <HelpSupportModal isOpen={showHelpSupport} onClose={() => setShowHelpSupport(false)} />}
    </>
  )
}
