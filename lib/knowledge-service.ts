import { createClient } from "@/lib/supabase/client"
import { createServerClient } from "@supabase/ssr"

export interface KnowledgeDocument {
  id: string
  title: string
  content: string
  file_name: string
  file_type: string
  uploaded_by: string
  created_at: string
  updated_at: string
}

// Client-side functions
export async function getAllKnowledgeDocuments(): Promise<KnowledgeDocument[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("knowledge_documents")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching knowledge documents:", error)
    throw error
  }

  return data || []
}

export async function getCombinedKnowledgeContent(): Promise<string> {
  try {
    const documents = await getAllKnowledgeDocuments()

    if (documents.length === 0) {
      return ""
    }

    return documents.map((doc) => `--- DOCUMENT: ${doc.title} ---\n${doc.content}\n--- END DOCUMENT ---`).join("\n\n")
  } catch (error) {
    console.error("[v0] Error getting combined knowledge:", error)
    return ""
  }
}

export async function uploadKnowledgeDocument(
  title: string,
  content: string,
  fileName: string,
  fileType: string,
): Promise<KnowledgeDocument> {
  const supabase = createClient()

  const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("knowledge_documents")
    .insert({
      id,
      title,
      content,
      file_name: fileName,
      file_type: fileType,
      uploaded_by: userData.user.id,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error uploading knowledge document:", error)
    throw error
  }

  return data
}

export async function deleteKnowledgeDocument(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from("knowledge_documents").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting knowledge document:", error)
    throw error
  }
}

// Server-side functions
export async function getCombinedKnowledgeContentServer(): Promise<string> {
  try {
    const { cookies } = await import("next/headers")
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

    const { data, error } = await supabase
      .from("knowledge_documents")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching knowledge documents:", error)
      return ""
    }

    if (!data || data.length === 0) {
      return ""
    }

    return data.map((doc) => `--- DOCUMENT: ${doc.title} ---\n${doc.content}\n--- END DOCUMENT ---`).join("\n\n")
  } catch (error) {
    console.error("[v0] Error getting combined knowledge:", error)
    return ""
  }
}
