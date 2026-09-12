'use client';
import { useState, useEffect, useRef } from 'react';
import AiSearchBar from '@/components/AiSearchBar';
import PGCard from '@/components/PGCard';
import FooterModals from '@/components/FooterModals';
import { useUser, useClerk } from '@clerk/nextjs';
import InteractiveMap from '@/components/InteractiveMap';

type ModalType = 'about' | 'howItWorks' | 'listProperty' | 'contact' | 'privacy' | 'terms' | null;

import { POPULAR_SEARCHES } from '@/constants/searchSuggestions';

export default function Home() {
  const { user, isSignedIn, isLoaded } = useUser();
  const clerk = useClerk();
  const [pgs, setPgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<string>('');
  const [userCoords, setUserCoords] = useState<[number, number] | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [displaySearches, setDisplaySearches] = useState<typeof POPULAR_SEARCHES>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [loadingText, setLoadingText] = useState('Searching the database...');
  const [sortBy, setSortBy] = useState<string>('recommended');
  const [hasSearched, setHasSearched] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [hoveredPgId, setHoveredPgId] = useState<string | null>(null);
  const [externalQuery, setExternalQuery] = useState<{ query: string, ts: number } | null>(null);
  
  // Smart Alerts State
  const [alertPhone, setAlertPhone] = useState('');
  const [alertStatus, setAlertStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [alertMessage, setAlertMessage] = useState('');
  
  // Compare State
  const [compareList, setCompareList] = useState<any[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const resultsRef = useRef<HTMLDivElement>(null);

  const handleAlertSubmit = async () => {
    if (!alertPhone || alertPhone.length < 10) {
      setAlertStatus('error');
      setAlertMessage('Please enter a valid phone number');
      return;
    }
    
    setAlertStatus('loading');
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: alertPhone,
          query: currentQuery,
          coordinates: userCoords
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setAlertStatus('success');
        setAlertMessage('Alert saved! We will notify you on WhatsApp.');
        setAlertPhone('');
      } else {
        setAlertStatus('error');
        setAlertMessage(data.error || 'Failed to save alert');
      }
    } catch (err) {
      setAlertStatus('error');
      setAlertMessage('Network error. Please try again.');
    }
  };

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
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      });
    }
    return sorted;
  };

  const sortedPgs = getSortedPgs();

  // Fetch Session from Clerk user object
  useEffect(() => {
    if (user) {
      // Handle user change to reset search state on logout/login with different account
      const lastUserId = sessionStorage.getItem('nestMatchUserId');
      if (lastUserId && lastUserId !== user.id) {
        sessionStorage.removeItem('nestMatchSearchState');
      }
      sessionStorage.setItem('nestMatchUserId', user.id);

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

      // Fetch recent searches
      fetch('/api/user/recent-searches')
        .then(res => res.json())
        .then(data => {
          if (data.recent_searches) {
            setRecentSearches(data.recent_searches);
          }
        })
        .catch(console.error);
    } else if (user === null) {
      // User is logged out
      sessionStorage.removeItem('nestMatchSearchState');
      sessionStorage.removeItem('nestMatchUserId');
    }
  }, [user]);

  // Load state from sessionStorage on mount
  useEffect(() => {
    // If it's a page reload, clear the session storage so we start fresh
    const navEntries = window.performance?.getEntriesByType('navigation');
    const isReload = navEntries?.length && (navEntries[0] as PerformanceNavigationTiming).type === 'reload';
    if (isReload) {
      sessionStorage.removeItem('nestMatchSearchState');
    } else {
      const savedStateStr = sessionStorage.getItem('nestMatchSearchState');
      if (savedStateStr) {
        try {
          const savedState = JSON.parse(savedStateStr);
          if (savedState.hasSearched) {
            setPgs(savedState.pgs || []);
            setHasMore(savedState.hasMore || false);
            setHasSearched(savedState.hasSearched || false);
            setCurrentQuery(savedState.currentQuery || '');
            setSortBy(savedState.sortBy || 'recommended');
            if (savedState.userCoords) setUserCoords(savedState.userCoords);
            setPage(savedState.page || 1);
            setLoading(false);
            
            // Scroll to results if there are any
            setTimeout(() => {
              resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
            return; // Skip initial fetch since we loaded from state
          }
        } catch (e) {
          console.error("Failed to parse saved search state", e);
        }
      }
    }

    // Default initial fetch if no valid saved state
    fetch('/api/properties')
      .then(res => res.json())
      .then(data => {
        setPgs(data.data || []);
        setHasMore((data.data || []).length === 10);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Save state to sessionStorage when it changes
  useEffect(() => {
    if (hasSearched) {
      sessionStorage.setItem('nestMatchSearchState', JSON.stringify({
        pgs,
        hasSearched,
        currentQuery,
        sortBy,
        userCoords,
        hasMore,
        page
      }));
    }
  }, [pgs, hasSearched, currentQuery, sortBy, userCoords, hasMore, page]);

  // Shuffle loading text
  useEffect(() => {
    // Only run on client to prevent hydration mismatch
    setDisplaySearches([...POPULAR_SEARCHES].sort(() => 0.5 - Math.random()).slice(0, 8));
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      const texts = [
        "Analyzing your request...",
        "Scanning Google Places...",
        "Extracting AI Data...",
        "Finding the best matches...",
        "Applying filters...",
        "Almost there..."
      ];
      let i = 0;
      setLoadingText(texts[0]);
      interval = setInterval(() => {
        i = (i + 1) % texts.length;
        setLoadingText(texts[i]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSearch = async (query: string, coordinates?: [number, number]) => {
    // Prevent unauthenticated users from using the AI search
    if (isLoaded && !isSignedIn) {
      clerk.openSignIn();
      return;
    }

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
    if (isLoaded && !isSignedIn) {
      clerk.openSignIn();
      return;
    }
    setExternalQuery({ query, ts: Date.now() });
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
        
        <AiSearchBar onSearch={handleSearch} defaultLocation={userLocation} externalQuery={externalQuery} />

        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(162, 53, 255, 0.1)', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🎉 100% Zero Brokerage
          </div>
          <div style={{ background: 'rgba(255, 61, 144, 0.1)', border: '1px solid var(--secondary)', color: 'var(--secondary)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ✅ Verified PG Listings
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="container" id="results-section" ref={resultsRef} style={{ paddingBottom: '60px', minHeight: '500px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--surface-border)', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '200px', background: 'var(--surface-hover)', animation: 'pulse 1.5s infinite' }}></div>
                <div style={{ padding: '20px' }}>
                  <div style={{ width: '70%', height: '24px', background: 'var(--surface-hover)', borderRadius: '4px', marginBottom: '12px', animation: 'pulse 1.5s infinite' }}></div>
                  <div style={{ width: '40%', height: '16px', background: 'var(--surface-hover)', borderRadius: '4px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }}></div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ width: '80px', height: '24px', background: 'var(--surface-hover)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }}></div>
                    <div style={{ width: '80px', height: '24px', background: 'var(--surface-hover)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }}></div>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--primary)', marginTop: '20px', fontWeight: 'bold' }}>
              <div style={{ fontSize: '30px', marginBottom: '10px', display: 'inline-block' }} className="spin-animation">🔍</div>
              <p>{loadingText}</p>
            </div>
            <style>{`
              @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 0.3; }
                100% { opacity: 0.6; }
              }
            `}</style>
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
                <button
                  onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
                  style={{
                    background: 'var(--surface-hover)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--surface-border)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginRight: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {viewMode === 'list' ? '🗺️ Show Map' : '📋 Show List'}
                </button>
                {[
                  { id: 'recommended', label: '✨ AI Recommended' },
                  { id: 'distance', label: '📍 Nearest' },
                  { id: 'price_low_high', label: '💰 Lowest Price' },
                  { id: 'rating', label: '⭐ Highest Rating' }
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
                      transition: 'transform 0.3s ease, opacity 0.3s ease, background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                      boxShadow: sortBy === option.id ? '0 4px 15px rgba(0,0,0,0.2)' : 'none'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {sortedPgs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
                  <span style={{ fontSize: '48px', display: 'block', marginBottom: '15px' }}>🔍</span>
                  <h3 style={{ fontSize: '24px', color: 'var(--foreground)', marginBottom: '10px' }}>Oops! Perfect match not found.</h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>We couldn't find any PGs matching your exact criteria. Try adjusting your filters or searching for a different location.</p>
                </div>
              ) : viewMode === 'map' ? (
                <div className="map-wrapper" style={{ width: '100%', height: 'calc(100vh - 200px)', minHeight: '500px', borderRadius: '16px', overflow: 'hidden' }}>
                  <InteractiveMap 
                    pgs={sortedPgs} 
                    hoveredPgId={hoveredPgId} 
                    userCoords={userCoords}
                  />
                </div>
              ) : (
                <div style={{ width: '100%' }}>
                  <div className="grid-auto-fit" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                    {sortedPgs.map((pg: any, idx: number) => {
                      const id = pg._id || pg.id;
                      const isCompared = compareList.some(c => (c._id || c.id) === id);
                      return (
                        <PGCard 
                          key={`${id}-${idx}`} 
                          pg={pg} 
                          currentUserRole={userRole} 
                          initialSaved={savedPropertyIds.includes(id)}
                          onMouseEnter={() => setHoveredPgId(id)}
                          onMouseLeave={() => setHoveredPgId(null)}
                          isCompared={isCompared}
                          onCompareToggle={(selectedPg) => {
                            setCompareList(prev => {
                              const exists = prev.some(c => (c._id || c.id) === (selectedPg._id || selectedPg.id));
                              if (exists) {
                                return prev.filter(c => (c._id || c.id) !== (selectedPg._id || selectedPg.id));
                              } else {
                                if (prev.length >= 3) {
                                  alert("You can only compare up to 3 PGs at a time.");
                                  return prev;
                                }
                                return [...prev, selectedPg];
                              }
                            });
                          }}
                        />
                      );
                    })}
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
              </div>
              )}
            </div>
          </>
        ) : hasSearched ? (
          <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--surface)', borderRadius: '24px', border: '1px dashed var(--primary)', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ fontSize: '60px', marginBottom: '20px', animation: 'bounce 2s infinite' }}>🥺</div>
            <h3 style={{ fontSize: '24px', marginBottom: '10px', color: 'var(--text)' }}>Oops! No perfect matches found yet.</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '16px' }}>
              We couldn&apos;t find a PG matching those exact requirements right now.
              But don&apos;t worry, new PGs are added every day!
            </p>
            <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '15px', color: 'var(--primary)' }}>Want to be the first to know?</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '15px' }}>
                We can send you a WhatsApp alert the moment a PG matches this search!
              </p>
              
              {alertStatus === 'success' ? (
                <div style={{ padding: '15px', background: 'rgba(0, 200, 83, 0.1)', color: '#00c853', borderRadius: '8px', border: '1px solid #00c853', fontWeight: 'bold' }}>
                  {alertMessage}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '10px', maxWidth: '400px', margin: '0 auto' }}>
                    <input 
                      type="text" 
                      placeholder="Enter your WhatsApp number" 
                      value={alertPhone}
                      onChange={(e) => setAlertPhone(e.target.value)}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--background)', color: 'var(--text)' }} 
                    />
                    <button 
                      onClick={handleAlertSubmit}
                      disabled={alertStatus === 'loading'}
                      style={{ padding: '12px 24px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', opacity: alertStatus === 'loading' ? 0.7 : 1 }}
                    >
                      {alertStatus === 'loading' ? 'Saving...' : 'Notify Me 🔔'}
                    </button>
                  </div>
                  {alertStatus === 'error' && (
                    <p style={{ color: '#ff3d3d', fontSize: '12px', marginTop: '10px' }}>{alertMessage}</p>
                  )}
                </>
              )}
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '15px' }}>{recentSearches.length > 0 ? "Or try one of your recent searches:" : "Or try one of these popular searches:"}</p>
            <div className="suggestion-chips" style={{ justifyContent: 'center' }}>
              {(recentSearches.length > 0 ? recentSearches.slice(0, 3) : ['Boys PG in Gurgaon', 'Girls PG with AC', 'Budget PG under ₹5000']).map((sug, i) => (
                <button key={i} className="suggestion-chip" onClick={() => handlePopularSearch(sug)}>
                  {recentSearches.length > 0 ? '🕒' : '🔍'} {sug.length > 30 ? sug.substring(0, 30) + '...' : sug}
                </button>
              ))}
            </div>
            <style>{`
              @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
            `}</style>
          </div>
        ) : null}
      </section>

      {/* ========== CONTENT SECTIONS (shown when not loading) ========== */}
      {!loading && (
        <>
          {/* Popular/Recent Searches */}
          <section className="popular-searches fade-in-section">
            <h2 className="section-title">{recentSearches.length > 0 ? "Recent Searches" : "Popular Searches"}</h2>
            <p className="section-subtitle">{recentSearches.length > 0 ? "Jump back into your recent searches" : "Quick searches that people love"}</p>
            <div className="popular-grid">
              {recentSearches.length > 0 ? (
                recentSearches.slice(0, 5).map((query, i) => (
                  <div key={i} className="popular-card" onClick={() => handlePopularSearch(query)}>
                    <span className="popular-icon">🕒</span>
                    <div>
                      <h3>{query.length > 30 ? query.substring(0, 30) + '...' : query}</h3>
                      <p>Resume search</p>
                    </div>
                  </div>
                ))
              ) : (
                displaySearches.map((item, i) => (
                  <div key={i} className="popular-card" onClick={() => handlePopularSearch(item.query)}>
                    <span className="popular-icon">{item.emoji}</span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.subtitle}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

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
                <h3>AI-Powered Matching</h3>
                <p>Our Gemini AI understands what you need and finds the perfect match</p>
              </div>
              <div className="feature-card">
                <span className="feature-icon">🛡️</span>
                <h3>Verified & Safe</h3>
                <p>Every property is verified with real photos, reviews, and safety scores</p>
              </div>
              <div className="feature-card">
                <span className="feature-icon">📍</span>
                <h3>Google Maps Verified</h3>
                <p>Real-time data from Google Maps for accurate location and distance</p>
              </div>
              <div className="feature-card">
                <span className="feature-icon">💬</span>
                <h3>Real Reviews</h3>
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
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveModal('contact'); }}>Contact</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveModal('privacy'); }}>Privacy Policy</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveModal('terms'); }}>Terms of Service</a>
            </div>
            <p className="footer-bottom">© {new Date().getFullYear()} NestMatch. All rights reserved. Made with ❤️ in India.</p>
          </footer>

          {/* Footer Modals */}
          <FooterModals activeModal={activeModal} onClose={() => setActiveModal(null)} />

          {/* Floating Compare Bar */}
          {compareList.length > 0 && (
            <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'var(--surface)', padding: '16px 24px', borderRadius: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '20px', zIndex: 100, border: '1px solid var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>{compareList.length} / 3</span>
                <span style={{ color: 'var(--text-muted)' }}>Selected</span>
              </div>
              <button 
                onClick={() => setShowCompareModal(true)}
                style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '24px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Compare Now
              </button>
              <button 
                onClick={() => setCompareList([])}
                style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '4px' }}
              >
                &times;
              </button>
            </div>
          )}

          {/* Compare Modal */}
          {showCompareModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
              <div style={{ background: 'var(--background)', width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', border: '1px solid var(--surface-border)', position: 'relative' }}>
                <button 
                  onClick={() => setShowCompareModal(false)}
                  style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--surface)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', fontSize: '24px', cursor: 'pointer', zIndex: 10 }}
                >
                  &times;
                </button>
                <div style={{ padding: '30px' }}>
                  <h2 style={{ fontSize: '28px', marginBottom: '30px', textAlign: 'center' }}>Comparing {compareList.length} Properties</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${compareList.length}, 1fr)`, gap: '20px' }}>
                    {compareList.map((pg, i) => (
                      <div key={i} style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
                        <div style={{ width: '100%', height: '150px', borderRadius: '12px', overflow: 'hidden', marginBottom: '15px' }}>
                          <img src={pg.media?.[0] || pg.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>{pg.name}</h3>
                        <p style={{ color: 'var(--secondary)', fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>₹{pg.pricing?.monthly_rent || 'N/A'}<span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>/mo</span></p>
                        
                        <div style={{ marginBottom: '15px' }}>
                          <strong style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: 'var(--text-muted)' }}>Gender</strong>
                          <span style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '14px' }}>{pg.gender_type}</span>
                        </div>

                        <div>
                          <strong style={{ display: 'block', marginBottom: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>Amenities</strong>
                          <ul style={{ paddingLeft: '20px', fontSize: '14px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {pg.amenities?.slice(0, 8).map((a: string, idx: number) => (
                              <li key={idx}>{a}</li>
                            ))}
                            {pg.amenities?.length > 8 && <li>+{pg.amenities.length - 8} more</li>}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
