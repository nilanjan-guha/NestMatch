'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';

export default function AdminUserTable({ users }: { users: any[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);

  const requestDelete = (userId: string) => {
    setTargetId(userId);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetId) return;
    const userId = targetId;
    setModalOpen(false);

    setLoading(userId);
    const loadingToast = toast.loading('Deleting user...');
    try {
      const res = await fetch(`/api/user/${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('User deleted successfully.', { id: loadingToast });
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to delete user.', { id: loadingToast });
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred.', { id: loadingToast });
    } finally {
      setLoading(null);
    }
  };

  const handleCancelDelete = () => {
    setModalOpen(false);
    setTargetId(null);
  };

  return (
    <>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}>
            <th style={{ padding: '10px' }}>Name / Email</th>
            <th style={{ padding: '10px' }}>Phone</th>
            <th style={{ padding: '10px' }}>Role</th>
            <th style={{ padding: '10px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u: any) => (
            <tr key={u._id.toString()} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '10px' }}>
                <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
              </td>
              <td style={{ padding: '10px' }}>
                {u.phone || <span style={{ color: 'var(--text-muted)' }}>Not Provided</span>}
              </td>
              <td style={{ padding: '10px' }}>
                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                  {u.role || 'searcher'}
                </span>
              </td>
              <td style={{ padding: '10px' }}>
                {u.isSuperAdminUser ? (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Super Admin</span>
                ) : (
                  <button
                    onClick={() => requestDelete(u._id)}
                    disabled={loading === u._id}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      opacity: loading === u._id ? 0.7 : 1
                    }}
                  >
                    {loading === u._id ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No users found.</td>
            </tr>
          )}
        </tbody>
      </table>
      <ConfirmModal
        isOpen={modalOpen}
        title="Delete User"
        message="Are you sure you want to delete this user? This will also delete all their associated properties, bookings, and saved properties. This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
