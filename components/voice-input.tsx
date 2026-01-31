"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Mic, MicOff, Languages } from "lucide-react"

export default function VoiceInput({
  onTranscript,
  isDisabled,
}: {
  onTranscript: (transcript: string) => void
  isDisabled: boolean
}) {
  const [recognition, setRecognition] = useState<any>(null)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [languageIndex, setLanguageIndex] = useState(1) // Start with MLM (Malayalam)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)
  const isStartingRef = useRef(false)
  const recognitionRef = useRef<any>(null)
  const fullTranscriptRef = useRef<string>("")
  const shouldRestartRef = useRef(false)

  const languages = [
    { code: "en-US", label: "English", shortLabel: "ENG", flag: "🇺🇸" },
    { code: "ml-IN", label: "മലയാളം", shortLabel: "MLM", flag: "🇮🇳" },
    { code: "ar-SA", label: "العربية", shortLabel: "ARB", flag: "🇸🇦" },
  ]

  const currentLanguage = languages[languageIndex]

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      
      if (!SpeechRecognition) {
        console.log("[v0] Speech recognition not supported")
        setIsSupported(false)
        return
      }

      // Clean up previous recognition instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors when stopping
        }
      }

      const recog = new SpeechRecognition()
      recog.continuous = true // Enable continuous mode for long recordings
      recog.interimResults = true
      recog.lang = currentLanguage.code
      recog.maxAlternatives = 1

      recog.onstart = () => {
        console.log("[v0] Speech recognition started for", currentLanguage.label)
        setIsRecognizing(true)
        isStartingRef.current = false
        setError(null)
      }

      recog.onresult = (event: any) => {
        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " "
            // Add final transcript to accumulated text
            fullTranscriptRef.current += transcript + " "
          } else {
            interimTranscript += transcript
          }
        }

        // Send accumulated + interim text
        const currentText = (fullTranscriptRef.current + interimTranscript).trim()
        if (currentText) {
          console.log("[v0] Transcript update:", currentText)
          onTranscript(currentText)
        }
      }

      recog.onend = () => {
        console.log("[v0] Speech recognition ended, shouldRestart:", shouldRestartRef.current)
        
        // If user is still supposed to be recording, restart automatically
        if (shouldRestartRef.current && !isStartingRef.current) {
          console.log("[v0] Auto-restarting recognition after pause...")
          setTimeout(() => {
            if (shouldRestartRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start()
              } catch (err) {
                console.error("[v0] Auto-restart failed:", err)
              }
            }
          }, 100)
        } else {
          setIsRecognizing(false)
          isStartingRef.current = false
          fullTranscriptRef.current = "" // Clear accumulated text when fully stopped
        }
      }

      recog.onerror = (event: any) => {
        console.log("[v0] Speech recognition error:", event.error)
        setIsRecognizing(false)
        isStartingRef.current = false

        if (event.error === "aborted" || event.error === "no-speech") {
          // These are not real errors - just user didn't speak or stopped early
          setError(null)
          return
        }

        if (event.error === "not-allowed") {
          setError("🎤 Microphone access denied. Please allow permissions.")
        } else if (event.error === "network") {
          setError("🌐 Network error. Check your connection.")
        } else if (event.error === "audio-capture") {
          setError("🎤 No microphone found. Please connect one.")
        } else if (event.error === "service-not-allowed") {
          setError("🔒 Speech service not available. Try Chrome browser.")
        } else {
          setError(`⚠️ Error: ${event.error}`)
        }

        setTimeout(() => setError(null), 5000)
      }

      recognitionRef.current = recog
      setRecognition(recog)
      setIsSupported(true)
    }

    return () => {
      // Cleanup on unmount
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors
        }
      }
    }
  }, [currentLanguage.code, onTranscript])

  const handleToggle = async () => {
    if (!recognition || !isSupported) {
      setError("🔊 Voice input not supported in this browser. Try Chrome.")
      setTimeout(() => setError(null), 5000)
      return
    }

    if (isStartingRef.current) {
      console.log("[v0] Recognition is already starting, ignoring click")
      return
    }

    if (isRecognizing) {
      console.log("[v0] User stopped recognition manually")
      shouldRestartRef.current = false // Don't auto-restart when user manually stops
      fullTranscriptRef.current = "" // Clear accumulated text
      try {
        recognition.stop()
      } catch (e) {
        console.error("[v0] Error stopping recognition:", e)
      }
      setIsRecognizing(false)
    } else {
      try {
        console.log("[v0] Requesting microphone permission")
        
        // Request microphone permission first
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Stop the stream immediately - we just needed permission
        stream.getTracks().forEach(track => track.stop())

        if (isRecognizing || isStartingRef.current) {
          console.log("[v0] Already recognizing or starting, skipping")
          return
        }

        isStartingRef.current = true
        fullTranscriptRef.current = "" // Clear any previous text
        shouldRestartRef.current = true // Enable auto-restart for pauses
        console.log("[v0] Starting recognition with language:", currentLanguage.label)
        
        try {
          recognition.start()
        } catch (err: any) {
          console.error("[v0] Error starting recognition:", err)
          isStartingRef.current = false
          shouldRestartRef.current = false
          
          if (err.name === "InvalidStateError") {
            // Recognition is already started, just set the state
            setIsRecognizing(true)
            shouldRestartRef.current = true
          } else {
            setError("⚠️ Failed to start voice input. Please try again.")
            setTimeout(() => setError(null), 3000)
          }
        }
      } catch (err: any) {
        console.error("[v0] Microphone permission error:", err)
        isStartingRef.current = false

        if (err.name === "NotAllowedError") {
          setError("🎤 Please allow microphone access in your browser.")
        } else if (err.name === "NotFoundError") {
          setError("🎤 No microphone found. Please connect one.")
        } else {
          setError("⚠️ Cannot access microphone. Please check settings.")
        }
        setTimeout(() => setError(null), 5000)
      }
    }
  }

  const cycleLanguage = () => {
    if (isRecognizing || isDisabled) return
    setLanguageIndex((prev) => (prev + 1) % languages.length)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (isRecognizing || isDisabled) return
    e.preventDefault()
    if (e.deltaY > 0) {
      setLanguageIndex((prev) => (prev + 1) % languages.length)
    } else {
      setLanguageIndex((prev) => (prev - 1 + languages.length) % languages.length)
    }
  }

  return (
    <div className="flex flex-col items-end space-y-2">
      {error && (
        <div className="px-3 py-2 bg-destructive/10 border border-destructive/50 text-destructive rounded-xl text-xs sm:text-sm max-w-xs shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-300">
          {error}
        </div>
      )}

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Language Selection Button - Made More Prominent */}
        <button
          onClick={cycleLanguage}
          onWheel={handleWheel}
          disabled={isRecognizing || isDisabled}
          className="group relative px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-primary/60 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl text-xs sm:text-sm font-bold text-primary hover:border-primary hover:from-primary/20 hover:to-primary/10 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 select-none flex-shrink-0 min-w-[70px] sm:min-w-[85px]"
          title={`Click to change language: ${currentLanguage.label}`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Languages className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="tracking-wide font-extrabold">{currentLanguage.shortLabel}</span>
          </div>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
        </button>

        {/* Voice Input Button */}
        <button
          onClick={handleToggle}
          disabled={!isSupported || isDisabled}
          className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-lg transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex-shrink-0 ${
            isRecognizing
              ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-500/50 ring-4 ring-red-500/30"
              : "bg-gradient-to-br from-primary to-primary/80 text-white hover:from-primary hover:to-primary/90 hover:shadow-primary/40"
          }`}
          title={isRecognizing ? `Stop Listening (${currentLanguage.label})` : `Start Voice Input (${currentLanguage.label})`}
        >
          {isRecognizing ? (
            <div className="relative">
              <MicOff className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
              <div className="absolute inset-0 w-5 h-5 sm:w-6 sm:h-6 bg-white/20 rounded-full animate-ping" />
            </div>
          ) : (
            <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </button>
      </div>

    </div>
  )
}
