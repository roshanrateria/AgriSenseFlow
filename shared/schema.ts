import { z } from "zod";

// Detection Result Schema
export const detectionResultSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  imageName: z.string(),
  timestamp: z.number(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  predictions: z.array(z.object({
    class_name: z.string(),
    confidence: z.number(),
    bbox: z.array(z.number()), // [x1, y1, x2, y2]
  })),
  count: z.number(),
});

export type DetectionResult = z.infer<typeof detectionResultSchema>;

// Chat Message Schema
export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// Weather Data Schema
export const weatherDataSchema = z.object({
  location: z.string(),
  temperature: z.number(),
  feels_like: z.number(),
  humidity: z.number(),
  pressure: z.number(),
  wind_speed: z.number(),
  description: z.string(),
  icon: z.string(),
  forecast: z.array(z.object({
    date: z.string(),
    temp_max: z.number(),
    temp_min: z.number(),
    description: z.string(),
    icon: z.string(),
  })),
});

export type WeatherData = z.infer<typeof weatherDataSchema>;

// Soil Data Schema
export const soilDataSchema = z.object({
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  properties: z.object({
    ph: z.number().optional(),
    nitrogen: z.number().optional(),
    organic_carbon: z.number().optional(),
    clay: z.number().optional(),
    sand: z.number().optional(),
    silt: z.number().optional(),
  }),
});

export type SoilData = z.infer<typeof soilDataSchema>;

// User Preferences Schema
export const userPreferencesSchema = z.object({
  language: z.string().default("en"),
  theme: z.enum(["light", "dark"]).default("light"),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

// Translation Request Schema
export const translationRequestSchema = z.object({
  text: z.string(),
  sourceLang: z.string(),
  targetLang: z.string(),
});

export type TranslationRequest = z.infer<typeof translationRequestSchema>;

// API Request/Response Schemas
export const detectRequestSchema = z.object({
  image: z.string(), // base64 or file path
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

export const chatRequestSchema = z.object({
  message: z.string(),
  history: z.array(chatMessageSchema).optional(),
  context: z.object({
    location: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    recentDetections: z.array(z.string()).optional(),
  }).optional(),
});

export const weatherRequestSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const soilRequestSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});
