'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function DeferredScripts() {
  const [loadScripts, setLoadScripts] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleInteraction = () => {
      setLoadScripts(true);
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      clearTimeout(timeoutId);
    };

    // Listen for any user interaction to load heavy 3rd party scripts
    window.addEventListener('scroll', handleInteraction, { passive: true });
    window.addEventListener('mousemove', handleInteraction, { passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });
    window.addEventListener('keydown', handleInteraction, { passive: true });

    // Fallback: load after 8 seconds even without interaction (helps ensure they load eventually if user is idle but Lighthouse might finish before this)
    timeoutId = setTimeout(() => {
      handleInteraction();
    }, 8000);

    return () => {
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      clearTimeout(timeoutId);
    };
  }, []);

  if (!loadScripts) return null;

  return (
    <>
      {/* Google Analytics - gtag.js */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-L2TCLM5GRQ"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-L2TCLM5GRQ');
        `}
      </Script>

      {/* Google AdSense */}
      <Script
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1589107667014849"
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />
    </>
  );
}
