'use client';
import { useState } from 'react';

export default function MediaCarousel({ 
  media, 
  height = '400px', 
  objectFit = 'contain',
  disableFullScreen = false
}: { 
  media: string[], 
  height?: string, 
  objectFit?: 'contain' | 'cover',
  disableFullScreen?: boolean
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);

  if (!media || media.length === 0) {
    return (
      <div style={{ width: '100%', height, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No media available
      </div>
    );
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const currentMedia = media[currentIndex];
  const isVideo = currentMedia.match(/\.(mp4|webm|ogg)$/i) || currentMedia.includes('video');

  return (
    <div style={{ position: 'relative', width: '100%', height, background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
      
      {/* Media Rendering */}
      {isVideo ? (
        <video 
          key={currentMedia}
          src={currentMedia} 
          controls 
          style={{ width: '100%', height: '100%', objectFit, animation: 'fadeIn 0.3s ease-in-out', cursor: disableFullScreen ? 'pointer' : 'zoom-in' }}
          onClick={(e) => { 
            if (!disableFullScreen) {
              e.stopPropagation(); 
              setFullScreen(true); 
            }
          }}
        />
      ) : (
        <img 
          key={currentMedia}
          src={currentMedia} 
          alt={`Media ${currentIndex + 1}`} 
          style={{ width: '100%', height: '100%', objectFit, animation: 'fadeIn 0.3s ease-in-out', cursor: disableFullScreen ? 'pointer' : 'zoom-in' }}
          onClick={(e) => { 
            if (!disableFullScreen) {
              e.stopPropagation(); 
              setFullScreen(true); 
            }
          }}
        />
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0.5; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Navigation Controls */}
      {media.length > 1 && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            style={navButtonStyle('left')}
          >
            &#10094;
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            style={navButtonStyle('right')}
          >
            &#10095;
          </button>
        </>
      )}

      {/* Indicators */}
      {media.length > 1 && (
        <div style={{ position: 'absolute', bottom: '15px', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {media.map((_, idx) => (
            <div 
              key={idx} 
              style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: idx === currentIndex ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer'
              }}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
            />
          ))}
        </div>
      )}

      {/* Full Screen Lightbox */}
      {fullScreen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.9)', zIndex: 100000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={(e) => { e.stopPropagation(); setFullScreen(false); }}>
          
          <button 
            onClick={(e) => { e.stopPropagation(); setFullScreen(false); }}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white', fontSize: '30px', cursor: 'pointer', zIndex: 100001 }}
          >
            ✕
          </button>

          {media.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} style={navButtonStyle('left')}>&#10094;</button>
              <button onClick={(e) => { e.stopPropagation(); handleNext(); }} style={navButtonStyle('right')}>&#10095;</button>
            </>
          )}

          {isVideo ? (
            <video 
              key={currentMedia}
              src={currentMedia} 
              controls 
              style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img 
              key={currentMedia}
              src={currentMedia} 
              alt="Fullscreen Media" 
              style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
}

const navButtonStyle = (side: 'left' | 'right') => ({
  position: 'absolute' as 'absolute',
  top: '50%',
  [side]: '10px',
  transform: 'translateY(-50%)',
  background: 'rgba(0,0,0,0.5)',
  color: 'white',
  border: 'none',
  padding: '12px',
  cursor: 'pointer',
  borderRadius: '50%',
  fontSize: '18px',
  zIndex: 10
});
