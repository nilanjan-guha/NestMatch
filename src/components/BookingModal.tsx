'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface BookingModalProps {
  pgName: string;
  monthlyRent: number;
  onClose: () => void;
}

export default function BookingModal({ pgName, monthlyRent, onClose }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const tokenAmount = 999;

  const handlePay = async () => {
    setLoading(true);
    // Simulate payment gateway delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    setLoading(false);
    setStep(2); // Success step
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
    }}>
      <div className="glass-panel" style={{
        background: 'var(--background)', width: '100%', maxWidth: '400px',
        padding: '30px', position: 'relative', borderRadius: '16px',
        border: '1px solid var(--surface-border)'
      }}>
        {step === 1 && (
          <button 
            onClick={onClose}
            disabled={loading}
            style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            ✕
          </button>
        )}

        {step === 1 ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔐</div>
              <h2 style={{ margin: '0 0 5px 0', color: 'var(--primary)' }}>Secure Booking</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>Reserve your bed instantly</p>
            </div>
            
            <div style={{ background: 'var(--surface)', padding: '15px', borderRadius: '8px', border: '1px solid var(--surface-border)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Property:</span>
                <span style={{ fontWeight: 'bold' }}>{pgName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Monthly Rent:</span>
                <span style={{ fontWeight: 'bold' }}>₹{monthlyRent}</span>
              </div>
              <div style={{ borderTop: '1px dashed var(--surface-border)', margin: '15px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Token Amount:</span>
                <span style={{ fontWeight: 'bold', fontSize: '24px', color: 'var(--primary)' }}>₹{tokenAmount}</span>
              </div>
              <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#10b981' }}>✓ Fully refundable if canceled within 24 hours</p>
            </div>

            <button 
              onClick={handlePay}
              disabled={loading}
              style={{
                width: '100%', padding: '15px', 
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', 
                color: 'white', border: 'none', borderRadius: '8px', 
                fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
              }}
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Processing...
                </>
              ) : (
                <>Pay ₹{tokenAmount} via Razorpay</>
              )}
            </button>
            <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '12px', color: 'var(--text-muted)' }}>
              🔒 Secured by 256-bit encryption
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '60px', color: '#10b981', marginBottom: '15px' }}>✅</div>
            <h2 style={{ margin: '0 0 10px 0', color: 'var(--foreground)' }}>Booking Confirmed!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              Your bed at <strong>{pgName}</strong> has been successfully reserved. The owner has been notified.
            </p>
            <button 
              onClick={() => {
                toast.success("Redirecting to your bookings...");
                onClose();
              }}
              style={{
                width: '100%', padding: '12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              View My Bookings
            </button>
          </div>
        )}
      </div>
      <style>{`
        .spinner {
          width: 20px; height: 20px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
