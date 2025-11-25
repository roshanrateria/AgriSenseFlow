import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { ImageUpload } from "@/components/image-upload";
import { DetectionResultCard } from "@/components/detection-result";
import { DetectionImage } from "@/components/detection-image";
import { Chatbot } from "@/components/chatbot";
import { WeatherWidget } from "@/components/weather-widget";
import { SoilWidget } from "@/components/soil-widget";
import { DetectionHistory } from "@/components/detection-history";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { DiseaseMap } from "@/components/disease-map";
import { cookieStorage } from "@/lib/cookies";
import { getCurrentLocation } from "@/lib/geolocation";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DetectionResult, ChatMessage, WeatherData, SoilData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const { toast } = useToast();
  const [language, setLanguage] = useState(() => cookieStorage.getPreferences().language);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [detectionHistory, setDetectionHistory] = useState<DetectionResult[]>(() =>
    cookieStorage.getDetectionHistory()
  );
  const [currentDetection, setCurrentDetection] = useState<DetectionResult | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() =>
    cookieStorage.getChatHistory()
  );
  const [activeTab, setActiveTab] = useState("detect");
  const [uploadTrigger, setUploadTrigger] = useState(0);

  useEffect(() => {
    getCurrentLocation().then((loc) => {
      if (loc) {
        setCurrentLocation(loc);
      }
    });
  }, []);

  useEffect(() => {
    const prefs = cookieStorage.getPreferences();
    cookieStorage.savePreferences({ ...prefs, language });
  }, [language]);

  const { data: weatherData, isLoading: weatherLoading } = useQuery({
    queryKey: ["/api/weather", currentLocation?.lat, currentLocation?.lng],
    enabled: !!currentLocation,
    queryFn: async () => {
      if (!currentLocation) return null;
      const res = await fetch(`/api/weather?lat=${currentLocation.lat}&lng=${currentLocation.lng}`);
      if (!res.ok) throw new Error("Failed to fetch weather");
      return res.json();
    },
  }) as any;

  const { data: soilData, isLoading: soilLoading } = useQuery({
    queryKey: ["/api/soil", currentLocation?.lat, currentLocation?.lng],
    enabled: !!currentLocation,
    queryFn: async () => {
      if (!currentLocation) return null;
      const res = await fetch(`/api/soil?lat=${currentLocation.lat}&lng=${currentLocation.lng}`);
      if (!res.ok) throw new Error("Failed to fetch soil data");
      return res.json();
    },
  }) as any;

  const detectionMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      if (currentLocation) {
        formData.append("lat", currentLocation.lat.toString());
        formData.append("lng", currentLocation.lng.toString());
      }

      const response = await fetch("/api/detect", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Detection failed");
      }

      return response.json();
    },
    onSuccess: (data: DetectionResult) => {
      setCurrentDetection(data);
      cookieStorage.saveDetection(data);
      setDetectionHistory([data, ...detectionHistory]);
      toast({
        title: "Detection Complete",
        description: `Found ${data.count} disease(s) in the image`,
      });
      setActiveTab("results");
    },
    onError: () => {
      toast({
        title: "Detection Failed",
        description: "Unable to analyze image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        timestamp: Date.now(),
      };

      setChatHistory((prev) => [...prev, userMessage]);
      cookieStorage.saveChatMessage(userMessage);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: chatHistory,
          context: {
            location: currentLocation,
            recentDetections: detectionHistory.slice(0, 5).map((d) => d.predictions[0]?.class_name),
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Chat failed");
      }

      const response = (await res.json()) as { message: string };

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message,
        timestamp: Date.now(),
      };

      setChatHistory((prev) => [...prev, assistantMessage]);
      cookieStorage.saveChatMessage(assistantMessage);

      return response;
    },
  });

  const handleClearHistory = () => {
    cookieStorage.clearDetectionHistory();
    setDetectionHistory([]);
    setCurrentDetection(null);
    toast({
      title: "History Cleared",
      description: "All detection history has been removed",
    });
  };

  const handleClearChat = () => {
    cookieStorage.clearChatHistory();
    setChatHistory([]);
    toast({
      title: "Chat Cleared",
      description: "All chat history has been removed",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={language} onLanguageChange={setLanguage} />

      <HeroSection
        onUploadClick={() => setUploadTrigger((prev) => prev + 1)}
        onCameraClick={() => setUploadTrigger((prev) => prev + 1)}
        detectionCount={detectionHistory.length}
        currentLanguage={language}
      />

      <main className="container px-4 py-12 space-y-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="detect" data-testid="tab-detect">
              Detect
            </TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-results">
              Results
            </TabsTrigger>
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="insights" data-testid="tab-insights">
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="detect" className="space-y-8">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold font-heading mb-2">
                  Upload Crop Image
                </h2>
                <p className="text-muted-foreground">
                  Take or upload a photo of your crop to detect diseases
                </p>
              </div>
              <ImageUpload
                key={uploadTrigger}
                onImageSelect={(file) => detectionMutation.mutate(file)}
                isProcessing={detectionMutation.isPending}
                showCamera={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-8">
            {currentDetection ? (
              <div className="max-w-3xl mx-auto space-y-6">
                <DetectionResultCard result={currentDetection} />
                {currentDetection.imageUrl && (
                  <DetectionImage
                    imageUrl={currentDetection.imageUrl}
                    predictions={currentDetection.predictions}
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No detection results yet. Upload an image to get started.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-8">
            <AnalyticsDashboard detections={detectionHistory} />
            <Separator />
            <div className="grid gap-6 lg:grid-cols-2">
              <DetectionHistory
                detections={detectionHistory}
                onClearHistory={handleClearHistory}
                onSelectDetection={(detection) => {
                  setCurrentDetection(detection);
                  setActiveTab("results");
                }}
              />
              <DiseaseMap detections={detectionHistory} />
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <WeatherWidget data={weatherData || null} isLoading={weatherLoading} />
              <SoilWidget data={soilData || null} isLoading={soilLoading} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Chatbot
        messages={chatHistory}
        onSendMessage={(msg) => chatMutation.mutate(msg)}
        isLoading={chatMutation.isPending}
      />

      <footer className="border-t mt-12 py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 AgriVision AI. Powered by AI for smarter agriculture.</p>
        </div>
      </footer>
    </div>
  );
}
