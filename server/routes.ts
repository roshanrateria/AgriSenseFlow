import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import fetch from "node-fetch";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY!;
const HUGGINGFACE_ENDPOINT = process.env.HUGGINGFACE_ENDPOINT!;

const BHASHINI_ULCA_KEY = process.env.BHASHINI_ULCA_KEY!;
const BHASHINI_USER_ID = process.env.BHASHINI_USER_ID!;

// Environment variable check moved to runtime or allowed to fail gracefully
if (!process.env.GROQ_API_KEY || !process.env.OPENWEATHER_API_KEY || !process.env.HUGGINGFACE_ENDPOINT || !process.env.BHASHINI_ULCA_KEY || !process.env.BHASHINI_USER_ID) {
  console.warn("Missing some environment variables. Some features may not work.");
}

let bhashiniAuthToken: string | null = null;

async function getBhashiniAuth() {
  if (bhashiniAuthToken) return bhashiniAuthToken;

  try {
    const response = await fetch(
      "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline",
      {
        method: "POST",
        headers: {
          "ulcaApiKey": BHASHINI_ULCA_KEY,
          "userID": BHASHINI_USER_ID,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pipelineTasks: [
            { taskType: "asr" },
            { taskType: "translation" },
            { taskType: "tts" },
          ],
          pipelineRequestConfig: {
            pipelineId: "64392f96daac500b55c543cd",
          },
        }),
      }
    );

    const data: any = await response.json();
    bhashiniAuthToken = data.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value || null;
    return bhashiniAuthToken;
  } catch (error) {
    console.error("Bhashini auth error:", error);
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/detect", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image provided" });
      }

      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append("file", blob, req.file.originalname);

      const response = await fetch(HUGGINGFACE_ENDPOINT, {
        method: "POST",
        body: formData as any,
      });

      if (!response.ok) {
        throw new Error("HuggingFace API error");
      }

      const result: any = await response.json();

      const detectionResult = {
        id: Date.now().toString(),
        imageUrl: `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        imageName: req.file.originalname,
        timestamp: Date.now(),
        location: req.body.lat && req.body.lng ? {
          lat: parseFloat(req.body.lat),
          lng: parseFloat(req.body.lng),
        } : undefined,
        predictions: result.predictions || [],
        count: result.count || 0,
      };

      res.json(detectionResult);
    } catch (error) {
      console.error("Detection error:", error);
      res.status(500).json({ error: "Detection failed" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history = [], context = {} } = req.body;

      const systemPrompt = `You are AgriBot, an expert agricultural AI assistant specialized in crop disease management and farming advice. 
      
Your role:
- Provide SHORT, BRIEF, and RELEVANT answers (2-3 sentences max)
- Focus on ACTIONABLE advice for farmers
- Discuss crop diseases, treatments, prevention, and organic solutions
- Suggest appropriate fertilization schedules and pest control
- Provide weather-based farming recommendations

Context:
${context.location ? `- Farmer location: ${context.location.lat}, ${context.location.lng}` : ""}
${context.recentDetections?.length > 0 ? `- Recent disease detections: ${context.recentDetections.join(", ")}` : ""}

Guidelines:
- Keep answers under 50 words when possible
- Be practical and farmer-friendly
- Avoid overly technical jargon
- Provide specific solutions, not general advice`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...history.map((h: any) => ({ role: h.role, content: h.content })),
        { role: "user", content: message },
      ];

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: messages,
          temperature: 0.7,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        throw new Error("Groq API error");
      }

      const data: any = await response.json();
      const reply = data.choices[0]?.message?.content || "Sorry, I couldn't process that.";

      res.json({ message: reply });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "I'm having trouble connecting. Please try again." });
    }
  });

  app.post("/api/translate", async (req, res) => {
    try {
      const { text, sourceLang, targetLang } = req.body;

      const authToken = await getBhashiniAuth();
      if (!authToken) {
        return res.status(500).json({ error: "Translation service unavailable" });
      }

      const response = await fetch(
        "https://dhruva-api.bhashini.gov.in/services/inference/pipeline",
        {
          method: "POST",
          headers: {
            "Authorization": authToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pipelineTasks: [
              {
                taskType: "translation",
                config: {
                  language: {
                    sourceLanguage: sourceLang,
                    targetLanguage: targetLang,
                  },
                  serviceId: "ai4bharat/indictrans-v2-all-gpu--t4",
                },
              },
            ],
            inputData: {
              input: [{ source: text }],
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Bhashini API error");
      }

      const data: any = await response.json();

      // Handle both array and object response formats from Bhashini
      let translatedText = text;
      if (data.pipelineResponse?.output) {
        const output = data.pipelineResponse.output;
        // Check if output is array
        if (Array.isArray(output) && output.length > 0) {
          translatedText = output[0]?.target || text;
        } else if (typeof output === "object" && output.target) {
          // Handle object format
          translatedText = output.target;
        }
      }

      res.json({ translatedText });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Translation failed", translatedText: req.body.text });
    }
  });

  app.get("/api/weather", async (req, res) => {
    try {
      const { lat, lng } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({ error: "Location required" });
      }

      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${OPENWEATHER_API_KEY}`
      );

      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${OPENWEATHER_API_KEY}`
      );

      if (!currentResponse.ok || !forecastResponse.ok) {
        throw new Error("OpenWeather API error");
      }

      const current: any = await currentResponse.json();
      const forecast: any = await forecastResponse.json();

      const dailyForecast = forecast.list
        .filter((_: any, index: number) => index % 8 === 0)
        .slice(0, 5)
        .map((item: any) => ({
          date: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
          temp_max: item.main.temp_max,
          temp_min: item.main.temp_min,
          description: item.weather[0].description,
          icon: item.weather[0].icon,
        }));

      const weatherData = {
        location: current.name,
        temperature: current.main.temp,
        feels_like: current.main.feels_like,
        humidity: current.main.humidity,
        pressure: current.main.pressure,
        wind_speed: current.wind.speed,
        description: current.weather[0].description,
        icon: current.weather[0].icon,
        forecast: dailyForecast,
      };

      res.json(weatherData);
    } catch (error) {
      console.error("Weather error:", error);
      res.status(500).json({ error: "Weather data unavailable" });
    }
  });

  app.get("/api/soil", async (req, res) => {
    try {
      const { lat, lng } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({ error: "Location required" });
      }

      const response = await fetch(
        `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lng}&lat=${lat}&property=phh2o&property=nitrogen&property=ocd&property=clay&property=sand&property=silt&depth=0-5cm&value=mean`
      );

      if (!response.ok) {
        throw new Error("ISRIC SoilGrids API error");
      }

      const data: any = await response.json();

      const getValue = (propName: string) => {
        const layer = data.properties?.layers?.find((l: any) => l.name === propName);
        const depth = layer?.depths?.[0];
        return depth?.values?.mean;
      };

      const soilData = {
        location: {
          lat: parseFloat(lat as string),
          lng: parseFloat(lng as string),
        },
        properties: {
          ph: getValue("phh2o") ? getValue("phh2o") / 10 : undefined,
          nitrogen: getValue("nitrogen") ? getValue("nitrogen") / 100 : undefined,
          organic_carbon: getValue("ocd") ? getValue("ocd") / 10 : undefined,
          clay: getValue("clay") ? getValue("clay") / 10 : undefined,
          sand: getValue("sand") ? getValue("sand") / 10 : undefined,
          silt: getValue("silt") ? getValue("silt") / 10 : undefined,
        },
      };

      res.json(soilData);
    } catch (error) {
      console.error("Soil data error:", error);
      res.status(500).json({ error: "Soil data unavailable" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
