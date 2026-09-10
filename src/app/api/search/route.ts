import { NextResponse } from 'next/server';
import connectToDatabase from '@/utils/db';
import { PGProperty } from '@/models/PGProperty';
import { GoogleGenAI, Type } from '@google/genai';
import OpenAI from 'openai';

// Initialize Gemini and OpenAI Clients
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

// Define the schema for structured output
const searchSchema = {
  type: Type.OBJECT,
  properties: {
    max_budget: {
      type: Type.NUMBER,
      description: "Maximum budget or rent mentioned by the user. E.g., if they say 'under 5000' or 'cheap', infer a number if possible, or leave null."
    },
    gender: {
      type: Type.STRING,
      description: "The preferred gender. Must be one of: 'Male', 'Female', 'Unisex'. If they say 'boys' -> Male, 'girls' -> Female, 'couple/family/any' -> Unisex. Leave null if not specified."
    },
    amenities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of amenities explicitly asked for, e.g., ['AC', 'WiFi', 'Food', 'Gym']."
    },
    city: {
      type: Type.STRING,
      description: "City name mentioned in the query (e.g., 'Gurgaon', 'Delhi'). Leave null if not mentioned."
    },
    street_or_area: {
      type: Type.STRING,
      description: "Specific street, sector, or area mentioned (e.g., 'Sector 18', 'Koramangala'). Leave null if not mentioned."
    },
    google_maps_query: {
      type: Type.STRING,
      description: "The optimal, concise text string to send to Google Maps to find exactly what the user is looking for. E.g. 'cheap boys PG in Marathahalli' or 'luxury coliving spaces in Delhi'."
    }
  }
};

