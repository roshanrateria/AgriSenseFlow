import { Leaf, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { ThemeToggle } from "./theme-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { translateText } from "@/lib/translation";

const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिंदी", flag: "🇮🇳" },
  { code: "gu", label: "ગુજરાતી", flag: "🇮🇳" },
  { code: "mr", label: "मराठी", flag: "🇮🇳" },
  { code: "ta", label: "தமிழ்", flag: "🇮🇳" },
  { code: "te", label: "తెలుగు", flag: "🇮🇳" },
];

interface HeaderProps {
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
}

export function Header({ currentLanguage, onLanguageChange }: HeaderProps) {
  const [displayLabel, setDisplayLabel] = useState("AgriVision AI");

  useEffect(() => {
    if (currentLanguage === "en") {
      setDisplayLabel("AgriVision AI");
    } else {
      // Translate the app name to the selected language
      translateText("AgriVision AI", "en", currentLanguage).then(setDisplayLabel);
    }
  }, [currentLanguage]);

  const handleLanguageChange = (lang: string) => {
    onLanguageChange(lang);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Leaf className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold font-heading tracking-tight">
              {displayLabel}
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Smart Crop Disease Detection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={currentLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger
              className="w-[140px] h-9"
              data-testid="select-language"
            >
              <Globe className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="mr-2">{lang.flag}</span>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
