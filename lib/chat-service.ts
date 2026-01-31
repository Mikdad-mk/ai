import { createBrowserClient } from "@supabase/ssr"

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

function getSupabase() {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error("Supabase environment variables are not configured")
    }

    supabaseInstance = createBrowserClient(url, key)
  }
  return supabaseInstance
}

export interface ChatMessage {
  id: string
  chat_id: string
  role: "user" | "model"
  text: string
  sources?: any[]
  is_from_document?: boolean
  is_not_in_document?: boolean
  created_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

// Create a new chat session
export async function createChatSession(userId: string, chatId?: string, firstMessage?: string): Promise<ChatSession> {
  const supabase = getSupabase()
  // Generate a unique ID if chatId is 'new' or not provided
  const actualChatId =
    !chatId || chatId === "new" ? `chat_${Date.now()}_${Math.random().toString(36).substring(7)}` : chatId
  const title = "New Chat" // Always start with "New Chat", will be updated with first message

  console.log("[v0] Creating chat session with ID:", actualChatId, "for user:", userId)

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      id: actualChatId,
      user_id: userId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating chat session:", error)
    throw error
  }

  console.log("[v0] Chat session created successfully")
  return data
}

// Get all chat sessions for a user
export async function getChatSessions(userId: string): Promise<ChatSession[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching chat sessions:", error)
      throw error
    }
    return data || []
  } catch (error) {
    console.error("[v0] getChatSessions failed:", error)
    return []
  }
}

// Get messages for a specific chat session
export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching chat messages:", error)
      throw error
    }
    return data || []
  } catch (error) {
    console.error("[v0] getChatMessages failed:", error)
    return []
  }
}

// Save a new message to the database
export async function saveMessage(message: Omit<ChatMessage, "created_at">): Promise<ChatMessage> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      ...message,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Update chat session timestamp
export async function updateChatSession(chatId: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", chatId)

  if (error) throw error
}

// Delete a chat session and all its messages
export async function deleteChatSession(chatId: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from("chat_sessions").delete().eq("id", chatId)

  if (error) throw error
}

// Build conversation history for API context (within current session only)
export function buildConversationContext(messages: ChatMessage[], maxMessages = 15): string {
  // Take only the most recent messages to stay within context window
  const recentMessages = messages.slice(-maxMessages)

  if (recentMessages.length === 0) {
    return ""
  }

  const formattedMessages = recentMessages.map((msg, index) => {
    const role = msg.role === "user" ? "USER" : "AI USTAD"
    const messageNum = index + 1
    return `[Message ${messageNum}] ${role}:\n${msg.text}`
  })

  return `=== CONVERSATION HISTORY (${recentMessages.length} messages) ===\n\n${formattedMessages.join("\n\n---\n\n")}\n\n=== END OF HISTORY ===`
}

// Update chat session title
export async function updateChatTitle(chatId: string, firstMessage: string): Promise<void> {
  const supabase = getSupabase()
  const title = firstMessage.length > 50 ? firstMessage.substring(0, 47) + "..." : firstMessage

  const { error } = await supabase
    .from("chat_sessions")
    .update({
      title,
      updated_at: new Date().toISOString(),
    })
    .eq("id", chatId)

  if (error) {
    console.error("[v0] Error updating chat title:", error)
    throw error
  }

  console.log("[v0] Chat title updated to:", title)
}

// Rename chat session with custom title
export async function renameChatSession(chatId: string, newTitle: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from("chat_sessions")
    .update({
      title: newTitle,
      updated_at: new Date().toISOString(),
    })
    .eq("id", chatId)

  if (error) {
    console.error("[v0] Error renaming chat session:", error)
    throw error
  }

  console.log("[v0] Chat renamed to:", newTitle)
}

// Delete messages after a specific message (for edit/retry functionality)
export async function deleteMessagesAfter(chatId: string, afterMessageId: string): Promise<void> {
  const supabase = getSupabase()

  const { data: referenceMessage, error: fetchError } = await supabase
    .from("chat_messages")
    .select("created_at")
    .eq("id", afterMessageId)
    .single()

  if (fetchError) {
    console.error("[v0] Error fetching reference message:", fetchError)
    throw fetchError
  }

  const { error: deleteError } = await supabase
    .from("chat_messages")
    .delete()
    .eq("chat_id", chatId)
    .gt("created_at", referenceMessage.created_at)

  if (deleteError) {
    console.error("[v0] Error deleting messages:", deleteError)
    throw deleteError
  }

  console.log("[v0] Messages after", afterMessageId, "deleted successfully")
}
