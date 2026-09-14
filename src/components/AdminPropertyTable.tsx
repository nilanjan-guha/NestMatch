'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';
import MediaCarousel from './MediaCarousel';

export default function AdminPropertyTable({ properties }: { properties: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [kycLoading, setKycLoading] = useState(false);
  
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

  const handleKycReview = async (propertyId: string, action: 'approve' | 'reject') => {
    let reason = '';
    if (action === 'reject') {
      const input = window.prompt('Please provide a reason for rejecting this KYC (e.g., Blurry ID, Name mismatch):');
      if (input === null) return; // User cancelled
      if (input.trim() === '') {
        toast.error('Rejection reason is required.');
        return;
      }
      reason = input.trim();
    }

    setKycLoading(true);
    const loadingToast = toast.loading(`${action === 'approve' ? 'Approving' : 'Rejecting'} KYC...`);
    
    try {
      const res = await fetch('/api/admin/properties/kyc-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, action, reason })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`KYC ${action}d successfully`, { id: loadingToast });
        window.location.reload();
      } else {
        throw new Error(data.error || 'Failed to review KYC');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An error occurred', { id: loadingToast });
    } finally {
      setKycLoading(false);
    }
  };

  return (
    <>
      <div className="table-responsive-wrapper">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px' }}>PG Name</th>
              <th style={{ padding: '12px' }}>Owner</th>
              <th style={{ padding: '12px' }}>Type</th>
              <th style={{ padding: '12px' }}>Rent</th>
              <th style={{ padding: '12px' }}>KYC Status</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p: any) => (
              <tr key={p._id.toString()} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', verticalAlign: 'top' }}>{p.name}</td>
                <td style={{ padding: '12px', verticalAlign: 'top' }}>
                  {p.owner_id?.name || 'Unknown Owner'}
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.owner_id?.email || 'No email provided'}</div>
                  {p.owner_id?.phone && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📞 {p.owner_id.phone}</div>
                  )}
                </td>
                <td style={{ padding: '12px', verticalAlign: 'top' }}>{p.gender_type}</td>
                <td style={{ padding: '12px', color: 'var(--secondary)', verticalAlign: 'top' }}>₹{p.pricing?.monthly_rent}</td>
                <td style={{ padding: '12px', verticalAlign: 'top' }}>
                  {p.kyc_status === 'verified' && <span style={{ color: '#4ade80', fontWeight: 'bold' }}>✅ Verified</span>}
                  {p.kyc_status === 'pending' && <span style={{ color: '#facc15' }}>⏳ Pending</span>}
                  {p.kyc_status === 'rejected' && <span style={{ color: '#ef4444' }}>❌ Rejected</span>}
                  {(!p.kyc_status || p.kyc_status === 'unverified') && <span style={{ color: 'var(--text-muted)' }}>Unverified</span>}
                </td>
                <td style={{ padding: '12px', display: 'flex', gap: '10px', verticalAlign: 'top', alignItems: 'flex-start' }}>
                  <button 
                    onClick={() => {
                      if (p.kyc_status === 'pending') {
                        setSelectedProperty(p);
                        setTimeout(() => {
                          document.getElementById('kyc-section')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }
                    }}
                    disabled={p.kyc_status !== 'pending'}
                    style={{ 
                      padding: '6px 12px', 
                      background: p.kyc_status === 'pending' ? 'rgba(234, 179, 8, 0.2)' : 'var(--surface-border)', 
                      border: p.kyc_status === 'pending' ? '1px solid rgba(234, 179, 8, 0.4)' : 'none', 
                      borderRadius: '4px', 
                      color: p.kyc_status === 'pending' ? '#facc15' : 'var(--text-muted)', 
                      cursor: p.kyc_status === 'pending' ? 'pointer' : 'not-allowed', 
                      fontSize: '12px', 
                      fontWeight: 'bold' 
                    }}
                  >
                    Review KYC
                  </button>
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
            {selectedProperty.media && selectedProperty.media.length > 0 ? (
              <div style={{ marginBottom: '24px', borderRadius: '12px', overflow: 'hidden' }}>
                <MediaCarousel media={selectedProperty.media} height="250px" objectFit="cover" />
              </div>
            ) : (
              <div style={{ width: '100%', height: '150px', background: 'var(--surface-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: 'var(--text-muted)' }}>
                No Images Uploaded
              </div>
            )}

            {/* Content Grid */}
            <div className="grid-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* KYC Review Section (Always show to allow manual override) */}
              <div id="kyc-section" style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '20px', borderRadius: '12px', gridColumn: '1 / -1', marginBottom: '10px' }}>
                <h4 style={{ color: '#facc15', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🛡️</span> KYC Documents Review
                </h4>
                
                {selectedProperty.kyc_documents && selectedProperty.kyc_documents.length > 0 ? (
                  <div style={{ marginBottom: '16px', borderRadius: '8px', overflow: 'hidden' }}>
                    <MediaCarousel media={selectedProperty.kyc_documents} height="300px" objectFit="contain" />
                  </div>
                ) : (
                  <div style={{ marginBottom: '16px', padding: '20px', background: 'var(--surface-border)', borderRadius: '8px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No KYC documents have been uploaded for this property yet.
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, color: 'var(--text-muted)', fontSize: '14px', alignSelf: 'center', minWidth: '200px' }}>
                    Current Status: <strong style={{ color: 'var(--foreground)' }}>{(selectedProperty.kyc_status || 'UNVERIFIED').toUpperCase()}</strong>
                  </div>
                  <button 
                    onClick={() => handleKycReview(selectedProperty._id.toString(), 'reject')}
                    disabled={kycLoading}
                    style={{ padding: '10px 20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#ef4444', borderRadius: '6px', cursor: kycLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleKycReview(selectedProperty._id.toString(), 'approve')}
                    disabled={kycLoading}
                    style={{ padding: '10px 20px', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.5)', color: '#4ade80', borderRadius: '6px', cursor: kycLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                  >
                    Approve & Verify (Override)
                  </button>
                </div>
              </div>

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
                  <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--text-muted)' }}>Total Beds:</span> {selectedProperty.capacity?.total_beds || 'N/A'}</div>
                  <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--text-muted)' }}>Available:</span> <strong style={{ color: '#4ade80' }}>{selectedProperty.capacity?.available_beds || 'N/A'}</strong></div>
                  <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--text-muted)' }}>Room Details:</span> {selectedProperty.capacity?.room_details || 'N/A'}</div>
                  
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Owner Details:</span> 
                    <strong>{selectedProperty.owner_id?.name || 'Unknown'}</strong>
                    {selectedProperty.owner_id?.email && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>📧 {selectedProperty.owner_id.email}</div>}
                    {selectedProperty.owner_id?.phone && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>📞 {selectedProperty.owner_id.phone}</div>}
                  </div>
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
