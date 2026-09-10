import 'dotenv/config';

async function test() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey || '',
    },
    body: JSON.stringify({
      input: 'Sector 18',
      includedRegionCodes: ['in']
    })
  });
  
  const data = await res.json();
  console.log("Autocomplete Data:", JSON.stringify(data, null, 2));

  if (data.suggestions && data.suggestions.length > 0) {
    const placeId = data.suggestions[0].placePrediction.placeId;
    console.log("Fetching details for Place ID:", placeId);

    const detailsRes = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=location`, {
      headers: {
        'X-Goog-Api-Key': apiKey || ''
      }
    });
    
    const detailsData = await detailsRes.json();
    console.log("Details Data:", JSON.stringify(detailsData, null, 2));
  }
}

test();
