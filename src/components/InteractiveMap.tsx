'use client';
import { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

interface InteractiveMapProps {
  pgs: any[];
  hoveredPgId: string | null;
  userCoords?: [number, number];
}

export default function InteractiveMap({ pgs, hoveredPgId, userCoords }: InteractiveMapProps) {
  const [mapCenter, setMapCenter] = useState({ lat: 28.5355, lng: 77.3910 }); // Default fallback to Noida
  const [zoom, setZoom] = useState(11);

  // Compute the center based on available data
  useEffect(() => {
    if (userCoords && userCoords.length === 2) {
      setMapCenter({ lat: userCoords[1], lng: userCoords[0] });
      setZoom(13);
    } else if (pgs.length > 0) {
      // Find the first valid PG with coordinates
      const firstValid = pgs.find(pg => pg.location?.coordinates?.length === 2);
      if (firstValid) {
        setMapCenter({
          lat: firstValid.location.coordinates[1],
          lng: firstValid.location.coordinates[0]
        });
        setZoom(12);
      }
    }
  }, [pgs, userCoords]);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '500px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}>
        <Map
          defaultCenter={mapCenter}
          center={mapCenter}
          defaultZoom={zoom}
          zoom={zoom}
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'}
          disableDefaultUI={true}
          onCenterChanged={(ev) => setMapCenter(ev.detail.center)}
          onZoomChanged={(ev) => setZoom(ev.detail.zoom)}
        >
          {pgs.map((pg, idx) => {
            const id = pg._id || pg.id;
            const coords = pg.location?.coordinates;
            if (!coords || coords.length !== 2) return null;

            const isHovered = hoveredPgId === id;
            
            return (
              <AdvancedMarker 
                key={`${id || 'pg'}-${idx}`} 
                position={{ lat: coords[1], lng: coords[0] }}
                zIndex={isHovered ? 100 : 1}
              >
                <Pin 
                  background={isHovered ? '#ff6b6b' : '#3b82f6'} 
                  borderColor={isHovered ? '#fff' : '#1e3a8a'} 
                  glyphColor={'#fff'} 
                  scale={isHovered ? 1.3 : 1.0}
                />
              </AdvancedMarker>
            );
          })}
        </Map>
      </APIProvider>
    </div>
  );
}
