import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const zip = searchParams.get('zip');

  if (!zip) {
    return NextResponse.json({ error: 'zip is required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("Missing GOOGLE_MAPS_API_KEY");
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?components=postal_code:${zip}|country:IN&key=${apiKey}`);
    
    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.error("Google Geocoding API Error:", data.status, data.error_message);
      return NextResponse.json({ error: data.error_message || 'Failed to fetch details' }, { status: 500 });
    }

    const results = data.results[0];
    let city = '';
    let state = '';
    let lat = results.geometry.location.lat;
    let lng = results.geometry.location.lng;

    results.address_components.forEach((component: any) => {
      if (component.types.includes('locality')) {
        city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }
    });

    return NextResponse.json({
      city,
      state,
      lat,
      lng
    });
  } catch (error) {
    console.error("Error fetching geocode details:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
