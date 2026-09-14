'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import citiesData from '@/data/indian-cities.json';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';

function MapUpdater({ coordinates }: { coordinates: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.panTo({ lat: coordinates[1], lng: coordinates[0] });
    }
  }, [map, coordinates]);
  return null;
}

export default function EditPropertyForm({ property }: { property: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: property.name || '',
    description: property.description || '',
    address: { 
      street: property.address?.street || '', 
      city: property.address?.city || '', 
      state: property.address?.state || '', 
      zip_code: property.address?.zip_code || '' 
    },
    gender_type: property.gender_type || 'Unisex',
    pricing: { 
      monthly_rent: property.pricing?.monthly_rent || '', 
      security_deposit: property.pricing?.security_deposit || '' 
    },
    amenities: property.amenities || [],
    rules: property.rules || [],
    media: '', // manual URLs
    video_url: property.video_url || ''
  });
  const [existingMedia, setExistingMedia] = useState<string[]>(property.media || []);
  const [files, setFiles] = useState<File[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  
  // Use existing coordinates if available, otherwise default
  const [selectedCoordinates, setSelectedCoordinates] = useState<[number, number]>(
    property.location?.coordinates?.length === 2 
      ? [property.location.coordinates[0], property.location.coordinates[1]] 
      : [77.5946, 12.9716]
  );
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAddressSearch = async (query: string) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    try {
      const [lng, lat] = selectedCoordinates;
      const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(query)}&lat=${lat}&lng=${lng}`);
      const data = await res.json();
      setSuggestions(data || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Failed to fetch suggestions", error);
    }
  };

  const handleMarkerDragEnd = async (e: any) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setSelectedCoordinates([lng, lat]);

    try {
      const res = await fetch(`/api/places/reverse?lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data) {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            street: data.street_address || data.display_name || prev.address.street,
            city: data.city || prev.address.city,
            state: data.state || prev.address.state,
            zip_code: data.zip_code || prev.address.zip_code
          }
        }));
      }
    } catch (error) {
      console.error("Reverse geocoding failed", error);
    }
  };

  const handleCitySearch = async (query: string) => {
    if (!query) {
      setCitySuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(query)}&types=locality`);
      const data = await res.json();
      setCitySuggestions(data || []);
      setShowCitySuggestions(true);
    } catch (error) {
      console.error("Failed to fetch city suggestions", error);
    }
  };

  const handleZipChange = async (e: any) => {
    const val = e.target.value;
    setFormData({ ...formData, address: { ...formData.address, zip_code: val } });
    
    if (val.length === 6) {
      try {
        const res = await fetch(`/api/places/geocode?zip=${val}`);
        const data = await res.json();
        if (data.city && data.state) {
          setFormData(prev => ({
            ...prev,
            address: {
              ...prev.address,
              zip_code: val,
              city: data.city,
              state: data.state
            }
          }));
          if (data.lat && data.lng) {
            setSelectedCoordinates([data.lng, data.lat]);
          }
        }
      } catch (err) {
        console.error("Geocoding failed", err);
      }
    }
  };

  const handleStreetChange = (e: any) => {
    const val = e.target.value;
    setFormData({ ...formData, address: { ...formData.address, street: val } });
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      handleAddressSearch(val);
    }, 500);
  };

  const handleCityChange = (e: any) => {
    const val = e.target.value;
    setFormData({ ...formData, address: { ...formData.address, city: val } });
    
    if (cityTimeoutRef.current) clearTimeout(cityTimeoutRef.current);
    cityTimeoutRef.current = setTimeout(() => {
      handleCitySearch(val);
    }, 500);
  };

  const handleSelectCity = async (place: any) => {
    setFormData({ ...formData, address: { ...formData.address, city: place.display_name.split(',')[0] } });
    setShowCitySuggestions(false);
    
    // Also fetch coords for the city so street address search gets biased there
    try {
      const res = await fetch(`/api/places/details?place_id=${place.place_id}`);
      const data = await res.json();
      if (data.lon && data.lat) {
        setSelectedCoordinates([data.lon, data.lat]);
      }
    } catch (error) {
      console.error("Failed to fetch place details", error);
    }
  };

  const handleSelectPlace = async (place: any) => {
    setFormData({ ...formData, address: { ...formData.address, street: place.display_name } });
    setShowSuggestions(false);
    
    try {
      const res = await fetch(`/api/places/details?place_id=${place.place_id}`);
      const data = await res.json();
      if (data.lon && data.lat) {
        setSelectedCoordinates([data.lon, data.lat]);
      }
    } catch (error) {
      console.error("Failed to fetch place details", error);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const removeExistingMedia = (index: number) => {
    setExistingMedia(existingMedia.filter((_, i) => i !== index));
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: { ...((formData as any)[parent]), [child]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'amenities' | 'rules') => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const currentList = prev[field];
      if (checked) {
        return { ...prev, [field]: [...currentList, value] };
      } else {
        return { ...prev, [field]: currentList.filter((item: string) => item !== value) };
      }
    });
  };

  const STANDARD_AMENITIES = [
    "WiFi", "AC", "Non-AC", "Meals Included (Veg)", "Meals Included (Non-Veg)", 
    "Housekeeping", "Laundry", "Power Backup", "Gym", "TV", "Attached Bathroom", 
    "Parking", "Lift", "RO Water", "CCTV Security"
  ];

  const STANDARD_RULES = [
    "No Smoking", "No Drinking", "No Boys/Girls Allowed", 
    "Curfew at 10 PM", "Notice Period (30 Days)", "No Loud Music", "No Pets"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      ...formData,
      pricing: {
        monthly_rent: Number(formData.pricing.monthly_rent),
        security_deposit: Number(formData.pricing.security_deposit)
      },
      address: {
        ...formData.address,
        coordinates: selectedCoordinates
      },
      amenities: formData.amenities,
      rules: formData.rules,
      media: [] // we will populate this below
    };

    try {
      // 1. Upload files if any
      let uploadedUrls: string[] = [];
      if (files.length > 0) {
        const uploadData = new FormData();
        files.forEach(f => uploadData.append('files', f));
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData
        });
        const uploadResult = await uploadRes.json();
        if (uploadResult.success) {
          uploadedUrls = uploadResult.urls;
        } else {
          alert(uploadResult.error || 'File upload failed');
          setLoading(false);
          return;
        }
      }

      // 2. Combine manually entered URLs, uploaded URLs, and remaining existing media
      const manualUrls = formData.media.split(',').map((i: string) => i.trim()).filter(Boolean);
      payload.media = [...existingMedia, ...manualUrls, ...uploadedUrls] as never[];
      const res = await fetch(`/api/properties/${property._id.toString()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        router.push('/owner/dashboard');
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to update property');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{ padding: '40px 24px', position: 'relative' }}>
      {loading && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(5px)' }}>
          <div style={{ width: '60px', height: '60px', border: '5px solid rgba(255,255,255,0.1)', borderTop: '5px solid var(--primary)', borderRadius: '50%', animation: 'smoothSpin 1s linear infinite' }} />
          <h2 style={{ marginTop: '24px', color: 'white', fontSize: '24px' }}>Updating Property...</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Saving changes and uploading new images, please wait.</p>
        </div>
      )}

      <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <Link href="/owner/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>← Back</Link>
        <h1 style={{ fontSize: '32px' }}>Edit Property: {property.name}</h1>
      </div>
      
      <div className="glass-panel" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Basic Details */}
          <div>
            <h3 style={{ marginBottom: '15px', color: 'var(--primary)' }}>Basic Details</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              <input type="text" name="name" placeholder="Property Name (e.g., Sunrise PG)" value={formData.name} onChange={handleChange} style={inputStyle} required />
              <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} style={{ ...inputStyle, minHeight: '100px' }} required />
              
              <select name="gender_type" value={formData.gender_type} onChange={handleChange} style={inputStyle}>
                <option value="Unisex" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>Unisex</option>
                <option value="Male" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>Male Only</option>
                <option value="Female" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>Female Only</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 style={{ marginBottom: '15px', color: 'var(--primary)' }}>Location</h3>
            
            <div style={{ marginBottom: '20px', width: '100%', height: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
              <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}>
                <Map
                  defaultCenter={{ lat: selectedCoordinates[1], lng: selectedCoordinates[0] }}
                  defaultZoom={15}
                  mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'}
                  gestureHandling={'greedy'}
                >
                  <MapUpdater coordinates={selectedCoordinates} />
                  <AdvancedMarker 
                    position={{ lat: selectedCoordinates[1], lng: selectedCoordinates[0] }}
                    draggable={true}
                    onDragEnd={handleMarkerDragEnd}
                  >
                    <Pin background={'#ff6b6b'} borderColor={'#fff'} glyphColor={'#fff'} scale={1.2} />
                  </AdvancedMarker>
                </Map>
              </APIProvider>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>Drag the pin to your exact building location.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <input 
                type="text" 
                name="address.zip_code" 
                placeholder="Zip Code (Enter 6 digits to auto-fill City/State)" 
                value={formData.address.zip_code} 
                onChange={handleZipChange} 
                style={{...inputStyle, gridColumn: 'span 2'}} 
                maxLength={6}
                required 
              />
              
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="address.city" 
                  placeholder="City" 
                  value={formData.address.city} 
                  onChange={handleCityChange} 
                  onFocus={() => { if(citySuggestions.length > 0) setShowCitySuggestions(true); }}
                  onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                  style={{ ...inputStyle, width: '100%' }} 
                  required 
                />
                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: 'var(--background)', border: '1px solid var(--surface-border)', borderRadius: '8px', zIndex: 9999, maxHeight: '200px', overflowY: 'auto', marginTop: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                    {citySuggestions.map((s, idx) => (
                      <div 
                        key={idx} 
                        onMouseDown={(e) => { e.preventDefault(); handleSelectCity(s); }}
                        style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: idx < citySuggestions.length - 1 ? '1px solid var(--surface-border)' : 'none' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {s.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input type="text" name="address.state" placeholder="State" value={formData.address.state} readOnly style={{...inputStyle, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)'}} required />
              
              <div style={{ position: 'relative', gridColumn: 'span 2' }}>
                <input 
                  type="text" 
                  name="address.street" 
                  placeholder="Street Address (Search for a location)" 
                  value={formData.address.street} 
                  onChange={handleStreetChange} 
                  onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  style={{...inputStyle, width: '100%'}} 
                  required 
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: 'var(--background)', border: '1px solid var(--surface-border)', borderRadius: '8px', zIndex: 9999, maxHeight: '200px', overflowY: 'auto', marginTop: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                    {suggestions.map((s, idx) => (
                      <div 
                        key={idx} 
                        onMouseDown={(e) => { e.preventDefault(); handleSelectPlace(s); }}
                        style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: idx < suggestions.length - 1 ? '1px solid var(--surface-border)' : 'none' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {s.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 style={{ marginBottom: '15px', color: 'var(--primary)' }}>Pricing (Monthly)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <input type="number" name="pricing.monthly_rent" placeholder="Monthly Rent (₹)" value={formData.pricing.monthly_rent} onChange={handleChange} style={inputStyle} required />
              <input type="number" name="pricing.security_deposit" placeholder="Security Deposit (₹)" value={formData.pricing.security_deposit} onChange={handleChange} style={inputStyle} required />
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <h3 style={{ marginBottom: '15px', color: 'var(--primary)' }}>Amenities & Rules</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-muted)' }}>Amenities</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                  {STANDARD_AMENITIES.map(amenity => (
                    <label key={amenity} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                      <input 
                        type="checkbox" 
                        value={amenity}
                        checked={formData.amenities.includes(amenity)}
                        onChange={(e) => handleCheckboxChange(e, 'amenities')}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                      />
                      {amenity}
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-muted)' }}>Rules</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                  {STANDARD_RULES.map(rule => (
                    <label key={rule} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                      <input 
                        type="checkbox" 
                        value={rule}
                        checked={formData.rules.includes(rule)}
                        onChange={(e) => handleCheckboxChange(e, 'rules')}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                      />
                      {rule}
                    </label>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ color: 'var(--text-muted)' }}>Upload New Images & Videos</label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*" 
                  onChange={(e) => {
                    if (e.target.files) {
                      setFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
                    }
                  }} 
                  style={inputStyle} 
                />
                
                {(existingMedia.length > 0 || files.length > 0) && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {/* Existing Media Previews */}
                    {existingMedia.map((url, index) => (
                      <div key={`existing-${index}`} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
                        <img 
                          src={url} 
                          alt={`Existing ${index}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                        <button 
                          type="button" 
                          onClick={() => removeExistingMedia(index)}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', padding: 0 }}
                          title="Remove existing image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {/* New Files Previews */}
                    {files.map((file, index) => (
                      <div key={`new-${index}`} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`New preview ${index}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                        <button 
                          type="button" 
                          onClick={() => removeFile(index)}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', padding: 0 }}
                          title="Remove new image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>Or add image URLs manually below (comma separated):</span>
                <input type="text" name="media" placeholder="Image URLs (comma separated)" value={formData.media} onChange={handleChange} style={inputStyle} />
                <label style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Virtual Tour / YouTube Video URL (Optional)</label>
                <input type="url" name="video_url" placeholder="https://youtube.com/watch?v=..." value={formData.video_url} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ padding: '16px', borderRadius: '8px', background: 'linear-gradient(45deg, var(--primary), var(--secondary))', color: 'white', border: 'none', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px', fontSize: '18px' }}>
            {loading ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </main>
  );
}

const inputStyle = {
  padding: '14px', 
  borderRadius: '8px', 
  background: 'var(--surface)', 
  border: '1px solid var(--surface-border)', 
  color: 'var(--foreground)',
  fontSize: '16px'
};
