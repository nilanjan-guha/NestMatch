'use client';
import { useState, useEffect, useRef } from 'react';
import AiSearchBar from '@/components/AiSearchBar';
import PGCard from '@/components/PGCard';
import FooterModals from '@/components/FooterModals';
import { useUser } from '@clerk/nextjs';

type ModalType = 'about' | 'howItWorks' | 'listProperty' | 'contact' | 'privacy' | 'terms' | null;

const POPULAR_SEARCHES = [
  { emoji: '👦', title: 'Boys PG in Gurgaon', subtitle: 'Affordable & near offices', query: 'Boys PG in Gurgaon' },
  { emoji: '👧', title: 'Girls PG near Metro', subtitle: 'Safe & well-connected', query: 'Safe Girls PG near Metro station' },
  { emoji: '👫', title: 'Couples Friendly PG', subtitle: 'Privacy & freedom', query: 'Couples friendly PG with privacy' },
  { emoji: '🍽️', title: 'PG with Food & Laundry', subtitle: 'Hassle-free living', query: 'PG with food and laundry service included' },
  { emoji: '💸', title: 'Budget PG under ₹5K', subtitle: 'Light on your pocket', query: 'Cheap PG under 5000 rupees' },
  { emoji: '🏢', title: 'PG near Cyber Hub', subtitle: 'Walk to work', query: 'PG near Cyber Hub Gurgaon' },
  { emoji: '🌐', title: 'PG with WiFi & AC', subtitle: 'Modern essentials', query: 'PG with WiFi and AC facilities' },
  { emoji: '🏋️', title: 'PG with Gym', subtitle: 'Stay fit, stay sharp', query: 'PG with gym and fitness facilities' },
];

