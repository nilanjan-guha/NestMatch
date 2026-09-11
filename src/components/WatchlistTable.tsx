'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PGDetailsModal from './PGDetailsModal';

export default function WatchlistTable({ properties }: { properties: any[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);

  const handleUnsave = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch('/api/user/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: id })
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert(data.error || 'Failed to remove from watchlist');
        setLoadingId(null);
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred');
      setLoadingId(null);
    }
  };

  return (
    <>
      <div className="table-responsive-wrapper">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px' }}>PG Name</th>
              <th style={{ padding: '12px' }}>Location</th>
              <th style={{ padding: '12px' }}>Type</th>
              <th style={{ padding: '12px' }}>Monthly Rent</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.filter((pg: any) => pg && pg.name).map((pg: any, index: number) => {
              const propertyId = (pg?._id || pg?.id || `unknown-${index}`).toString();
              return (
              <tr key={propertyId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td 
                  onClick={() => setSelectedProperty(pg)}
                  style={{ padding: '12px', fontWeight: 'bold', cursor: 'pointer', color: 'var(--primary)' }}
                >
                  {pg.name}
                </td>
                <td style={{ padding: '12px' }}>{pg.address?.city}, {pg.address?.state}</td>
                <td style={{ padding: '12px' }}>{pg.gender_type}</td>
                <td style={{ padding: '12px', color: 'var(--secondary)' }}>₹{pg.pricing?.monthly_rent}</td>
                <td style={{ padding: '12px', display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setSelectedProperty(pg)}
                    style={{ padding: '6px 12px', background: 'var(--surface-border)', border: 'none', borderRadius: '4px', color: 'var(--foreground)', cursor: 'pointer' }}
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => handleUnsave(propertyId)} 
                    disabled={loadingId === propertyId}
                    style={{ padding: '6px 12px', background: 'rgba(255, 0, 0, 0.2)', border: '1px solid rgba(255, 0, 0, 0.4)', borderRadius: '4px', color: '#ff6b6b', cursor: loadingId === propertyId ? 'not-allowed' : 'pointer' }}
                  >
                    {loadingId === propertyId ? '...' : 'Remove 💔'}
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedProperty && (
        <PGDetailsModal
          pg={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          pgMedia={selectedProperty.media && selectedProperty.media.length > 0 ? selectedProperty.media : (selectedProperty.images && selectedProperty.images.length > 0 ? selectedProperty.images : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop'])}
          isOwnerView={false}
          isFromAPI={selectedProperty.amenities?.includes('Google Maps Verified')}
          isSaved={true}
          saving={loadingId === (selectedProperty._id || selectedProperty.id)?.toString()}
          booking={false}
          onSave={() => handleUnsave((selectedProperty._id || selectedProperty.id)?.toString())}
        />
      )}
    </>
  );
}
