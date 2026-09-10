'use client';
import { useState } from 'react';
import MediaCarousel from './MediaCarousel';
import { toast } from 'react-hot-toast';

export default function PGCard({ pg, isOwnerView = false, currentUserRole = null }: { pg: any, isOwnerView?: boolean, currentUserRole?: string | null }) {
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [booking, setBooking] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent modal opening
    setSaving(true);
    try {
      const res = await fetch('/api/user/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: pg._id })
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
        onClick={() => setShowModal(true)}
      >
        <div style={{ position: 'relative' }}>
          <MediaCarousel media={pg.media || []} height="200px" objectFit="cover" />
          
          {!isOwnerView && (
            <button 
              onClick={handleSave}
              disabled={saving}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%', color: 'white', cursor: 'pointer', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', fontSize: '20px' }}
            >
              {saving ? '...' : (isSaved ? '❤️' : '🤍')}
            </button>
          )}
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
              <p style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--secondary)' }}>₹{pg.pricing.monthly_rent}</p>
            </div>
            {!isOwnerView ? (
              <button onClick={handleBook} disabled={booking} style={{ background: 'linear-gradient(45deg, var(--primary), var(--secondary))', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                {booking ? '...' : 'Book Visit'}
              </button>
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
              <MediaCarousel media={pg.media || []} height="400px" objectFit="cover" />
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
                  <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--secondary)' }}>₹{pg.pricing.monthly_rent}</p>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Deposit: ₹{pg.pricing.security_deposit}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                <span style={{ background: 'var(--surface)', padding: '8px 16px', borderRadius: '20px' }}>{pg.gender_type}</span>
                <span style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: '20px' }}>★ {pg.rating}</span>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '10px', color: 'var(--primary)' }}>Description</h3>
                <p style={{ lineHeight: '1.6', color: 'var(--text-muted)' }}>{pg.description}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '20px', marginBottom: '15px', color: 'var(--primary)' }}>Accommodation Details</h3>
                  <div style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                    <div style={{ marginBottom: '8px' }}><strong>Total Beds:</strong> {pg.capacity?.total_beds || 'N/A'}</div>
                    <div style={{ marginBottom: '8px' }}><strong>Available Beds:</strong> <span style={{ color: '#4ade80' }}>{pg.capacity?.available_beds || 'N/A'}</span></div>
                    <div><strong>Room Details:</strong> {pg.capacity?.room_details || 'N/A'}</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '20px', marginBottom: '15px', color: 'var(--primary)' }}>Owner Details</h3>
                  <div style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                    <div style={{ marginBottom: '8px' }}><strong>Name:</strong> {pg.owner_id?.name || 'Unknown'}</div>
                    {pg.owner_id?.email && <div style={{ marginBottom: '8px' }}><strong>Email:</strong> <a href={`mailto:${pg.owner_id.email}`} style={{ color: 'var(--secondary)', textDecoration: 'none' }}>{pg.owner_id.email}</a></div>}
                    {pg.owner_id?.phone && <div><strong>Phone:</strong> {pg.owner_id.phone}</div>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', marginBottom: '15px', color: 'var(--primary)' }}>Amenities</h3>
                  <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {pg.amenities?.map((amenity: string, idx: number) => (
                      <li key={idx} style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>✓ {amenity}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', marginBottom: '15px', color: 'var(--primary)' }}>House Rules</h3>
                  <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {pg.rules?.map((rule: string, idx: number) => (
                      <li key={idx} style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>• {rule}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {!isOwnerView && (
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
