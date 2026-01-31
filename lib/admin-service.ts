import { createClient } from "@/lib/supabase/client"

export interface AdminStats {
  totalUsers: number
  totalChats: number
  activeToday: number
}

export interface UserData {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

export interface ChatAnalytics {
  totalMessages: number
  averageMessagesPerChat: number
  chatsCreatedToday: number
  messagesCreatedToday: number
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = createClient()

  // Get total users
  const { count: totalUsers } = await supabase.from("user_profiles").select("*", { count: "exact", head: true })

  // Get total chats
  const { count: totalChats } = await supabase.from("chat_sessions").select("*", { count: "exact", head: true })

  // Get active today (users who created a chat or message today)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: activeSessions } = await supabase
    .from("chat_sessions")
    .select("user_id")
    .gte("created_at", today.toISOString())

  const uniqueActiveUsers = new Set(activeSessions?.map((s) => s.user_id) || [])

  return {
    totalUsers: totalUsers || 0,
    totalChats: totalChats || 0,
    activeToday: uniqueActiveUsers.size,
  }
}

export async function getAllUsers(): Promise<UserData[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("user_profiles").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function getChatAnalytics(): Promise<ChatAnalytics> {
  const supabase = createClient()

  // Get total messages
  const { count: totalMessages } = await supabase.from("chat_messages").select("*", { count: "exact", head: true })

  // Get total chats
  const { count: totalChats } = await supabase.from("chat_sessions").select("*", { count: "exact", head: true })

  // Get chats and messages created today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: chatsCreatedToday } = await supabase
    .from("chat_sessions")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString())

  const { count: messagesCreatedToday } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString())

  return {
    totalMessages: totalMessages || 0,
    averageMessagesPerChat: totalChats && totalMessages ? Math.round(totalMessages / totalChats) : 0,
    chatsCreatedToday: chatsCreatedToday || 0,
    messagesCreatedToday: messagesCreatedToday || 0,
  }
}

export async function updateUserRole(userId: string, role: "user" | "admin"): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from("user_profiles").update({ role }).eq("id", userId)

  if (error) throw error
}

export async function deleteUser(userId: string): Promise<void> {
  const supabase = createClient()

  // This will cascade delete user_profiles, chat_sessions, and chat_messages
  // due to the foreign key constraints
  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) throw error
}
