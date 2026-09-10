import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999
    }}>
      <div className="glass-panel" style={{
        padding: '30px',
        width: '100%',
        maxWidth: '400px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h3 style={{ margin: 0, fontSize: '24px' }}>{title}</h3>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid var(--surface-border)',
              color: 'var(--foreground)',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: '#ef4444',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
