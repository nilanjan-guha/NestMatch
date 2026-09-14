import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import connectToDatabase from '@/utils/db';
import { Review } from '@/models/Review';
import { PGProperty } from '@/models/PGProperty';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(req: Request) {
  try {
    const { property_id } = await req.json();

    if (!property_id) {
      return NextResponse.json({ success: false, error: 'property_id is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Fetch the property name for context
    const property = await PGProperty.findById(property_id).lean();
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    // Fetch all reviews for this property
    const reviews = await Review.find({ property_id }).sort({ createdAt: -1 }).lean();

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({ success: false, error: 'No reviews found to summarize' }, { status: 400 });
    }

    // If there's only 1 review, summarization is a bit overkill, but we'll allow it.
    
    const reviewTexts = reviews.map((r: any) => `Rating: ${r.rating}/5 - ${r.comment}`).join('\n\n');

    const prompt = `You are an AI Review Analyzer for NestMatch, a premium PG booking platform.
Analyze the following user reviews for a property named "${property.name}".

Reviews:
${reviewTexts}

Your task is to provide a concise, high-level summary of the overall sentiment, and extract the top "Pros" and "Cons" mentioned by users.

Return ONLY a JSON object matching this schema:
{
  "summary": "A 1-2 sentence overall summary of what people think of this PG.",
  "pros": ["Pro 1", "Pro 2", "Pro 3"],
  "cons": ["Con 1", "Con 2"]
}`;

    const modelConfig = {
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              pros: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              cons: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["summary", "pros", "cons"]
          },
          temperature: 0.2,
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

    const parsed = JSON.parse(resultText);

    return NextResponse.json({ 
      success: true, 
      summary: parsed.summary,
      pros: parsed.pros,
      cons: parsed.cons
    });

  } catch (error: any) {
    console.error("AI Summarize Error:", error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
