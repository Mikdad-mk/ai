"use client"

import { useEffect, useState } from "react"

interface UploadOverlayProps {
  isVisible: boolean
  progress: number
  fileName: string
}

export default function UploadOverlay({ isVisible, progress, fileName }: UploadOverlayProps) {
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    if (displayProgress < progress) {
      const timer = setTimeout(() => setDisplayProgress(Math.min(displayProgress + 5, progress)), 50)
      return () => clearTimeout(timer)
    }
  }, [displayProgress, progress])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Uploading File</h3>
            <p className="text-sm text-gray-600 truncate">{fileName}</p>
          </div>

          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 rounded-full shadow-lg"
              style={{ width: `${displayProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{displayProgress}%</span>
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Processing your document and generating answers if needed...
          </p>
        </div>
      </div>
    </div>
  )
}
