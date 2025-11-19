import { AudioChunker, transcribeAudio } from "./whisper"
import { translateWithGemini } from "./gemini"

export interface CaptureSession {
  stop: () => void
  isActive: boolean
}

export async function startAudioCapture(
  onTranslation: (text: string) => void,
  onError: (error: string) => void
): Promise<CaptureSession> {
  let isActive = false
  let chunker: AudioChunker | null = null

  try {
    // Request tab audio capture
    // Note: This requires the tabCapture permission and user gesture
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    })

    chunker = new AudioChunker(async (audioBlob) => {
      try {
        // Transcribe the audio chunk
        const transcription = await transcribeAudio(audioBlob)
        
        if (transcription.text && transcription.text.trim().length > 0) {
          // Translate the transcription
          const translation = await translateWithGemini(transcription.text)
          onTranslation(translation.translated)
        }
      } catch (err) {
        onError((err as Error).message)
      }
    })

    await chunker.start(stream)
    isActive = true

    return {
      stop: () => {
        if (chunker) {
          chunker.stop()
        }
        stream.getTracks().forEach((track) => track.stop())
        isActive = false
      },
      get isActive() {
        return isActive
      }
    }
  } catch (err) {
    throw new Error("Failed to capture audio: " + (err as Error).message)
  }
}

// For MV3, we need to use chrome.tabCapture in offscreen documents
// This is a simplified version that uses getUserMedia
export async function captureTabAudio(tabId: number): Promise<MediaStream> {
  return new Promise((resolve, reject) => {
    chrome.tabCapture.capture(
      {
        audio: true,
        video: false
      },
      (stream) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else if (stream) {
          resolve(stream)
        } else {
          reject(new Error("Failed to capture tab audio"))
        }
      }
    )
  })
}
