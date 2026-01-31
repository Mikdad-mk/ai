"use client"

import { useEffect, useState } from "react"

interface ToastProps {
  message: string
  type: "success" | "error" | "info"
  duration?: number
}

export default function Toast({ message, type, duration = 4000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), duration)
    return () => clearTimeout(timer)
  }, [duration])

  if (!isVisible) return null

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  }[type]

  const icon = {
    success: "✓",
    error: "✕",
    info: "ℹ",
  }[type]

  return (
    <div
      className={`fixed bottom-6 right-6 ${bgColor} text-white rounded-lg shadow-lg p-4 flex items-center gap-3 z-40 animate-in fade-in slide-in-from-bottom-5 max-w-sm`}
    >
      <span className="text-xl font-bold">{icon}</span>
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}
