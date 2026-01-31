export const chatModel = "gemini-2.5-flash"
export const ttsModel = "gemini-2.5-flash-preview-tts"

// Get all available API keys from environment variables
export function getApiKeys(): string[] {
  const keys: string[] = []
  
  // Primary key
  if (process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY)
  }
  
  // Additional keys (GEMINI_API_KEY_2, GEMINI_API_KEY_3, etc.)
  for (let i = 2; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`]
    if (key) {
      keys.push(key)
    }
  }
  
  return keys
}

// Track which key index to use next (round-robin)
let currentKeyIndex = 0

export function getNextApiKey(): string {
  const keys = getApiKeys()
  if (keys.length === 0) {
    throw new Error("No GEMINI_API_KEY environment variables are set")
  }
  
  const key = keys[currentKeyIndex % keys.length]
  currentKeyIndex = (currentKeyIndex + 1) % keys.length
  return key
}

export function getChatApiUrl(): string {
  const apiKey = getNextApiKey()
  return `https://generativelanguage.googleapis.com/v1beta/models/${chatModel}:generateContent?key=${apiKey}`
}

export function getTtsApiUrl(): string {
  const apiKey = getNextApiKey()
  return `https://generativelanguage.googleapis.com/v1beta/models/${ttsModel}:generateContent?key=${apiKey}`
}

// Get TTS URL with a specific key (for retry logic)
export function getTtsApiUrlWithKey(apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${ttsModel}:generateContent?key=${apiKey}`
}
