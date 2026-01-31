"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Volume2, Pause, Square, Loader2 } from "lucide-react"

interface ReadAloudButtonProps {
  text: string
  voice?: string
}

export default function ReadAloudButton({ text, voice = "Charon" }: ReadAloudButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const lastRequestTimeRef = useRef<number>(0)
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
      audioRef.current = null
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current)
      cooldownTimerRef.current = null
    }
    setIsSpeaking(false)
    setIsPaused(false)
  }, [])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  const handleSpeak = useCallback(async () => {
    setError(null)

    // Check cooldown before making new TTS request
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTimeRef.current
    const COOLDOWN_MS = 3000 // 3 seconds cooldown between requests

    if (timeSinceLastRequest < COOLDOWN_MS && !audioRef.current) {
      const remainingMs = COOLDOWN_MS - timeSinceLastRequest
      setError(`Please wait ${Math.ceil(remainingMs / 1000)}s before trying again`)
      setTimeout(() => {
        setError(null)
      }, remainingMs)
      return
    }

    // If audio exists, handle pause/resume
    if (audioRef.current) {
      if (isSpeaking && !isPaused) {
        audioRef.current.pause()
        setIsPaused(true)
        setIsSpeaking(false)
        return
      }
      if (isPaused) {
        try {
          await audioRef.current.play()
          setIsPaused(false)
          setIsSpeaking(true)
        } catch (e) {
          console.error("[TTS] Resume playback error:", e)
          cleanup()
        }
        return
      }
    }

    // Update last request time
    lastRequestTimeRef.current = now

    // Clean the text for TTS (basic cleanup, server does more thorough cleaning)
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim()

    if (!cleanText) {
      setError("No text to read")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textToSpeak: cleanText, voice }),
      })

      // Check if response is ok before parsing
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Failed to parse error response" }))
        throw new Error(data.error || `TTS generation failed with status ${response.status}`)
      }

      const data = await response.json()

      if (!data.audioData) {
        throw new Error("No audio data received from server")
      }

      if (!data.mimeType) {
        throw new Error("No mime type received from server")
      }

      // Convert base64 PCM to WAV
      const pcmData = base64ToArrayBuffer(data.audioData)
      const pcm16 = new Int16Array(pcmData)

      // Extract sample rate from mimeType (e.g., "audio/L16;rate=24000")
      const match = data.mimeType?.match(/rate=(\d+)/)
      const sampleRate = match ? Number.parseInt(match[1], 10) : 24000

      const wavBlob = pcmToWav(pcm16, sampleRate)
      const audioUrl = URL.createObjectURL(wavBlob)
      audioUrlRef.current = audioUrl

      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onplay = () => {
        setIsSpeaking(true)
        setIsPaused(false)
        setIsLoading(false)
      }

      audio.onended = () => {
        cleanup()
      }

      audio.onerror = (event) => {
        console.error("[TTS] Audio playback error:", event)
        const audioElement = event.target as HTMLAudioElement
        const errorDetails = audioElement.error
        
        let errorMsg = "Audio playback failed"
        if (errorDetails) {
          switch (errorDetails.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              errorMsg = "Audio playback was aborted"
              break
            case MediaError.MEDIA_ERR_NETWORK:
              errorMsg = "Network error while loading audio"
              break
            case MediaError.MEDIA_ERR_DECODE:
              errorMsg = "Audio decoding failed - invalid audio format"
              break
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMsg = "Audio format not supported by browser"
              break
          }
        }
        
        console.error("[TTS] Detailed error:", errorMsg, errorDetails)
        setError(errorMsg)
        setIsLoading(false)
        cleanup()
        
        // Auto-clear error after 5 seconds
        setTimeout(() => {
          setError(null)
        }, 5000)
      }

      await audio.play()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate speech"
      console.error("[TTS] Error:", errorMessage)
      
      // Show a more user-friendly error message
      let displayError = errorMessage
      if (errorMessage.includes("quota")) {
        displayError = "Daily TTS quota reached. Try again tomorrow or add more API keys."
      } else if (errorMessage.includes("Rate limited")) {
        displayError = "Too many requests. Please wait a moment."
      }
      
      setError(displayError)
      setIsLoading(false)
      cleanup()
      
      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setError(null)
      }, 5000)
    }
  }, [text, voice, isSpeaking, isPaused, cleanup])

  function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  function pcmToWav(pcm16: Int16Array, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + pcm16.length * 2)
    const view = new DataView(buffer)

    function writeString(view: DataView, offset: number, string: string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(view, 0, "RIFF")
    view.setUint32(4, 36 + pcm16.length * 2, true)
    writeString(view, 8, "WAVE")
    writeString(view, 12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(view, 36, "data")
    view.setUint32(40, pcm16.length * 2, true)

    let offset = 44
    for (let i = 0; i < pcm16.length; i++, offset += 2) {
      view.setInt16(offset, pcm16[i], true)
    }

    return new Blob([buffer], { type: "audio/wav" })
  }

  const handleStop = useCallback(() => {
    cleanup()
  }, [cleanup])

  // Get button title based on state
  const getTitle = () => {
    if (error) return `Error: ${error}`
    if (isLoading) return "Generating voice..."
    if (isSpeaking) return "Pause"
    if (isPaused) return "Resume"
    return "Read Aloud"
  }

  return (
    <div className="relative flex flex-col items-end gap-1">
      {error && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-destructive/10 border border-destructive/50 text-destructive rounded-xl text-xs max-w-xs shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-300 whitespace-nowrap">
          {error}
        </div>
      )}
      
      <div className="flex items-center gap-1">
        <button
          onClick={handleSpeak}
          disabled={isLoading}
          className={`p-2 rounded-full transition-all duration-200 transform hover:scale-110 disabled:opacity-60 disabled:cursor-wait ${
            error
              ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/40"
              : isLoading
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/40"
                : isSpeaking
                  ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/40 animate-pulse"
                  : isPaused
                    ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/40"
                    : "bg-gradient-to-br from-primary to-primary/80 text-white hover:from-primary hover:to-primary/90 shadow-md hover:shadow-lg"
          }`}
          title={getTitle()}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isSpeaking ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>

        {(isSpeaking || isPaused) && (
          <button
            onClick={handleStop}
            className="p-2 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md hover:shadow-lg shadow-red-500/30 transition-all duration-200 transform hover:scale-110"
            title="Stop"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        )}
      </div>
    </div>
  )
}
