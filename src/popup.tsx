import { useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import { GoogleGenAI } from "@google/genai"

function IndexPopup() {
  const [geminiApiKey, setGeminiApiKey] = useStorage("geminiApiKey", "")
  const [openaiApiKey, setOpenaiApiKey] = useStorage("openaiApiKey", "")
  const [translationEnabled, setTranslationEnabled] = useStorage("translationEnabled", false)
  const [translationProvider, setTranslationProvider] = useStorage("translationProvider", "ollama")
  const [ollamaUrl, setOllamaUrl] = useStorage("ollamaUrl", "http://127.0.0.1:11434")
  const [ollamaModel, setOllamaModel] = useStorage("ollamaModel", "fast-trans")
  const [fontSize, setFontSize] = useStorage("fontSize", 24)
  const [status, setStatus] = useState<string>("")

  const handleSave = async () => {
    setStatus("Settings saved!")
    setTimeout(() => setStatus(""), 2000)
  }

  const testConnection = async () => {
    setStatus("Testing connection...")
    try {
      if (translationProvider === "ollama") {
        // Test Ollama connection
        const response = await fetch(`${ollamaUrl}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: ollamaModel,
            prompt: "Say hello",
            stream: false
          })
        })
        if (response.ok) {
          const data = await response.json()
          if (data.response) {
            setStatus("Ollama connection successful!")
          } else {
            setStatus("Connection failed: No response")
          }
        } else {
          setStatus("Connection failed: " + response.status)
        }
      } else {
        // Test Gemini connection
        const ai = new GoogleGenAI({ apiKey: geminiApiKey })
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: "Say hello"
        })
        if (response.text) {
          setStatus("Gemini connection successful!")
        } else {
          setStatus("Connection failed: No response")
        }
      }
    } catch (err) {
      setStatus("Connection failed: " + (err as Error).message)
    }
  }

  return (
    <div
      style={{
        width: "320px",
        padding: "16px",
        fontFamily: "system-ui, sans-serif"
      }}>
      <h2 style={{ margin: "0 0 16px", fontSize: "18px", color: "#333" }}>
        NPO English Subtitles
      </h2>

      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            fontWeight: "bold"
          }}>
          <input
            type="checkbox"
            checked={translationEnabled}
            onChange={(e) => setTranslationEnabled(e.target.checked)}
            style={{ marginRight: "8px" }}
          />
          Enable Translation
        </label>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
          Font Size: {fontSize}px
        </label>
        <input
          type="range"
          min="16"
          max="48"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          style={{
            width: "100%",
            cursor: "pointer"
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#999" }}>
          <span>16px</span>
          <span>48px</span>
        </div>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
          Translation Provider
        </label>
        <select
          value={translationProvider}
          onChange={(e) => setTranslationProvider(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            boxSizing: "border-box",
            backgroundColor: "white"
          }}>
          <option value="ollama">Ollama (Local)</option>
          <option value="gemini">Gemini (Cloud)</option>
        </select>
      </div>

      {translationProvider === "ollama" && (
        <>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
              Ollama URL
            </label>
            <input
              type="text"
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              placeholder="http://localhost:11434"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
              Model
            </label>
            <input
              type="text"
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              placeholder="fast-trans"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                boxSizing: "border-box"
              }}
            />
            <span style={{ fontSize: "12px", color: "#666" }}>
              e.g., fast-trans, qwen3:0.6b, llama3.2
            </span>
          </div>
        </>
      )}

      {translationProvider === "gemini" && (
        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
            Gemini API Key
          </label>
          <input
            type="password"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            placeholder="Enter your Gemini API key"
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "12px", color: "#666" }}>
            Get API key
          </a>
        </div>
      )}

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
          OpenAI API Key (for Whisper)
        </label>
        <input
          type="password"
          value={openaiApiKey}
          onChange={(e) => setOpenaiApiKey(e.target.value)}
          placeholder="Optional - for audio transcription"
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            boxSizing: "border-box"
          }}
        />
        <span style={{ fontSize: "12px", color: "#666" }}>
          Only needed for videos without Dutch subtitles
        </span>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            padding: "8px 16px",
            backgroundColor: "#4285f4",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}>
          Save
        </button>
        <button
          onClick={testConnection}
          style={{
            flex: 1,
            padding: "8px 16px",
            backgroundColor: "#f1f3f4",
            color: "#333",
            border: "1px solid #ddd",
            borderRadius: "4px",
            cursor: "pointer"
          }}>
          Test
        </button>
      </div>

      {status && (
        <div
          style={{
            padding: "8px",
            backgroundColor: status.includes("failed") ? "#fce4ec" : "#e8f5e9",
            borderRadius: "4px",
            fontSize: "12px",
            color: status.includes("failed") ? "#c62828" : "#2e7d32"
          }}>
          {status}
        </div>
      )}

      <div style={{ marginTop: "16px", fontSize: "12px", color: "#666", borderTop: "1px solid #eee", paddingTop: "12px" }}>
        <strong>How to use:</strong>
        <ol style={{ margin: "8px 0", paddingLeft: "16px" }}>
          <li>Select provider and configure</li>
          <li>Enable translation</li>
          <li>Go to npo.nl and play a video</li>
          <li>Turn on Dutch subtitles</li>
        </ol>
      </div>
    </div>
  )
}

export default IndexPopup
