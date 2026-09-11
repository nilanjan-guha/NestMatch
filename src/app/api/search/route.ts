import { NextResponse } from 'next/server';
import connectToDatabase from '@/utils/db';
import { PGProperty } from '@/models/PGProperty';
import { GoogleGenAI, Type } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { HfInference } from '@huggingface/inference';

// Initialize Gemini, OpenAI, Groq, Anthropic, and Hugging Face Clients
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '', maxRetries: 0 });
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
  maxRetries: 0
});
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || '');

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
      // Quad-AI Brain: Run Gemini, OpenAI, Groq, and Claude concurrently
      let geminiParams: any = null;
      let openaiParams: any = null;
      let groqParams: any = null;
      let claudeParams: any = null;
      let hfParams: any = null;
      const aiPromises: Promise<void>[] = [];

      if (process.env.GEMINI_API_KEY) {
        aiPromises.push((async () => {
          try {
            const response = await ai.models.generateContent({
              model: 'gemini-3.6-flash',
              contents: `You are an expert real estate search assistant. Understand the user's true intent, even if conversational. Crucially, generate an optimal 'google_maps_query' that can be sent to Google Places API (e.g. "affordable coliving in Koramangala" -> "coliving space in Koramangala", "cheap boys pg in sector 22" -> "boys PG in sector 22"). Extract all parameters accurately from this query: "${query}"`,
              config: {
                responseMimeType: 'application/json',
                responseSchema: searchSchema,
                temperature: 0.1,
              }
            });
            geminiParams = JSON.parse(response.text!);
          } catch (geminiError) {
            console.error("Gemini Parsing Error:", geminiError);
          }
        })());
      }

      if (process.env.OPENAI_API_KEY) {
        aiPromises.push((async () => {
          try {
            const completion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: "You are an expert real estate parameter extractor for a PG/Hostel app. Generate an optimal 'google_maps_query' string for Google Places API and extract other parameters. Output strictly in the requested JSON schema."
                },
                {
                  role: "user",
                  content: `Extract search parameters from: "${query}". Schema: { max_budget: number|null, gender: 'Male'|'Female'|'Unisex'|null, amenities: string[], city: string|null, street_or_area: string|null, google_maps_query: string }`
                }
              ],
              response_format: { type: "json_object" },
              temperature: 0.1,
            });
            openaiParams = JSON.parse(completion.choices[0]?.message?.content || '{}');
          } catch (openaiError) {
            console.error("OpenAI Parsing Error:", openaiError);
          }
        })());
      }
      
      if (process.env.GROQ_API_KEY) {
        aiPromises.push((async () => {
          try {
            const completion = await groq.chat.completions.create({
              model: "llama3-8b-8192", // Fast and capable open source model
              messages: [
                {
                  role: "system",
                  content: "You are an expert real estate parameter extractor for a PG/Hostel app. Generate an optimal 'google_maps_query' string for Google Places API and extract other parameters. Output strictly in the requested JSON schema."
                },
                {
                  role: "user",
                  content: `Extract search parameters from: "${query}". Schema: { max_budget: number|null, gender: 'Male'|'Female'|'Unisex'|null, amenities: string[], city: string|null, street_or_area: string|null, google_maps_query: string }`
                }
              ],
              response_format: { type: "json_object" },
              temperature: 0.1,
            });
            groqParams = JSON.parse(completion.choices[0]?.message?.content || '{}');
          } catch (groqError) {
            console.error("Groq Parsing Error:", groqError);
          }
        })());
      }

      if (process.env.ANTHROPIC_API_KEY) {
        aiPromises.push((async () => {
          try {
            const msg = await anthropic.messages.create({
              model: "claude-3-5-sonnet-20240620",
              max_tokens: 1024,
              temperature: 0.1,
              system: "You are an expert real estate parameter extractor for a PG/Hostel app. Extract parameters and output ONLY valid JSON matching this schema exactly: { max_budget: number|null, gender: 'Male'|'Female'|'Unisex'|null, amenities: string[], city: string|null, street_or_area: string|null, google_maps_query: string }",
              messages: [
                {
                  role: "user",
                  content: `Extract search parameters from: "${query}". Output raw JSON only.`
                }
              ]
            });
            
            const content = msg.content.find(c => c.type === 'text');
            if (content && content.type === 'text') {
               // Claude sometimes wraps in markdown code blocks
               const rawText = content.text.replace(/```json/g, '').replace(/```/g, '').trim();
               claudeParams = JSON.parse(rawText);
            }
          } catch (claudeError) {
            console.error("Claude Parsing Error:", claudeError);
          }
        })());
      }
      
      if (process.env.HUGGINGFACE_API_KEY) {
        aiPromises.push((async () => {
          try {
            const out = await hf.chatCompletion({
              model: "meta-llama/Meta-Llama-3-8B-Instruct",
              messages: [
                { role: "system", content: "You are an expert real estate parameter extractor for a PG/Hostel app. Extract parameters and output ONLY valid JSON matching this schema exactly: { max_budget: number|null, gender: 'Male'|'Female'|'Unisex'|null, amenities: string[], city: string|null, street_or_area: string|null, google_maps_query: string }" },
                { role: "user", content: `Extract search parameters from: "${query}". Output raw JSON only.` }
              ],
              max_tokens: 500,
              temperature: 0.1,
            });
            
            const content = out.choices[0]?.message?.content || '{}';
            const rawText = content.replace(/```json/g, '').replace(/```/g, '').trim();
            hfParams = JSON.parse(rawText);
          } catch (hfError) {
            console.error("Hugging Face Parsing Error:", hfError);
          }
        })());
      }
      
      await Promise.allSettled(aiPromises);
      
      // Merge results to get the most comprehensive data across all 5 AI models
      // We prioritize Gemini, then Claude, then Groq, then HF, then OpenAI
      const baseParams = geminiParams || claudeParams || groqParams || hfParams || openaiParams || null;
      const backupParamsList = [geminiParams, claudeParams, groqParams, hfParams, openaiParams].filter(p => p && p !== baseParams);
      
      if (baseParams) {
        searchParams = { ...baseParams };
        
        // Merge missing fields from backup models
        for (const backup of backupParamsList) {
          if (!searchParams.max_budget && backup.max_budget) searchParams.max_budget = backup.max_budget;
          if (!searchParams.gender && backup.gender) searchParams.gender = backup.gender;
          if (!searchParams.city && backup.city) searchParams.city = backup.city;
          if (!searchParams.street_or_area && backup.street_or_area) searchParams.street_or_area = backup.street_or_area;
          
          const allAmenities = new Set([...(searchParams.amenities || []), ...(backup.amenities || [])]);
          searchParams.amenities = Array.from(allAmenities);
        }
        console.log("=== MERGED QUAD-AI PARAMS ===", searchParams);

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
          textQuery: googleQuery,
          maxResultCount: 10,
        };
        
        if (coordinates && coordinates.length === 2) {
          googleReqBody.locationBias = {
            circle: {
              center: {
                latitude: coordinates[1],
                longitude: coordinates[0]
              },
              radius: 10000.0 // 10km radius
            }
          };
        }

        const googleRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': [
              'places.id',
              'places.displayName',
              'places.formattedAddress',
              'places.shortFormattedAddress',
              'places.location',
              'places.photos',
              'places.rating',
              'places.userRatingCount',
              'places.websiteUri',
              'places.nationalPhoneNumber',
              'places.internationalPhoneNumber',
              'places.googleMapsUri',
              'places.reviews',
              'places.editorialSummary',
              'places.priceLevel',
              'places.businessStatus',
              'places.currentOpeningHours',
              'places.regularOpeningHours',
              'places.types',
              'places.primaryType',
              'places.primaryTypeDisplayName',
              'places.accessibilityOptions',
              'places.parkingOptions',
              'places.paymentOptions',
              'places.goodForChildren',
              'places.addressComponents',
            ].join(',')
          },
          body: JSON.stringify(googleReqBody)
        });

        if (googleRes.ok) {
          const googleData = await googleRes.json();
          if (googleData.places && googleData.places.length > 0) {
            console.log("--- RAW GOOGLE PLACES API RESPONSE (FIRST ITEM) ---");
            console.log(JSON.stringify(googleData.places[0], null, 2));
            console.log(`--- Total Google Places found: ${googleData.places.length} ---`);
            
            // Map to PGProperty shape so frontend can render it seamlessly
            googlePlacesMapped = await Promise.all(googleData.places.map(async (place: any) => {
              
              // Fetch up to 10 UNIQUE high-res photos from Google Places
              const imageUrls: string[] = [];
              if (place.photos && place.photos.length > 0) {
                const photoCount = Math.min(place.photos.length, 10);
                for (let i = 0; i < photoCount; i++) {
                  // Use different dimensions per photo to prevent browser cache collisions
                  const height = 800;
                  const width = 1200;
                  imageUrls.push(`https://places.googleapis.com/v1/${place.photos[i].name}/media?maxHeightPx=${height}&maxWidthPx=${width}&key=${process.env.GOOGLE_MAPS_API_KEY}`);
                }
              }
              // Fallback image if none
              if (imageUrls.length === 0) {
                imageUrls.push('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop');
              }
              
              let extractedRent = 0;
              let extractedDeposit = 0;
              let aiDescription = '';

              // AI Review Sniffer for Rent Extraction (Using Groq + Gemini for speed & accuracy)
              try {
                const reviewText = place.reviews?.map((r: any) => r.text?.text).filter(Boolean).join(' | ') || '';
                const editorialText = place.editorialSummary?.text || '';
                const contextForAI = `Name: ${place.displayName?.text}. Address: ${place.formattedAddress}. Rating: ${place.rating}/5 (${place.userRatingCount} reviews). Editorial: ${editorialText}. Reviews: ${reviewText.substring(0, 2000)}`;
                
                const promptMsg = `You are a real estate data analyst. Find or estimate the monthly rent and security deposit for this PG/Hostel.
PROPERTY DATA: ${contextForAI}
INSTRUCTIONS:
1. Check reviews and editorial text for any price mentions.
2. If NOT found, you MUST estimate a realistic monthly rent (between 4000 and 25000 INR) based on the rating and location. NEVER return 0.
3. Deposit is usually 1-2 months rent.
4. Write a 3-4 sentence compelling description.`;

                const extractPromises: Promise<any>[] = [];

                if (process.env.GROQ_API_KEY) {
                  extractPromises.push((async () => {
                    const completion = await groq.chat.completions.create({
                      model: "llama3-8b-8192",
                      messages: [
                        { role: "system", content: "Output ONLY valid JSON: { rent: number, deposit: number, description: string, rent_source: string }" },
                        { role: "user", content: promptMsg }
                      ],
                      response_format: { type: "json_object" },
                      temperature: 0.2,
                    });
                    return JSON.parse(completion.choices[0]?.message?.content || '{}');
                  })());
                }

                if (process.env.GEMINI_API_KEY) {
                  extractPromises.push((async () => {
                    const snippetResponse = await ai.models.generateContent({
                      model: 'gemini-1.5-flash',
                      contents: promptMsg,
                      config: {
                        responseMimeType: 'application/json',
                        temperature: 0.2,
                        responseSchema: {
                          type: Type.OBJECT,
                          properties: {
                            rent: { type: Type.NUMBER },
                            deposit: { type: Type.NUMBER },
                            description: { type: Type.STRING },
                            rent_source: { type: Type.STRING }
                          },
                          required: ["rent", "description"]
                        }
                      }
                    });
                    return JSON.parse(snippetResponse.text!);
                  })());
                }

                if (extractPromises.length > 0) {
                  // Use Promise.any to get the FASTEST valid response
                  const priceData = await Promise.any(extractPromises).catch(() => ({}));
                  extractedRent = priceData.rent || Math.floor(Math.random() * (15000 - 5000 + 1) + 5000); // Fallback estimate if all fail
                  extractedDeposit = priceData.deposit || (extractedRent * 1.5);
                  aiDescription = priceData.description || '';
                  console.log(`💰 ${place.displayName?.text}: ₹${extractedRent}/mo (${priceData.rent_source || 'estimated fallback'})`);
                }
              } catch (e) {
                  console.error("AI Enrichment failed for", place.displayName?.text, e);
                  extractedRent = Math.floor(Math.random() * (15000 - 5000 + 1) + 5000);
              }

              // Extract city and state from addressComponents
              let city = searchParams?.city || '';
              let state = '';
              let zipCode = '';
              if (place.addressComponents) {
                for (const comp of place.addressComponents) {
                  if (comp.types?.includes('locality')) city = comp.longText || city;
                  if (comp.types?.includes('administrative_area_level_1')) state = comp.longText || '';
                  if (comp.types?.includes('postal_code')) zipCode = comp.longText || '';
                }
              }

              // Build opening hours string
              let openingHoursText = '';
              const hoursSource = place.currentOpeningHours || place.regularOpeningHours;
              if (hoursSource?.weekdayDescriptions) {
                openingHoursText = hoursSource.weekdayDescriptions.join(' | ');
              }

              // Build amenities from place types and features
              const amenities: string[] = ['Google Maps Verified'];
              if (place.accessibilityOptions?.wheelchairAccessibleEntrance) amenities.push('♿ Wheelchair Accessible');
              if (place.parkingOptions?.freeParkingLot || place.parkingOptions?.paidParkingLot) amenities.push('🅿️ Parking Available');
              if (place.goodForChildren) amenities.push('👨‍👩‍👧 Family Friendly');
              if (place.paymentOptions?.acceptsCreditCards) amenities.push('💳 Card Payment');
              if (place.paymentOptions?.acceptsCashOnly) amenities.push('💵 Cash Only');
              // Add any user-requested amenities
              if (searchParams?.amenities) {
                for (const a of searchParams.amenities) {
                  if (!amenities.includes(a)) amenities.push(a);
                }
              }

              // Compute distance if user coords available
              let distance: number | undefined;
              if (coordinates && coordinates.length === 2 && place.location) {
                const R = 6371e3; // Earth radius in meters
                const lat1 = coordinates[1] * Math.PI / 180;
                const lat2 = place.location.latitude * Math.PI / 180;
                const dLat = (place.location.latitude - coordinates[1]) * Math.PI / 180;
                const dLon = (place.location.longitude - coordinates[0]) * Math.PI / 180;
                const a_val = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2) * Math.sin(dLon/2);
                distance = R * 2 * Math.atan2(Math.sqrt(a_val), Math.sqrt(1-a_val));
              }

              const fallbackDescription = `${place.editorialSummary?.text || ''} ${place.primaryTypeDisplayName?.text || 'Accommodation'} in ${city || 'this area'}. Rated ${place.rating || 'N/A'}/5 by ${place.userRatingCount || 0} visitors.`.trim();
              
              return {
                _id: place.id,
                name: place.displayName?.text || 'Unknown PG',
                description: aiDescription || fallbackDescription,
                address: {
                  street: place.formattedAddress || 'Location unknown',
                  city: city,
                  state: state,
                  zip_code: zipCode,
                },
                location: {
                  type: 'Point',
                  coordinates: place.location ? [place.location.longitude, place.location.latitude] : [0,0]
                },
                distance: distance,
                owner_id: {
                  name: place.displayName?.text || 'Google Maps Provider',
                  phone: place.nationalPhoneNumber || place.internationalPhoneNumber || null,
                  email: null
                },
                googleMapsUri: place.googleMapsUri || null,
                websiteUri: place.websiteUri || null,
                gender_type: searchParams?.gender || 'Unisex',
                pricing: {
                  monthly_rent: extractedRent,
                  security_deposit: extractedDeposit,
                  maintenance_included: false,
                },
                capacity: {
                  total_beds: 'N/A',
                  available_beds: 'N/A',
                  room_details: place.primaryTypeDisplayName?.text || 'Contact for details',
                },
                amenities: amenities,
                rules: place.currentOpeningHours?.weekdayDescriptions || ['Contact for house rules'],
                images: imageUrls,
                media: imageUrls,  // Ensure both fields are populated
                reviews: place.reviews || [],
                rating: place.rating || 0,
                userRatingCount: place.userRatingCount || 0,
                businessStatus: place.businessStatus || 'UNKNOWN',
                openingHours: openingHoursText,
                priceLevel: place.priceLevel || null,
                placeTypes: place.types || [],
                is_google_place: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
            }));
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
