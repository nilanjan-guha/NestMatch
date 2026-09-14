'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';
import MediaCarousel from './MediaCarousel';
import KycUploadModal from './KycUploadModal';

export default function PropertyTable({ properties }: { properties: any[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [kycUploadingId, setKycUploadingId] = useState<string | null>(null);
  
  // KYC Modal state
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycProperty, setKycProperty] = useState<any | null>(null);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);

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

  // Replaced by KycUploadModal flow

  return (
    <div className="table-responsive-wrapper">
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}>
            <th style={{ padding: '12px' }}>PG Name</th>
            <th style={{ padding: '12px' }}>Location</th>
            <th style={{ padding: '12px' }}>Type</th>
            <th style={{ padding: '12px' }}>Monthly Rent</th>
            <th style={{ padding: '12px' }}>KYC Status</th>
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
              <td style={{ padding: '12px' }}>
                {pg.kyc_status === 'verified' && <span style={{ color: '#4ade80', fontWeight: 'bold' }}>✅ Verified</span>}
                {pg.kyc_status === 'pending' && <span style={{ color: '#facc15' }}>⏳ Pending</span>}
                {pg.kyc_status === 'rejected' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>❌ Rejected</span>
                    {pg.kyc_rejection_reason && (
                      <span style={{ fontSize: '11px', color: '#fca5a5', maxWidth: '150px', lineHeight: '1.2', background: 'rgba(239,68,68,0.1)', padding: '4px', borderRadius: '4px' }}>
                        {pg.kyc_rejection_reason}
                      </span>
                    )}
                  </div>
                )}
                {(!pg.kyc_status || pg.kyc_status === 'unverified') && <span style={{ color: 'var(--text-muted)' }}>Unverified</span>}
              </td>
              <td style={{ padding: '12px', display: 'flex', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {(!pg.kyc_status || pg.kyc_status === 'unverified' || pg.kyc_status === 'rejected') ? (
                    <>
                      <button 
                        onClick={() => {
                          setKycProperty(pg);
                          setKycModalOpen(true);
                        }}
                        style={{ padding: '6px 12px', background: 'linear-gradient(45deg, var(--primary), var(--secondary))', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', textAlign: 'center' }}
                      >
                        Upload KYC
                      </button>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '100px', lineHeight: '1.2' }}>
                        Strict Verification Required
                      </span>
                    </>
                  ) : (
                    <>
                      <button 
                        disabled
                        style={{ padding: '6px 12px', background: 'var(--surface-border)', border: 'none', borderRadius: '4px', color: 'var(--text-muted)', cursor: 'not-allowed', fontWeight: 'bold', textAlign: 'center' }}
                      >
                        {pg.kyc_status === 'pending' ? 'Wait for Review' : 'KYC Verified'}
                      </button>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '100px', lineHeight: '1.2' }}>
                        {pg.kyc_status === 'pending' ? 'Under processing' : 'Verification complete'}
                      </span>
                    </>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedProperty(pg)}
                  style={{ padding: '6px 12px', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '4px', color: '#818cf8', cursor: 'pointer' }}
                >
                  Details
                </button>
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

      {kycProperty && (
        <KycUploadModal 
          isOpen={kycModalOpen}
          onClose={() => setKycModalOpen(false)}
          propertyId={kycProperty._id.toString()}
          ownerName={kycProperty.owner_id?.name || 'Owner'}
          onSuccess={() => {
            router.refresh(); // Tells Next.js to fetch new data from server
            setTimeout(() => {
              window.location.reload(); // Hard refresh to ensure button turns to Wait for Review
            }, 500);
          }}
        />
      )}

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
              <div style={{ marginTop: '12px' }}>
                <a 
                  href={`/pg/${selectedProperty._id.toString()}`} 
                  target="_blank"
                  style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}
                >
                  👁️ View Public Page (How users see it)
                </a>
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
    </div>
  );
}
