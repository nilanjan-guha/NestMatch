'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [role, setRole] = useState('searcher');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, location, coordinates, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      
      // Auto login after registration
      await signIn('credentials', { redirect: false, email, password });
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setPassword('');
    }
  };

  const handleLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        
        const city = data.address.city || data.address.town || data.address.village || data.address.county || 'my location';
        const area = data.address.suburb || data.address.neighbourhood || '';
        
        setLocation(area ? `${area}, ${city}` : city);
        setCoordinates([longitude, latitude]);
      } catch (error) {
        console.error("Error fetching location", error);
        alert("Failed to get location automatically. Please type it in.");
      } finally {
        setLoadingLoc(false);
      }
    }, () => {
      alert('Unable to retrieve your location. Please type it in manually.');
      setLoadingLoc(false);
    });
  };

  const inputStyle = { padding: '12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--foreground)' };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '450px' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '20px', textAlign: 'center' }}>Create Account</h2>
        {error && <p style={{ color: '#ef4444', marginBottom: '15px', textAlign: 'center' }}>{error}</p>}
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Full Name" 
            value={name}
            onChange={e => setName(e.target.value)}
            autoComplete="name"
            style={inputStyle}
            required
          />
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            style={inputStyle}
            required
          />
          <input 
            type="tel" 
            placeholder="Phone Number (e.g. 9734147131)" 
            value={phone}
            onChange={e => setPhone(e.target.value)}
            autoComplete="tel"
            style={inputStyle}
            required
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="City or Area (e.g., Bangalore)" 
              value={location}
              onChange={e => setLocation(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
              required
            />
            <button 
              type="button" 
              onClick={handleLocation}
              disabled={loadingLoc}
              title="Use current location"
              style={{ padding: '0 15px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--surface-border)', cursor: 'pointer', fontSize: '18px' }}
            >
              {loadingLoc ? '...' : '📍'}
            </button>
          </div>
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            style={inputStyle}
            required
          />
          <div style={{ position: 'relative' }}>
            <div 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ padding: '12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>{role === 'searcher' ? 'I am looking for a PG' : 'I want to list my PG'}</span>
              <span style={{ fontSize: '12px', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
            </div>
            {dropdownOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: 'var(--background)', border: '1px solid var(--surface-border)', borderRadius: '8px', overflow: 'hidden', zIndex: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                <div 
                  onClick={() => { setRole('searcher'); setDropdownOpen(false); }}
                  style={{ padding: '12px', cursor: 'pointer', background: role === 'searcher' ? 'var(--surface)' : 'transparent', color: 'var(--foreground)', transition: 'background 0.2s' }}
                >
                  I am looking for a PG
                </div>
                <div 
                  onClick={() => { setRole('owner'); setDropdownOpen(false); }}
                  style={{ padding: '12px', cursor: 'pointer', background: role === 'owner' ? 'var(--surface)' : 'transparent', color: 'var(--foreground)', transition: 'background 0.2s' }}
                >
                  I want to list my PG
                </div>
              </div>
            )}
          </div>
          <button type="submit" style={{ padding: '12px', borderRadius: '8px', background: 'linear-gradient(45deg, var(--primary), var(--secondary))', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
            Register
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--primary)' }}>Login</Link>
        </p>
      </div>
    </div>
  );
}