export async function POST(req: Request) {
  try {
    const { query, coordinates, page = 1, limit = 10 } = await req.json();
    await connectToDatabase();
    
    let matchStage: any = {};
    let searchParams: any = {};

    console.log("=== SEARCH REQUEST ===");
    console.log("Query:", query);
    console.log("GEMINI KEY PRESENT:", !!process.env.GEMINI_API_KEY);
    console.log("OPENAI KEY PRESENT:", !!process.env.OPENAI_API_KEY);

    // 1. Process Natural Language Query
    if (query) {
      let aiResponseText = null;

      // Try Gemini First
      if (process.env.GEMINI_API_KEY) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: `You are an expert real estate search assistant. The user will ask for a PG/Hostel in natural language. Understand their true intent, even if the phrasing is complex or conversational. Extract the parameters from this query: "${query}"`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: searchSchema,
              temperature: 0.1,
            }
          });
          aiResponseText = response.text;
          console.log("Parsed using Gemini successfully.");
        } catch (geminiError) {
          console.error("Gemini Parsing Error, falling back to OpenAI...", geminiError);
        }
      }

      // Fallback to OpenAI if Gemini failed or wasn't available
      if (!aiResponseText && process.env.OPENAI_API_KEY) {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are an expert real estate parameter extractor for a PG/Hostel app. Understand the user's true intent, even if conversational, and output JSON."
              },
              {
                role: "user",
                content: `Extract the search parameters from this user query about renting a PG/Hostel: "${query}". Output JSON matching this schema: { max_budget: number|null, gender: 'Male'|'Female'|'Unisex'|null, amenities: string[], city: string|null, street_or_area: string|null, google_maps_query: string }`
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
          });
          aiResponseText = completion.choices[0]?.message?.content;
          console.log("Parsed using OpenAI successfully.");
        } catch (openaiError) {
          console.error("OpenAI Parsing Error:", openaiError);
        }
      }
      
      if (aiResponseText) {
        try {
          searchParams = JSON.parse(aiResponseText);
          console.log("AI Extracted Search Params:", searchParams);

          if (searchParams.max_budget && searchParams.max_budget > 0) {
            matchStage['pricing.monthly_rent'] = { $lte: searchParams.max_budget * 1.1 };
          }
          if (searchParams.gender && searchParams.gender !== 'null') {
            matchStage['gender_type'] = { $regex: searchParams.gender, $options: 'i' };
          }
          if (searchParams.amenities && Array.isArray(searchParams.amenities) && searchParams.amenities.length > 0) {
            const amenityRegex = searchParams.amenities.filter((a: string) => a !== 'null').map((a: string) => new RegExp(a, 'i'));
            if (amenityRegex.length > 0) {
              matchStage['amenities'] = { $all: amenityRegex };
            }
          }
          if (searchParams.city && searchParams.city !== 'null') {
            // Only apply text location filters if we aren't already doing a geospatial coordinate search
            if (!coordinates || coordinates.length !== 2) {
              matchStage['address.city'] = { $regex: searchParams.city, $options: 'i' };
            }
          }
          if (searchParams.street_or_area && searchParams.street_or_area !== 'null') {
            if (!coordinates || coordinates.length !== 2) {
              matchStage['$or'] = [
                { name: { $regex: searchParams.street_or_area, $options: 'i' } },
                { 'address.street': { $regex: searchParams.street_or_area, $options: 'i' } },
                { description: { $regex: searchParams.street_or_area, $options: 'i' } }
              ];
            }
          }
        } catch (parseErr) {
          console.error("Error parsing AI JSON output:", parseErr);
        }
      }
    } 
    
    // Fallback if AI fails: Try to match ANY word in the query instead of the whole sentence
    if (query && Object.keys(matchStage).length === 0) {
      console.log("Using fallback basic search...");
      const keywords = query.split(' ').filter((w: string) => w.length > 3).join('|');
      if (keywords) {
        matchStage = {
          $or: [
            { name: { $regex: keywords, $options: 'i' } },
            { description: { $regex: keywords, $options: 'i' } },
            { 'address.city': { $regex: keywords, $options: 'i' } },
            { 'address.street': { $regex: keywords, $options: 'i' } }
          ]
        };
      }
    }

    // 2. Build Aggregation Pipeline for MongoDB
    const pipeline: any[] = [];

    if (coordinates && coordinates.length === 2 && coordinates[0] !== undefined) {
      pipeline.push({
        $geoNear: {
          near: { type: "Point", coordinates: [coordinates[0], coordinates[1]] },
          distanceField: "distance",
          spherical: true,
          query: matchStage 
        }
      });
    } else {
      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }
      pipeline.push({ $sort: { createdAt: -1 } }); 
    }

    const skipCount = (page - 1) * limit;
    pipeline.push({ $skip: skipCount });
    pipeline.push({ $limit: limit });

    // Execute MongoDB Pipeline
    const dbPgs = await PGProperty.aggregate(pipeline);
    
    // 3. Fetch from Google Places API (New) to enrich results
    let googlePlacesMapped: any[] = [];
    if (query && process.env.GOOGLE_MAPS_API_KEY) {
      try {
        console.log("Fetching real-world PGs from Google Places API...");
        
        const googleQuery = searchParams?.google_maps_query || (query + ' PG OR Hostel OR Coliving');
        console.log("Google Maps Query:", googleQuery);

        const googleReqBody: any = {
          textQuery: googleQuery, // Use AI synthesized optimal query
        };
        
        if (coordinates && coordinates.length === 2) {
          googleReqBody.locationBias = {
            circle: {
              center: {
                latitude: coordinates[1],
                longitude: coordinates[0]
              },
              radius: 5000.0 // 5km radius bias
            }
          };
        }

        const googleRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.photos,places.rating,places.userRatingCount,places.websiteUri'
          },
          body: JSON.stringify(googleReqBody)
        });

        if (googleRes.ok) {
          const googleData = await googleRes.json();
          if (googleData.places && googleData.places.length > 0) {
            // Map to PGProperty shape so frontend can render it seamlessly
            googlePlacesMapped = googleData.places.map((place: any) => {
              const photoName = place.photos && place.photos.length > 0 ? place.photos[0].name : null;
              const photoUrl = photoName 
                ? `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=400&key=${process.env.GOOGLE_MAPS_API_KEY}` 
                : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop';
              
              return {
                _id: place.id,
                name: place.displayName?.text || 'Unknown PG',
                description: `Real-world property powered by Google Maps. Rating: ${place.rating || 'N/A'} (${place.userRatingCount || 0} reviews).`,
                address: {
                  street: place.formattedAddress || 'Location unknown',
                  city: searchParams?.city || 'City',
                  state: '',
                  zipCode: '',
                },
                location: {
                  type: 'Point',
                  coordinates: place.location ? [place.location.longitude, place.location.latitude] : [0,0]
                },
                gender_type: searchParams?.gender || 'Unisex',
                pricing: {
                  monthly_rent: searchParams?.max_budget || 0, // Fallback since Google doesn't provide price
                  deposit: 0,
                  maintenance_included: false,
                },
                amenities: ['Google Maps Verified', ...searchParams?.amenities || []],
                images: [photoUrl],
                is_google_place: true, // Custom flag to identify it on frontend
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
            });
          }
        } else {
          console.error("Google Places API Error:", await googleRes.text());
        }
      } catch (gErr) {
        console.error("Failed to fetch from Google Places API:", gErr);
      }
    }

    // 4. Mix and return results (DB first, then Google)
    const combinedPgs = [...dbPgs, ...googlePlacesMapped];

    return NextResponse.json({ success: true, data: combinedPgs, params: searchParams });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to search PGs' }, { status: 500 });
  }
}
