import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Helper to download an image URL and convert to Base64
async function fetchImageAsBase64(url: string): Promise<{ data: string, mimeType: string }> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Data = buffer.toString('base64');
  const mimeType = response.headers.get('content-type') || 'image/jpeg';
  return { data: base64Data, mimeType };
}

// Simple fuzzy matching function
function doNamesMatch(extracted: string, expected: string): boolean {
  if (!extracted || !expected) return false;
  
  const exParts = extracted.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(p => p.length > 2);
  const expecParts = expected.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(p => p.length > 2);
  
  // If at least one significant part of the expected name is in the extracted text
  for (const part of expecParts) {
    if (exParts.some(ep => ep.includes(part) || part.includes(ep))) {
      return true;
    }
  }
  
  // Also check direct string inclusion as a fallback
  if (extracted.toLowerCase().replace(/ /g, '').includes(expected.toLowerCase().replace(/ /g, ''))) return true;
  
  return false;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl, ownerName, expectedIdType } = await req.json();

    if (!imageUrl || !ownerName || !expectedIdType) {
      return NextResponse.json({ success: false, error: 'Missing imageUrl, ownerName, or expectedIdType' }, { status: 400 });
    }

    // Fallback if no Gemini key
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY missing, skipping OCR validation.');
      return NextResponse.json({ success: true, warning: 'Skipped AI validation due to missing key' });
    }

    console.log(`Scanning document for owner: ${ownerName}, Expected ID Type: ${expectedIdType}`);
    
    // Download image and prepare for Gemini
    const { data: base64, mimeType } = await fetchImageAsBase64(imageUrl);

    // Call Gemini Vision to extract name and verify ID type
    const prompt = `You are an OCR ID verification system. Read the text from this government ID card.
The expected ID type is: ${expectedIdType}.
Find the full name of the person on the card.
Return ONLY a JSON object exactly matching this schema:
{
  "extracted_name": "the full name found on the card",
  "confidence": "high, medium, or low",
  "is_valid_id": true/false (true if it looks like a real ID card),
  "id_type_matches": true/false (true if the card appears to be a ${expectedIdType}),
  "detected_id_type": "The type of ID detected (e.g. Aadhaar, PAN, Voter ID, Driving License, Unknown)"
}`;

    const modelConfig = {
      contents: [
        {
          inlineData: {
            data: base64,
            mimeType: mimeType
          }
        },
        { text: prompt }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                extracted_name: { type: Type.STRING },
                confidence: { type: Type.STRING },
                is_valid_id: { type: Type.BOOLEAN },
                id_type_matches: { type: Type.BOOLEAN },
                detected_id_type: { type: Type.STRING }
            },
            required: ["extracted_name", "is_valid_id", "id_type_matches", "detected_id_type"]
        },
        temperature: 0.1,
      }
    };

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        ...modelConfig
      });
    } catch (e: any) {
      if (e?.message?.includes('503') || e?.message?.includes('experiencing high demand')) {
        console.warn('gemini-3.7-flash is overloaded, falling back to gemini-3.5-flash-lite');
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          ...modelConfig
        });
      } else {
        throw e;
      }
    }

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");
    
    const parsed = JSON.parse(resultText);
    console.log("OCR Result:", parsed);

    if (!parsed.is_valid_id) {
        return NextResponse.json({ 
            success: false, 
            error: 'The uploaded image does not appear to be a valid ID card.' 
        });
    }

    if (!parsed.id_type_matches) {
        return NextResponse.json({
            success: false,
            error: `ID type mismatch. You selected "${expectedIdType}", but the uploaded image appears to be a ${parsed.detected_id_type || 'different document'}.`
        });
    }

    const isMatch = doNamesMatch(parsed.extracted_name, ownerName);

    if (isMatch) {
      return NextResponse.json({ 
          success: true, 
          extracted_name: parsed.extracted_name,
          message: 'Name verified successfully!'
      });
    } else {
      return NextResponse.json({ 
          success: false, 
          error: `Name mismatch. The ID shows "${parsed.extracted_name || 'unknown'}", but your registered name is "${ownerName}". Please ensure the ID belongs to the registered owner.` 
      });
    }

  } catch (error: any) {
    console.error("KYC Scan API Error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to scan document' }, { status: 500 });
  }
}
