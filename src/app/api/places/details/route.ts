import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get('place_id');

  if (!placeId) {
    return NextResponse.json({ error: 'place_id is required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("Missing GOOGLE_MAPS_API_KEY");
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=location`, {
      headers: {
        'X-Goog-Api-Key': apiKey,
      }
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error("Google Places Details Error:", data.error);
      return NextResponse.json({ error: data.error.message || 'Failed to fetch place details' }, { status: 500 });
    }

    const { location } = data;

    // Return in the same lon, lat format the frontend expects
    return NextResponse.json({
      lon: location.longitude,
      lat: location.latitude
    });
  } catch (error) {
    console.error("Error fetching place details:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
