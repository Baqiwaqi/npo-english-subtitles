import { Storage } from "@plasmohq/storage"

const storage = new Storage()

export interface TranslationResult {
  original: string
  translated: string
  cached: boolean
}

export async function translateWithOllama(text: string): Promise<TranslationResult> {
  const ollamaUrl = await storage.get("ollamaUrl") || "http://127.0.0.1:11434"
  const ollamaModel = await storage.get("ollamaModel") || "fast-trans"

  // Check cache first
  const cacheKey = "translation:ollama:" + hashText(text)
  const cached = await storage.get(cacheKey)
  if (cached) {
    return {
      original: text,
      translated: cached,
      cached: true
    }
  }

  // Simple prompt - the model's system prompt handles the translation instructions
  const prompt = text

  let response
  try {
    response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 256
        }
      })
    })
  } catch (fetchError) {
    throw new Error(`Ollama connection failed: ${(fetchError as Error).message}. Is Ollama running?`)
  }

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Ollama API error (${response.status}): ${error || 'Unknown error'}`)
  }

  const data = await response.json()
  let translated = data.response?.trim() || text

  // Clean up any thinking tags that qwen might add
  translated = translated.replace(/<think>[\s\S]*?<\/think>/g, "").trim()

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

export async function testOllamaConnection(): Promise<boolean> {
  try {
    const ollamaUrl = await storage.get("ollamaUrl") || "http://127.0.0.1:11434"
    const response = await fetch(`${ollamaUrl}/api/tags`)
    return response.ok
  } catch {
    return false
  }
}
