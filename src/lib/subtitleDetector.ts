export interface SubtitleElement {
  container: Element
  textNode: Text | null
}

export function findNPOSubtitleContainer(): SubtitleElement | null {
  // NPO uses various class names for subtitles
  // These selectors target the most common patterns
  const selectors = [
    // NPO Player (Bitmovin) subtitle containers
    ".bmpui-ui-subtitle-overlay",
    ".bmpui-subtitle-region-container",
    ".bmpui-ui-subtitle-label",
    "[class*='bmpui'][class*='subtitle']",
    // NPO Start player subtitle containers
    "[class*='subtitle']",
    "[class*='caption']",
    "[class*='ondertitel']",
    // Video.js subtitle container
    ".vjs-text-track-display",
    ".vjs-text-track-cue"
  ]

  console.log("[NPO Translate] Searching for subtitle containers...")

  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector)
      for (const element of elements) {
        const text = element.textContent?.trim()
        if (text && text.length > 0) {
          console.log("[NPO Translate] Found subtitle container:", selector, "Text:", text)
          return {
            container: element,
            textNode: findTextNode(element)
          }
        }
      }
    } catch (e) {
      // Some selectors may throw
      continue
    }
  }

  console.log("[NPO Translate] No subtitle container found")
  return null
}

function findTextNode(element: Element): Text | null {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  )
  
  let node: Node | null
  while ((node = walker.nextNode())) {
    if (node.textContent && node.textContent.trim().length > 0) {
      return node as Text
    }
  }
  
  return null
}

export function findVideoElement(): HTMLVideoElement | null {
  // Find the main video element on the page
  const videos = document.querySelectorAll("video")
  
  // Return the largest video (likely the main content)
  let mainVideo: HTMLVideoElement | null = null
  let maxArea = 0
  
  videos.forEach((video) => {
    const rect = video.getBoundingClientRect()
    const area = rect.width * rect.height
    if (area > maxArea) {
      maxArea = area
      mainVideo = video
    }
  })
  
  return mainVideo
}

export function observeSubtitleChanges(
  container: Element,
  callback: (text: string) => void
): MutationObserver {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData" || mutation.type === "childList") {
        const text = container.textContent?.trim()
        if (text && text.length > 0) {
          callback(text)
        }
      }
    }
  })

  observer.observe(container, {
    characterData: true,
    childList: true,
    subtree: true
  })

  return observer
}
