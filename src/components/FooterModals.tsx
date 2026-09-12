'use client';
import { useState } from 'react';

type ModalType = 'about' | 'howItWorks' | 'listProperty' | 'contact' | 'privacy' | 'terms' | null;

export default function FooterModals({ activeModal, onClose }: { activeModal: ModalType, onClose: () => void }) {
  if (!activeModal) return null;

  const modalContent: Record<string, { title: string; content: React.ReactNode }> = {
    about: {
      title: '🏠 About NestMatch',
      content: (
        <div style={{ lineHeight: '1.8' }}>
          <p style={{ fontSize: '16px', marginBottom: '20px', color: 'var(--text-muted)' }}>
            NestMatch is an AI-powered PG (Paying Guest) finding platform that helps you discover the perfect home away from home.
            Built with love to solve the real struggle of finding safe, affordable, and comfortable PG accommodations.
          </p>

          <div style={{ background: 'rgba(99,102,241,0.08)', padding: '20px', borderRadius: '14px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '14px', color: 'var(--primary)' }}>👨‍💻 Created By</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>👤</span>
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Nilanjan Guha</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📧</span>
                <a href="mailto:nilanjanguha8@gmail.com" style={{ color: 'var(--secondary)', textDecoration: 'none' }}>nilanjanguha8@gmail.com</a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📞</span>
                <a href="tel:+919734147131" style={{ color: 'var(--secondary)', textDecoration: 'none' }}>+91 9734147131</a>
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(236,72,153,0.08)', padding: '20px', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '14px', color: 'var(--secondary)' }}>🚀 Our Mission</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              To make PG hunting stress-free by combining AI intelligence with real Google Maps data,
              so you can find verified, safe, and affordable accommodation in seconds — not days.
            </p>
          </div>
        </div>
      )
    },

    howItWorks: {
      title: '🔍 How NestMatch Works',
      content: (
        <div style={{ lineHeight: '1.8' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { step: '1', icon: '📍', title: 'Set Your Location', desc: 'Type your preferred area in the search bar (e.g., "Sector 18, Noida") or click "Use My Current Location" to auto-detect via GPS.' },
              { step: '2', icon: '✍️', title: 'Describe What You Need', desc: 'Use the requirements box to type in natural language — "Safe PG for girls under ₹5000 with AC and WiFi". Our AI understands you!' },
              { step: '3', icon: '⚡', title: 'Click "Find My PG"', desc: 'Hit the search button or click any Quick Suggestion Chip to instantly search. Our AI processes your request using Gemini AI.' },
              { step: '4', icon: '🏠', title: 'Browse Matched Results', desc: 'See AI-matched results from our database + live Google Maps data. Each property card shows photos, price, distance, rating, and amenities.' },
              { step: '5', icon: '📋', title: 'View Details & Book', desc: 'Click any property card to see full details — reviews, opening hours, photos, contact info. Hit "Book Visit" to register your interest.' },
              { step: '6', icon: '❤️', title: 'Save to Watchlist', desc: 'Love a PG? Click the heart icon to save it to your Watchlist. Compare later and decide at your pace.' },
            ].map((item) => (
              <div key={item.step} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  minWidth: '48px', height: '48px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', flexShrink: 0
                }}>
                  {item.icon}
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Step {item.step}: {item.title}</h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(99,102,241,0.08)', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              💡 <strong>Pro Tip:</strong> Use the sort buttons (AI Recommended, Nearest, Lowest Price) to reorder your results!
            </p>
          </div>
        </div>
      )
    },

    contact: {
      title: '📞 Contact Us',
      content: (
        <div style={{ lineHeight: '1.8' }}>
          <p style={{ fontSize: '16px', marginBottom: '24px', color: 'var(--text-muted)' }}>
            Have questions, feedback, or need help? We&apos;d love to hear from you!
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--surface)', padding: '20px', borderRadius: '14px', border: '1px solid var(--surface-border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: 'var(--primary)' }}>👤 Admin Contact</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>👨‍💻</span>
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Name</p>
                    <p style={{ fontWeight: 'bold' }}>Nilanjan Guha</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>📧</span>
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Email</p>
                    <a href="mailto:nilanjanguha8@gmail.com" style={{ color: 'var(--secondary)', textDecoration: 'none', fontWeight: 'bold' }}>nilanjanguha8@gmail.com</a>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>📞</span>
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Phone</p>
                    <a href="tel:+919734147131" style={{ color: 'var(--secondary)', textDecoration: 'none', fontWeight: 'bold' }}>+91 9734147131</a>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--surface)', padding: '20px', borderRadius: '14px', border: '1px solid var(--surface-border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '10px', color: 'var(--primary)' }}>⏰ Response Time</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                We typically respond within 24 hours. For urgent issues, please call directly.
              </p>
            </div>
          </div>
        </div>
      )
    },

    privacy: {
      title: '🔒 Privacy Policy',
      content: (
        <div style={{ lineHeight: '1.9', fontSize: '14px', color: 'var(--text-muted)' }}>
          <p style={{ marginBottom: '6px', fontSize: '12px', opacity: 0.6 }}>Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <h3 style={{ fontSize: '16px', color: 'var(--foreground)', marginTop: '20px', marginBottom: '8px' }}>1. Information We Collect</h3>
          <p>We collect the following information when you use NestMatch:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
            <li><strong>Account Information:</strong> Name, email address, and phone number provided during sign-up via Clerk Authentication.</li>
            <li><strong>Location Data:</strong> Your location when you use GPS-based search or manually enter an area. This is used solely to find PGs near you.</li>
            <li><strong>Search & Usage Data:</strong> Search queries, saved properties, and booking interests to improve recommendations.</li>
            <li><strong>Device Information:</strong> Browser type, device type, and IP address for analytics (via Google Analytics).</li>
          </ul>

          <h3 style={{ fontSize: '16px', color: 'var(--foreground)', marginTop: '20px', marginBottom: '8px' }}>2. How We Use Your Information</h3>
          <ul style={{ paddingLeft: '20px' }}>
            <li>To provide AI-powered PG search and matching</li>
            <li>To display nearby properties using Google Maps APIs</li>
            <li>To facilitate communication between tenants and property owners</li>
            <li>To improve our services through analytics</li>
            <li>To send booking confirmations and important notifications</li>
          </ul>

          <h3 style={{ fontSize: '16px', color: 'var(--foreground)', marginTop: '20px', marginBottom: '8px' }}>3. Data Security</h3>
          <p>We take data security seriously. All data is stored in encrypted MongoDB Atlas databases. Authentication is handled by Clerk with industry-standard encryption. We do not sell your personal information to third parties.</p>

          <h3 style={{ fontSize: '16px', color: 'var(--foreground)', marginTop: '20px', marginBottom: '8px' }}>4. Your Rights</h3>
          <p>You have the right to access, update, or delete your personal data at any time. Contact us at <a href="mailto:nilanjanguha8@gmail.com" style={{ color: 'var(--secondary)' }}>nilanjanguha8@gmail.com</a> for any data-related requests.</p>

          <h3 style={{ fontSize: '16px', color: 'var(--foreground)', marginTop: '20px', marginBottom: '8px' }}>5. Cookies and Advertising</h3>
          <h3 style={{ fontSize: '16px', color: 'var(--foreground)', marginTop: '20px', marginBottom: '8px' }}>5. Cookies and Advertising</h3>
          <p>We use cookies for authentication sessions, user preferences, and analytics. Additionally, we use third-party advertising companies, including Google, to serve ads when you visit our website.</p>
          <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
            <li>Third-party vendors, including Google, use cookies to serve ads based on your prior visits to NestMatch or other websites.</li>
            <li>Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our site and/or other sites on the Internet.</li>
            <li>You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary)' }}>Google Ads Settings</a>.</li>
          </ul>
          <p style={{ marginTop: '10px' }}>By using NestMatch, you consent to the use of cookies as described.</p>
        </div>
      )
    },

    terms: {
      title: '📜 Terms of Service',
      content: (
        <div style={{ lineHeight: '1.9', fontSize: '14px', color: 'var(--text-muted)' }}>
          <p style={{ marginBottom: '6px', fontSize: '12px', opacity: 0.6 }}>Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <h3 style={{ fontSize: '16px', color: 'var(--foreground)', marginTop: '20px', marginBottom: '8px' }}>1. Acceptance of Terms</h3>
          <p>By accessing and using NestMatch, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>

          <h3 style={{ fontSize: '16px', color: 'var(--foreground)', marginTop: '20px', marginBottom: '8px' }}>2. Description of Service</h3>
          <p>NestMatch is an AI-powered platform that helps users discover and compare PG (Paying Guest) accommodations. We aggregate listings from our database and Google Maps to provide comprehensive search results.</p>

          <h3 style={{ fontSize: '16px', color: 'var(--foreground)', marginTop: '20px', marginBottom: '8px' }}>3. User Accounts</h3>
          <ul style={{ paddingLeft: '20px' }}>
            <li>You must provide accurate information when creating an account.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You must not create multiple accounts or impersonate others.</li>
            <li>Property owners must provide truthful and accurate property listings.</li>
          </ul>

          <h3 style={{ fontSize: '16px', color: 'var(--foreground)', marginTop: '20px', marginBottom: '8px' }}>4. Property Listings</h3>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Property owners are solely responsible for the accuracy of their listings.</li>
            <li>NestMatch does not guarantee the quality, safety, or legality of any listed property.</li>
            <li>We reserve the right to remove listings that violate our guidelines or are reported as fraudulent.</li>
            <li>Google Maps-sourced results are provided as-is from Google&apos;s APIs.</li>
          </ul>

          <h3 style={{ fontSize: '16px', color: 'var(--foreground)', marginTop: '20px', marginBottom: '8px' }}>5. User Conduct</h3>
          <p>Users agree not to:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
            <li>Post false, misleading, or fraudulent content</li>
            <li>Harass property owners or other users</li>
            <li>Scrape, crawl, or use automated tools to extract data</li>
            <li>Attempt to bypass security measures or disrupt the platform</li>
          </ul>

          <h3 style={{ fontSize: '16px', color: 'var(--foreground)', marginTop: '20px', marginBottom: '8px' }}>6. Disclaimer of Warranties</h3>
          <p>NestMatch is provided &quot;as is&quot; without warranties of any kind. We do not guarantee uninterrupted service, accuracy of AI recommendations, or the suitability of any property. Users should independently verify property details before making decisions.</p>

          <h3 style={{ fontSize: '16px', color: 'var(--foreground)', marginTop: '20px', marginBottom: '8px' }}>7. Limitation of Liability</h3>
          <p>NestMatch shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform, including but not limited to property disputes, financial loss, or personal safety issues.</p>

          <h3 style={{ fontSize: '16px', color: 'var(--foreground)', marginTop: '20px', marginBottom: '8px' }}>8. Changes to Terms</h3>
          <p>We reserve the right to modify these terms at any time. Continued use of NestMatch after changes constitutes acceptance of the new terms.</p>

          <h3 style={{ fontSize: '16px', color: 'var(--foreground)', marginTop: '20px', marginBottom: '8px' }}>9. Contact</h3>
          <p>For questions regarding these terms, contact <a href="mailto:nilanjanguha8@gmail.com" style={{ color: 'var(--secondary)' }}>nilanjanguha8@gmail.com</a>.</p>
        </div>
      )
    }
  };

  const current = modalContent[activeModal];
  if (!current) return null;

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 10000, padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto',
          background: 'var(--background)', border: '1px solid var(--surface-border)',
          borderRadius: '20px', position: 'relative', padding: '0',
          boxShadow: '0 30px 60px rgba(0,0,0,0.4)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          position: 'sticky', top: 0, background: 'var(--background)',
          padding: '24px 30px 16px', borderBottom: '1px solid var(--surface-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          zIndex: 2, borderRadius: '20px 20px 0 0'
        }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800' }}>{current.title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'var(--surface)', border: '1px solid var(--surface-border)',
              color: 'var(--foreground)', borderRadius: '50%',
              width: '36px', height: '36px', fontSize: '18px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 30px 30px' }}>
          {current.content}
        </div>
      </div>
    </div>
  );
}
