import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
// dotenv.config();

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API Client successfully initialized.");
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI client:", err);
  }
} else {
  console.warn("GEMINI_API_KEY is not defined or is placeholder. AI endpoints will run in high-quality fallback generator mode.");
}

// ==========================================
// API Endpoints
// ==========================================

/**
 * Endpoint to generate bespoke designs and narratives
 */
app.post("/api/gemini/generate-pattern", async (req, res) => {
  const { prompt, clothingType, styleModifier = "Arabic Geometric Art Deco" } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "A prompt is required to generate a design" });
  }

  // Fallback pattern if API key resides unused or fails
  const mockResponse = {
    patternName: `The Al-Sadaf Whisper in ${clothingType}`,
    description: `A bespoke design depicting: "${prompt}" fused with traditional ${styleModifier} motifs, rendered in deep royal gold and iridescent blue hues.`,
    story: `Inspired by Cairo’s historic Al-Muizz streets and royal marine mother-of-pearl (Sadaf) patterns. This design tells a story of cultural resonance, bringing medieval calligraphic stroke weights and symmetric stars onto a modern tailored ${clothingType}.`,
    primaryColor: "#0A0F2C",
    accentColor: "#C9A84C",
    secondaryColor: "#4FC3F7",
    matchingFabrics: ["Luxury Italian Velvet", "Raw Giza Cotton (500gsm)"],
    printingOption: "Embroidery (Gold Thread)",
    customSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0A0F2C"/>
      <circle cx="50" cy="50" r="40" stroke="#C9A84C" stroke-width="0.5" stroke-dasharray="2,2"/>
      <path d="M50 10 L90 50 L50 90 L10 50 Z" stroke="#4FC3F7" stroke-width="0.75" />
      <path d="M50 20 L80 50 L50 80 L20 50 Z" stroke="#C9A84C" stroke-width="0.5" />
      <circle cx="50" cy="50" r="15" stroke="#C9A84C" stroke-width="1"/>
      <path d="M 50,38 L 50,62 M 38,50 L 62,50 Q 50,50 50,62" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="5" fill="#F0D080" />
      <path d="M30 30 L70 70 M30 70 L70 30" stroke="#4FC3F7" stroke-width="0.25" stroke-dasharray="1,1"/>
    </svg>`
  };

  if (!aiClient) {
    return res.json({
      ...mockResponse,
      mode: "crafted-fallback",
      systemNote: "Running in offline fallback mode because no real GEMINI_API_KEY was found in Settings > Secrets."
    });
  }

  try {
    const systemPrompt = `You are a world-class luxury couture stylist, Arabic calligraphy historian, and creative AI generator for the ultra-premium fashion house "SADAF | Art & Fashion House" (inspired by Dior, Prada, and Egyptian heritage).
Your task is to analyze a design prompt for a customized clothing piece and return a fully resolved, curated design definition with customized colors, materials, and a cinematic storytelling paragraph in JSON format.
You must return a valid JSON matching the specified schema. Keep colors within the luxury palette: Deep Navy (#0A0F2C), Midnight Blue (#1B2A6B), Crystal Blue (#4FC3F7), Pearl (#E8E0D5), Iridescent (#B8D4E8), and Gold (#C9A84C). Generate a valid custom geometric vector SVG in the \`customSvg\` field representing this artistic design. The SVG should be highly decorative, containing thin lines, geometric circles, stars, or calligraphic curves, optimized to render beautifully inside a clothing mockup.`;

    const userQuery = `Generate a customized design definition for:
Clothing Type: ${clothingType}
User Desired Concept: ${prompt}
Visual Modifier: ${styleModifier}`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userQuery,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["patternName", "description", "story", "primaryColor", "accentColor", "secondaryColor", "matchingFabrics", "printingOption", "customSvg"],
          properties: {
            patternName: { type: Type.STRING, description: "A high-end luxury title for the bespoke design pattern, blend gold or pearl nomenclature" },
            description: { type: Type.STRING, description: "Detailed description of the visual layout of the clothing print (3-4 sentences)" },
            story: { type: Type.STRING, description: "Deep cinematic narrative of cultural Arabic or Egyptian connection to the artwork, written in the voice of a luxury brand curator" },
            primaryColor: { type: Type.STRING, description: "Hex value for primary background fabric color, choose from deep navy or midnight" },
            accentColor: { type: Type.STRING, description: "Hex value for primary highlight embroidery or metal color, e.g. gold #C9A84C" },
            secondaryColor: { type: Type.STRING, description: "Hex value for secondary pattern lines, e.g. crystal blue #4FC3F7 or pearl #E8E0D5" },
            matchingFabrics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2-3 matching fabrics from: Luxury Italian Velvet, Raw Giza Cotton (500gsm), Premium Mulberry Silk, Super-140s Wool Canvas"
            },
            printingOption: {
              type: Type.STRING,
              description: "Best match production method: 'Embroidery (Gold Thread)', 'Puff Multi-Texture Print', 'Direct-to-Garment Micro-spray', or 'Artisanal Screen Printing'"
            },
            customSvg: { type: Type.STRING, description: "A pure valid SVG tag (<svg...>...</svg>) with viewBox='0 0 100 100' containing absolute vector shapes, stars, calligraphic paths or abstract lines in gold and crystal blue mapping this design." }
          }
        }
      }
    });

    const text = response.text ? response.text.trim() : "";
    if (text) {
      const parsedData = JSON.parse(text);
      return res.json({
        ...parsedData,
        mode: "gemini-ai-generated"
      });
    } else {
      throw new Error("Empty text returned from Google Gemini AI");
    }

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    return res.json({
      ...mockResponse,
      mode: "crafted-fallback-on-error",
      systemNote: `Running in beautiful local fallback due to API error: ${error?.message || "JSON parsing error"}`
    });
  }
});

