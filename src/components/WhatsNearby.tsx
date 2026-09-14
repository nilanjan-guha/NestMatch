'use client';
import { useState, useEffect } from 'react';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';

function WhatsNearbyInner({ coordinates }: { coordinates: [number, number] }) {
  const placesLibrary = useMapsLibrary('places');
  const routesLibrary = useMapsLibrary('routes');
  
  const [landmarks, setLandmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!placesLibrary || !routesLibrary || !coordinates) return;

    const findLandmarks = async () => {
      setLoading(true);
      try {
        const center = new google.maps.LatLng(coordinates[1], coordinates[0]);
        
        // We use a dummy div because PlacesService requires an HTML element
        const dummyDiv = document.createElement('div');
        const service = new placesLibrary.PlacesService(dummyDiv);
        const distanceService = new routesLibrary.DistanceMatrixService();

        // Search for universities, hospitals, tech parks nearby
        const typesToSearch = ['university', 'hospital', 'shopping_mall'];
        const resultsMap = new Map();

        for (const type of typesToSearch) {
          await new Promise<void>((resolve) => {
            service.nearbySearch(
              {
                location: center,
                radius: 3000, // 3km
                type: type,
              },
              (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                  // Take top 2 from each category
                  results.slice(0, 2).forEach(place => {
                    resultsMap.set(place.place_id, {
                      name: place.name,
                      type: type,
                      location: place.geometry?.location
                    });
                  });
                }
                resolve();
              }
            );
          });
        }

        const topLandmarks = Array.from(resultsMap.values()).slice(0, 5);

        if (topLandmarks.length === 0) {
          setLoading(false);
          return;
        }

        // Calculate distances
        const destinations = topLandmarks.map(l => l.location);
        distanceService.getDistanceMatrix(
          {
            origins: [center],
            destinations: destinations,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (response, status) => {
            if (status === google.maps.DistanceMatrixStatus.OK && response) {
              const elements = response.rows[0].elements;
              const finalLandmarks = topLandmarks.map((l, index) => ({
                ...l,
                distance: elements[index].distance?.text,
                duration: elements[index].duration?.text
              })).filter(l => l.distance && l.duration);
              
              setLandmarks(finalLandmarks);
            }
            setLoading(false);
          }
        );

      } catch (err) {
        console.error("Error fetching nearby landmarks:", err);
        setLoading(false);
      }
    };

    findLandmarks();
  }, [placesLibrary, routesLibrary, coordinates]);

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Finding nearby landmarks... 📍</div>;
  }

  if (landmarks.length === 0) {
    return null;
  }

  const getEmoji = (type: string) => {
    switch (type) {
      case 'university': return '🎓';
      case 'hospital': return '🏥';
      case 'shopping_mall': return '🛍️';
      default: return '📍';
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
      {landmarks.map((landmark, idx) => (
        <div key={idx} style={{ 
          background: 'rgba(255,255,255,0.03)', 
          border: '1px solid var(--surface-border)', 
          borderRadius: '12px', 
          padding: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{ fontSize: '24px', background: 'rgba(162, 53, 255, 0.1)', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
            {getEmoji(landmark.type)}
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{landmark.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              🚗 {landmark.distance} • {landmark.duration} drive
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WhatsNearby({ coordinates }: { coordinates?: [number, number] }) {
  if (!coordinates || coordinates.length < 2) return null;
  
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}>
      <WhatsNearbyInner coordinates={coordinates} />
    </APIProvider>
  );
}
