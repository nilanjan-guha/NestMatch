'use client';
import { useState } from 'react';
import MediaCarousel from './MediaCarousel';
import { toast } from 'react-hot-toast';
import ReviewsSection from './ReviewsSection';

export default function PGCard({ pg, isOwnerView = false, currentUserRole = null, initialSaved = false }: { pg: any, isOwnerView?: boolean, currentUserRole?: string | null, initialSaved?: boolean }) {
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [booking, setBooking] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const isFromAPI = pg.amenities?.includes('Google Maps Verified');

  // Smart media resolver: empty arrays are truthy in JS, so check .length
  const getMedia = (): string[] => {
    if (pg.media && pg.media.length > 0) return pg.media;
    if (pg.images && pg.images.length > 0) return pg.images;
    // Fallback placeholder
    return ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop'];
  };
  const pgMedia = getMedia();

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent modal opening
    setSaving(true);
    try {
      const res = await fetch('/api/user/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: pg._id || pg.id, property_data: pg })
      });
      const data = await res.json();
      if (data.success) {
        setIsSaved(data.saved);
        toast.success(data.saved ? 'Added to Watchlist ❤️' : 'Removed from Watchlist 💔');
      } else {
        toast.error(data.error || 'Failed to save property');
      }
    } catch (e) {
      console.error(e);
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleBook = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent modal opening
    setBooking(true);
    const loadingToast = toast.loading('Registering interest...');
    try {
      const res = await fetch('/api/user/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: pg._id })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Interest registered! The owner has been notified. 📅', { id: loadingToast });
      } else {
        toast.error(data.error || 'Failed to register interest', { id: loadingToast });
      }
    } catch (e) {
      console.error(e);
      toast.error('An error occurred', { id: loadingToast });
    } finally {
      setBooking(false);
    }
  };

  return (
    <>
      <div 
        className="glass-panel glow-effect" 
        style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', cursor: 'pointer' }}
        onClick={() => {
          console.log('--- OPENING PG CARD DETAILS ---');
          console.log(pg);
          setShowModal(true);
        }}
      >
        <div style={{ position: 'relative' }}>
          <MediaCarousel media={pgMedia} height="200px" objectFit="cover" />
          <button 
            onClick={handleSave}
            disabled={saving}
            style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%', color: 'white', cursor: 'pointer', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', fontSize: '20px' }}
          >
            {saving ? '...' : (isSaved ? '❤️' : '🤍')}
          </button>
        </div>
        
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>{pg.name}</h3>
              {pg.distance !== undefined && (
                <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>
                  📍 {(pg.distance / 1000).toFixed(1)} km away
                </span>
              )}
            </div>
            <span style={{ background: 'var(--primary)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
              ★ {pg.rating}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '14px' }}>
            {pg.address.city}, {pg.address.state} • {pg.gender_type}
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {pg.amenities?.slice(0, 3).map((amenity: string, idx: number) => (
              <span key={idx} style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', padding: '4px 10px', borderRadius: '8px', fontSize: '12px' }}>
                {amenity}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monthly Rent</p>
              <p style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--secondary)' }}>
                {pg.pricing.monthly_rent ? `₹${pg.pricing.monthly_rent}` : 'Contact Owner'}
              </p>
            </div>
            {!isOwnerView ? (
              !isFromAPI && (
                <button onClick={handleBook} disabled={booking} style={{ background: 'linear-gradient(45deg, var(--primary), var(--secondary))', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                  {booking ? '...' : 'Book Visit'}
                </button>
              )
            ) : (
              <button style={{ background: 'var(--foreground)', color: 'var(--background)', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                Edit Details
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Property Details Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'var(--background-transparent)', backdropFilter: 'blur(5px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000, padding: '20px'
        }} onClick={() => setShowModal(false)}>
          
          <div 
            className="glass-panel" 
            style={{ 
              width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', 
              position: 'relative', padding: '0', background: 'var(--background)' 
            }}
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--foreground)', borderRadius: '50%', width: '36px', height: '36px', fontSize: '20px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              &times;
            </button>

            {/* Media Scroller */}
            <div style={{ borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
              <MediaCarousel media={pgMedia} height="400px" objectFit="cover" />
            </div>

            {/* Content Details */}
            <div style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>{pg.name}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>{pg.address.street}, {pg.address.city}, {pg.address.state} - {pg.address.zip_code}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Monthly Rent</p>
                  <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--secondary)' }}>
                    {pg.pricing.monthly_rent ? `₹${pg.pricing.monthly_rent}` : 'Contact for Price'}
                  </p>
                  {pg.pricing.security_deposit > 0 && (
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Deposit: ₹{pg.pricing.security_deposit}</p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <span style={{ background: 'var(--surface)', padding: '8px 16px', borderRadius: '20px', fontSize: '13px' }}>{pg.gender_type}</span>
                <span style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '13px' }}>★ {pg.rating} ({pg.userRatingCount || pg.rating_count || 0} reviews)</span>
                {pg.businessStatus && pg.businessStatus !== 'UNKNOWN' && (
                  <span style={{ background: pg.businessStatus === 'OPERATIONAL' ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)', color: pg.businessStatus === 'OPERATIONAL' ? '#4ade80' : '#ef4444', padding: '8px 16px', borderRadius: '20px', fontSize: '13px' }}>
                    {pg.businessStatus === 'OPERATIONAL' ? '✅ Open' : '🔴 ' + pg.businessStatus}
                  </span>
                )}
                {pg.distance !== undefined && (
                  <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '8px 16px', borderRadius: '20px', fontSize: '13px' }}>📍 {(pg.distance / 1000).toFixed(1)} km away</span>
                )}
                {pg.priceLevel && (
                  <span style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '8px 16px', borderRadius: '20px', fontSize: '13px' }}>
                    {'💰'.repeat(pg.priceLevel === 'PRICE_LEVEL_INEXPENSIVE' ? 1 : pg.priceLevel === 'PRICE_LEVEL_MODERATE' ? 2 : pg.priceLevel === 'PRICE_LEVEL_EXPENSIVE' ? 3 : 1)}
                  </span>
                )}
              </div>

              {/* Quick Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
                <a 
                  href={pg.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${pg.location?.coordinates?.[1]},${pg.location?.coordinates?.[0]}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(66,133,244,0.1)', border: '1px solid rgba(66,133,244,0.3)', color: '#4285f4', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}
                >
                  📍 View on Google Maps
                </a>
                {pg.owner_id?.phone && (
                  <a href={`tel:${pg.owner_id.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>
                    📞 Call {pg.owner_id.phone}
                  </a>
                )}
                {pg.websiteUri && (
                  <a href={pg.websiteUri} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>
                    🌐 Visit Website
                  </a>
                )}
              </div>

              {/* Description */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '10px', color: 'var(--primary)' }}>About This Property</h3>
                <p style={{ lineHeight: '1.7', color: 'var(--text-muted)', fontSize: '15px' }}>{pg.description}</p>
              </div>

              {/* Opening Hours */}
              {pg.openingHours && (
                <div style={{ marginBottom: '30px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '12px', color: 'var(--primary)' }}>🕐 Opening Hours</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                    {pg.openingHours.split(' | ').map((day: string, idx: number) => (
                      <span key={idx} style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{day}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              {pg.reviews && pg.reviews.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ fontSize: '20px', marginBottom: '15px', color: 'var(--primary)' }}>💬 What People Say</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {pg.reviews.map((review: any, idx: number) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '5px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{review.authorAttribution?.displayName || 'Google User'}</span>
                          <span style={{ color: 'var(--secondary)', fontSize: '14px' }}>{Array(Math.floor(review.rating || 5)).fill('★').join('')}{Array(5 - Math.floor(review.rating || 5)).fill('☆').join('')}</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>&quot;{review.text?.text || review.originalText?.text}&quot;</p>
                        <p style={{ color: '#555', fontSize: '12px', marginTop: '8px' }}>{review.relativePublishTimeDescription}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Grid */}
              <div className="grid-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '15px', color: 'var(--primary)' }}>🏠 Accommodation</h3>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '2' }}>
                    <div><strong>Total Beds:</strong> {pg.capacity?.total_beds || 'N/A'}</div>
                    <div><strong>Available Beds:</strong> <span style={{ color: '#4ade80' }}>{pg.capacity?.available_beds || 'N/A'}</span></div>
                    <div><strong>Room Type:</strong> {pg.capacity?.room_details || 'N/A'}</div>
                    {pg.pricing?.security_deposit > 0 && <div><strong>Security Deposit:</strong> ₹{pg.pricing.security_deposit}</div>}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '15px', color: 'var(--primary)' }}>📋 Contact Info</h3>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '2' }}>
                    <div><strong>Name:</strong> {pg.owner_id?.name || 'Unknown'}</div>
                    {pg.owner_id?.email && <div><strong>Email:</strong> <a href={`mailto:${pg.owner_id.email}`} style={{ color: 'var(--secondary)', textDecoration: 'none' }}>{pg.owner_id.email}</a></div>}
                    {pg.owner_id?.phone && <div><strong>Phone:</strong> <a href={`tel:${pg.owner_id.phone}`} style={{ color: 'var(--secondary)', textDecoration: 'none' }}>{pg.owner_id.phone}</a></div>}
                    {!pg.owner_id?.phone && !pg.owner_id?.email && <div><em>Contact via app</em></div>}
                  </div>
                </div>
              </div>

              <div className="grid-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', marginBottom: '15px', color: 'var(--primary)' }}>✅ Amenities</h3>
                  <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {pg.amenities?.map((amenity: string, idx: number) => (
                      <li key={idx} style={{ marginBottom: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>✓ {amenity}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', marginBottom: '15px', color: 'var(--primary)' }}>📜 House Rules / Hours</h3>
                  <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {pg.rules?.map((rule: string, idx: number) => (
                      <li key={idx} style={{ marginBottom: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>• {rule}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Our Custom Reviews Section */}
              <ReviewsSection propertyId={pg._id || pg.id} />

              {!isOwnerView && !isFromAPI && (
                <div style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
                  <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '16px', background: isSaved ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface)', border: `1px solid ${isSaved ? 'rgba(239, 68, 68, 0.3)' : 'var(--surface-border)'}`, color: isSaved ? '#ef4444' : 'var(--foreground)', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {saving ? '...' : (isSaved ? '❤️ Saved to Watchlist' : '🤍 Save for Later')}
                  </button>
                  <button onClick={handleBook} disabled={booking} style={{ flex: 2, padding: '16px', background: 'linear-gradient(45deg, var(--primary), var(--secondary))', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {booking ? 'Registering...' : 'Book Visit'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
