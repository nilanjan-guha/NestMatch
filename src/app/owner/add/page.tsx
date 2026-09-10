'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddProperty() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: { street: '', city: '', state: '', zip_code: '' },
    gender_type: 'Unisex',
    pricing: { monthly_rent: '', security_deposit: '' },
    capacity: { total_beds: '', available_beds: '', room_details: '' },
    amenities: '',
    rules: '',
    media: ''
  });
  const [files, setFiles] = useState<File[]>([]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: { ...((formData as any)[parent]), [child]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      ...formData,
      pricing: {
        monthly_rent: Number(formData.pricing.monthly_rent),
        security_deposit: Number(formData.pricing.security_deposit)
      },
      capacity: {
        total_beds: Number(formData.capacity.total_beds),
        available_beds: Number(formData.capacity.available_beds),
        room_details: formData.capacity.room_details
      },
      address: {
        ...formData.address,
        coordinates: [77.5946, 12.9716] // Default coordinates
      },
      amenities: formData.amenities.split(',').map(i => i.trim()).filter(Boolean),
      rules: formData.rules.split(',').map(i => i.trim()).filter(Boolean),
      media: [] // we will populate this below
    };

    try {
      // 1. Upload files if any
      let uploadedUrls: string[] = [];
      if (files.length > 0) {
        const uploadData = new FormData();
        files.forEach(f => uploadData.append('files', f));
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData
        });
        const uploadResult = await uploadRes.json();
        if (uploadResult.success) {
          uploadedUrls = uploadResult.urls;
        } else {
          alert(uploadResult.error || 'File upload failed');
          setLoading(false);
          return;
        }
      }

      // 2. Combine manually entered URLs with uploaded URLs
      const manualUrls = formData.media.split(',').map(i => i.trim()).filter(Boolean);
      payload.media = [...manualUrls, ...uploadedUrls] as never[];
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        router.push('/owner/dashboard');
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to add property');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{ padding: '40px 24px' }}>
      <div style={{ marginBottom: '30px' }}>
        <Link href="/owner/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: '10px' }}>← Back to Dashboard</Link>
        <h1 style={{ fontSize: '32px', margin: 0 }}>Add New PG Property</h1>
      </div>
      
      <div className="glass-panel form-panel" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Basic Details */}
          <div>
            <h3 style={{ marginBottom: '15px', color: 'var(--primary)' }}>Basic Details</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              <input type="text" name="name" placeholder="Property Name (e.g., Sunrise PG)" value={formData.name} onChange={handleChange} style={inputStyle} required />
              <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} style={{ ...inputStyle, minHeight: '100px' }} required />
              
              <select name="gender_type" value={formData.gender_type} onChange={handleChange} style={inputStyle}>
                <option value="Unisex">Unisex</option>
                <option value="Male">Male Only</option>
                <option value="Female">Female Only</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 style={{ marginBottom: '15px', color: 'var(--primary)' }}>Location</h3>
            <div className="grid-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <input type="text" name="address.street" placeholder="Street Address" value={formData.address.street} onChange={handleChange} style={inputStyle} className="full-width-mobile span-2-desktop" required />
              <input type="text" name="address.city" placeholder="City" value={formData.address.city} onChange={handleChange} style={inputStyle} required />
              <input type="text" name="address.state" placeholder="State" value={formData.address.state} onChange={handleChange} style={inputStyle} required />
              <input type="text" name="address.zip_code" placeholder="Zip Code" value={formData.address.zip_code} onChange={handleChange} style={inputStyle} required />
            </div>
          </div>

          {/* Pricing & Capacity */}
          <div>
            <h3 style={{ marginBottom: '15px', color: 'var(--primary)' }}>Pricing & Capacity</h3>
            <div className="grid-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <input type="number" name="pricing.monthly_rent" placeholder="Monthly Rent (₹)" value={formData.pricing.monthly_rent} onChange={handleChange} style={inputStyle} required />
              <input type="number" name="pricing.security_deposit" placeholder="Security Deposit (₹)" value={formData.pricing.security_deposit} onChange={handleChange} style={inputStyle} required />
              
              <input type="number" name="capacity.total_beds" placeholder="Total Beds" value={formData.capacity.total_beds} onChange={handleChange} style={inputStyle} required />
              <input type="number" name="capacity.available_beds" placeholder="Available Beds" value={formData.capacity.available_beds} onChange={handleChange} style={inputStyle} required />
              <input type="text" name="capacity.room_details" placeholder="Room/Bed Details (e.g., Room 204, Bed A)" value={formData.capacity.room_details} onChange={handleChange} style={inputStyle} className="full-width-mobile span-2-desktop" />
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <h3 style={{ marginBottom: '15px', color: 'var(--primary)' }}>Amenities & Rules</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              <input type="text" name="amenities" placeholder="Amenities (comma separated, e.g., WiFi, AC, Meals)" value={formData.amenities} onChange={handleChange} style={inputStyle} />
              <input type="text" name="rules" placeholder="Rules (comma separated, e.g., No smoking, Curfew at 10 PM)" value={formData.rules} onChange={handleChange} style={inputStyle} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ color: 'var(--text-muted)' }}>Upload Images & Videos</label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*" 
                  onChange={(e) => {
                    if (e.target.files) {
                      setFiles(Array.from(e.target.files));
                    }
                  }} 
                  style={inputStyle} 
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Or add image URLs manually below:</span>
                <input type="text" name="media" placeholder="Image/Video URLs (comma separated)" value={formData.media} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ padding: '16px', borderRadius: '8px', background: 'linear-gradient(45deg, var(--primary), var(--secondary))', color: 'white', border: 'none', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px', fontSize: '18px' }}>
            {loading ? 'Publishing...' : 'Publish Property'}
          </button>
        </form>
      </div>
    </main>
  );
}

const inputStyle = {
  padding: '14px', 
  borderRadius: '8px', 
  background: 'var(--surface)', 
  border: '1px solid var(--surface-border)', 
  color: 'var(--foreground)',
  fontSize: '16px'
};