/**
 * Endpoint for Maqasaq (مقاسك) AI Sizing recommendation
 */
app.post("/api/maqasaq/size-advisor", async (req, res) => {
  const { height, weight, gender, chestOption = "Standard", posture = "Regular Fit" } = req.body;

  if (!height || !weight) {
    return res.status(400).json({ error: "Height and weight are required" });
  }

  // Calculate default sizing formula
  const h = Number(height);
  const w = Number(weight);
  let recommendedSize = "M";

  if (w < 60) recommendedSize = "S";
  else if (w >= 60 && w < 78) recommendedSize = "M";
  else if (w >= 78 && w < 92) recommendedSize = "L";
  else recommendedSize = "XL";

  if (h > 185 && recommendedSize !== "XL") {
    recommendedSize = recommendedSize === "L" ? "XL" : "L";
  }

  // Fallback prediction response
  const defaultRecommendation = {
    size: recommendedSize,
    confidence: 96.5,
    measurements: {
      chest: Math.round(w * 0.6 + 50),
      shoulder: Math.round(h * 0.22 + 5),
      length: Math.round(h * 0.42),
      waist: Math.round(w * 0.7 + 25)
    },
    comment: `Maqasaq AI analyzed body metrics ${h}cm, ${w}kg (${gender}) with ${posture} preference. We recommend size ${recommendedSize} to drape elegantly without constriction, honoring classical lines. Fabric behavior is adjusted for selected heavy cotton and velvets.`
  };

  if (!aiClient) {
    return res.json({
      ...defaultRecommendation,
      mode: "crafted-fallback",
      systemNote: "Running in responsive local formula mode. Real Gemini server-side validation is inactive (provide API key in Secrets)."
    });
  }

  try {
    const prompt = `You are "Maqasaq (مقاسك)", the elite AI Fitting and Size Assistant for the boutique "SADAF | Art & Fashion House".
Given these anthropometric parameters:
- Height: ${height} cm
- Weight: ${weight} kg
- Gender: ${gender}
- Chest preference: ${chestOption}
- Silhouette preference: ${posture}

Based on luxury tailoring guidelines, determine their perfect clothing size (XS, S, M, L, XL, XXL) and estimated clothing dimensions in cm (chest, shoulder width, garment length, waist). Also write an elegant, personalized tailors advice calling the customer's attention to how this drape suits their profile.
Return a valid JSON according to the specified schema.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["size", "confidence", "measurements", "comment"],
          properties: {
            size: { type: Type.STRING, description: "Bespoke recommended size, e.g. S, M, L, XL, XXL" },
            confidence: { type: Type.NUMBER, description: "Tailoring confidence percentage, e.g. 98.4" },
            measurements: {
              type: Type.OBJECT,
              required: ["chest", "shoulder", "length", "waist"],
              properties: {
                chest: { type: Type.INTEGER, description: "Estimated clothing chest circumference in cm" },
                shoulder: { type: Type.INTEGER, description: "Estimated clothing shoulder tip to tip in cm" },
                length: { type: Type.INTEGER, description: "Estimated luxury garment back length in cm" },
                waist: { type: Type.INTEGER, description: "Estimated garment waist circumference in cm" }
              }
            },
            comment: { type: Type.STRING, description: "A beautifully styled tailoring advice (3 sentences) in elegant, helpful prose including a professional tip." }
          }
        }
      }
    });

    const text = response.text ? response.text.trim() : "";
    if (text) {
      const parsedData = JSON.parse(text);
      return res.json({
        ...parsedData,
        mode: "maqasaq-ai-predicted"
      });
    } else {
      throw new Error("Empty text from Gemini advisor");
    }

  } catch (error: any) {
    console.error("Maqasaq prediction error:", error);
    return res.json({
      ...defaultRecommendation,
      mode: "crafted-fallback-on-error"
    });
  }
});


// ==========================================
// Vite Dev Server / Static Ingress
// ==========================================

async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    // Dynamically import Vite in development
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite dev server middleware
    app.use(vite.middlewares);
    console.log("Vite dev middleware mounted successfully.");
  } else {
    // Serve production static build assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production static files from dist/");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SADAF server listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error("Initialization error in Express-Vite backend:", err);
});
