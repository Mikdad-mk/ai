"use client"

import { useState, useEffect, useRef } from "react"
import { getAllKnowledgeDocuments, uploadKnowledgeDocument, deleteKnowledgeDocument } from "@/lib/knowledge-service"
import type { KnowledgeDocument } from "@/lib/knowledge-service"
import { useRouter } from "next/navigation"
import AuthGuard from "@/components/auth-guard"

export default function KnowledgeManagementPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  async function loadDocuments() {
    try {
      setIsLoading(true)
      const docs = await getAllKnowledgeDocuments()
      setDocuments(docs)
    } catch (err: any) {
      setError(err.message || "Failed to load documents")
    } finally {
      setIsLoading(false)
    }
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject("Failed to read file")
      reader.readAsText(file)
    })
  }

  const extractPdfTextViaApi = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/extract-pdf", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        if (data.text && data.text.trim().length > 0) {
          console.log(`[v0] PDF extracted successfully: ${data.text.length} characters`)
          return data.text
        }
      }

      throw new Error("PDF extraction returned empty result")
    } catch (error) {
      console.error("[v0] PDF API extraction failed:", error)
      throw error
    }
  }

  const extractTextFromFile = async (file: File): Promise<string> => {
    const fileName = file.name.toLowerCase()

    if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      return await readFileAsText(file)
    } else if (fileName.endsWith(".pdf")) {
      try {
        return await extractPdfTextViaApi(file)
      } catch (error) {
        console.warn("[v0] PDF extraction failed:", error)
        return `[PDF File: ${fileName}] - Content could not be extracted. The PDF may be scanned/image-based.`
      }
    } else if (fileName.endsWith(".docx")) {
      return await extractDocxText(file)
    }

    throw new Error(`Unsupported file type: ${file.name}`)
  }

  const extractDocxText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const text = new TextDecoder().decode(uint8Array)
    const matches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || []
    const extractedText = matches.map((m) => m.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>/, "")).join(" ")
    return extractedText || `[DOCX content from ${file.name}]`
  }

  async function handleUpload() {
    const files = fileInputRef.current?.files
    if (!files || files.length === 0) {
      setError("Please select files to upload")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setError("")

    try {
      const validFiles = Array.from(files).filter((file) => {
        const ext = file.name.toLowerCase()
        return ext.endsWith(".txt") || ext.endsWith(".md") || ext.endsWith(".pdf") || ext.endsWith(".docx")
      })

      if (validFiles.length === 0) {
        setError("No valid files. Please use PDF, DOCX, TXT, or MD files.")
        return
      }

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        setUploadProgress(Math.round(((i + 0.5) / validFiles.length) * 100))

        const content = await extractTextFromFile(file)
        const title = file.name.replace(/\.[^/.]+$/, "")
        const fileType = file.name.split(".").pop() || ""

        await uploadKnowledgeDocument(title, content, file.name, fileType)

        setUploadProgress(Math.round(((i + 1) / validFiles.length) * 100))
      }

      setSuccess(`Successfully uploaded ${validFiles.length} document(s)!`)
      await loadDocuments()

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      console.error("[v0] Upload error:", err)
      setError(err.message || "Failed to upload documents")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    try {
      await deleteKnowledgeDocument(id)
      setSuccess("Document deleted successfully!")
      await loadDocuments()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to delete document")
    }
  }

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <button
                onClick={() => router.push("/admin")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
              <h1 className="text-4xl font-bold text-gray-900">Knowledge Base Management</h1>
              <p className="text-gray-600 mt-2">Upload and manage centralized knowledge documents for AI Ustad</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Documents</h2>
            <p className="text-gray-600 mb-6">
              Upload knowledge documents that AI Ustad will use to answer questions. All users will benefit from these
              documents.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select files (.txt, .md, .pdf, .docx)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.pdf,.docx"
                  multiple
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition duration-150"
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? `Uploading... ${uploadProgress}%` : "Upload Documents"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Existing Documents ({documents.length})</h2>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-lg font-medium">No documents uploaded yet</p>
                <p className="text-sm mt-2">Upload your first knowledge document to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{doc.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {doc.file_name} • {doc.file_type.toUpperCase()} •{" "}
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{doc.content.substring(0, 200)}...</p>
                      </div>
                      <button
                        onClick={() => handleDelete(doc.id, doc.title)}
                        className="ml-4 text-red-600 hover:text-red-800 transition-colors"
                        title="Delete document"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
