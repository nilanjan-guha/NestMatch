import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("Missing GOOGLE_MAPS_API_KEY");
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.error("Google Geocoding API Error:", data);
      return NextResponse.json({ error: data.error_message || 'Failed to fetch reverse geocode' }, { status: 500 });
    }

    // Try to find locality/neighborhood
    const result = data.results[0];
    const addressComponents = result.address_components;
    
    let city = '';
    let area = '';

    for (const component of addressComponents) {
      if (component.types.includes('locality')) {
        city = component.long_name;
      }
      if (component.types.includes('sublocality_level_1') || component.types.includes('neighborhood')) {
        area = component.long_name;
      }
    }

    if (!city) city = 'Unknown City';

    return NextResponse.json({
      display_name: area ? `${area}, ${city}` : city
    });
  } catch (error) {
    console.error("Error fetching reverse geocode:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
