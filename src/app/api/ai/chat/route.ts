import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import connectToDatabase from '@/utils/db';
import { PGProperty } from '@/models/PGProperty';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Fetch up to 20 properties to give as context to the AI
    const availableProperties = await PGProperty.find({ is_verified: true })
      .limit(20)
      .lean();

    // Format properties for AI context
    const propertyContext = availableProperties.map((p: any) => ({
      id: p._id.toString(),
      name: p.name,
      description: p.description,
      city: p.address.city,
      gender_type: p.gender_type,
      monthly_rent: p.pricing.monthly_rent,
      amenities: p.amenities
    }));

    const prompt = `You are the NestMatch AI Copilot, a friendly and helpful real estate assistant.
The user is looking for a PG/Hostel.
Here are the currently available properties in our database:
${JSON.stringify(propertyContext, null, 2)}

User Chat History:
${history.map((m: any) => `${m.role}: ${m.content}`).join('\n')}

New User Message: ${message}

Instructions:
1. Act as a friendly conversational assistant.
2. Based on the user's message, recommend up to 3 of the best matching properties from the available list.
3. If no properties match exactly, recommend the closest alternatives and explain why.
4. Return ONLY a JSON object matching the exact schema below.

Output Schema:
{
  "reply": "Your conversational response to the user, using emojis and formatting.",
  "suggested_property_ids": ["id1", "id2"] // Array of string IDs from the provided property context. Keep empty if no matches.
}`;

    let aiResponse;
    try {
      aiResponse = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              suggested_property_ids: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["reply", "suggested_property_ids"]
          },
          temperature: 0.3,
        }
      });
    } catch (e: any) {
      console.warn('Falling back to gemini-3.5-flash-lite due to error:', e.message);
      aiResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              suggested_property_ids: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["reply", "suggested_property_ids"]
          },
          temperature: 0.3,
        }
      });
    }

    const resultText = aiResponse.text;
    if (!resultText) throw new Error("No response from AI");

    const parsed = JSON.parse(resultText);

    // Map the IDs back to the full property objects (so we can send images/details to frontend)
    const suggestedProperties = availableProperties.filter((p: any) => 
      parsed.suggested_property_ids.includes(p._id.toString())
    );

    return NextResponse.json({ 
      success: true, 
      reply: parsed.reply,
      properties: suggestedProperties
    });

  } catch (error: any) {
    console.error("AI Chat API Error:", error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
