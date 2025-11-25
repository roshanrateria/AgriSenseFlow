import { useCallback, useEffect, useState } from "react";
import { translateText } from "@/lib/translation";

export function useTranslation(language: string = "en") {
  const [translating, setTranslating] = useState(false);

  const translate = useCallback(
    async (text: string, fromLang: string = "en") => {
      if (!text || language === "en") return text;
      
      try {
        setTranslating(true);
        const result = await translateText(text, fromLang, language);
        return result;
      } catch (error) {
        console.error("Translation error:", error);
        return text;
      } finally {
        setTranslating(false);
      }
    },
    [language]
  );

  return { translate, translating };
}
