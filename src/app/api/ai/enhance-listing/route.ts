import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(req: Request) {
  try {
    const { name, city, amenities, rules, rent, gender_type } = await req.json();

    if (!name || !city) {
      return NextResponse.json({ success: false, error: 'Name and City are required for AI description.' }, { status: 400 });
    }

    const prompt = `You are an expert real estate copywriter for "NestMatch", a premium PG & Co-living platform.
Please write a highly engaging, catchy, and professional marketing description (2-3 short paragraphs) for the following PG.
Do not use placeholders, just write it creatively based on what is provided.

Property Name: ${name}
City: ${city}
Gender Type: ${gender_type}
Monthly Rent: ₹${rent || 'Not specified'}
Amenities: ${amenities && amenities.length > 0 ? amenities.join(', ') : 'Basic amenities'}
Rules: ${rules && rules.length > 0 ? rules.join(', ') : 'Standard PG rules'}

Focus on making it sound welcoming, premium, and highlight the amenities and location.`;

    const modelConfig = {
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    };

    let aiResponse;
    try {
      aiResponse = await ai.models.generateContent(modelConfig);
    } catch (e: any) {
      console.warn('Falling back to gemini-3.5-flash-lite due to error:', e.message);
      modelConfig.model = 'gemini-3.5-flash-lite';
      aiResponse = await ai.models.generateContent(modelConfig);
    }

    const resultText = aiResponse.text;
    if (!resultText) throw new Error("No response from AI");

    return NextResponse.json({ success: true, description: resultText.trim() });

  } catch (error: any) {
    console.error("AI Enhance Listing Error:", error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
