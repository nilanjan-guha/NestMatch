'use client';

import { useEffect, useState } from 'react';

type BadgeType = 'viewers' | 'scarcity' | 'rare';

export default function UrgencyBadge({ propertyId }: { propertyId: string }) {
  const [badgeType, setBadgeType] = useState<BadgeType | null>(null);
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    // Generate a consistent but pseudo-random number based on the propertyId string
    // so it doesn't change wildly on every single render, but looks dynamic across properties.
    let hash = 0;
    for (let i = 0; i < propertyId.length; i++) {
      hash = propertyId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seed = Math.abs(hash);

    // Determine badge type based on seed
    const typeMod = seed % 100;
    let selectedType: BadgeType = 'viewers';
    if (typeMod < 15) selectedType = 'rare'; // 15% chance
    else if (typeMod < 45) selectedType = 'scarcity'; // 30% chance
    
    setBadgeType(selectedType);

    // Determine count based on seed
    if (selectedType === 'viewers') {
      setCount((seed % 6) + 2); // 2 to 7 viewers
    } else if (selectedType === 'scarcity') {
      setCount((seed % 3) + 1); // 1 to 3 beds left
    }
  }, [propertyId]);

  if (!badgeType) return null; // Prevent hydration mismatch

  let content = null;
  let bgGradient = '';
  let borderColor = '';
  let icon = '';

  if (badgeType === 'viewers') {
    content = `${count} people viewing this right now`;
    bgGradient = 'linear-gradient(135deg, rgba(255, 69, 58, 0.1), rgba(255, 159, 10, 0.15))';
    borderColor = 'rgba(255, 69, 58, 0.3)';
    icon = '🔥';
  } else if (badgeType === 'scarcity') {
    content = `Only ${count} bed${count > 1 ? 's' : ''} left!`;
    bgGradient = 'linear-gradient(135deg, rgba(255, 159, 10, 0.15), rgba(255, 214, 10, 0.15))';
    borderColor = 'rgba(255, 159, 10, 0.3)';
    icon = '⚡';
  } else if (badgeType === 'rare') {
    content = `Rare find in this area`;
    bgGradient = 'linear-gradient(135deg, rgba(191, 90, 242, 0.15), rgba(94, 92, 230, 0.15))';
    borderColor = 'rgba(191, 90, 242, 0.3)';
    icon = '💎';
  }

  return (
    <div 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        background: bgGradient,
        border: `1px solid ${borderColor}`,
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 'bold',
        color: 'var(--foreground)',
        backdropFilter: 'blur(4px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        animation: 'pulseGlow 2s infinite alternate',
      }}
    >
      <span style={{ fontSize: '14px' }}>{icon}</span>
      <span>{content}</span>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulseGlow {
          0% { filter: brightness(1); }
          100% { filter: brightness(1.2); }
        }
      `}} />
    </div>
  );
}
