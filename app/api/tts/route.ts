import { type NextRequest, NextResponse } from "next/server"
import { getApiKeys, getTtsApiUrlWithKey, ttsModel } from "@/lib/gemini-server"
import { TTS_VOICE } from "@/lib/gemini-api"

export const maxDuration = 60 // Allow up to 60 seconds for TTS generation

export async function POST(request: NextRequest) {
  try {
    const { textToSpeak, voice } = await request.json()

    // Clean the text for TTS
    let cleanText = textToSpeak
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold markdown
      .replace(/\*(.*?)\*/g, "$1") // Remove italic markdown
      .replace(/#{1,6}\s/g, "") // Remove heading markers
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks
      .replace(/`([^`]+)`/g, "$1") // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Convert links to text
      .trim()

    if (!cleanText) {
      return NextResponse.json({ error: "Nothing to read aloud." }, { status: 400 })
    }

    // Truncate if too long (TTS has 32k token limit)
    if (cleanText.length > 8000) {
      cleanText = cleanText.substring(0, 8000) + "... (Text truncated for TTS)"
    }

    const selectedVoice = voice || TTS_VOICE

    // Gemini 2.5 Flash TTS natively supports multilingual text
    // It can automatically detect and pronounce multiple languages in the same text
    // Including: Arabic, Malayalam, English, Urdu, Hindi, etc.
    const payload = {
      contents: [{ parts: [{ text: cleanText }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    }

    // Get all API keys for rotation/retry
    const apiKeys = getApiKeys()
    if (apiKeys.length === 0) {
      return NextResponse.json(
        { error: "No API keys configured. Please add GEMINI_API_KEY to environment variables." },
        { status: 500 }
      )
    }

    let lastError: Error | null = null

    // Helper function to delay
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    // Helper function to extract retry delay from error response
    const extractRetryDelay = (errorText: string): number => {
      // Try to extract retry delay from the error message
      const retryMatch = errorText.match(/retry in (\d+(?:\.\d+)?)/i)
      if (retryMatch) {
        return Math.ceil(Number.parseFloat(retryMatch[1]) * 1000) // Convert to ms
      }
      return 2000 // Default 2 second delay
    }

    // Try each API key with retry logic
    for (let i = 0; i < apiKeys.length; i++) {
      const apiKey = apiKeys[i]
      const apiUrl = getTtsApiUrlWithKey(apiKey)

      // Allow up to 2 retries per key for rate limits
      for (let retry = 0; retry < 2; retry++) {
        try {
          console.log(`[TTS] Attempting with API key ${i + 1}/${apiKeys.length}, attempt ${retry + 1}`)

          const fetchResponse = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })

          if (!fetchResponse.ok) {
            const errorText = await fetchResponse.text()
            console.error(`[TTS] API key ${i + 1} failed:`, fetchResponse.status, errorText)

            // If rate limited (429), check if it's quota exhaustion or temporary rate limit
            if (fetchResponse.status === 429) {
              // Parse the error to check if it's a daily quota issue
              const isDailyQuotaExhausted = errorText.includes("quota") && 
                                           (errorText.includes("exceeded your current quota") || 
                                            errorText.includes("GenerateRequestsPerDayPerProjectPerModel"))
              
              if (isDailyQuotaExhausted) {
                // Daily quota exhausted - don't retry, move to next key
                console.log(`[TTS] API key ${i + 1} daily quota exhausted`)
                lastError = new Error(
                  "TTS daily quota exhausted. The free tier allows 10 requests per day. " +
                  "Please add additional API keys (GEMINI_API_KEY_2, etc.) or upgrade your plan."
                )
                break
              }
              
              // Temporary rate limit - retry with delay
              const retryDelay = extractRetryDelay(errorText)
              console.log(`[TTS] Rate limited, waiting ${retryDelay}ms before retry...`)
              
              if (retry < 1) {
                await delay(retryDelay)
                continue // Retry with same key
              }
              
              // After retry, move to next key
              lastError = new Error("Rate limited. Please try again in a few seconds.")
              break
            }

            // If quota exceeded (403), try next key immediately
            if (fetchResponse.status === 403) {
              lastError = new Error("API quota exceeded. Please add more API keys or upgrade your plan.")
              break
            }

            // For other errors, throw immediately
            throw new Error(`TTS API Error: ${fetchResponse.status} - ${errorText}`)
          }

          const response = await fetchResponse.json()
          const candidate = response.candidates?.[0]
          const part = candidate?.content?.parts?.[0]
          const audioData = part?.inlineData?.data
          const mimeType = part?.inlineData?.mimeType

          if (audioData && mimeType) {
            console.log(`[TTS] Success with API key ${i + 1}, mimeType: ${mimeType}`)
            return NextResponse.json({ audioData, mimeType })
          } else {
            console.error("[TTS] Invalid response structure:", JSON.stringify(response).substring(0, 500))
            lastError = new Error("TTS generation failed. Audio data missing from response.")
            break
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          console.error(`[TTS] Error with API key ${i + 1}:`, errorMessage)
          lastError = error instanceof Error ? error : new Error(errorMessage)

          // If it's a network error or timeout, try next key
          if (errorMessage.includes("fetch") || errorMessage.includes("timeout")) {
            break
          }

          // For other errors, throw immediately
          throw error
        }
      }
    }

    // All keys failed
    return NextResponse.json(
      { error: lastError?.message || "All API keys failed. Please try again later." },
      { status: 500 }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[TTS] Error in TTS API:", errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
