'use client';
import { useState, useEffect, useRef } from 'react';

const SUGGESTION_CHIPS = [
  { emoji: '🛡️', label: 'Safe PGs for Girls' },
  { emoji: '💰', label: 'Budget PG under ₹5000' },
  { emoji: '🏋️', label: 'PG with Gym & Pool' },
  { emoji: '🍕', label: 'PG with Meals Included' },
  { emoji: '📶', label: 'PG with WiFi & AC' },
  { emoji: '👫', label: 'Couples Friendly PG' },
  { emoji: '🚇', label: 'PG near Metro Station' },
];

const PLACEHOLDER_EXAMPLES = [
  'Where do you want to live? (e.g. Sector 18, Noida)',
  'Try: Safe PG for girls in Koramangala...',
  'Try: Furnished PG with AC under ₹8000...',
  'Try: Boys PG near Cyber Hub, Gurgaon...',
  'Try: PG with food and laundry in HSR Layout...',
];

export default function AiSearchBar({ onSearch, defaultLocation }: { onSearch: (query: string, coordinates?: [number, number]) => void, defaultLocation?: string }) {
  const [location, setLocation] = useState('');
  const [requirements, setRequirements] = useState('');
  const [coords, setCoords] = useState<[number, number] | undefined>(undefined);
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cycle through animated placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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

  const handleChipClick = (chipLabel: string) => {
    setRequirements(chipLabel);
    // If location is set, trigger search immediately
    if (location.trim()) {
      const finalQuery = `Location: ${location}. Requirements: ${chipLabel}`;
      onSearch(finalQuery, coords);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      
      {/* Step 1: Location Box */}
      <div style={{ borderRadius: '15px', position: 'relative' }}>
        <input 
          type="text" 
          value={location}
          onChange={(e) => handleLocationChange(e.target.value)}
          onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
          placeholder={PLACEHOLDER_EXAMPLES[placeholderIdx]}
          className="glass-panel search-input"
          style={{ paddingLeft: '20px' }}
        />

        {/* Autocomplete Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#1a1a1a',
            border: '1px solid var(--surface-border)',
            borderRadius: '10px',
            marginTop: '5px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            zIndex: 9999,
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

      {/* Clear Use Current Location Button */}
      <button
        type="button"
        onClick={handleGeoLocation}
        disabled={loadingLoc}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--surface-border)',
          color: 'var(--foreground)',
          padding: '10px 16px',
          borderRadius: '20px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          alignSelf: 'flex-start',
          fontSize: '14px',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
      >
        <span>📍</span>
        {loadingLoc ? 'Finding location...' : 'Use My Current Location'}
      </button>

      {/* Step 2: Requirements & Submit — always visible now */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', animation: 'fadeInUp 0.5s ease' }}>
        <div style={{ borderRadius: '15px' }}>
          <textarea 
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Any specific requirements? (e.g. Cheap unisex PG under 5000 with AC and WiFi)"
            className="glass-panel search-textarea"
            rows={2}
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
            boxShadow: '0 4px 15px rgba(var(--primary-rgb), 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          🔍 Find My PG
        </button>
      </div>

      {/* Quick Suggestion Chips */}
      <div className="suggestion-chips">
        {SUGGESTION_CHIPS.map((chip, i) => (
          <button
            key={i}
            type="button"
            className="suggestion-chip"
            onClick={() => handleChipClick(chip.label)}
          >
            {chip.emoji} {chip.label}
          </button>
        ))}
      </div>

    </form>
  );
}
