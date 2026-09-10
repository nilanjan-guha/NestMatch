'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password
    });
    
    if (res?.error) {
      setError("Invalid email or password");
      setEmail('');
      setPassword('');
    } else {
      setEmail('');
      setPassword('');
      router.push('/');
      router.refresh(); // to update Navbar session
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '20px', textAlign: 'center' }}>Welcome Back</h2>
        {error && <p style={{ color: '#ef4444', marginBottom: '15px', textAlign: 'center' }}>{error}</p>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="username"
            style={{ padding: '12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--foreground)' }}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{ padding: '12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--foreground)' }}
            required
          />
          <button type="submit" style={{ padding: '12px', borderRadius: '8px', background: 'linear-gradient(45deg, var(--primary), var(--secondary))', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
            Login
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)' }}>
          Don't have an account? <Link href="/register" style={{ color: 'var(--primary)' }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
