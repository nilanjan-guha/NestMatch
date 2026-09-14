import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const types = searchParams.get('types');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("Missing GOOGLE_MAPS_API_KEY");
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  try {
    const requestBody: any = {
      input: query,
      includedRegionCodes: ['in']
    };

    if (types) {
      requestBody.includedPrimaryTypes = types.split(',');
    }

    if (lat && lng) {
      requestBody.locationBias = {
        circle: {
          center: {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng)
          },
          radius: 50000.0 // 50km radius bias
        }
      };
    }

    const response = await fetch(`https://places.googleapis.com/v1/places:autocomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error("Google Places API Error:", data.error);
      return NextResponse.json({ error: data.error.message || 'Failed to fetch places' }, { status: 500 });
    }

    const suggestions = (data.suggestions || []).map((s: any) => ({
      place_id: s.placePrediction.placeId,
      display_name: s.placePrediction.text.text
    }));

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Error fetching places autocomplete:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
