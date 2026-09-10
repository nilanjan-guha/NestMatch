'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';

export default function PropertyTable({ properties }: { properties: any[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);

  const requestDelete = (id: string) => {
    setTargetId(id);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetId) return;
    const id = targetId;
    setModalOpen(false);
    
    setLoadingId(id);
    const loadingToast = toast.loading('Deleting listing...');
    
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Listing deleted successfully', { id: loadingToast });
        // Force a hard refresh to re-run server side fetch and update navbar logic if this was the last property
        window.location.href = '/owner/dashboard';
      } else {
        toast.error(data.error || 'Failed to delete', { id: loadingToast });
        setLoadingId(null);
      }
    } catch (e) {
      console.error(e);
      toast.error('An error occurred', { id: loadingToast });
      setLoadingId(null);
    }
  };

  const handleCancelDelete = () => {
    setModalOpen(false);
    setTargetId(null);
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
                  onClick={() => requestDelete(pg._id.toString())} 
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

      <ConfirmModal
        isOpen={modalOpen}
        title="Delete Property"
        message="Are you sure you want to delete this listing? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