export default function Home() {
  const { user } = useUser();
  const [pgs, setPgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<string>('');
  const [userCoords, setUserCoords] = useState<[number, number] | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('recommended');
  const [hasSearched, setHasSearched] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Compute sorted PGs
  const getSortedPgs = () => {
    let sorted = [...pgs];
    if (sortBy === 'distance') {
      sorted.sort((a, b) => {
        const distA = a.distance ?? 999999;
        const distB = b.distance ?? 999999;
        return distA - distB;
      });
    } else if (sortBy === 'price_low_high') {
      sorted.sort((a, b) => {
        const priceA = (a.pricing?.monthly_rent && a.pricing.monthly_rent > 0) ? a.pricing.monthly_rent : 999999;
        const priceB = (b.pricing?.monthly_rent && b.pricing.monthly_rent > 0) ? b.pricing.monthly_rent : 999999;
        return priceA - priceB;
      });
    }
    return sorted;
  };

  const sortedPgs = getSortedPgs();

  // Fetch Session from Clerk user object
  useEffect(() => {
    if (user) {
      const role = user.publicMetadata?.role as string;
      setUserRole(role || 'USER');
      const location = user.publicMetadata?.location as string;
      const coordinates = user.publicMetadata?.coordinates as [number, number];
      
      if (location) setUserLocation(location);
      if (coordinates) setUserCoords(coordinates);

      // Fetch saved property IDs
      fetch('/api/user/saved')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSavedPropertyIds(data.properties.map((p: any) => p._id || p.id));
          }
        })
        .catch(console.error);
    }
  }, [user]);

  // Fetch initial PGs
  useEffect(() => {
    fetch('/api/properties')
      .then(res => res.json())
      .then(data => {
        setPgs(data.data || []);
        setHasMore((data.data || []).length === 10);
        setLoading(false);
      });
  }, []);

  const handleSearch = async (query: string, coordinates?: [number, number]) => {
    setLoading(true);
    setCurrentQuery(query);
    setHasSearched(true);
    if (coordinates) setUserCoords(coordinates);
    setPage(1);
    
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, coordinates: coordinates || userCoords, page: 1, limit: 10 })
      });
      const data = await res.json();
      setPgs(data.data || []);
      setHasMore((data.data || []).length === 10);
      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentQuery, coordinates: userCoords, page: nextPage, limit: 10 })
      });
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        setPgs(prev => [...prev, ...data.data]);
        setHasMore(data.data.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePopularSearch = (query: string) => {
    handleSearch(`Requirements: ${query}`, userCoords);
  };

  return (
    <main>
      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">
          Find Your Perfect PG with <span style={{ background: 'linear-gradient(45deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NestMatch</span>
        </h1>
        <p className="hero-subtitle">
          Just tell us what you&apos;re looking for, and we will instantly find the best home for you.
        </p>
        
        <AiSearchBar onSearch={handleSearch} defaultLocation={userLocation} />
      </section>

      {/* Results Section */}
      <section className="container" id="results-section" ref={resultsRef} style={{ paddingBottom: '60px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px', animation: 'fadeInUp 0.5s ease' }}>🔍</div>
            <p style={{ fontSize: '16px' }}>Searching the database...</p>
          </div>
        ) : pgs.length > 0 ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ fontSize: '20px' }}>
                Showing {pgs.length} Properties
                {hasMore && <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 'normal' }}> • More available</span>}
              </h2>
              <div style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '4px',
                border: '1px solid rgba(255,255,255,0.1)',
                overflowX: 'auto',
                whiteSpace: 'nowrap'
              }}>
                {[
                  { id: 'recommended', label: '✨ AI Recommended' },
                  { id: 'distance', label: '📍 Nearest' },
                  { id: 'price_low_high', label: '💰 Lowest Price' }
                ].map(option => (
                  <button
                    key={option.id}
                    onClick={() => setSortBy(option.id)}
                    style={{
                      background: sortBy === option.id ? 'linear-gradient(45deg, var(--primary), var(--secondary))' : 'transparent',
                      color: sortBy === option.id ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: sortBy === option.id ? 'bold' : 'normal',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: sortBy === option.id ? '0 4px 15px rgba(0,0,0,0.2)' : 'none'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid-auto-fit">
              {sortedPgs.map((pg: any, idx: number) => (
                <PGCard 
                  key={`${pg._id || 'pg'}-${idx}`} 
                  pg={pg} 
                  currentUserRole={userRole} 
                  initialSaved={savedPropertyIds.includes(pg._id || pg.id)}
                />
              ))}
            </div>
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <button 
                  onClick={loadMore} 
                  disabled={loadingMore}
                  className="load-more-btn"
                >
                  {loadingMore ? (
                    <>⏳ Loading more...</>
                  ) : (
                    <>Showing {pgs.length} results • Load More ↓</>
                  )}
                </button>
              </div>
            )}
          </>
        ) : hasSearched ? (
          <div className="empty-state">
            <span className="empty-icon">🏠</span>
            <h3>No PGs found for this search</h3>
            <p>Try a different location or broader requirements</p>
            <div className="suggestion-chips" style={{ justifyContent: 'center' }}>
              {['Boys PG in Gurgaon', 'Girls PG with AC', 'Budget PG under ₹5000'].map((sug, i) => (
                <button key={i} className="suggestion-chip" onClick={() => handlePopularSearch(sug)}>
                  🔍 {sug}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* ========== CONTENT SECTIONS (shown when not loading) ========== */}
      {!loading && (
        <>
          {/* How It Works */}
          <section className="how-it-works fade-in-section">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Finding your ideal PG is as easy as 1-2-3</p>
            <div className="steps-grid">
              <div className="step-card">
                <span className="step-icon">📍</span>
                <span className="step-number">1</span>
                <h3>Set Your Location</h3>
                <p>Enter your preferred area, city, or use GPS to auto-detect your location</p>
              </div>
              <div className="step-card">
                <span className="step-icon">🔍</span>
                <span className="step-number">2</span>
                <h3>Describe Your Ideal PG</h3>
                <p>Tell us your budget, amenities, gender preference — our AI understands natural language</p>
              </div>
              <div className="step-card">
                <span className="step-icon">🏠</span>
                <span className="step-number">3</span>
                <h3>Get Matched Instantly</h3>
                <p>Our AI scans hundreds of PGs and Google Maps to find the best matches for you</p>
              </div>
            </div>
          </section>

          {/* Popular Searches */}
          <section className="popular-searches fade-in-section">
            <h2 className="section-title">Popular Searches</h2>
            <p className="section-subtitle">Quick searches that people love</p>
            <div className="popular-grid">
              {POPULAR_SEARCHES.map((item, i) => (
                <div key={i} className="popular-card" onClick={() => handlePopularSearch(item.query)}>
                  <span className="popular-icon">{item.emoji}</span>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Stats Bar */}
          <section className="stats-bar fade-in-section">
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">PGs Listed</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">10,000+</span>
              <span className="stat-label">Happy Tenants</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">Cities Covered</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">4.8★</span>
              <span className="stat-label">Avg. Rating</span>
            </div>
          </section>

          {/* Why NestMatch */}
          <section className="why-nestmatch fade-in-section">
            <h2 className="section-title">Why NestMatch?</h2>
            <p className="section-subtitle">We&apos;re not just a listing site — we&apos;re your AI-powered home finder</p>
            <div className="features-grid">
              <div className="feature-card">
                <span className="feature-icon">🤖</span>
                <h4>AI-Powered Matching</h4>
                <p>Our Gemini AI understands what you need and finds the perfect match</p>
              </div>
              <div className="feature-card">
                <span className="feature-icon">🛡️</span>
                <h4>Verified & Safe</h4>
                <p>Every property is verified with real photos, reviews, and safety scores</p>
              </div>
              <div className="feature-card">
                <span className="feature-icon">📍</span>
                <h4>Google Maps Verified</h4>
                <p>Real-time data from Google Maps for accurate location and distance</p>
              </div>
              <div className="feature-card">
                <span className="feature-icon">💬</span>
                <h4>Real Reviews</h4>
                <p>Honest reviews from real tenants so you know what to expect</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="footer-section">
            <div className="footer-brand">NestMatch</div>
            <p className="footer-tagline">Find your perfect PG, powered by AI</p>
            <div className="footer-links">
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveModal('about'); }}>About Us</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveModal('howItWorks'); }}>How It Works</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveModal('listProperty'); }}>List Your Property</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveModal('contact'); }}>Contact</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveModal('privacy'); }}>Privacy Policy</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveModal('terms'); }}>Terms of Service</a>
            </div>
            <p className="footer-bottom">© {new Date().getFullYear()} NestMatch. All rights reserved. Made with ❤️ in India.</p>
          </footer>

          {/* Footer Modals */}
          <FooterModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
        </>
      )}
    </main>
  );
}
