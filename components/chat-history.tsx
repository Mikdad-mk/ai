"use client"

import { useEffect, useState, memo } from "react"
import ReadAloudButton from "./read-aloud-button"
import TypingText from "./typing-text"
import TypingIndicator from "./typing-indicator"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Pencil, RotateCcw, Check, X, SlackIcon, Sparkles, User } from "lucide-react"

const ChatHistory = memo(function ChatHistory({
  messages,
  isStopped = false,
  isLoading = false,
  onEditMessage,
  onRetryMessage,
}: {
  messages: any[]
  isStopped?: boolean
  isLoading?: boolean
  onEditMessage?: (messageId: string, newText: string) => void
  onRetryMessage?: (messageIndex: number) => void
}) {
  const [showWelcome, setShowWelcome] = useState(true)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")

  useEffect(() => {
    if (messages.length > 0) {
      setShowWelcome(false)
    } else {
      setShowWelcome(true)
    }
  }, [messages])

  const handleStartEdit = (messageId: string, currentText: string) => {
    setEditingMessageId(messageId)
    setEditText(currentText)
  }

  const handleSaveEdit = () => {
    if (editingMessageId && editText.trim() && onEditMessage) {
      onEditMessage(editingMessageId, editText.trim())
    }
    setEditingMessageId(null)
    setEditText("")
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditText("")
  }

  const welcomeMessage =
    "Assalamu Alaikum. I am an AI Ustad, ready to serve as a knowledgeable guide and source of clarity. I was created to be a major attraction at the Samastha Global Expo.Call upon Me, and I will respond to you"

  return (
    <div className="py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6">
      {showWelcome && (
        <div className="flex justify-start animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="max-w-[90%] sm:max-w-[80%] lg:max-w-[75%] flex items-end gap-3">
            {/* AI Avatar */}
            <div className="hidden sm:flex w-10 h-10 rounded-full gold-gradient items-center justify-center flex-shrink-0 shadow-lg">
              <SlackIcon className="w-5 h-5 text-white" />
            </div>
            <div className="message-bubble-ai p-4 sm:p-5 rounded-2xl rounded-tl-md">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-primary tracking-wide">AI Ustad</span>
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
              </div>
              <div className="text-sm sm:text-base font-serif leading-[1.9] tracking-wide text-foreground/90">
                {welcomeMessage}
              </div>
            </div>
            <ReadAloudButton text={welcomeMessage} />
          </div>
        </div>
      )}

      {messages.map((msg, index) => (
        <div
          key={msg.id}
          className={`flex mb-4 sm:mb-6 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in duration-300`}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div
            className={`max-w-[90%] sm:max-w-[80%] lg:max-w-[75%] flex items-end gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} group`}
          >
            {msg.role === "user" ? (
              <div className="hidden sm:flex w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 items-center justify-center flex-shrink-0 shadow-md">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            ) : (
              <div className="hidden sm:flex w-10 h-10 rounded-full gold-gradient items-center justify-center flex-shrink-0 shadow-lg">
                <SlackIcon className="w-5 h-5 text-white" />
              </div>
            )}

            <div
              className={`p-4 sm:p-5 rounded-2xl transition-all duration-300 ${
                msg.role === "user"
                  ? "message-bubble-user text-white rounded-tr-md"
                  : "message-bubble-ai text-foreground rounded-tl-md"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs sm:text-sm font-bold tracking-wide ${msg.role === "user" ? "text-white/95" : "text-primary"}`}
                >
                  {msg.role === "user" ? "You" : "AI Ustad"}
                </span>
                {msg.role !== "user" && <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>}
              </div>

              {msg.role !== "user" && (
                <>
                  {msg.isFromDocument && (
                    <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      From Document
                    </div>
                  )}
                  {msg.isNotInDocument && (
                    <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 text-xs font-semibold shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      Web Search
                    </div>
                  )}
                </>
              )}

              {msg.role === "user" && editingMessageId === msg.id ? (
                <div className="mt-2 animate-in fade-in zoom-in-95 duration-200">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full min-h-[100px] p-4 text-sm sm:text-base font-serif leading-relaxed bg-white/20 rounded-xl border-2 border-white/40 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-white/60 resize-none transition-all duration-200"
                    placeholder="Edit your message..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSaveEdit()
                      } else if (e.key === "Escape") {
                        handleCancelEdit()
                      }
                    }}
                  />
                  <div className="flex gap-3 mt-4 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 text-sm font-medium text-white/90 backdrop-blur-sm"
                      title="Cancel (Esc)"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editText.trim()}
                      className="px-4 py-2 rounded-xl bg-white/30 hover:bg-white/40 disabled:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm"
                      title="Save & Resend (Enter)"
                    >
                      <Check className="w-4 h-4" />
                      Save & Resend
                    </button>
                  </div>
                </div>
              ) : msg.role !== "user" && msg.isTyping ? (
                <div className="transition-all duration-200 ease-in-out">
                  <div className="mt-1 text-sm sm:text-base font-serif leading-[1.9] tracking-wide">
                    <TypingText text={msg.text} speed={8} stopTyping={isStopped} />
                  </div>
                </div>
              ) : msg.role === "user" ? (
                <div className="mt-1 text-sm sm:text-base font-serif leading-[1.8] tracking-wide whitespace-pre-wrap text-shadow-sm">
                  {msg.text}
                </div>
              ) : (
                <div
                  className="mt-1 text-sm sm:text-base font-serif leading-[1.9] tracking-wide prose prose-sm sm:prose-base max-w-none 
                  prose-headings:text-foreground prose-headings:font-bold prose-headings:leading-tight prose-headings:mt-6 prose-headings:mb-3
                  prose-p:text-foreground/90 prose-p:leading-[1.9] prose-p:my-4
                  prose-strong:text-foreground prose-strong:font-bold
                  prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                  prose-li:text-foreground/90 prose-li:leading-[1.9] prose-li:my-2
                  prose-ul:text-foreground prose-ul:my-4 prose-ul:pl-5
                  prose-ol:text-foreground prose-ol:my-4 prose-ol:pl-5
                  prose-blockquote:border-l-primary prose-blockquote:border-l-4 prose-blockquote:text-muted-foreground prose-blockquote:italic prose-blockquote:my-4 prose-blockquote:pl-4 prose-blockquote:py-1
                  prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm
                  prose-pre:bg-muted prose-pre:text-foreground prose-pre:rounded-xl prose-pre:p-4"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                </div>
              )}

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-5 pt-4 border-t border-border/50">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Sources
                  </div>
                  <ul className="space-y-2">
                    {msg.sources.slice(0, 3).map((source: any, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary font-bold text-xs mt-0.5">{idx + 1}.</span>
                        <a
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:text-accent underline-offset-2 hover:underline font-medium transition-colors"
                        >
                          {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {msg.role === "user" && !editingMessageId && !isLoading && (
              <button
                onClick={() => handleStartEdit(msg.id, msg.text)}
                className="p-2.5 rounded-xl bg-white/80 hover:bg-white border border-border/50 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 shadow-md hover:shadow-lg"
                title="Edit message"
              >
                <Pencil className="w-4 h-4 text-primary" />
              </button>
            )}

            {msg.role !== "user" && (
              <div className="flex flex-col gap-2">
                <ReadAloudButton text={msg.text} />
                {!msg.isTyping && !isLoading && onRetryMessage && (
                  <button
                    onClick={() => onRetryMessage(index)}
                    className="p-2.5 rounded-xl bg-white/80 hover:bg-white border border-border/50 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 shadow-md hover:shadow-lg"
                    title="Regenerate response"
                  >
                    <RotateCcw className="w-4 h-4 text-primary" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
        <div className="flex justify-start mb-4 sm:mb-6 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="max-w-[90%] sm:max-w-[80%] lg:max-w-[75%] flex items-end gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-full gold-gradient items-center justify-center flex-shrink-0 shadow-lg animate-pulse">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="message-bubble-ai p-4 sm:p-5 rounded-2xl rounded-tl-md min-h-[70px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-primary tracking-wide">AI Ustad</span>
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></div>
              </div>
              <TypingIndicator />
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default ChatHistory
