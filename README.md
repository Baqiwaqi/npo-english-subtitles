# NPO English Subtitles

A Chrome extension that translates Dutch subtitles to English in real-time on NPO (Nederlandse Publieke Omroep) video streams.

## Features

- **Real-time translation** of Dutch subtitles to English
- **Local translation** using Ollama (privacy-friendly, no data sent to cloud)
- **Cloud translation** option using Google Gemini API
- **Customizable font size** for better visibility (16px - 48px)
- **Fullscreen support** - overlay stays visible in fullscreen mode
- **Translation caching** - repeated subtitles load instantly

## Installation

### Prerequisites

For local translation (recommended):
- [Ollama](https://ollama.ai/) installed and running
- A translation model (e.g., `llama3.2:3b`)

For cloud translation:
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/baqiwaqi/npo-english-subtitles.git
   cd npo-english-subtitles
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build the extension:
   ```bash
   pnpm build
   ```

4. Load in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `build/chrome-mv3-prod` folder

### Create Optimized Translation Model (Recommended)

Create a fast translation model for Ollama:

```bash
# Create Modelfile
cat > M3Translator << 'EOF'
FROM llama3.2:3b

PARAMETER temperature 0
PARAMETER num_ctx 4096

SYSTEM "You are a real-time translation engine. Translate the input Dutch text to English immediately. Output ONLY the English translation. Do not include notes, explanations, or introductory text."
EOF

# Build the model
ollama create fast-trans -f M3Translator
```

### Start Ollama with CORS

The extension needs CORS enabled to communicate with Ollama:

```bash
OLLAMA_ORIGINS="chrome-extension://*,*" ollama serve
```

## Usage

1. Click the extension icon to open settings
2. Select translation provider (Ollama or Gemini)
3. Configure the provider settings
4. Adjust font size if needed
5. Enable translation
6. Go to [npo.nl](https://npo.nl) and play a video
7. Turn on Dutch subtitles (Ondertiteling)
8. English translations appear automatically

## Configuration

### Ollama (Local)
- **URL**: Default `http://127.0.0.1:11434`
- **Model**: Default `fast-trans` (or any model you prefer)

### Gemini (Cloud)
- **API Key**: Your Google Gemini API key
- Free tier: 60 requests/minute, 1500 requests/day

### Display
- **Font Size**: Adjustable slider from 16px to 48px

## Development

```bash
# Development mode with hot reload
pnpm dev

# Build for production
pnpm build

# Package for distribution
pnpm package
```

## Project Structure

```
translate-extension/
├── src/
│   ├── background.ts         # Service worker for API calls
│   ├── popup.tsx             # Settings popup UI
│   ├── contents/
│   │   └── npo.tsx           # Content script for NPO sites
│   └── lib/
│       ├── gemini.ts         # Gemini translation client
│       ├── ollama.ts         # Ollama translation client
│       ├── whisper.ts        # Whisper transcription
│       └── subtitleDetector.ts
├── M3Translator              # Ollama model definition
├── package.json
└── README.md
```

## Troubleshooting

### Translation not appearing
- Make sure Dutch subtitles (CC) are enabled on the video
- Check that translation is enabled in the extension popup
- Use the "Test" button to verify connection

### Ollama 403 error
- Start Ollama with CORS enabled:
  ```bash
  OLLAMA_ORIGINS="chrome-extension://*,*" ollama serve
  ```

### Overlay not visible in fullscreen
- Reload the extension after updating
- The overlay automatically moves into the fullscreen element

## Tech Stack

- [Plasmo](https://plasmo.com/) - Browser extension framework
- [React](https://react.dev/) - UI components
- [Ollama](https://ollama.ai/) - Local LLM inference
- [Google Gemini](https://ai.google.dev/) - Cloud LLM API

## Tested On

- **Hardware**: MacBook Pro M3
- **Ollama Model**: `fast-trans` (custom model based on `llama3.2:3b`)
- **Performance**: ~400-500ms per subtitle translation

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Author

Tim Bouma
