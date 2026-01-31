"use client"

import type React from "react"

import { useState } from "react"
import { X, Send, MessageCircle } from "lucide-react"
import { createSupportRequest } from "@/lib/support-service"
import { getCurrentUser, getUserProfile } from "@/lib/auth-service"

interface HelpSupportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function HelpSupportModal({ isOpen, onClose }: HelpSupportModalProps) {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!subject.trim() || !message.trim()) {
      alert("Please fill in both subject and message")
      return
    }

    setIsSubmitting(true)

    try {
      const user = await getCurrentUser()
      if (!user) {
        alert("You must be logged in to submit a support request")
        return
      }

      const profile = await getUserProfile(user.id)

      await createSupportRequest({
        user_id: user.id,
        user_name: profile?.name || "User",
        user_email: profile?.email || user.email || "",
        subject: subject.trim(),
        message: message.trim(),
      })

      setShowSuccess(true)
      setSubject("")
      setMessage("")

      setTimeout(() => {
        setShowSuccess(false)
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Error submitting support request:", error)
      alert("Failed to submit request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-gray-900">Help & Support</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {showSuccess ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h3>
            <p className="text-gray-600">We'll review your message and get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="What do you need help with?"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Please describe your issue or question in detail..."
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-[oklch(0.60_0.14_80)] to-[oklch(0.55_0.12_75)] hover:opacity-90 text-white px-4 py-2 rounded-lg transition-opacity disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? "Sending..." : "Send Request"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
