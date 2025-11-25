import { Camera, Upload, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroImage from "@assets/generated_images/agricultural_hero_banner_image.png";
import { translateTexts } from "@/lib/translation";

interface HeroSectionProps {
  onUploadClick: () => void;
  onCameraClick: () => void;
  detectionCount: number;
  currentLanguage: string;
}

export function HeroSection({
  onUploadClick,
  onCameraClick,
  detectionCount,
  currentLanguage,
}: HeroSectionProps) {
  const defaultTexts = {
    badge: "AI-Powered Disease Detection",
    titlePrefix: "Protect Your Crops with",
    titleHighlight: "Smart AI",
    description: "Detect plant diseases instantly using your smartphone camera. Get expert advice, weather insights, and soil data in multiple languages.",
    cameraBtn: "Take Photo",
    uploadBtn: "Upload Image",
    stat1: "Detections Made",
    stat2: "Languages Supported",
    stat3: "AI Assistant"
  };

  const [texts, setTexts] = useState(defaultTexts);

  useEffect(() => {
    if (currentLanguage === "en") {
      setTexts(defaultTexts);
      return;
    }

    const keys = Object.keys(defaultTexts) as (keyof typeof defaultTexts)[];
    const values = keys.map(k => defaultTexts[k]);

    translateTexts(values, "en", currentLanguage).then(translatedValues => {
      const newTexts = { ...defaultTexts };
      keys.forEach((key, index) => {
        newTexts[key] = translatedValues[index];
      });
      setTexts(newTexts);
    });
  }, [currentLanguage]);
  return (
    <section className="relative min-h-[60vh] sm:min-h-[50vh] flex items-center justify-center overflow-hidden">
      {/* Hero Image Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Agricultural farmland"
          className="w-full h-full object-cover"
        />
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 container px-4 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <Badge
            variant="outline"
            className="bg-white/10 backdrop-blur-md text-white border-white/20 px-4 py-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5 inline" />
            {texts.badge}
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-heading text-white leading-tight">
            {texts.titlePrefix}{" "}
            <span className="text-primary-foreground bg-primary/90 px-3 py-1 rounded-lg inline-block">
              {texts.titleHighlight}
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto backdrop-blur-sm">
            {texts.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              onClick={onCameraClick}
              className="bg-primary hover:bg-primary/90 text-primary-foreground backdrop-blur-md w-full sm:w-auto"
              data-testid="button-camera-capture"
            >
              <Camera className="h-5 w-5 mr-2" />
              {texts.cameraBtn}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onUploadClick}
              className="bg-white/10 backdrop-blur-md text-white border-white/30 hover:bg-white/20 w-full sm:w-auto"
              data-testid="button-upload-image"
            >
              <Upload className="h-5 w-5 mr-2" />
              {texts.uploadBtn}
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-6 justify-center items-center pt-8 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 backdrop-blur-md flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">
                  {detectionCount}+
                </span>
              </div>
              <span className="backdrop-blur-sm">{texts.stat1}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 backdrop-blur-md flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">
                  6
                </span>
              </div>
              <span className="backdrop-blur-sm">{texts.stat2}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 backdrop-blur-md flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">
                  24/7
                </span>
              </div>
              <span className="backdrop-blur-sm">{texts.stat3}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
