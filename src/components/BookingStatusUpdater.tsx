'use client';

import { useState } from 'react';

export default function BookingStatusUpdater({ bookingId, currentStatus }: { bookingId: string, currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/booking/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to update status');
        setStatus(currentStatus); // Revert on failure
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred');
      setStatus(currentStatus);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch(s) {
      case 'Pending': return '#f59e0b';
      case 'Contacted': return '#3b82f6';
      case 'Accepted': return '#10b981';
      case 'Rejected': return '#ef4444';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <select 
      value={status} 
      onChange={(e) => handleStatusChange(e.target.value)}
      disabled={loading}
      style={{
        padding: '6px 12px',
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${getStatusColor(status)}`,
        borderRadius: '6px',
        color: getStatusColor(status),
        cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: 'bold',
        outline: 'none'
      }}
    >
      <option value="Pending" style={{ background: '#1e1e2e', color: '#f59e0b' }}>Pending</option>
      <option value="Contacted" style={{ background: '#1e1e2e', color: '#3b82f6' }}>Contacted</option>
      <option value="Accepted" style={{ background: '#1e1e2e', color: '#10b981' }}>Accepted</option>
      <option value="Rejected" style={{ background: '#1e1e2e', color: '#ef4444' }}>Rejected</option>
    </select>
  );
}
