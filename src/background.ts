import { translateWithGemini } from "~lib/gemini"
import { translateWithOllama } from "~lib/ollama"
import { transcribeAudio } from "~lib/whisper"
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "translate") {
    handleTranslation(message.text)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ error: error.message })
      })
    return true // Keep message channel open for async response
  }

  if (message.action === "transcribe") {
    handleTranscription(message.audioData)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ error: error.message })
      })
    return true
  }

  if (message.action === "startAudioCapture") {
    startTabAudioCapture(sender.tab?.id)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ error: error.message })
      })
    return true
  }
})

async function handleTranslation(text: string): Promise<{ translated: string; cached: boolean }> {
  const provider = await storage.get("translationProvider") || "ollama"

  let result
  if (provider === "ollama") {
    result = await translateWithOllama(text)
  } else {
    result = await translateWithGemini(text)
  }

  return {
    translated: result.translated,
    cached: result.cached
  }
}

async function handleTranscription(audioData: ArrayBuffer): Promise<{ text: string }> {
  const blob = new Blob([audioData], { type: "audio/webm" })
  const result = await transcribeAudio(blob)
  
  // Also translate the transcription
  const translation = await translateWithGemini(result.text)
  
  return {
    text: translation.translated
  }
}

async function startTabAudioCapture(tabId: number | undefined): Promise<{ success: boolean }> {
  if (!tabId) {
    throw new Error("No tab ID provided")
  }

  // Note: tabCapture requires user gesture and cannot be started from background
  // This is a placeholder - actual implementation needs offscreen document in MV3
  
  return { success: true }
}

// Log when extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("NPO Translate extension installed")
    // Open options page on first install
    chrome.runtime.openOptionsPage?.()
  }
})
