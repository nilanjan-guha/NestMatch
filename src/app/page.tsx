'use client';
import { useState, useEffect } from 'react';
import AiSearchBar from '@/components/AiSearchBar';
import PGCard from '@/components/PGCard';
import { useUser } from '@clerk/nextjs';

export default function Home() {
  const { user } = useUser();
  const [pgs, setPgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<string>('');
  const [userCoords, setUserCoords] = useState<[number, number] | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');

  // Fetch Session from Clerk user object
  useEffect(() => {
    if (user) {
      const role = user.publicMetadata?.role as string;
      setUserRole(role || 'USER');
      const location = user.publicMetadata?.location as string;
      const coordinates = user.publicMetadata?.coordinates as [number, number];
      
      if (location) setUserLocation(location);
      if (coordinates) setUserCoords(coordinates);
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

  return (
    <main>
      {/* Hero Section */}
      <section style={{ padding: '100px 24px', textAlign: 'center', background: 'radial-gradient(circle at top, rgba(99,102,241,0.15) 0%, transparent 50%)' }}>
        <h1 style={{ fontSize: '64px', fontWeight: '800', marginBottom: '20px', lineHeight: '1.2' }}>
          Find Your Perfect PG with <span style={{ background: 'linear-gradient(45deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NestMatch</span>
        </h1>
        <p style={{ fontSize: '20px', color: 'var(--text-muted)', marginBottom: '50px', maxWidth: '600px', margin: '0 auto 50px' }}>
          Just tell us what you're looking for, and we will instantly find the best home for you.
        </p>
        
        <AiSearchBar onSearch={handleSearch} defaultLocation={userLocation} />
      </section>

      {/* Results Section */}
      <section className="container" style={{ paddingBottom: '100px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>Searching the database...</div>
        ) : pgs.length > 0 ? (
          <>
            <div className="grid-auto-fit">
              {pgs.map((pg: any) => (
                <PGCard key={pg._id} pg={pg} currentUserRole={userRole} />
              ))}
            </div>
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <button 
                  onClick={loadMore} 
                  disabled={loadingMore}
                  style={{
                    padding: '12px 32px',
                    borderRadius: '8px',
                    background: 'var(--surface)',
                    border: '1px solid var(--surface-border)',
                    color: 'var(--foreground)',
                    cursor: loadingMore ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
            No PGs found matching your search.
          </div>
        )}
      </section>
    </main>
  );
}
