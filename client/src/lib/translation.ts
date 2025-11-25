import { apiRequest } from "@/lib/queryClient";

// UI translations cache
const translationCache: Record<string, Record<string, string>> = {
  en: {
    "app.title": "AgriVision AI",
    "app.subtitle": "Smart Crop Disease Detection",
    "nav.upload": "Upload Image",
    "nav.detect": "Detect",
    "nav.results": "Results",
    "nav.dashboard": "Dashboard",
    "nav.insights": "Insights",
    "hero.title": "Protect Your Crops with Smart AI",
    "hero.description": "Detect plant diseases instantly using your smartphone camera. Get expert advice, weather insights, and soil data in multiple languages.",
    "hero.button.camera": "Take Photo",
    "hero.button.upload": "Upload Image",
    "button.upload": "Upload Crop Image",
    "button.dragdrop": "Drag & drop or click to browse",
    "button.camera": "Use Camera",
    "detection.title": "Upload Crop Image",
    "detection.subtitle": "Take or upload a photo of your crop to detect diseases",
    "results.title": "Detection Results",
    "results.nodata": "No detection results yet. Upload an image to get started.",
    "dashboard.title": "Dashboard",
    "dashboard.analytics": "Analytics",
    "dashboard.history": "Detection History",
    "dashboard.map": "Disease Map",
    "insights.title": "Agricultural Insights",
    "insights.weather": "Weather Conditions",
    "insights.soil": "Soil Composition",
    "insights.nolocation": "Enable location to view weather data",
    "chat.welcome": "Welcome to AgriBot!",
    "chat.subtitle": "Ask me anything about crop diseases, treatments, or farming.",
    "chat.try": "Try asking:",
    "chat.placeholder": "Ask about crop diseases...",
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.success": "Success",
    "history.title": "Detection History",
    "history.nodata": "No detections yet",
    "history.subtitle": "Upload or capture crop images to start detecting diseases",
    "weather.location": "Weather Conditions",
    "soil.location": "Soil Composition",
  },
};

export async function translateText(
  text: string,
  fromLang: string,
  toLang: string
): Promise<string> {
  // If already cached and it's a known translation, return it
  if (translationCache[toLang]?.[text]) {
    return translationCache[toLang][text];
  }

  // If translating to the same language, return original
  if (toLang === fromLang) {
    return text;
  }

  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        sourceLang: fromLang,
        targetLang: toLang,
      }),
    });

    if (!response.ok) {
      throw new Error("Translation API error");
    }

    const data = (await response.json()) as { translatedText: string };
    const translated = data.translatedText;

    // Cache the translation
    if (!translationCache[toLang]) {
      translationCache[toLang] = {};
    }
    translationCache[toLang][text] = translated;

    return translated;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
}

export function getTranslation(
  key: string,
  language: string = "en"
): string {
  // Return English translation if available
  return translationCache.en[key as keyof typeof translationCache.en] || key;
}

// Batch translate multiple texts
export async function translateTexts(
  texts: string[],
  fromLang: string,
  toLang: string
): Promise<string[]> {
  if (toLang === "en") {
    return texts;
  }

  return Promise.all(
    texts.map((text) => translateText(text, fromLang, toLang))
  );
}

// Get UI text in a specific language
export const uiText = {
  en: translationCache.en,
  getByLanguage: (lang: string) => translationCache.en, // Default to English
};

// Map of language codes to Bhashini language codes
export const languageMap: Record<string, string> = {
  en: "en",
  hi: "hi",
  gu: "gu",
  mr: "mr",
  ta: "ta",
  te: "te",
};
