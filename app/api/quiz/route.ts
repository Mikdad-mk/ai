import { type NextRequest, NextResponse } from "next/server"
import { QUIZ_SCHEMA } from "@/lib/gemini-api"
import { getChatApiUrl } from "@/lib/gemini-server"

export async function POST(request: NextRequest) {
  try {
    const { sourceDocument } = await request.json()

    if (!sourceDocument?.trim()) {
      return NextResponse.json({ error: "Please upload and save the knowledge file first!" }, { status: 400 })
    }

    const systemPrompt =
      "You are a quiz generation engine. Based *only* on the provided document, create exactly three multiple-choice questions. Ensure each question has exactly four options and a single correct answer. Respond ONLY with the JSON structure provided."

    const payload = {
      contents: [{ parts: [{ text: "Generate a quiz with 3 multiple-choice questions based on this document." }] }],
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: QUIZ_SCHEMA,
      },
    }

    let response
    let attempt = 0
    const maxAttempts = 5

    while (attempt < maxAttempts) {
      attempt++
      try {
        const fetchResponse = await fetch(getChatApiUrl(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (fetchResponse.ok) {
          response = await fetchResponse.json()
          break
        } else if (fetchResponse.status === 429 && attempt < maxAttempts) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000
          await new Promise((resolve) => setTimeout(resolve, delay))
        } else {
          throw new Error(`API Error: ${fetchResponse.statusText}`)
        }
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error
        }
      }
    }

    if (response) {
      const jsonText = response.candidates?.[0]?.content?.parts?.[0]?.text
      if (jsonText) {
        const quizData = JSON.parse(jsonText)
        return NextResponse.json({ quizData })
      }
    }

    return NextResponse.json({ error: "AI failed to generate quiz." }, { status: 500 })
  } catch (error: any) {
    console.error("Error in quiz API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
