import { createClient } from "@/lib/supabase/client"

export interface SupportRequest {
  id: string
  user_id: string
  user_name: string | null
  user_email: string | null
  subject: string
  message: string
  status: "pending" | "in_progress" | "resolved"
  admin_response: string | null
  created_at: string
  updated_at: string
}

export async function createSupportRequest(data: {
  user_id: string
  user_name: string
  user_email: string
  subject: string
  message: string
}): Promise<SupportRequest> {
  const supabase = createClient()

  const { data: request, error } = await supabase
    .from("support_requests")
    .insert([
      {
        user_id: data.user_id,
        user_name: data.user_name,
        user_email: data.user_email,
        subject: data.subject,
        message: data.message,
        status: "pending",
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Error creating support request:", error)
    throw new Error("Failed to create support request")
  }

  return request
}

export async function getUserSupportRequests(userId: string): Promise<SupportRequest[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("support_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching user support requests:", error)
    throw new Error("Failed to fetch support requests")
  }

  return data || []
}

export async function getAllSupportRequests(): Promise<SupportRequest[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("support_requests").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching all support requests:", error)
    throw new Error("Failed to fetch support requests")
  }

  return data || []
}

export async function updateSupportRequestStatus(
  requestId: string,
  status: "pending" | "in_progress" | "resolved",
  adminResponse?: string,
): Promise<void> {
  const supabase = createClient()

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (adminResponse) {
    updateData.admin_response = adminResponse
  }

  const { error } = await supabase.from("support_requests").update(updateData).eq("id", requestId)

  if (error) {
    console.error("Error updating support request:", error)
    throw new Error("Failed to update support request")
  }
}
