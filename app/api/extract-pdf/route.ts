import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// PDF text extraction API route - runs on server with proper PDF parsing
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString("base64")

    // Use Gemini Vision to extract text from PDF
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("[v0] GEMINI_API_KEY not configured")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data,
        },
      },
      {
        text: `Extract ALL text content from this PDF document. 
        
Instructions:
- Extract every piece of text visible in the document
- Preserve the original language (including Malayalam, Arabic, Urdu, or any other language)
- Maintain paragraph structure where possible
- If there are multiple pages, extract text from all pages
- If the PDF contains scanned images of text, use OCR to extract the text
- Return ONLY the extracted text, no commentary or explanations
- If you cannot extract any text, respond with exactly: "NO_TEXT_FOUND"`,
      },
    ])

    const extractedText = result.response.text()

    if (!extractedText || extractedText === "NO_TEXT_FOUND" || extractedText.trim().length < 10) {
      return NextResponse.json(
        { error: "Could not extract text from PDF. The document may be empty or protected." },
        { status: 400 },
      )
    }

    return NextResponse.json({
      text: extractedText,
      method: "gemini-vision",
    })
  } catch (error: any) {
    console.error("[v0] PDF extraction error:", error)

    return NextResponse.json(
      {
        error: "Failed to extract PDF text",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
