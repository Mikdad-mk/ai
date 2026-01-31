import type { NextRequest } from "next/server"
import { DOCUMENT_SYSTEM_PROMPT, GENERAL_SYSTEM_PROMPT } from "@/lib/gemini-api"
import { buildConversationContext } from "@/lib/chat-service"
import { getCombinedKnowledgeContentServer } from "@/lib/knowledge-service"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { chatModel } from "@/lib/gemini-server"

async function getServerChatMessages(supabaseAdmin: ReturnType<typeof createClient>, chatId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("chat_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching chat messages on server:", error)
      return []
    }
    return data || []
  } catch (error) {
    console.error("[v0] getServerChatMessages failed:", error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, chatId: rawChatId, isFirstMessage } = await request.json()

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Please provide a question." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const chatId =
      rawChatId === "new" || rawChatId === "general"
        ? `chat_${Date.now()}_${Math.random().toString(36).substring(7)}`
        : rawChatId

    if (!chatId) {
      return new Response(JSON.stringify({ error: "Chat ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { data: existingSessions } = await supabaseAdmin
      .from("chat_sessions")
      .select("id, user_id")
      .eq("id", chatId)
      .limit(1)

    const existingSession = existingSessions?.[0]

    if (!existingSession) {
      const { error: createError } = await supabaseAdmin.from("chat_sessions").insert({
        id: chatId,
        user_id: user.id,
        title: "New Chat",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (createError && createError.code !== "23505") {
        console.error("[v0] Error creating session:", createError)
        return new Response(JSON.stringify({ error: "Failed to create chat session" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      }
    } else if (existingSession.user_id !== user.id) {
      if (existingSession.user_id === null) {
        await supabaseAdmin.from("chat_sessions").update({ user_id: user.id }).eq("id", chatId)
      } else {
        console.log(`[v0] User ${user.id} trying to access chat ${chatId} owned by ${existingSession.user_id}`)
        return new Response(JSON.stringify({ error: "Unauthorized access to chat" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        })
      }
    }

    const centralizedKnowledge = await getCombinedKnowledgeContentServer()
    const previousMessages = await getServerChatMessages(supabaseAdmin, chatId)
    const conversationContext = buildConversationContext(previousMessages)

    console.log("[v0] Chat ID:", chatId)
    console.log("[v0] Previous messages count:", previousMessages.length)
    if (previousMessages.length > 0) {
      console.log(
        "[v0] Last 3 messages:",
        previousMessages.slice(-3).map((m) => ({
          role: m.role,
          text: m.text.substring(0, 100) + (m.text.length > 100 ? "..." : ""),
        })),
      )
    }
    console.log("[v0] Conversation context length:", conversationContext.length, "characters")

    const hasKnowledge = centralizedKnowledge.trim().length > 0
    let systemPrompt: string

    const tools = [{ google_search: {} }]

    if (hasKnowledge) {
      systemPrompt = DOCUMENT_SYSTEM_PROMPT(centralizedKnowledge)
      console.log("[v0] Using centralized knowledge base with", centralizedKnowledge.length, "characters")
    } else {
      systemPrompt = GENERAL_SYSTEM_PROMPT
      console.log("[v0] No knowledge documents found, using web search mode")
    }

    let enhancedPrompt: string
    if (conversationContext) {
      enhancedPrompt = `${conversationContext}

---

**CURRENT USER MESSAGE:** ${prompt}

**CRITICAL INSTRUCTION FOR YOU:** 
- The user's current message may reference previous parts of our conversation shown above
- When the user says things like "tell me more about that/him/her" or "adhehathe kurich kooduthal parayoo" or "continue" or "elaborate", they are referring to the MOST RECENT topic discussed in the conversation history
- You MUST carefully read the conversation history above and understand what the user is referring to
- Respond in the SAME LANGUAGE the user wrote the current message in
- If unclear what the user is referencing, ask for clarification`
    } else {
      enhancedPrompt = `User Question: ${prompt}`
    }

    const payload = {
      contents: [{ parts: [{ text: enhancedPrompt }] }],
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      tools: tools,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
    }

    const availableKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
      process.env.GEMINI_API_KEY_5,
      "AIzaSyAMzJeZTkDIapDQxZnS8nSRBtxySXmf2vE",
    ].filter((key): key is string => !!key)

    if (availableKeys.length === 0) {
      console.error("[v0] No GEMINI_API_KEY configured")
      return new Response(
        JSON.stringify({
          error: "service_unavailable",
          message: "AI service is not configured. Please add GEMINI_API_KEY to environment variables.",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log(`[v0] Available API keys: ${availableKeys.length}`)

    let lastError: any = null
    let successfulResponse: Response | null = null

    for (let keyIndex = 0; keyIndex < availableKeys.length; keyIndex++) {
      const apiKey = availableKeys[keyIndex]
      console.log(`[v0] Trying API key ${keyIndex + 1}/${availableKeys.length}`)

      const streamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${chatModel}:streamGenerateContent?alt=sse&key=${apiKey}`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000)

      try {
        const response = await fetch(streamUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.status === 429) {
          console.log(`[v0] Key ${keyIndex + 1} rate limited, trying next key...`)
          const errorData = await response.json()
          lastError = errorData
          continue
        }

        if (response.status === 503) {
          const errorData = await response.json()
          lastError = errorData
          return new Response(
            JSON.stringify({
              error: "service_unavailable",
              message:
                errorData.error?.message || "The AI service is temporarily overloaded. Please try again in a moment.",
            }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            },
          )
        }

        if (!response.ok) {
          const errorData = await response.json()
          console.error("[v0] Gemini API error:", errorData)
          lastError = errorData
          continue
        }

        console.log(`[v0] Successfully used key ${keyIndex + 1}`)
        successfulResponse = response
        break
      } catch (error) {
        console.error(`[v0] Error with key ${keyIndex + 1}:`, error)
        lastError = error
        clearTimeout(timeoutId)
        continue
      }
    }

    if (!successfulResponse) {
      console.error("[v0] All API keys exhausted")
      const retryDelay = lastError?.error?.details?.find((d: any) => d.retryDelay)?.retryDelay || "60s"
      const quotaValue =
        lastError?.error?.details?.find((d: any) => d["@type"] === "type.googleapis.com/google.rpc.QuotaFailure")
          ?.violations?.[0]?.quotaValue || "20"

      return new Response(
        JSON.stringify({
          error: "rate_limit",
          message: `All ${availableKeys.length} Gemini API keys are exhausted (${quotaValue} requests/day per key). Please wait ${retryDelay} or add more API keys.`,
          retryAfter: Number.parseInt(retryDelay) || 60,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "metadata", chatId })}\n\n`))

        const reader = successfulResponse!.body!.getReader()
        const decoder = new TextDecoder()
        let fullText = ""
        let sources: any[] = []
        let isFromDocument = false
        let isNotInDocument = false
        let buffer = ""
        let isComplete = false

        try {
          const streamTimeoutId = setTimeout(() => {
            console.log("[v0] Stream timeout - forcing completion")
            reader.cancel()
          }, 110000)

          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              clearTimeout(streamTimeoutId)
              break
            }

            const chunk = decoder.decode(value, { stream: true })
            buffer += chunk
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6))
                  const candidate = data.candidates?.[0]

                  if (candidate?.content?.parts?.[0]?.text) {
                    let text = candidate.content.parts[0].text

                    text = text.replace(/tool_code[\s\S]*?(?=\n\n|$)/g, "")
                    text = text.replace(/print$$[^)]+$$[\s\S]*?(?=\n\n|$)/g, "")
                    text = text.replace(/^thought[\s\S]*?(?=\n\n|$)/gm, "")
                    text = text.replace(/^\s*[\r\n]+/gm, "")
                    text = text.trim()

                    if (text.length > 0) {
                      fullText += text

                      if (fullText.includes("Based on the document:")) {
                        isFromDocument = true
                      }
                      if (fullText.includes("This information does not appear in the provided document.")) {
                        isNotInDocument = true
                      }

                      const groundingMetadata = candidate.groundingMetadata
                      if (groundingMetadata?.groundingAttributions && isNotInDocument && sources.length === 0) {
                        sources = groundingMetadata.groundingAttributions
                          .map((attribution: any) => ({
                            uri: attribution.web?.uri,
                            title: attribution.web?.title,
                          }))
                          .filter((source: any) => source.uri && source.title)
                      }

                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text", text })}\n\n`))
                    }
                  }

                  const finishReason = candidate?.finishReason
                  if (
                    finishReason &&
                    (finishReason === "STOP" ||
                      finishReason === "MAX_TOKENS" ||
                      finishReason === "SAFETY" ||
                      finishReason === "END_TURN" ||
                      finishReason === "RECITATION")
                  ) {
                    isComplete = true
                    clearTimeout(streamTimeoutId)

                    try {
                      await supabaseAdmin.from("chat_messages").insert({
                        id: `msg_${Date.now()}_user`,
                        chat_id: chatId,
                        role: "user",
                        text: prompt,
                        created_at: new Date().toISOString(),
                      })

                      await supabaseAdmin.from("chat_messages").insert({
                        id: `msg_${Date.now()}_model`,
                        chat_id: chatId,
                        role: "model",
                        text: fullText,
                        sources,
                        is_from_document: isFromDocument,
                        is_not_in_document: isNotInDocument,
                        created_at: new Date().toISOString(),
                      })

                      if (isFirstMessage) {
                        const title = prompt.length > 50 ? prompt.substring(0, 47) + "..." : prompt
                        await supabaseAdmin
                          .from("chat_sessions")
                          .update({ title, updated_at: new Date().toISOString() })
                          .eq("id", chatId)
                      }

                      await supabaseAdmin
                        .from("chat_sessions")
                        .update({ updated_at: new Date().toISOString() })
                        .eq("id", chatId)
                    } catch (dbError) {
                      console.error("[v0] Error saving messages:", dbError)
                    }

                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: "done",
                          sources,
                          isFromDocument,
                          isNotInDocument,
                        })}\n\n`,
                      ),
                    )
                    break
                  }
                } catch (parseError) {
                  console.error("[v0] Error parsing SSE data:", parseError)
                }
              }
            }
          }

          if (!isComplete && fullText.length > 0) {
            console.log("[v0] Stream ended without finish reason, saving response anyway")

            try {
              await supabaseAdmin.from("chat_messages").insert({
                id: `msg_${Date.now()}_user`,
                chat_id: chatId,
                role: "user",
                text: prompt,
                created_at: new Date().toISOString(),
              })

              await supabaseAdmin.from("chat_messages").insert({
                id: `msg_${Date.now()}_model`,
                chat_id: chatId,
                role: "model",
                text: fullText,
                sources,
                is_from_document: isFromDocument,
                is_not_in_document: isNotInDocument,
                created_at: new Date().toISOString(),
              })
            } catch (dbError) {
              console.error("[v0] Error saving incomplete message:", dbError)
            }

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "done",
                  sources,
                  isFromDocument,
                  isNotInDocument,
                })}\n\n`,
              ),
            )
          }
        } catch (error) {
          console.error("[v0] Stream reading error:", error)
          if (fullText.length > 0) {
            try {
              await supabaseAdmin.from("chat_messages").insert({
                id: `msg_${Date.now()}_user`,
                chat_id: chatId,
                role: "user",
                text: prompt,
                created_at: new Date().toISOString(),
              })

              await supabaseAdmin.from("chat_messages").insert({
                id: `msg_${Date.now()}_model`,
                chat_id: chatId,
                role: "model",
                text: fullText,
                sources,
                is_from_document: isFromDocument,
                is_not_in_document: isNotInDocument,
                created_at: new Date().toISOString(),
              })
            } catch (dbError) {
              console.error("[v0] Error saving interrupted message:", dbError)
            }
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: "Stream interrupted" })}\n\n`),
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error: any) {
    console.error("[v0] Chat API error:", error)
    return new Response(
      JSON.stringify({
        error: "server_error",
        message: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
