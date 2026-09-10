'use client';
import { useState, useEffect, useRef } from 'react';

export default function AiSearchBar({ onSearch, defaultLocation }: { onSearch: (query: string, coordinates?: [number, number]) => void, defaultLocation?: string }) {
  const [location, setLocation] = useState('');
  const [requirements, setRequirements] = useState('');
  const [coords, setCoords] = useState<[number, number] | undefined>(undefined);
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingLoc, setLoadingLoc] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (defaultLocation && !location) {
      setLocation(defaultLocation);
    }
  }, [defaultLocation]);

  const handleLocationChange = (val: string) => {
    setLocation(val);
    setCoords(undefined); // Reset coords if they type manually
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (val.trim().length > 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(val)}`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data);
            setShowSuggestions(true);
          }
        } catch (e) {
          console.error(e);
        }
      }, 500);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = async (sug: any) => {
    setLocation(sug.display_name);
    setShowSuggestions(false);
    try {
      const res = await fetch(`/api/places/details?place_id=${sug.place_id}`);
      if (res.ok) {
        const data = await res.json();
        setCoords([data.lon, data.lat]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGeoLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`/api/places/reverse?lat=${latitude}&lon=${longitude}`);
        if (res.ok) {
          const data = await res.json();
          setLocation(data.display_name);
        } else {
          setLocation(`Current Location`);
        }
        setCoords([longitude, latitude]);
        setShowSuggestions(false);
      } catch (error) {
        console.error("Error fetching location", error);
        setLocation(`Current Location`);
        setCoords([position.coords.longitude, position.coords.latitude]);
      } finally {
        setLoadingLoc(false);
      }
    }, () => {
      alert('Unable to retrieve your location');
      setLoadingLoc(false);
    });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (location.trim() || requirements.trim()) {
      const finalQuery = `Location: ${location || 'Anywhere'}. Requirements: ${requirements || 'Any PG'}`;
      onSearch(finalQuery, coords);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      
      {/* Step 1: Location Box */}
      <div className="glow-effect" style={{ borderRadius: '15px', position: 'relative', background: 'var(--surface)' }}>
        <input 
          type="text" 
          value={location}
          onChange={(e) => handleLocationChange(e.target.value)}
          onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
          placeholder="Where do you want to live? (e.g. Sector 18, Gurgaon)"
          className="glass-panel"
          style={{
            width: '100%',
            padding: '20px 60px',
            fontSize: '18px',
            borderRadius: '15px',
            border: '1px solid var(--surface-border)',
            background: 'transparent',
            color: 'var(--foreground)',
            outline: 'none'
          }}
        />
        <button
          type="button"
          onClick={handleGeoLocation}
          title="Use my current location"
          style={{
            position: 'absolute',
            left: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: loadingLoc ? 'var(--primary)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            transition: 'color 0.3s ease'
          }}
        >
          📍
        </button>

        {/* Autocomplete Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#1a1a1a', // Solid dark background to prevent overlap transparency
            border: '1px solid var(--surface-border)',
            borderRadius: '10px',
            marginTop: '5px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            zIndex: 9999, // Super high z-index to stay above everything
            maxHeight: '250px',
            overflowY: 'auto'
          }}>
            {suggestions.map((sug, i) => (
              <div 
                key={i}
                onClick={() => handleSelectSuggestion(sug)}
                style={{
                  padding: '12px 20px',
                  cursor: 'pointer',
                  borderBottom: i === suggestions.length - 1 ? 'none' : '1px solid #333',
                  color: 'white',
                  fontSize: '15px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {sug.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: AI Requirements Box & Submit (Only shows if location is selected) */}
      {coords !== undefined && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', animation: 'fadeIn 0.5s ease' }}>
          <div className="glow-effect" style={{ borderRadius: '15px', background: 'var(--surface)' }}>
            <textarea 
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Any specific requirements? (e.g. Cheap unisex PG under 5000 with AC and WiFi)"
              className="glass-panel"
              rows={2}
              style={{
                width: '100%',
                padding: '20px',
                fontSize: '16px',
                borderRadius: '15px',
                border: '1px solid var(--surface-border)',
                background: 'transparent',
                color: 'var(--foreground)',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          <button 
            type="submit"
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '15px',
              background: 'linear-gradient(45deg, var(--primary), var(--secondary))',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '18px',
              boxShadow: '0 4px 15px rgba(var(--primary-rgb), 0.3)'
            }}
          >
            Find My PG
          </button>
        </div>
      )}

    </form>
  );
}
