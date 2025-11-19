import { Storage } from "@plasmohq/storage"

const storage = new Storage()

export interface TranscriptionResult {
  text: string
  language: string
}

export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  // Check environment variable first, then fall back to storage
  const apiKey = process.env.PLASMO_PUBLIC_OPENAI_API_KEY || await storage.get("openaiApiKey")

  if (!apiKey) {
    throw new Error("OpenAI API key not configured. Set PLASMO_PUBLIC_OPENAI_API_KEY in .env.local or enter it in the extension popup.")
  }

  const formData = new FormData()
  formData.append("file", audioBlob, "audio.webm")
  formData.append("model", "whisper-1")
  formData.append("language", "nl") // Dutch
  formData.append("response_format", "json")

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: formData
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Whisper API error: ${error}`)
  }

  const data = await response.json()
  
  return {
    text: data.text || "",
    language: "nl"
  }
}

export class AudioChunker {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private onChunkReady: (blob: Blob) => void

  constructor(onChunkReady: (blob: Blob) => void) {
    this.onChunkReady = onChunkReady
  }

  async start(stream: MediaStream) {
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus"
    })

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data)
      }
    }

    this.mediaRecorder.onstop = () => {
      if (this.chunks.length > 0) {
        const blob = new Blob(this.chunks, { type: "audio/webm" })
        this.chunks = []
        this.onChunkReady(blob)
      }
    }

    // Start recording
    this.mediaRecorder.start()

    // Create 5-second chunks
    setInterval(() => {
      if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
        this.mediaRecorder.stop()
        this.mediaRecorder.start()
      }
    }, 5000)
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop()
    }
  }
}
