import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { Storage } from "@plasmohq/storage"
import { findNPOSubtitleContainer, findVideoElement, observeSubtitleChanges } from "~lib/subtitleDetector"

export const config: PlasmoCSConfig = {
  matches: ["https://*.npo.nl/*", "https://*.npostart.nl/*"],
  all_frames: true
}

const storage = new Storage()

function SubtitleOverlay() {
  const [translatedText, setTranslatedText] = useState<string>("")
  const [isEnabled, setIsEnabled] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [fontSize, setFontSize] = useState<number>(24)

  useEffect(() => {
    console.log("[NPO Translate] Overlay component mounted")

    // Load initial states
    storage.get("translationEnabled").then((enabled) => {
      console.log("[NPO Translate] Translation enabled:", enabled)
      setIsEnabled(enabled === true)
    })
    storage.get("fontSize").then((size) => {
      if (size) setFontSize(size)
    })

    // Listen for setting changes
    storage.watch({
      translationEnabled: (c) => {
        console.log("[NPO Translate] Translation toggled:", c.newValue)
        setIsEnabled(c.newValue === true)
      },
      fontSize: (c) => {
        if (c.newValue) setFontSize(c.newValue)
      }
    })

    return () => {
      // Cleanup not directly supported, but we clear state
    }
  }, [])

  useEffect(() => {
    if (!isEnabled) {
      setTranslatedText("")
      return
    }

    let observer: MutationObserver | null = null
    let lastText = ""

    const setupObserver = () => {
      const subtitleElement = findNPOSubtitleContainer()

      if (subtitleElement) {
        console.log("[NPO Translate] Setting up observer on subtitle element")
        observer = observeSubtitleChanges(subtitleElement.container, async (text) => {
          // Debounce - only translate if text changed
          if (text === lastText) return
          lastText = text

          console.log("[NPO Translate] Subtitle detected:", text)
          setIsLoading(true)
          setError("")

          try {
            // Send to background for translation
            const response = await chrome.runtime.sendMessage({
              action: "translate",
              text
            })

            if (response.error) {
              console.log("[NPO Translate] Translation error:", response.error)
              setError(response.error)
            } else {
              console.log("[NPO Translate] Translation result:", response.translated)
              setTranslatedText(response.translated)
            }
          } catch (err) {
            console.log("[NPO Translate] Translation failed:", err)
            setError("Translation failed")
          } finally {
            setIsLoading(false)
          }
        })
      }
    }

    // Try to find subtitles periodically until found
    const interval = setInterval(() => {
      if (!observer) {
        setupObserver()
      }
    }, 1000)

    setupObserver()

    return () => {
      clearInterval(interval)
      if (observer) {
        observer.disconnect()
      }
    }
  }, [isEnabled])

  if (!isEnabled || (!translatedText && !isLoading && !error)) {
    return null
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        color: "white",
        padding: "12px 24px",
        borderRadius: "8px",
        fontSize: `${fontSize}px`,
        fontFamily: "Arial, sans-serif",
        maxWidth: "80%",
        textAlign: "center",
        zIndex: 2147483647,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
      }}>
      {isLoading && <span style={{ opacity: 0.7 }}>Translating...</span>}
      {error && <span style={{ color: "#ff6b6b" }}>{error}</span>}
      {!isLoading && !error && translatedText}
    </div>
  )
}

// Mount the overlay
console.log("[NPO Translate] Content script loaded on:", window.location.href)

const overlayContainer = document.createElement("div")
overlayContainer.id = "npo-translate-overlay"
document.body.appendChild(overlayContainer)

// Handle fullscreen changes - move overlay inside fullscreen element
document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement) {
    // Move overlay inside the fullscreen element
    document.fullscreenElement.appendChild(overlayContainer)
    console.log("[NPO Translate] Moved overlay to fullscreen element")
  } else {
    // Move back to body when exiting fullscreen
    document.body.appendChild(overlayContainer)
    console.log("[NPO Translate] Moved overlay back to body")
  }
})

// Also handle webkit prefix for Safari
document.addEventListener("webkitfullscreenchange", () => {
  const fullscreenEl = document.fullscreenElement || (document as any).webkitFullscreenElement
  if (fullscreenEl) {
    fullscreenEl.appendChild(overlayContainer)
  } else {
    document.body.appendChild(overlayContainer)
  }
})

const root = createRoot(overlayContainer)
root.render(<SubtitleOverlay />)

export default SubtitleOverlay
