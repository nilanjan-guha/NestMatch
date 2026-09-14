import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { city, capacity, amenities, room_details } = await req.json();

    if (!city) {
      return NextResponse.json({ success: false, error: 'City is required for price estimation.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const prompt = `You are an expert real estate appraiser in India specializing in PG (Paying Guest) accommodations.
Analyze the following property details and suggest a competitive monthly rent in Indian Rupees (INR) for ONE bed in this PG.

City: ${city}
Capacity/Room Type: ${capacity?.total_beds} total beds, Details: ${room_details || 'Not specified'}
Amenities provided: ${amenities ? amenities.join(', ') : 'None specified'}

Provide a reasonable market estimate. Do not hallucinate extreme values.
Return ONLY a JSON object matching this schema:
{
  "suggested_rent": number (the exact suggested monthly rent for 1 bed in INR),
  "rationale": "A short 1-2 sentence explanation of why this price is suggested based on the city and amenities"
}`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggested_rent: { type: Type.INTEGER },
              rationale: { type: Type.STRING }
            },
            required: ["suggested_rent", "rationale"]
          },
          temperature: 0.2,
        }
      });
    } catch (e: any) {
      if (e?.message?.includes('503') || e?.message?.includes('experiencing high demand')) {
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                suggested_rent: { type: Type.INTEGER },
                rationale: { type: Type.STRING }
              },
              required: ["suggested_rent", "rationale"]
            },
            temperature: 0.2,
          }
        });
      } else {
        throw e;
      }
    }

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");
    
    const parsed = JSON.parse(resultText);

    return NextResponse.json({ 
      success: true, 
      suggested_rent: parsed.suggested_rent,
      rationale: parsed.rationale
    });

  } catch (error: any) {
    console.error("AI Pricing API Error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to generate price suggestion' }, { status: 500 });
  }
}
