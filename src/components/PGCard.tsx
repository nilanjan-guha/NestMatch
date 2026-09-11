'use client';
import { useState } from 'react';
import MediaCarousel from './MediaCarousel';
import { toast } from 'react-hot-toast';
import ReviewsSection from './ReviewsSection';
import PGDetailsModal from './PGDetailsModal';

export default function PGCard({ 
  pg, 
  isOwnerView = false, 
  currentUserRole = null, 
  initialSaved = false,
  onMouseEnter,
  onMouseLeave
}: { 
  pg: any, 
  isOwnerView?: boolean, 
  currentUserRole?: string | null, 
  initialSaved?: boolean,
  onMouseEnter?: () => void,
  onMouseLeave?: () => void
}) {
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
