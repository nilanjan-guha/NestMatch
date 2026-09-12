'use client';

import { useTransition, useState, useEffect, useRef } from 'react';
import { completeOnboarding } from '@/app/actions/user';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const [isPending, startTransition] = useTransition();
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);
  const { user, isLoaded } = useUser();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const router = useRouter();
  const roleSectionRef = useRef<HTMLDivElement>(null);

  const [countryCode, setCountryCode] = useState('+91');

  useEffect(() => {
    if (user) {
      if (user.fullName || user.firstName) {
        setName(user.fullName || user.firstName || '');
      }
      if (user.primaryPhoneNumber?.phoneNumber) {
        let p = user.primaryPhoneNumber.phoneNumber;
        if (p.startsWith('+91')) { p = p.slice(3); setCountryCode('+91'); }
        else if (p.startsWith('91')) { p = p.slice(2); setCountryCode('+91'); }
        else if (p.startsWith('+1')) { p = p.slice(2); setCountryCode('+1'); }
        else if (p.startsWith('+44')) { p = p.slice(3); setCountryCode('+44'); }
        setPhone(p);
      }
    }
  }, [user]);

  // Auto-retry if there was a previous pending onboarding stuck due to network issue
  useEffect(() => {
    if (!isLoaded) return;
    const pending = localStorage.getItem('pendingOnboarding');
    if (pending) {
      try {
        const { role, name, fullPhone } = JSON.parse(pending);
        setIsAutoRetrying(true);
        toast.loading("Resuming your previous selection...", { id: 'retry-toast' });
        
        startTransition(async () => {
          try {
            await completeOnboarding(role, name, fullPhone);
            localStorage.removeItem('pendingOnboarding');
            toast.success(`Welcome to NestMatch! You are now a ${role === 'owner' ? 'PG Owner' : 'PG Searcher'}.`, { id: 'retry-toast' });
            window.location.href = '/';
          } catch (error) {
            console.error("Failed to auto-resume onboarding:", error);
            toast.error("Failed to resume. Please try selecting again.", { id: 'retry-toast' });
            setIsAutoRetrying(false);
          }
        });
      } catch(e) {
        localStorage.removeItem('pendingOnboarding');
      }
    }
  }, [isLoaded]);

  const handleSelection = (role: 'searcher' | 'owner') => {
    if (!name.trim() || !phone.trim()) {
      toast.error("Please provide your name and phone number to continue.");
      return;
    }

    if (phone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }

    startTransition(async () => {
      try {
        const fullPhone = `${countryCode}${phone}`;
        // Save to localStorage just in case network hangs
        localStorage.setItem('pendingOnboarding', JSON.stringify({ role, name, fullPhone }));
        
        await completeOnboarding(role, name, fullPhone);
        
        // Remove from storage on success
        localStorage.removeItem('pendingOnboarding');
        
        toast.success(`Welcome to NestMatch! You are now a ${role === 'owner' ? 'PG Owner' : 'PG Searcher'}.`);
        window.location.href = '/';
      } catch (error) {
        console.error("Failed to complete onboarding:", error);
        toast.error("Failed to set your role. Please try again.");
      }
    });
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'radial-gradient(circle at center, rgba(162, 53, 255, 0.1) 0%, transparent 70%)'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px' }}>
          Welcome to <span style={{ color: 'var(--primary)' }}>NestMatch</span>
        </h1>
        <p style={{ fontSize: '18px', color: 'var(--text-muted)' }}>
          {isAutoRetrying ? "Resuming your previous selection, please wait..." : "Please confirm your details and tell us how you plan to use NestMatch."}
        </p>
      </div>

      <div style={{ 
        width: '100%', 
        maxWidth: '500px', 
        marginBottom: '40px',
        background: 'var(--surface)',
        padding: '30px',
        borderRadius: '16px',
        border: '1px solid var(--surface-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Full Name *</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--surface-border)',
              background: 'var(--background)',
              color: 'var(--text)',
              fontSize: '16px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Phone Number *</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--surface-border)',
                background: 'var(--surface-hover)',
                color: 'var(--text)',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              <option value="+91">🇮🇳 +91</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+44">🇬🇧 +44</option>
              <option value="+61">🇦🇺 +61</option>
            </select>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 10) {
                  setPhone(val);
                  // Auto-scroll to role selection if they finished typing their phone
                  if (val.length === 10 && name.trim()) {
                    setTimeout(() => {
                      roleSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 200);
                  }
                }
              }}
              placeholder="9876543210"
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--surface-border)',
                background: 'var(--background)',
                color: 'var(--text)',
                fontSize: '16px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Role Selection Section */}
      <div ref={roleSectionRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {name.trim() && phone.length === 10 && (
          <div style={{ marginBottom: '25px', textAlign: 'center', padding: '10px 20px', background: 'rgba(162, 53, 255, 0.1)', borderRadius: '30px', border: '1px solid var(--primary)' }}>
            <p style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '16px', margin: 0 }}>
              👇 Almost done! Please select your role to continue
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
        
        {/* Searcher Card */}
        <button 
          onClick={() => handleSelection('searcher')}
          disabled={isPending || isAutoRetrying}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--surface-border)',
            borderRadius: '16px',
            padding: '40px 30px',
            width: '280px',
            textAlign: 'center',
            cursor: (isPending || isAutoRetrying) ? 'not-allowed' : 'pointer',
            opacity: (isPending || isAutoRetrying) ? 0.7 : 1,
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            color: 'var(--foreground)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(162, 53, 255, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--surface-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ fontSize: '48px' }}>🔍</div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '10px' }}>I am looking for a PG</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
              Search, filter, and find the perfect accommodation that suits your needs and budget.
            </p>
          </div>
        </button>

        {/* Owner Card */}
        <button 
          onClick={() => handleSelection('owner')}
          disabled={isPending || isAutoRetrying}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--surface-border)',
            borderRadius: '16px',
            padding: '40px 30px',
            width: '280px',
            textAlign: 'center',
            cursor: (isPending || isAutoRetrying) ? 'not-allowed' : 'pointer',
            opacity: (isPending || isAutoRetrying) ? 0.7 : 1,
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            color: 'var(--foreground)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.borderColor = 'var(--secondary)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 61, 144, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--surface-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ fontSize: '48px' }}>🏠</div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '10px' }}>I want to list my PG</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
              List your property, manage bookings, and find reliable tenants quickly and easily.
            </p>
          </div>
        </button>

        </div>
      </div>
    </div>
  );
}
