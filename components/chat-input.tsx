"use client"

import { useState } from "react"
import VoiceInput from "./voice-input"
import { Send, Square } from "lucide-react"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  onStopGeneration: () => void
  isLoading: boolean
}

export default function ChatInput({ onSendMessage, onStopGeneration, isLoading }: ChatInputProps) {
  const [inputValue, setInputValue] = useState("")

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return
    onSendMessage(inputValue)
    setInputValue("")
  }

  const handleVoiceInput = (transcript: string) => {
    setInputValue(transcript)
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <VoiceInput onTranscript={handleVoiceInput} isDisabled={isLoading} />

      <div className="flex-1 relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Ask a question..."
          className="w-full px-4 py-3 sm:px-5 sm:py-3.5 text-sm sm:text-base font-serif input-elegant rounded-xl focus:outline-none transition-all duration-300 placeholder:text-muted-foreground/60"
          disabled={isLoading}
        />
      </div>

      {isLoading ? (
        <button
          onClick={onStopGeneration}
          className="flex-shrink-0 p-3 sm:p-3.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center gap-2"
          title="Stop Generation"
        >
          <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          <span className="hidden sm:inline text-sm font-medium">Stop</span>
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={isLoading || !inputValue.trim()}
          className="flex-shrink-0 p-3 sm:p-3.5 rounded-xl btn-gold text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
          title="Send Message"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}
    </div>
  )
}
