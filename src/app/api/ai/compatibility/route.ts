import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const fallbackAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY_FALLBACK || process.env.GEMINI_API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.INTEGER,
      description: "A compatibility score from 0 to 100 based on how well the user's lifestyle matches the PG.",
    },
    reason: {
      type: Type.STRING,
      description: "A single, engaging sentence explaining why this is a good or bad match based on the user's specific lifestyle vs the property details.",
    },
  },
  required: ["score", "reason"],
};

export async function POST(req: Request) {
  try {
    const { lifestyle, pgName, pgDescription, pgAmenities, pgRules, pgGender } = await req.json();

    if (!lifestyle) {
      return NextResponse.json({ error: 'Lifestyle preferences missing' }, { status: 400 });
    }

    const prompt = `
      You are an expert coliving matchmaker. 
      Analyze the compatibility between a prospective tenant's lifestyle preferences and a PG/Hostel property.
      
      Tenant Lifestyle:
      - Sleep: ${lifestyle.sleep}
      - Diet: ${lifestyle.diet}
      - Smoking/Drinking tolerance: ${lifestyle.smoking}
      - Social Vibe: ${lifestyle.social}
      
      Property Details:
      - Name: ${pgName}
      - Description: ${pgDescription}
      - Amenities: ${pgAmenities?.join(', ') || 'None specified'}
      - Rules: ${pgRules?.join(', ') || 'None specified'}
      - Gender Type: ${pgGender}
      
      Generate a realistic compatibility score (0-100) and a 1-sentence reason. 
      For example, if the tenant is a strict vegetarian and the PG rules say "No Non-Veg", that's a positive match for diet. 
      If the tenant is a night owl but the PG has a 10 PM curfew, lower the score.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.2,
        }
      });
      return NextResponse.json(JSON.parse(response.text || '{}'));
    } catch (primaryError) {
      console.warn("Primary model failed, using fallback:", primaryError);
      const response = await fallbackAi.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.2,
        }
      });
      return NextResponse.json(JSON.parse(response.text || '{}'));
    }
  } catch (error) {
    console.error('Error generating compatibility score:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
