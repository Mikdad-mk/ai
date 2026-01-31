"use client"

import { useState, useRef, useEffect } from "react"
import StatusMessage from "./status-message"
import QuizResults from "./quiz-results"
import UploadOverlay from "./upload-overlay"
import Toast from "./toast-notification"
import AnswerDisplay from "./answer-display"

const SOURCE_DOC_STORAGE_KEY = "ai_ustad_source_document"
const ANSWERS_STORAGE_KEY = "ai_ustad_extracted_answers"
const EMPTY_MEMORY_TEXT =
  "No document loaded or saved yet. Upload files to begin. You can still ask general knowledge questions."

export default function KnowledgePanel() {
  const [uploadedText, setUploadedText] = useState("")
  const [documentContent, setDocumentContent] = useState(EMPTY_MEMORY_TEXT)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [statusColor, setStatusColor] = useState("")
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizData, setQuizData] = useState<any[]>([])
  const [showUploadOverlay, setShowUploadOverlay] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentFileName, setCurrentFileName] = useState("")
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)
  const [extractedAnswers, setExtractedAnswers] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const savedDocument = localStorage.getItem(SOURCE_DOC_STORAGE_KEY)
    const savedAnswers = localStorage.getItem(ANSWERS_STORAGE_KEY)

    if (savedDocument) {
      try {
        const text = JSON.parse(savedDocument)
        setUploadedText(text)
        const snippet = text.substring(0, 500) + (text.length > 500 ? "\n\n... (Content truncated for display)" : "")
        setDocumentContent(snippet)
      } catch (error) {
        console.error("[v0] Error loading document from storage:", error)
      }
    }

    if (savedAnswers) {
      try {
        const answers = JSON.parse(savedAnswers)
        setExtractedAnswers(answers)
      } catch (error) {
        console.error("[v0] Error loading answers from storage:", error)
      }
    }
  }, [])

  const showStatus = (message: string, color: string) => {
    setStatusMessage(message)
    setStatusColor(color)
    setTimeout(() => setStatusMessage(""), 4000)
  }

  const readFileAsText = (file: File): Promise<{ name: string; content: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve({ name: file.name, content: e.target?.result as string })
      reader.onerror = () => reject(`Failed to read file: ${file.name}`)
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
      const result = await readFileAsText(file)
      return result.content
    } else if (fileName.endsWith(".pdf")) {
      try {
        const text = await extractPdfTextViaApi(file)
        return text
      } catch (error) {
        console.warn("[v0] PDF extraction failed:", error)
        return `[PDF File: ${fileName}] - Content could not be extracted. The PDF may be scanned/image-based. Please try with a text-based PDF or use TXT/DOCX format.`
      }
    } else if (fileName.endsWith(".docx")) {
      try {
        const text = await extractDocxText(file)
        return text
      } catch (error) {
        console.warn("[v0] DOCX parsing failed:", error)
        return `[DOCX File: ${fileName}] - Content could not be fully extracted. Please try with TXT or PDF format.`
      }
    }
    throw new Error(`Unsupported file type: ${file.name}`)
  }

  const extractDocxText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()

    try {
      const uint8Array = new Uint8Array(arrayBuffer)
      const text = new TextDecoder().decode(uint8Array)

      // Extract text between XML tags
      const matches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || []
      const extractedText = matches.map((m) => m.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>/, "")).join(" ")

      return extractedText || `[DOCX Content] - ${text.substring(0, 500)}`
    } catch (error) {
      throw error
    }
  }

  const extractOrGenerateAnswers = async (sourceDocument: string) => {
    try {
      console.log("[v0] Starting answer extraction/generation")
      const response = await fetch("/api/extract-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceDocument }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Extraction response:", data)

        if (data.answers && Array.isArray(data.answers) && data.answers.length > 0) {
          setExtractedAnswers(data.answers)
          localStorage.setItem(ANSWERS_STORAGE_KEY, JSON.stringify(data.answers))

          if (data.generated) {
            setToast({
              message: `Generated ${data.answers.length} answers successfully via Gemini AI!`,
              type: "success",
            })
          } else if (data.hasAnswers) {
            setToast({
              message: `Found ${data.answers.length} existing answers in document!`,
              type: "success",
            })
          }
        }
        return data.answers
      }
    } catch (error) {
      console.error("[v0] Error extracting/generating answers:", error)
      setToast({
        message: "Error processing answers. Please try again.",
        type: "error",
      })
    }
    return []
  }

  const handleSaveDocument = async () => {
    const files = fileInputRef.current?.files
    if (!files || files.length === 0) {
      showStatus("Please select files to upload.", "bg-yellow-500")
      return
    }

    setIsLoading(true)
    setShowUploadOverlay(true)
    setUploadProgress(0)

    try {
      const validFiles = Array.from(files).filter((file) => {
        const ext = file.name.toLowerCase()
        return ext.endsWith(".txt") || ext.endsWith(".md") || ext.endsWith(".pdf") || ext.endsWith(".docx")
      })

      if (validFiles.length === 0) {
        showStatus("No valid files selected. Please use PDF, DOCX, TXT, or MD files.", "bg-yellow-500")
        setShowUploadOverlay(false)
        setIsLoading(false)
        return
      }

      setCurrentFileName(validFiles[0].name)
      setUploadProgress(10)

      const fileContents = await Promise.all(
        validFiles.map(async (file) => ({
          name: file.name,
          content: await extractTextFromFile(file),
        })),
      )
      setUploadProgress(40)

      const combined = fileContents
        .map((item) => `--- FILE START: ${item.name} ---\n${item.content}\n--- FILE END: ${item.name} ---`)
        .join("\n\n")

      setUploadedText(combined)
      setUploadProgress(60)

      const snippet =
        combined.substring(0, 500) + (combined.length > 500 ? "\n\n... (Content truncated for display)" : "")
      setDocumentContent(snippet)

      await extractOrGenerateAnswers(combined)
      setUploadProgress(85)

      localStorage.setItem(SOURCE_DOC_STORAGE_KEY, JSON.stringify(combined))
      setUploadProgress(100)

      setTimeout(() => {
        setToast({
          message: `${validFiles.length} file(s) loaded and saved successfully!`,
          type: "success",
        })
        setShowUploadOverlay(false)
        showStatus(`${validFiles.length} file(s) loaded and saved!`, "bg-green-500")
      }, 500)

      setIsOpen(false)

      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (error) {
      console.error("Error saving document:", error)
      showStatus("Error saving document.", "bg-red-500")
      setToast({
        message: "Error uploading file. Please try again.",
        type: "error",
      })
      setShowUploadOverlay(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateQuiz = async () => {
    if (!uploadedText.trim()) {
      showStatus("Please upload a document first!", "bg-red-500")
      return
    }

    setQuizLoading(true)
    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceDocument: uploadedText }),
      })

      if (response.ok) {
        const data = await response.json()
        setQuizData(data.quizData)
      } else {
        showStatus("Failed to generate quiz.", "bg-red-500")
      }
    } catch (error) {
      console.error("Error generating quiz:", error)
      showStatus("Error generating quiz.", "bg-red-500")
    } finally {
      setQuizLoading(false)
    }
  }

  const handleRefreshMemory = async () => {
    if (
      !confirm("Are you sure you want to reset the AI memory? This will permanently delete the current knowledge file.")
    ) {
      return
    }

    localStorage.removeItem(SOURCE_DOC_STORAGE_KEY)
    localStorage.removeItem(ANSWERS_STORAGE_KEY)

    setUploadedText("")
    setDocumentContent(EMPTY_MEMORY_TEXT)
    setQuizData([])
    setExtractedAnswers([])
    if (fileInputRef.current) fileInputRef.current.value = ""

    showStatus("Memory reset successfully.", "bg-green-600")
  }

  return (
    <>
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-xl h-fit sticky top-4">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex justify-between items-center cursor-pointer hover:bg-indigo-50 p-2 -mx-2 -mt-2 rounded-lg transition duration-150"
        >
          <h2 className="text-2xl font-semibold text-indigo-700">Upload Knowledge Files</h2>
          <svg
            className={`w-6 h-6 text-indigo-700 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {isOpen && (
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select files (.txt, .md, .pdf, .docx) for the AI's memory.
            </label>
            <div className="flex items-center space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf,.docx"
                multiple
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition duration-150"
              />
              <button
                onClick={handleSaveDocument}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 shadow-lg text-sm whitespace-nowrap disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Load & Save"}
              </button>
            </div>

            <div className="border border-gray-300 bg-gray-100 p-3 rounded-lg text-sm text-gray-700 min-h-[100px] max-h-[250px] overflow-y-auto whitespace-pre-wrap">
              {documentContent}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleRefreshMemory}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 shadow-lg text-sm"
              >
                Refresh Memory
              </button>
            </div>

            {statusMessage && <StatusMessage message={statusMessage} bgColor={statusColor} />}

            {extractedAnswers.length > 0 && <AnswerDisplay answers={extractedAnswers} />}

            {quizData.length > 0 && <QuizResults quizData={quizData} />}
          </div>
        )}
      </div>

      <UploadOverlay isVisible={showUploadOverlay} progress={uploadProgress} fileName={currentFileName} />
      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  )
}
