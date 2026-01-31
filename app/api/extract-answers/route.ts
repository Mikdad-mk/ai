import { type NextRequest, NextResponse } from "next/server"
import { getChatApiUrl } from "@/lib/gemini-server"

function parseJsonResponse(text: string): any {
  // Remove markdown code blocks if present
  const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "")

  try {
    return JSON.parse(cleanText)
  } catch (e) {
    console.log("[v0] JSON parse attempt 1 failed, trying with sanitization")
    // Try to extract JSON from text
    const jsonMatch = cleanText.match(/\[[\s\S]*\]|\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch (e2) {
        console.log("[v0] JSON parse attempt 2 failed")
      }
    }
    throw new Error("Could not parse JSON response")
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sourceDocument } = await request.json()

    if (!sourceDocument?.trim()) {
      return NextResponse.json({ hasAnswers: false, answers: [] }, { status: 200 })
    }

    console.log("[v0] Extracting answers from document, length:", sourceDocument.length)

    // First, try to extract existing answers from the document
    const extractPrompt = `Review this document and extract any existing answer key or answers section. 
    Look for patterns like:
    - "Answer Key:" or "Answers:"
    - "Correct Answers:"
    - Q&A format with answers
    - Test answers listed at the end
    - Solutions or Answer sections
    
    If you find answers, return ONLY a JSON array with this exact format (no markdown, no extra text):
    [{"question": "...", "answer": "..."}]
    
    If no answers exist, return this exact response:
    {"hasAnswers": false}
    
    Document:
    ${sourceDocument}`

    const extractResponse = await fetch(getChatApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: extractPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2000,
          topP: 0.95,
        },
      }),
    })

    if (!extractResponse.ok) {
      console.log("[v0] Extract API failed, will generate answers")
    } else {
      const extractData = await extractResponse.json()
      const responseText = extractData.candidates?.[0]?.content?.parts?.[0]?.text || ""
      console.log("[v0] Extract response:", responseText.substring(0, 200))

      try {
        const parsedResponse = parseJsonResponse(responseText)
        if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
          console.log("[v0] Found existing answers:", parsedResponse.length)
          return NextResponse.json({ hasAnswers: true, answers: parsedResponse })
        }
      } catch (e) {
        console.log("[v0] Failed to parse extract response, will generate answers")
      }
    }

    // If no answers found, generate them
    console.log("[v0] Generating answers via Gemini")
    const generatePrompt = `Based on this document, create a comprehensive answer key for all questions, topics, or learning points.
    Return ONLY a JSON array with this exact format (no markdown, no extra text):
    [{"question": "...", "answer": "..."}]
    
    Make sure to identify all questions and provide complete, accurate answers based on the document content.
    
    Document:
    ${sourceDocument}`

    const generateResponse = await fetch(getChatApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: generatePrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
          topP: 0.95,
        },
      }),
    })

    if (!generateResponse.ok) {
      console.error("[v0] Generate API failed:", generateResponse.statusText)
      throw new Error("Failed to generate answers")
    }

    const generateData = await generateResponse.json()
    const generateText = generateData.candidates?.[0]?.content?.parts?.[0]?.text || "[]"
    console.log("[v0] Generate response:", generateText.substring(0, 200))

    try {
      const generatedAnswers = parseJsonResponse(generateText)
      if (Array.isArray(generatedAnswers) && generatedAnswers.length > 0) {
        console.log("[v0] Generated answers:", generatedAnswers.length)
        return NextResponse.json({ hasAnswers: false, answers: generatedAnswers, generated: true })
      }
    } catch (e) {
      console.error("[v0] Failed to parse generated response:", e)
    }

    return NextResponse.json({ hasAnswers: false, answers: [] })
  } catch (error) {
    console.error("[v0] Error in extract-answers API:", error)
    return NextResponse.json({ hasAnswers: false, answers: [] }, { status: 200 })
  }
}
