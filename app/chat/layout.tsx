"use client"

import type React from "react"
import { useState } from "react"
import Header from "@/components/header"
import ChatPanel from "@/components/chat-panel"
import Sidebar from "@/components/sidebar"
import AuthGuard from "@/components/auth-guard"
import { Info } from "lucide-react"

export default function ChatLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { chatId: string }
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false)
  const [showInfoPopup, setShowInfoPopup] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <AuthGuard>
      <div className="bg-background h-screen flex overflow-hidden">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          onMinimizedChange={setIsSidebarMinimized}
        />

        <div
          className={`flex-1 flex flex-col h-screen overflow-y-auto transition-all duration-300 ${
            isSidebarMinimized ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          <div className="max-w-6xl mx-auto w-full p-2 sm:p-4 md:p-8">
            <Header />

            <main className="mt-3 sm:mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              <ChatPanel />
            </main>

            <footer className="mt-6 sm:mt-8 md:mt-12 py-3 sm:py-4 md:py-6 border-t border-border bg-card/50">
              <div className="max-w-4xl mx-auto px-2">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground text-center font-medium">
                    AI Ustad can make mistakes, ask scholars for confirmation.
                  </p>
                  <div className="relative">
                    <button
                      onClick={() => setShowInfoPopup(!showInfoPopup)}
                      onMouseEnter={() => setShowInfoPopup(true)}
                      onMouseLeave={() => setShowInfoPopup(false)}
                      className="p-1 rounded-full hover:bg-muted transition-colors"
                      aria-label="Information"
                    >
                      <Info className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground hover:text-primary" />
                    </button>
                    {showInfoPopup && (
                      <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-card border border-border rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <p className="text-xs sm:text-sm text-foreground">
                          Report misinformation through the Help and Support section.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
