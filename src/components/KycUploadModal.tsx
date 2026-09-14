'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

interface KycUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  ownerName: string;
  onSuccess: () => void;
}

export default function KycUploadModal({ isOpen, onClose, propertyId, ownerName, onSuccess }: KycUploadModalProps) {
  const [step, setStep] = useState(1);
  const [idType, setIdType] = useState('Aadhaar');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontUrl, setFrontUrl] = useState<string | null>(null);
  const [backUrl, setBackUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (loading) return;
    setStep(1);
    setFrontImage(null);
    setBackImage(null);
    setFrontUrl(null);
    setBackUrl(null);
    setError(null);
    onClose();
  };

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append('files', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!data.urls || data.urls.length === 0) throw new Error('Failed to upload image to Cloudinary');
    return data.urls[0];
  };

  const handleNextStep1 = () => {
    setStep(2);
    setError(null);
  };

  const handleFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFrontImage(file);
    setLoading(true);
    setLoadingText('Uploading & AI Scanning...');
    setError(null);

    try {
      // 1. Upload to Cloudinary
      const uploadedUrl = await uploadToCloudinary(file);

      // 2. Scan with AI
      const scanRes = await fetch('/api/kyc/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: uploadedUrl, ownerName, expectedIdType: idType })
      });
      const scanData = await scanRes.json();

      if (!scanData.success) {
        throw new Error(scanData.error || 'AI verification failed');
      }

      toast.success(scanData.message || 'Name verified successfully!');
      setFrontUrl(uploadedUrl);
      setStep(3); // Move to Back Side
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Verification failed. Please try again.');
      setFrontImage(null);
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackImage(file);
    setLoading(true);
    setLoadingText('Uploading back side...');
    setError(null);

    try {
      const uploadedUrl = await uploadToCloudinary(file);
      setBackUrl(uploadedUrl);
      setStep(4); // Move to Submit step
      
      // Auto-submit since we have both
      submitKyc(uploadedUrl);
    } catch (err: any) {
      console.error(err);
      setError('Failed to upload back side.');
      setBackImage(null);
      setLoading(false);
    } finally {
      e.target.value = '';
    }
  };

  const submitKyc = async (finalBackUrl: string) => {
    setLoadingText('Submitting Documents...');
    try {
      const kycRes = await fetch('/api/properties/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          documents: [frontUrl, finalBackUrl]
        })
      });

      const kycData = await kycRes.json();
      
      if (kycData.success) {
        toast.success('KYC documents submitted successfully!');
        onSuccess();
        handleClose();
      } else {
        throw new Error(kycData.error || 'Failed to submit KYC');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setStep(3); // Go back to step 3 so they can retry
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
    }}>
      <div className="glass-panel" style={{
        background: 'var(--background)', width: '100%', maxWidth: '500px',
        padding: '30px', position: 'relative', borderRadius: '16px',
        border: '1px solid var(--surface-border)'
      }}>
        <button 
          onClick={handleClose}
          disabled={loading}
          style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          ✕
        </button>

        <h2 style={{ margin: '0 0 20px 0', color: 'var(--primary)', textAlign: 'center' }}>
          Identity Verification
        </h2>

        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ 
              flex: 1, height: '4px', borderRadius: '2px', 
              background: step >= s ? 'var(--primary)' : 'var(--surface-border)',
              transition: 'all 0.3s'
            }} />
          ))}
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.5)', padding: '12px', borderRadius: '8px', color: '#ef4444', marginBottom: '20px', fontSize: '14px', lineHeight: '1.4' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Step 1: Select ID Type */}
        {step === 1 && (
          <div>
            <h3 style={{ marginBottom: '10px' }}>Step 1: Select Document Type</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
              Please select the type of government ID you will be uploading. We need this to verify you are the legitimate owner.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {['Aadhaar', 'PAN Card', 'Voter ID', 'Driving License'].map(type => (
                <label key={type} style={{ 
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', 
                  border: idType === type ? '1px solid var(--primary)' : '1px solid var(--surface-border)', 
                  borderRadius: '8px', cursor: 'pointer', background: idType === type ? 'rgba(162, 53, 255, 0.05)' : 'transparent' 
                }}>
                  <input 
                    type="radio" 
                    name="idType" 
                    value={type} 
                    checked={idType === type} 
                    onChange={(e) => setIdType(e.target.value)} 
                    style={{ cursor: 'pointer' }}
                  />
                  {type}
                </label>
              ))}
            </div>
            <button 
              onClick={handleNextStep1}
              style={{ width: '100%', padding: '12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Next: Upload Front Side
            </button>
          </div>
        )}

        {/* Step 2: Upload Front Side */}
        {step === 2 && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '10px' }}>Step 2: Upload Front Side</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
              Upload the <strong>FRONT</strong> side of your {idType}.<br/>
              Our AI will scan it to verify the name matches your registered name: <strong>{ownerName}</strong>
            </p>

            {loading ? (
              <div style={{ padding: '40px', border: '2px dashed var(--primary)', borderRadius: '12px', background: 'rgba(162, 53, 255, 0.05)' }}>
                <div style={{ fontSize: '30px', animation: 'spin 2s linear infinite', marginBottom: '10px' }}>⏳</div>
                <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{loadingText}</div>
              </div>
            ) : (
              <label style={{ 
                display: 'block', padding: '40px', border: '2px dashed var(--surface-border)', 
                borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', background: 'var(--surface)' 
              }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📸</div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Click to Upload Front Image</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Supported: JPG, PNG, PDF</div>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  style={{ display: 'none' }}
                  onChange={handleFrontUpload}
                />
              </label>
            )}
            <style>{`
              @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        )}

        {/* Step 3: Upload Back Side */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '10px' }}>Step 3: Upload Back Side</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
              Great! AI verified the name. Now upload the <strong>BACK</strong> side of your {idType}.
            </p>

            {loading ? (
              <div style={{ padding: '40px', border: '2px dashed var(--primary)', borderRadius: '12px', background: 'rgba(162, 53, 255, 0.05)' }}>
                <div style={{ fontSize: '30px', animation: 'spin 2s linear infinite', marginBottom: '10px' }}>⏳</div>
                <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{loadingText}</div>
              </div>
            ) : (
              <label style={{ 
                display: 'block', padding: '40px', border: '2px dashed var(--surface-border)', 
                borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', background: 'var(--surface)' 
              }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📸</div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Click to Upload Back Image</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Supported: JPG, PNG, PDF</div>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  style={{ display: 'none' }}
                  onChange={handleBackUpload}
                />
              </label>
            )}
          </div>
        )}

        {/* Step 4: Submitting */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '40px', animation: 'spin 2s linear infinite', marginBottom: '20px' }}>⚙️</div>
            <h3 style={{ color: 'var(--primary)' }}>{loadingText}</h3>
            <p style={{ color: 'var(--text-muted)' }}>Finalizing your verification request...</p>
          </div>
        )}

      </div>
    </div>
  );
}
