"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import ChatHistory from "./chat-history"
import ChatInput from "./chat-input"
import StatusMessage from "./status-message"
import {
  getChatMessages,
  saveMessage,
  updateChatSession,
  createChatSession,
  updateChatTitle,
  deleteMessagesAfter,
} from "@/lib/chat-service"
import { getCurrentUser } from "@/lib/auth-service"

const ANSWERS_STORAGE_KEY = "ai_ustad_extracted_answers"

export default function ChatPanel() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.chatId as string
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [statusColor, setStatusColor] = useState("")
  const [extractedAnswers, setExtractedAnswers] = useState<any[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)
  const [isStopped, setIsStopped] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [sessionExists, setSessionExists] = useState(false)
  const [isFirstMessage, setIsFirstMessage] = useState(true)
  const sseBufferRef = useRef("")

  useEffect(() => {
    const loadUserAndMessages = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          setUserId(user.id)

          try {
            const dbMessages = await getChatMessages(chatId)
            setMessages(
              dbMessages.map((msg) => ({
                ...msg,
                timestamp: msg.created_at,
                isTyping: false,
              })),
            )
            setSessionExists(true)
            setIsFirstMessage(dbMessages.length === 0)
          } catch (error) {
            console.log("[v0] New chat session detected:", chatId)
            setSessionExists(false)
            setIsFirstMessage(true)
          }
        }
      } catch (error) {
        console.error("[v0] Error loading user and messages:", error)
      }
    }

    loadUserAndMessages()

    const savedAnswers = localStorage.getItem(ANSWERS_STORAGE_KEY)
    if (savedAnswers) {
      try {
        setExtractedAnswers(JSON.parse(savedAnswers))
      } catch (error) {
        console.error("[v0] Error loading extracted answers:", error)
      }
    }
  }, [chatId])

  const showStatus = (message: string, color: string) => {
    setStatusMessage(message)
    setStatusColor(color)
    setTimeout(() => setStatusMessage(""), 4000)
  }

  const findMatchingAnswer = (question: string): { question: string; answer: string } | null => {
    if (!extractedAnswers || extractedAnswers.length === 0) return null

    const lowercaseQuestion = question.toLowerCase().trim()

    const match = extractedAnswers.find((item) => {
      const documentQuestion = item.question.toLowerCase().trim()
      const questionWords = lowercaseQuestion.split(/\s+/).filter((w) => w.length > 3)
      const docQuestionWords = documentQuestion.split(/\s+/).filter((w) => w.length > 3)

      const wordOverlap = questionWords.filter((w) => documentQuestion.includes(w)).length
      const minMatchThreshold = Math.ceil(Math.min(questionWords.length, 2))

      return (
        documentQuestion === lowercaseQuestion ||
        documentQuestion.includes(lowercaseQuestion) ||
        lowercaseQuestion.includes(documentQuestion) ||
        wordOverlap >= minMatchThreshold
      )
    })

    return match || null
  }

  const handleStopGeneration = () => {
    console.log("[v0] Stop button clicked")
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStopped(true)
    setIsLoading(false)

    setMessages((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].role === "model") {
        const updated = [...prev]
        updated[updated.length - 1].isTyping = false
        return updated
      }
      return prev
    })

    showStatus("Response stopped", "bg-yellow-500")
  }

  const handleSendMessage = async (inputValue: string) => {
    if (!inputValue.trim()) return

    const userMessage = inputValue.trim()

    if (!userId) {
      showStatus("Please log in to continue", "bg-red-500")
      return
    }

    if (!sessionExists) {
      try {
        console.log("[v0] Creating new chat session for chatId:", chatId)
        const newSession = await createChatSession(userId, chatId)
        if (newSession.id !== chatId) {
          router.push(`/chat/${newSession.id}`)
          return
        }
        setSessionExists(true)
      } catch (error: any) {
        console.error("[v0] Error creating chat session:", error)
        if (error.code === "23505") {
          console.log("[v0] Session already exists, continuing...")
          setSessionExists(true)
        } else {
          showStatus("Error creating chat session", "bg-red-500")
          return
        }
      }
    }

    setIsLoading(true)
    setIsStopped(false)
    sseBufferRef.current = ""

    abortControllerRef.current = new AbortController()

    try {
      const userMsg = {
        id: `msg_${Date.now()}`,
        role: "user",
        text: userMessage,
        timestamp: new Date().toISOString(),
      }

      const messagesWithUser = [...messages, userMsg]
      setMessages(messagesWithUser)

      const documentAnswer = findMatchingAnswer(userMessage)
      let aiMsg

      if (documentAnswer) {
        aiMsg = {
          id: `msg_${Date.now() + 1}`,
          role: "model",
          text: `Based on the document:\n\n${documentAnswer.answer}`,
          sources: [],
          isFromDocument: true,
          isNotInDocument: false,
          timestamp: new Date().toISOString(),
          isTyping: true,
        }
        console.log("[v0] Answer found in document:", documentAnswer)

        try {
          await saveMessage({
            id: userMsg.id,
            chat_id: chatId,
            role: "user",
            text: userMessage,
          })

          await saveMessage({
            id: aiMsg.id,
            chat_id: chatId,
            role: "model",
            text: aiMsg.text,
            sources: [],
            is_from_document: true,
            is_not_in_document: false,
          })

          if (isFirstMessage) {
            await updateChatTitle(chatId, userMessage)
            setIsFirstMessage(false)
          }

          await updateChatSession(chatId)
        } catch (error) {
          console.error("[v0] Error saving document answer:", error)
        }

        if (!isStopped) {
          const updatedMessages = [...messagesWithUser, aiMsg]
          setMessages(updatedMessages)
        }

        setIsLoading(false)
      } else {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: userMessage,
            chatId: chatId,
            isFirstMessage,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (response.status === 429) {
          const errorData = await response.json()
          const message = errorData.message || "AI service rate limit exceeded. Please try again later."
          showStatus(message, "bg-amber-500")
          setMessages(messages)
          setIsLoading(false)
          return
        }

        if (response.status === 503) {
          const errorData = await response.json()
          const message = errorData.message || "AI service temporarily unavailable. Please try again in a moment."
          showStatus(message, "bg-orange-500")
          setMessages(messages)
          setIsLoading(false)
          return
        }

        if (!response.ok) {
          try {
            const errorData = await response.json()
            showStatus(errorData.message || errorData.error || "Failed to get response.", "bg-red-500")
          } catch {
            showStatus("Failed to get response.", "bg-red-500")
          }
          setMessages(messages)
          setIsLoading(false)
          return
        }

        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let streamedText = ""
        let sources: any[] = []
        let isFromDocument = false
        let isNotInDocument = false
        let actualChatId = chatId

        const aiMessageId = `msg_${Date.now() + 1}`
        aiMsg = {
          id: aiMessageId,
          role: "model",
          text: "",
          sources: [],
          isFromDocument: false,
          isNotInDocument: false,
          timestamp: new Date().toISOString(),
          isTyping: true,
        }

        const messagesWithAI = [...messagesWithUser, aiMsg]
        setMessages(messagesWithAI)

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            sseBufferRef.current += chunk
            const lines = sseBufferRef.current.split("\n")

            if (!sseBufferRef.current.endsWith("\n")) {
              sseBufferRef.current = lines.pop() || ""
            } else {
              sseBufferRef.current = ""
            }

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6))

                  if (data.type === "metadata") {
                    actualChatId = data.chatId
                    if (actualChatId !== chatId) {
                      router.replace(`/chat/${actualChatId}`)
                    }
                  } else if (data.type === "text") {
                    streamedText += data.text
                    setMessages((prev) => {
                      const updated = [...prev]
                      const lastMsg = updated[updated.length - 1]
                      if (lastMsg && lastMsg.role === "model") {
                        lastMsg.text = streamedText
                        lastMsg.isTyping = true
                      }
                      return updated
                    })
                  } else if (data.type === "done") {
                    sources = data.sources || []
                    isFromDocument = data.isFromDocument || false
                    isNotInDocument = data.isNotInDocument || false

                    setMessages((prev) => {
                      const updated = [...prev]
                      const lastMsg = updated[updated.length - 1]
                      if (lastMsg && lastMsg.role === "model") {
                        lastMsg.text = streamedText
                        lastMsg.sources = sources
                        lastMsg.isFromDocument = isFromDocument
                        lastMsg.isNotInDocument = isNotInDocument
                        lastMsg.isTyping = false
                      }
                      return updated
                    })

                    if (isFirstMessage) {
                      setIsFirstMessage(false)
                    }
                  } else if (data.type === "error") {
                    showStatus(data.error, "bg-red-500")
                  }
                } catch (parseError) {
                  if (line.trim().length > 6) {
                    console.error("[v0] Error parsing SSE data:", parseError)
                  }
                }
              }
            }
          }
        } catch (streamError: any) {
          if (streamError.name === "AbortError") {
            console.log("[v0] Stream was aborted")
          } else {
            console.error("[v0] Stream error:", streamError)
            showStatus("Error receiving response", "bg-red-500")
          }
        }

        setIsLoading(false)
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("[v0] Request was aborted")
      } else {
        console.error("[v0] Error sending message:", error)
        showStatus("Error sending message.", "bg-red-500")
      }
      setIsLoading(false)
    } finally {
      abortControllerRef.current = null
    }
  }

  const handleEditMessage = async (messageId: string, newText: string) => {
    const messageIndex = messages.findIndex((msg) => msg.id === messageId)
    if (messageIndex === -1) return

    const messagesBeforeEdit = messages.slice(0, messageIndex)
    setMessages(messagesBeforeEdit)

    try {
      await deleteMessagesAfter(chatId, messageId)
    } catch (error) {
      console.error("[v0] Error deleting messages:", error)
    }

    await handleSendMessage(newText)
  }

  const handleRetryMessage = async (messageIndex: number) => {
    let userMessageIndex = messageIndex - 1
    while (userMessageIndex >= 0 && messages[userMessageIndex].role !== "user") {
      userMessageIndex--
    }

    if (userMessageIndex < 0) return

    const userMessage = messages[userMessageIndex]

    const messagesBeforeAI = messages.slice(0, messageIndex)
    setMessages(messagesBeforeAI)

    try {
      await deleteMessagesAfter(chatId, userMessage.id)
    } catch (error) {
      console.error("[v0] Error deleting AI message:", error)
    }

    await handleSendMessage(userMessage.text)
  }

  return (
    <div className="lg:col-span-3 flex flex-col min-h-[calc(100vh-220px)]">
      <div className="card-elevated p-4 sm:p-5 md:p-6 rounded-t-2xl">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground border-b border-border/50 pb-3 font-serif">
          ٱدْعُونِىٓ أَسْتَجِبْ لَكُمْ
        </h2>
      </div>

      <div className="bg-gradient-to-b from-background to-secondary/30 px-3 sm:px-5 md:px-6 flex-1 overflow-y-auto">
        <ChatHistory
          messages={messages}
          isStopped={isStopped}
          isLoading={isLoading}
          onEditMessage={handleEditMessage}
          onRetryMessage={handleRetryMessage}
        />
      </div>

      {statusMessage && (
        <div className="bg-background px-3 sm:px-5 md:px-6">
          <StatusMessage message={statusMessage} bgColor={statusColor} />
        </div>
      )}

      <div className="card-elevated p-3 sm:p-4 md:p-5 rounded-b-2xl sticky bottom-0 border-t-0">
        <ChatInput onSendMessage={handleSendMessage} onStopGeneration={handleStopGeneration} isLoading={isLoading} />
      </div>
    </div>
  )
}
