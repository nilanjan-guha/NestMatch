'use client';

import { IPGProperty } from '@/models/PGProperty';

interface CompareModalProps {
  properties: any[];
  onClose: () => void;
  onRemove: (id: string) => void;
}

export default function CompareModal({ properties, onClose, onRemove }: CompareModalProps) {
  if (properties.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100000, padding: '20px'
    }}>
      <div className="glass-panel" style={{
        background: 'var(--background)',
        width: '100%', maxWidth: '1000px',
        maxHeight: '90vh', overflowY: 'auto',
        padding: '30px', position: 'relative',
        borderRadius: '16px',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        boxShadow: '0 0 40px rgba(99, 102, 241, 0.15), 0 8px 32px rgba(0, 0, 0, 0.8)'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '15px', right: '20px',
            background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer',
            color: 'var(--text-muted)'
          }}
        >
          &times;
        </button>
        
        <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Compare Properties</h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr>
                <th style={{ width: '20%', padding: '15px', borderBottom: '2px solid var(--surface-border)', textAlign: 'left', color: 'var(--text-muted)' }}>Feature</th>
                {properties.map((p, i) => (
                  <th key={p._id} style={{ width: `${80 / properties.length}%`, padding: '15px', borderBottom: '2px solid var(--surface-border)', textAlign: 'left' }}>
                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '18px', color: 'var(--primary)' }}>{p.name}</span>
                        <button 
                          onClick={() => onRemove(p._id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}
                          title="Remove from comparison"
                        >
                          &times;
                        </button>
                      </div>
                      {p.media && p.media.length > 0 ? (
                        <img src={p.media[0]} alt={p.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--surface-border)' }} />
                      ) : (
                        <div style={{ width: '100%', height: '120px', backgroundColor: 'var(--surface)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px solid var(--surface-border)' }}>No Image</div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Basic Info */}
              <tr style={{ borderBottom: '1px solid var(--surface-border)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <td style={{ padding: '15px', fontWeight: 'bold' }}>City</td>
                {properties.map(p => (
                  <td key={p._id} style={{ padding: '15px' }}>{p.address?.city || 'N/A'}</td>
                ))}
              </tr>
              <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                <td style={{ padding: '15px', fontWeight: 'bold' }}>Monthly Rent</td>
                {properties.map(p => (
                  <td key={p._id} style={{ padding: '15px', color: 'var(--secondary)', fontWeight: 'bold' }}>
                    ₹{p.pricing?.monthly_rent?.toLocaleString() || 'N/A'}
                  </td>
                ))}
              </tr>
              <tr style={{ borderBottom: '1px solid var(--surface-border)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <td style={{ padding: '15px', fontWeight: 'bold' }}>Deposit</td>
                {properties.map(p => (
                  <td key={p._id} style={{ padding: '15px' }}>
                    ₹{p.pricing?.security_deposit?.toLocaleString() || 'N/A'}
                  </td>
                ))}
              </tr>
              <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                <td style={{ padding: '15px', fontWeight: 'bold' }}>Gender</td>
                {properties.map(p => {
                  let gender = p.gender_type;
                  if (!gender || gender === 'null' || gender.includes('placeholder')) gender = 'N/A';
                  return (
                    <td key={p._id} style={{ padding: '15px' }}>{gender}</td>
                  );
                })}
              </tr>
              <tr style={{ borderBottom: '1px solid var(--surface-border)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <td style={{ padding: '15px', fontWeight: 'bold' }}>Distance from Search</td>
                {properties.map(p => (
                  <td key={p._id} style={{ padding: '15px', color: 'var(--primary)', fontWeight: 'bold' }}>
                    {p.distance ? `${(p.distance / 1000).toFixed(1)} km` : 'N/A'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

