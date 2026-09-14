'use client';
import { useState, useEffect } from 'react';
import ReviewsSection from '@/components/ReviewsSection';
import MediaCarousel from '@/components/MediaCarousel';
import WhatsNearby from '@/components/WhatsNearby';
import BookingModal from '@/components/BookingModal';
import UrgencyBadge from '@/components/UrgencyBadge';
import LifestyleQuizModal from '@/components/LifestyleQuizModal';
import toast from 'react-hot-toast';

export default function PGDetailsClient({ pg }: { pg: any }) {
  const [saving, setSaving] = useState(false);
  const [booking, setBooking] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  
  const [userStatus, setUserStatus] = useState<any>(null);
  const [compatibility, setCompatibility] = useState<{score: number, reason: string} | null>(null);
  const [loadingCompat, setLoadingCompat] = useState(false);
  const isSaved = false; // Add real logic if needed

  useEffect(() => {
    fetchUserStatus();
  }, []);

  const fetchUserStatus = async () => {
    try {
      const res = await fetch('/api/user/status');
      const data = await res.json();
      if (data.success) {
        setUserStatus(data);
        if (data.lifestyle) {
          fetchCompatibility(data.lifestyle);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCompatibility = async (lifestyle: any) => {
    setLoadingCompat(true);
    try {
      const res = await fetch('/api/ai/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lifestyle,
          pgName: pg.name,
          pgDescription: pg.description,
          pgAmenities: pg.amenities,
          pgRules: pg.rules,
          pgGender: pg.gender_type
        })
      });
      const data = await res.json();
      if (data.score !== undefined) {
        setCompatibility(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCompat(false);
    }
  };

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

      {/* Virtual Tour / Video Embed */}
      {pg.video_url && (
        <div style={{ padding: '0 30px', marginTop: '30px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '15px', color: 'var(--primary)' }}>🎥 Virtual Tour</h3>
          <div style={{ width: '100%', height: '400px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
            {pg.video_url.includes('youtube.com') || pg.video_url.includes('youtu.be') ? (
              <iframe 
                width="100%" 
                height="100%" 
                src={pg.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                title="Virtual Tour" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            ) : (
              <video 
                width="100%" 
                height="100%" 
                controls 
                style={{ objectFit: 'cover' }}
              >
                <source src={pg.video_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </div>
      )}

      {/* Content Details */}
      <div style={{ padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ marginBottom: '10px' }}>
              <UrgencyBadge propertyId={pg._id || pg.id} />
            </div>
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

        {/* Compatibility Matcher */}
        <div style={{ marginBottom: '30px', padding: '20px', background: 'linear-gradient(145deg, rgba(162, 53, 255, 0.1), rgba(255, 107, 107, 0.05))', border: '1px solid rgba(162, 53, 255, 0.2)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h3 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🤝 AI Roommate & Lifestyle Match
              </h3>
              {userStatus && !userStatus.lifestyle ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '600px' }}>Take a quick 4-question quiz to let our AI compare your lifestyle against the property rules and other tenants.</p>
              ) : compatibility ? (
                <div style={{ maxWidth: '600px' }}>
                  <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{compatibility.reason}</p>
                </div>
              ) : loadingCompat ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Analyzing compatibility based on your profile...</p>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Login to unlock AI lifestyle matching.</p>
              )}
            </div>
            
            {userStatus && !userStatus.lifestyle ? (
              <button 
                onClick={() => setShowQuizModal(true)}
                style={{ padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                ✨ Take Quiz
              </button>
            ) : compatibility ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: `4px solid ${compatibility.score > 75 ? '#4ade80' : compatibility.score > 50 ? '#fbbf24' : '#ef4444'}`, color: 'var(--foreground)', fontSize: '24px', fontWeight: 'bold' }}>
                {compatibility.score}%
              </div>
            ) : null}
          </div>
        </div>

        {showQuizModal && (
          <LifestyleQuizModal 
            onClose={() => setShowQuizModal(false)} 
            onSuccess={fetchUserStatus}
            existingData={userStatus?.lifestyle}
          />
        )}

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

        {/* What's Nearby (Google Places & Distance Matrix API) */}
        {pg.address?.coordinates && pg.address.coordinates.length === 2 && (
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '15px', color: 'var(--primary)' }}>🗺️ What's Nearby</h3>
            <WhatsNearby coordinates={pg.address.coordinates} />
          </div>
        )}

        {/* Reviews */}
        {/* <ReviewsSection propertyId={pg._id || pg.id} /> */}

        <div style={{ display: 'flex', gap: '15px', marginTop: '40px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleSave} disabled={saving} style={{ flex: '1 1 200px', padding: '16px', background: isSaved ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface)', border: `1px solid ${isSaved ? 'rgba(239, 68, 68, 0.3)' : 'var(--surface-border)'}`, color: isSaved ? '#ef4444' : 'var(--foreground)', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', minWidth: '200px' }}>
            {saving ? '...' : (isSaved ? '💔 Remove from Watchlist' : '❤️ Save for Later')}
          </button>
          
          <div style={{ flex: '2 1 300px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input 
              type="date" 
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={{ flex: '1 1 150px', padding: '16px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '16px', colorScheme: 'dark', minWidth: '150px' }}
            />
            <button onClick={handleBook} disabled={booking} style={{ flex: '1 1 150px', padding: '16px', background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--surface-border)', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', minWidth: '150px' }}>
              {booking ? 'Scheduling...' : '📅 Schedule Visit'}
            </button>
            <button onClick={() => setShowBookingModal(true)} style={{ flex: '2 1 200px', padding: '16px', background: 'linear-gradient(45deg, var(--primary), var(--secondary))', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', minWidth: '200px', boxShadow: '0 4px 15px rgba(162,53,255,0.3)' }}>
              ⚡ Pay Token to Reserve
            </button>
          </div>
        </div>
      </div>

      {showBookingModal && (
        <BookingModal 
          pgName={pg.name}
          monthlyRent={pg.pricing?.monthly_rent || 0}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  );
}
