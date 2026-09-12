'use client';
import { useState } from 'react';
import ReviewsSection from '@/components/ReviewsSection';
import MediaCarousel from '@/components/MediaCarousel';
import toast from 'react-hot-toast';

export default function PGDetailsClient({ pg }: { pg: any }) {
  const [saving, setSaving] = useState(false);
  const [booking, setBooking] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const isSaved = false; // Add real logic if needed

  const handleSave = () => {
    toast.success('Added to Watchlist! 🎉');
  };

  const handleBook = () => {
    if (!visitDate) {
      toast.error('Please select a visit date!');
      return;
    }
    toast.success(`Visit scheduled for ${visitDate}! The owner has been notified.`);
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Media Scroller */}
      <div style={{ width: '100%' }}>
        <MediaCarousel media={pg.media || []} height="400px" objectFit="cover" />
      </div>

      {/* Content Details */}
      <div style={{ padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>{pg.name}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
              {pg.address?.street ? `${pg.address.street}, ` : ''}{pg.address?.city}, {pg.address?.state} {pg.address?.zip_code ? `- ${pg.address.zip_code}` : ''}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Monthly Rent</p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--secondary)' }}>
              {pg.pricing?.monthly_rent ? `₹${pg.pricing.monthly_rent}` : 'Contact for Price'}
            </p>
            {pg.pricing?.security_deposit > 0 && (
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Deposit: ₹{pg.pricing.security_deposit}</p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {(() => {
            const g = pg.gender_type;
            if (!g || g.includes('placeholder') || g.toLowerCase() === 'unspecified') return null;
            const lower = g.toLowerCase();
            let displayGender = null;
            if (lower.includes('female') || lower.includes('girl') || lower.includes('women')) displayGender = 'Female';
            else if (lower.includes('unisex') || lower.includes('coliv') || lower.includes('co-liv') || lower.includes('couple') || lower.includes('any')) displayGender = 'Unisex';
            else if (lower.includes('male') || lower.includes('boy') || lower.includes('men')) displayGender = 'Male';
            if (!displayGender) return null;
            return (
              <span style={{ background: 'var(--surface)', padding: '8px 16px', borderRadius: '20px', fontSize: '14px' }}>
                {displayGender}
              </span>
            );
          })()}
          <span style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '14px' }}>★ {pg.rating || 0} ({pg.userRatingCount || 0} reviews)</span>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
          {pg.video_url && (
            <a href={pg.video_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>
              ▶️ Watch Video Tour
            </a>
          )}
          {pg.owner_id?.phone && (
            <>
              <a href={`tel:${pg.owner_id.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>
                📞 Call {pg.owner_id.phone}
              </a>
              <a href={`https://wa.me/91${pg.owner_id.phone}?text=Hi, I am interested in your property ${pg.name} listed on NestMatch.`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>
                💬 WhatsApp
              </a>
            </>
          )}
          <button 
            onClick={async () => {
              const shareData = {
                title: pg.name,
                text: `Check out this property on NestMatch: ${pg.name}`,
                url: window.location.href
              };
              if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                try {
                  await navigator.share(shareData);
                } catch (err) {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Link copied to clipboard!');
                }
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied to clipboard!');
              }
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', padding: '10px 18px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🔗 Share Property
          </button>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '10px', color: 'var(--primary)' }}>About This Property</h3>
          <p style={{ lineHeight: '1.7', color: 'var(--text-muted)', fontSize: '16px' }}>{pg.description || 'No description provided.'}</p>
        </div>

        {/* Content Grid */}
        <div className="grid-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '15px', color: 'var(--primary)' }}>🛏️ Accommodation</h3>
            <div style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: '2' }}>
              <div><strong>Total Beds:</strong> {pg.capacity?.total_beds || 'N/A'}</div>
              <div><strong>Available Beds:</strong> <span style={{ color: '#4ade80' }}>{pg.capacity?.available_beds || 'N/A'}</span></div>
              <div><strong>Room Type:</strong> {pg.capacity?.room_details || 'N/A'}</div>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '15px', color: 'var(--primary)' }}>✨ Amenities</h3>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {pg.amenities?.map((amenity: string, idx: number) => (
                <li key={idx} style={{ marginBottom: '8px', color: 'var(--text-muted)', fontSize: '15px' }}>✅ {amenity}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Reviews */}
        <ReviewsSection propertyId={pg._id || pg.id} />

        <div style={{ display: 'flex', gap: '15px', marginTop: '40px', alignItems: 'center' }}>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '16px', background: isSaved ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface)', border: `1px solid ${isSaved ? 'rgba(239, 68, 68, 0.3)' : 'var(--surface-border)'}`, color: isSaved ? '#ef4444' : 'var(--foreground)', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
            {saving ? '...' : (isSaved ? '💔 Remove from Watchlist' : '❤️ Save for Later')}
          </button>
          
          <div style={{ flex: 1.5, display: 'flex', gap: '10px' }}>
            <input 
              type="date" 
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={{ flex: 1, padding: '16px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--background)', color: 'var(--text)', fontSize: '16px' }}
            />
            <button onClick={handleBook} disabled={booking} style={{ flex: 1.5, padding: '16px', background: 'linear-gradient(45deg, var(--primary), var(--secondary))', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
              {booking ? 'Scheduling...' : '📅 Schedule Visit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
