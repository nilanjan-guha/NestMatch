'use client';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import ThemeToggle from './ThemeToggle';

export default function MobileAuthButtons() {
  const closeMenu = () => {
    const cb = document.getElementById('mobile-menu-toggle') as HTMLInputElement;
    if (cb) cb.checked = false;
  };

  return (
    <div className="stack-mobile" style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '100%' }}>
      <ThemeToggle />
      <div className="hide-mobile" style={{ width: '1px', height: '24px', background: 'var(--surface-border)' }}></div>
      <SignInButton mode="modal">
        <button 
          onClick={closeMenu}
          style={{ height: '40px', padding: '0 20px', color: 'var(--foreground)', background: 'var(--surface)', border: '1px solid var(--surface-border)', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
          Login
        </button>
      </SignInButton>
      <SignUpButton mode="modal" fallbackRedirectUrl="/onboarding">
        <button 
          onClick={closeMenu}
          style={{ height: '40px', padding: '0 20px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
          Register
        </button>
      </SignUpButton>
    </div>
  );
}
