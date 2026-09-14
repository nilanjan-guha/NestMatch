'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface LifestyleQuizModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  existingData?: {
    sleep: string;
    diet: string;
    smoking: string;
    social: string;
  };
}

export default function LifestyleQuizModal({ onClose, onSuccess, existingData }: LifestyleQuizModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sleep: existingData?.sleep || '',
    diet: existingData?.diet || '',
    smoking: existingData?.smoking || '',
    social: existingData?.social || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sleep || !formData.diet || !formData.smoking || !formData.social) {
      toast.error('Please answer all questions!');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Saving lifestyle preferences...');
    
    try {
      const res = await fetch('/api/user/lifestyle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Preferences saved successfully! 🎉', { id: loadingToast });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to save preferences', { id: loadingToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const selectStyle = {
    width: '100%',
    padding: '12px',
    background: 'var(--surface)',
    border: '1px solid var(--surface-border)',
    borderRadius: '8px',
    color: 'var(--foreground)',
    outline: 'none',
    fontSize: '15px'
  };

  const optionStyle = {
    background: 'var(--background)',
    color: 'var(--foreground)'
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 100000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div 
        className="glass-panel" 
        style={{ width: '100%', maxWidth: '500px', padding: '30px', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '24px', cursor: 'pointer' }}>×</button>
        
        <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>🤝 Lifestyle Matcher</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '25px', fontSize: '14px' }}>
          Answer 4 quick questions to let our AI find your most compatible roommates and PGs.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>1. What is your typical sleep schedule?</label>
            <select name="sleep" value={formData.sleep} onChange={handleChange} style={selectStyle} required>
              <option value="" style={optionStyle} disabled>Select an option</option>
              <option value="Early Bird (Asleep by 10 PM)" style={optionStyle}>Early Bird (Asleep by 10 PM)</option>
              <option value="Standard (11 PM - 12 AM)" style={optionStyle}>Standard (11 PM - 12 AM)</option>
              <option value="Night Owl (1 AM or later)" style={optionStyle}>Night Owl (1 AM or later)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>2. What are your dietary preferences?</label>
            <select name="diet" value={formData.diet} onChange={handleChange} style={selectStyle} required>
              <option value="" style={optionStyle} disabled>Select an option</option>
              <option value="Strict Vegetarian" style={optionStyle}>Strict Vegetarian</option>
              <option value="Eggetarian" style={optionStyle}>Eggetarian</option>
              <option value="Non-Vegetarian" style={optionStyle}>Non-Vegetarian</option>
              <option value="Vegan" style={optionStyle}>Vegan</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>3. How do you feel about smoking/drinking in the room?</label>
            <select name="smoking" value={formData.smoking} onChange={handleChange} style={selectStyle} required>
              <option value="" style={optionStyle} disabled>Select an option</option>
              <option value="Strictly No (Cannot tolerate)" style={optionStyle}>Strictly No (Cannot tolerate)</option>
              <option value="Neutral (I don't mind occasionally)" style={optionStyle}>Neutral (I don't mind occasionally)</option>
              <option value="Yes (I prefer it or do it myself)" style={optionStyle}>Yes (I prefer it or do it myself)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>4. What is your social vibe?</label>
            <select name="social" value={formData.social} onChange={handleChange} style={selectStyle} required>
              <option value="" style={optionStyle} disabled>Select an option</option>
              <option value="Quiet & Reserved (Keep to myself)" style={optionStyle}>Quiet & Reserved (Keep to myself)</option>
              <option value="Friendly (Casual chats are fine)" style={optionStyle}>Friendly (Casual chats are fine)</option>
              <option value="Life of the Party (Love hanging out)" style={optionStyle}>Life of the Party (Love hanging out)</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '10px', width: '100%', padding: '14px', background: 'var(--primary)', 
              color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', 
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: '0.2s'
            }}
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>
      </div>
    </div>
  );
}
