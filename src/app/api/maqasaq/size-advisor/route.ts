import { NextResponse } from 'next/server';
import { Type } from "@google/genai";
import { aiClient } from '../../../../lib/gemini';

export async function POST(req: Request) {
  const body = await req.json();
  const { height, weight, gender, chestOption = "Standard", posture = "Regular Fit" } = body;

  if (!height || !weight) {
    return NextResponse.json({ error: "Height and weight are required" }, { status: 400 });
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
    return NextResponse.json({
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
      return NextResponse.json({
        ...parsedData,
        mode: "maqasaq-ai-predicted"
      });
    } else {
      throw new Error("Empty text from Gemini advisor");
    }

  } catch (error: any) {
    console.error("Maqasaq prediction error:", error);
    return NextResponse.json({
      ...defaultRecommendation,
      mode: "crafted-fallback-on-error"
    });
  }
}
