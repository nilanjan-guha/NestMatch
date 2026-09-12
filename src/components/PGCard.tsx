'use client';
import { useState, useEffect } from 'react';
import MediaCarousel from './MediaCarousel';
import { toast } from 'react-hot-toast';
import ReviewsSection from './ReviewsSection';
import PGDetailsModal from './PGDetailsModal';
import confetti from 'canvas-confetti';

export default function PGCard({ 
  pg, 
  isOwnerView = false, 
  currentUserRole = null, 
  initialSaved = false,
  onMouseEnter,
  onMouseLeave,
  isCompared = false,
  onCompareToggle
}: { 
  pg: any, 
  isOwnerView?: boolean, 
  currentUserRole?: string | null, 
  initialSaved?: boolean,
  onMouseEnter?: () => void,
  onMouseLeave?: () => void,
  isCompared?: boolean,
  onCompareToggle?: (pg: any) => void
}) {
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [localSavesCount, setLocalSavesCount] = useState(pg.savesCount || 0);
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
        setLocalSavesCount((prev: number) => data.saved ? prev + 1 : prev - 1);
        toast.success(data.saved ? 'Added to Watchlist ❤️' : 'Removed from Watchlist 💔');
        if (data.saved) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
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
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={() => {
          console.log('--- OPENING PG CARD DETAILS ---');
          console.log(pg);
          setShowModal(true);
        }}
      >
        <div style={{ position: 'relative' }}>
          <MediaCarousel media={pgMedia} height="200px" objectFit="cover" disableFullScreen={true} />
          
          {onCompareToggle && (
            <div 
              style={{ position: 'absolute', top: '15px', left: '15px', background: isCompared ? 'var(--primary)' : 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: isCompared ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)', transition: 'transform 0.2s ease, opacity 0.2s ease, background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              onClick={(e) => {
                e.stopPropagation();
                onCompareToggle(pg);
              }}
            >
              <input type="checkbox" checked={isCompared} onChange={() => {}} style={{ cursor: 'pointer', accentColor: 'white' }} />
              Compare
            </div>
          )}

          {/* Real saves count instead of fake active viewers */}
          {localSavesCount > 0 && (
            <div style={{ position: 'absolute', bottom: '15px', left: '15px', background: 'rgba(255, 61, 144, 0.95)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)' }}>
              ❤️ {localSavesCount} {localSavesCount === 1 ? 'person saved this' : 'people saved this'}
            </div>
          )}

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
            {pg.address.city}, {pg.address.state}
            {(() => {
              const g = pg.gender_type;
              if (!g || g.includes('placeholder') || g.toLowerCase() === 'unspecified') return null;
              const lower = g.toLowerCase();
              let displayGender = null;
              if (lower.includes('female') || lower.includes('girl') || lower.includes('women')) displayGender = 'Female';
              else if (lower.includes('unisex') || lower.includes('coliv') || lower.includes('co-liv') || lower.includes('couple') || lower.includes('any')) displayGender = 'Unisex';
              else if (lower.includes('male') || lower.includes('boy') || lower.includes('men')) displayGender = 'Male';
              return displayGender ? ` • ${displayGender}` : null;
            })()}
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
        <PGDetailsModal 
          pg={pg}
          onClose={() => setShowModal(false)}
          pgMedia={pgMedia}
          isOwnerView={isOwnerView}
          isFromAPI={isFromAPI}
          isSaved={isSaved}
          saving={saving}
          booking={booking}
          onSave={handleSave}
          onBook={handleBook}
        />
      )}
    </>
  );
}
