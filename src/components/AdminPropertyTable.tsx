'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';

export default function AdminPropertyTable({ properties }: { properties: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  
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
        window.location.reload();
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
    <>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px' }}>PG Name</th>
              <th style={{ padding: '12px' }}>Owner</th>
              <th style={{ padding: '12px' }}>Type</th>
              <th style={{ padding: '12px' }}>Rent</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p: any) => (
              <tr key={p._id.toString()} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{p.name}</td>
                <td style={{ padding: '12px' }}>
                  {p.owner_id?.name || 'Unknown Owner'}
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.owner_id?.email || 'No email provided'}</div>
                  {p.owner_id?.phone && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📞 {p.owner_id.phone}</div>
                  )}
                </td>
                <td style={{ padding: '12px' }}>{p.gender_type}</td>
                <td style={{ padding: '12px', color: 'var(--secondary)' }}>₹{p.pricing?.monthly_rent}</td>
                <td style={{ padding: '12px', display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setSelectedProperty(p)}
                    style={{ padding: '6px 12px', background: 'var(--surface-border)', border: 'none', borderRadius: '4px', color: 'var(--foreground)', cursor: 'pointer', fontSize: '12px' }}
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => requestDelete(p._id.toString())} 
                    disabled={loadingId === p._id.toString()}
                    style={{ padding: '6px 12px', background: 'rgba(255, 0, 0, 0.2)', border: '1px solid rgba(255, 0, 0, 0.4)', borderRadius: '4px', color: '#ff6b6b', cursor: loadingId === p._id.toString() ? 'not-allowed' : 'pointer', fontSize: '12px' }}
                  >
                    {loadingId === p._id.toString() ? '...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={modalOpen}
        title="Delete Listing (Admin Override)"
        message="Are you sure you want to delete this listing? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {selectedProperty && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }} onClick={() => setSelectedProperty(null)}>
          <div className="glass-panel" style={{
            background: 'var(--background)', width: '100%', maxWidth: '600px', maxHeight: '90vh',
            overflowY: 'auto', padding: '30px', position: 'relative', borderRadius: '16px',
            border: '1px solid var(--surface-border)'
          }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedProperty(null)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
            >
              ✕
            </button>
            
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', background: 'linear-gradient(45deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {selectedProperty.name}
              </h2>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
                {selectedProperty.address?.city}, {selectedProperty.address?.state} • {selectedProperty.gender_type}
              </div>
            </div>

            {/* Images Placeholder */}
            {selectedProperty.images && selectedProperty.images.length > 0 ? (
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '24px' }}>
                {selectedProperty.images.map((img: string, i: number) => (
                  <img key={i} src={img} alt="PG" style={{ height: '150px', borderRadius: '8px', objectFit: 'cover' }} />
                ))}
              </div>
            ) : (
              <div style={{ width: '100%', height: '150px', background: 'var(--surface-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: 'var(--text-muted)' }}>
                No Images Uploaded
              </div>
            )}

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>💰</span> Pricing
                </h4>
                <div style={{ fontSize: '14px' }}>
                  <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--text-muted)' }}>Monthly Rent:</span> <strong style={{ color: 'var(--secondary)' }}>₹{selectedProperty.pricing?.monthly_rent}</strong></div>
                  <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--text-muted)' }}>Deposit:</span> ₹{selectedProperty.pricing?.deposit_amount}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Notice Period:</span> {selectedProperty.pricing?.notice_period_days} days</div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📋</span> Details
                </h4>
                <div style={{ fontSize: '14px' }}>
                  <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--text-muted)' }}>Total Beds:</span> {selectedProperty.capacity?.total_beds}</div>
                  <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--text-muted)' }}>Available:</span> <strong style={{ color: '#4ade80' }}>{selectedProperty.capacity?.available_beds}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Owner:</span> {selectedProperty.owner_id?.name}</div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', gridColumn: '1 / -1' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✨</span> Amenities & Rules
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {selectedProperty.amenities?.map((am: string, i: number) => (
                    <span key={i} style={{ padding: '4px 10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderRadius: '20px', fontSize: '12px' }}>
                      {am}
                    </span>
                  ))}
                  {(!selectedProperty.amenities || selectedProperty.amenities.length === 0) && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>None listed</span>
                  )}
                </div>
                
                <h5 style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '13px' }}>Rules:</h5>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--foreground)' }}>
                  {selectedProperty.rules?.map((rule: string, i: number) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{rule}</li>
                  ))}
                  {(!selectedProperty.rules || selectedProperty.rules.length === 0) && (
                    <li style={{ color: 'var(--text-muted)' }}>No special rules listed</li>
                  )}
                </ul>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', gridColumn: '1 / -1' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📝</span> Description
                </h4>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-muted)', margin: 0 }}>
                  {selectedProperty.description || 'No description provided.'}
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
