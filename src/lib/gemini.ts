import { GoogleGenAI } from "@google/genai"
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

export interface TranslationResult {
  original: string
  translated: string
  cached: boolean
}

export async function translateWithGemini(text: string): Promise<TranslationResult> {
  // Check environment variable first, then fall back to storage
  const apiKey = process.env.PLASMO_PUBLIC_GEMINI_API_KEY || await storage.get("geminiApiKey")

  if (!apiKey) {
    throw new Error("Gemini API key not configured. Set PLASMO_PUBLIC_GEMINI_API_KEY in .env.local or enter it in the extension popup.")
  }

  // Check cache first
  const cacheKey = "translation:" + hashText(text)
  const cached = await storage.get(cacheKey)
  if (cached) {
    return {
      original: text,
      translated: cached,
      cached: true
    }
  }

  const ai = new GoogleGenAI({ apiKey })
  const prompt = "Translate the following Dutch subtitle text to English. Only return the translation, no explanations:\n\n" + text

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      temperature: 0.1,
      maxOutputTokens: 256
    }
  })

  const translated = response.text?.trim() || text

  // Cache the result
  await storage.set(cacheKey, translated)

  return {
    original: text,
    translated,
    cached: false
  }
}

function hashText(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}

export async function testGeminiConnection(): Promise<boolean> {
  try {
    const result = await translateWithGemini("Hallo")
    return result.translated.length > 0
  } catch {
    return false
  }
}
