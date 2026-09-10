import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  // Try Google Geocoding API first
  if (apiKey) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`
      );
      const data = await response.json();
      
      console.log("Reverse Geocode Response status:", data.status);

      if (data.status === 'OK' && data.results && data.results.length > 0) {
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
      }
      
      // If Google API returned an error, log it and fall through to Nominatim
      console.error("Google Geocoding API Error:", data.status, data.error_message || '');
    } catch (error) {
      console.error("Google Geocoding fetch error:", error);
    }
  }

  // Fallback: Use free Nominatim (OpenStreetMap) reverse geocoding
  try {
    const nominatimRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          'User-Agent': 'NestMatch/1.0'
        }
      }
    );

    if (nominatimRes.ok) {
      const nomData = await nominatimRes.json();
      const displayName = nomData.address
        ? [nomData.address.suburb || nomData.address.neighbourhood, nomData.address.city || nomData.address.town || nomData.address.village]
            .filter(Boolean)
            .join(', ') || nomData.display_name
        : `${lat}, ${lon}`;

      return NextResponse.json({ display_name: displayName });
    }
  } catch (nomError) {
    console.error("Nominatim fallback error:", nomError);
  }

  // Final fallback — just return coords
  return NextResponse.json({ display_name: `${lat}, ${lon}` });
}
