'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminOwnerTable({ owners, properties }: { owners: any[], properties: any[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedOwner, setExpandedOwner] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this owner? This will also delete all their associated properties, bookings, and saved properties. This action cannot be undone.')) {
      return;
    }

    setLoading(userId);
    try {
      const res = await fetch(`/api/user/${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (res.ok) {
        alert('Owner deleted successfully.');
        router.refresh();
      } else {
        alert(data.error || 'Failed to delete owner.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred.');
    } finally {
      setLoading(null);
    }
  };

  const toggleExpand = (ownerId: string) => {
    setExpandedOwner(expandedOwner === ownerId ? null : ownerId);
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}>
            <th style={{ padding: '10px' }}>Name / Email</th>
            <th style={{ padding: '10px' }}>Phone</th>
            <th style={{ padding: '10px' }}>Properties Listed</th>
            <th style={{ padding: '10px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {owners.map((owner: any) => {
            const ownerIdStr = owner._id.toString();
            // In Admin dashboard, owner_id is populated, so it's an object, but maybe it's just the ID for some reason.
            const ownerProperties = properties.filter((p: any) => {
              const pOwnerId = typeof p.owner_id === 'object' ? p.owner_id._id.toString() : p.owner_id?.toString();
              return pOwnerId === ownerIdStr;
            });
            
            return (
              <React.Fragment key={ownerIdStr}>
                <tr style={{ borderBottom: expandedOwner === ownerIdStr ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px' }}>
                    <div style={{ fontWeight: 'bold' }}>{owner.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{owner.email}</div>
                  </td>
                  <td style={{ padding: '10px' }}>
                    {owner.phone || <span style={{ color: 'var(--text-muted)' }}>Not Provided</span>}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{ownerProperties.length}</span> Listed
                  </td>
                  <td style={{ padding: '10px', display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => toggleExpand(ownerIdStr)}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--surface-border)',
                        color: 'var(--foreground)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      {expandedOwner === ownerIdStr ? 'Hide PGs' : 'View PGs'}
                    </button>
                    <button
                      onClick={() => handleDelete(ownerIdStr)}
                      disabled={loading === ownerIdStr}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        opacity: loading === ownerIdStr ? 0.7 : 1
                      }}
                    >
                      {loading === ownerIdStr ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
                {expandedOwner === ownerIdStr && (
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td colSpan={4} style={{ padding: '10px 20px 20px 20px', background: 'rgba(0,0,0,0.2)' }}>
                      {ownerProperties.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}>
                              <th style={{ padding: '8px' }}>PG Name</th>
                              <th style={{ padding: '8px' }}>Type</th>
                              <th style={{ padding: '8px' }}>Rent</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ownerProperties.map((p: any) => (
                              <tr key={p._id.toString()} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '8px', fontWeight: 'bold' }}>{p.name}</td>
                                <td style={{ padding: '8px' }}>{p.gender_type}</td>
                                <td style={{ padding: '8px', color: 'var(--secondary)' }}>₹{p.pricing?.monthly_rent}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                          This owner has not listed any PGs yet.
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
          {owners.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No owners found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
