"use client"

import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface TypingTextProps {
  text: string
  speed?: number
  onComplete?: () => void
  stopTyping?: boolean
}

export default function TypingText({ text, speed = 8, onComplete, stopTyping = false }: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [cursorVisible, setCursorVisible] = useState(true)
  const currentIndexRef = useRef(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const cursorIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasCompletedRef = useRef(false)
  const targetTextRef = useRef(text)

  useEffect(() => {
    cursorIntervalRef.current = setInterval(() => {
      setCursorVisible((v) => !v)
    }, 500)

    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    targetTextRef.current = text

    // If stopped, show full text immediately
    if (stopTyping) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      currentIndexRef.current = text.length
      setDisplayedText(text)
      return
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Start typing animation
    intervalRef.current = setInterval(() => {
      const target = targetTextRef.current
      const currentIdx = currentIndexRef.current

      if (currentIdx < target.length) {
        const charsToAdd = Math.min(2, target.length - currentIdx)
        const newIndex = currentIdx + charsToAdd
        currentIndexRef.current = newIndex
        setDisplayedText(target.slice(0, newIndex))
      } else {
        // Typing complete
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        if (onComplete && !hasCompletedRef.current) {
          hasCompletedRef.current = true
          onComplete()
        }
      }
    }, speed)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [text, speed, stopTyping, onComplete])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current)
    }
  }, [])

  const isTyping = currentIndexRef.current < targetTextRef.current.length && !stopTyping

  return (
    <div
      className="prose prose-sm sm:prose-base max-w-none 
      prose-headings:text-foreground prose-headings:font-bold prose-headings:leading-tight prose-headings:mt-6 prose-headings:mb-3
      prose-p:text-foreground/90 prose-p:leading-[1.9] prose-p:my-4
      prose-strong:text-foreground prose-strong:font-bold
      prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
      prose-li:text-foreground/90 prose-li:leading-[1.9] prose-li:my-2
      prose-ul:text-foreground prose-ul:my-4 prose-ul:pl-5
      prose-ol:text-foreground prose-ol:my-4 prose-ol:pl-5
      prose-blockquote:border-l-primary prose-blockquote:border-l-4 prose-blockquote:text-muted-foreground prose-blockquote:italic
      prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm
      prose-pre:bg-muted prose-pre:text-foreground prose-pre:rounded-xl prose-pre:p-4"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedText}</ReactMarkdown>
      {isTyping && (
        <span
          className={`inline-block w-0.5 h-5 bg-primary ml-0.5 align-middle transition-opacity duration-100 ${
            cursorVisible ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  )
}
