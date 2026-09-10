'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PropertyTable({ properties }: { properties: any[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;
    
    setLoadingId(id);
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (data.success) {
        // Force a hard refresh to re-run server side fetch and update navbar logic if this was the last property
        window.location.href = '/owner/dashboard';
      } else {
        alert(data.error || 'Failed to delete');
        setLoadingId(null);
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred');
      setLoadingId(null);
    }
  };

  return (
    <div style={{ overflowX: 'auto' }}>
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
          {properties.map((pg: any) => (
            <tr key={pg._id.toString()} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>{pg.name}</td>
              <td style={{ padding: '12px' }}>{pg.address.city}, {pg.address.state}</td>
              <td style={{ padding: '12px' }}>{pg.gender_type}</td>
              <td style={{ padding: '12px', color: 'var(--secondary)' }}>₹{pg.pricing.monthly_rent}</td>
              <td style={{ padding: '12px', display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => router.push(`/owner/edit/${pg._id.toString()}`)}
                  style={{ padding: '6px 12px', background: 'var(--surface-border)', border: 'none', borderRadius: '4px', color: 'var(--foreground)', cursor: 'pointer' }}
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(pg._id.toString())} 
                  disabled={loadingId === pg._id.toString()}
                  style={{ padding: '6px 12px', background: 'rgba(255, 0, 0, 0.2)', border: '1px solid rgba(255, 0, 0, 0.4)', borderRadius: '4px', color: '#ff6b6b', cursor: loadingId === pg._id.toString() ? 'not-allowed' : 'pointer' }}
                >
                  {loadingId === pg._id.toString() ? '...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
