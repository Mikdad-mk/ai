"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.chatId as string
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return null
  }

  return null
}
