'use client';
import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  properties?: any[];
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi there! 👋 I am your NestMatch AI Copilot. Looking for a PG? Tell me what you need (e.g. "Girls PG near DLF Phase 3 under 15k").' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.reply,
          properties: data.properties 
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered a network error.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: 'white',
            border: 'none',
            boxShadow: '0 8px 24px rgba(162, 53, 255, 0.4)',
            cursor: 'pointer',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            transition: 'transform 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          ✨
        </button>
      )}

      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '350px',
          height: '500px',
          background: 'var(--background)',
          borderRadius: '24px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          border: '1px solid var(--surface-border)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>✨</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>NestMatch Copilot</h3>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>AI Assistant</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--surface)',
                  color: msg.role === 'user' ? 'white' : 'var(--foreground)',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--surface-border)'
                }}>
                  {msg.content}
                </div>
                
                {msg.properties && msg.properties.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    {msg.properties.map((pg, i) => (
                      <a href={`/pg/${pg._id || pg.id}`} key={i} target="_blank" rel="noopener noreferrer" style={{
                        display: 'flex',
                        gap: '10px',
                        background: 'var(--surface)',
                        border: '1px solid var(--surface-border)',
                        padding: '10px',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        color: 'var(--foreground)'
                      }}>
                        <img src={pg.media?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80'} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 5px 0', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>{pg.name}</h4>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>₹{pg.pricing?.monthly_rent}/mo</p>
                          <p style={{ margin: 0, fontSize: '11px', color: 'var(--primary)' }}>{pg.address?.city}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--surface)', padding: '12px 16px', borderRadius: '20px 20px 20px 4px', border: '1px solid var(--surface-border)' }}>
                <span className="typing-dot" style={{ animationDelay: '0s' }}>.</span>
                <span className="typing-dot" style={{ animationDelay: '0.2s' }}>.</span>
                <span className="typing-dot" style={{ animationDelay: '0.4s' }}>.</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '15px', borderTop: '1px solid var(--surface-border)', display: 'flex', gap: '10px', background: 'var(--surface)' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask anything..."
              style={{
                flex: 1,
                background: 'var(--background)',
                border: '1px solid var(--surface-border)',
                borderRadius: '20px',
                padding: '10px 15px',
                color: 'var(--foreground)',
                outline: 'none'
              }}
            />
            <button 
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
                opacity: (loading || !input.trim()) ? 0.5 : 1
              }}
            >
              ➤
            </button>
          </div>
          <style>{`
            .typing-dot {
              display: inline-block;
              font-size: 20px;
              line-height: 10px;
              animation: jump 1s infinite;
            }
            @keyframes jump {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-5px); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
