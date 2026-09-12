'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function MenuCloseOnNavigate() {
  const pathname = usePathname();

  useEffect(() => {
    // Whenever the route changes, close the mobile menu if it's open
    const cb = document.getElementById('mobile-menu-toggle') as HTMLInputElement;
    if (cb && cb.checked) {
      cb.checked = false;
    }
  }, [pathname]);

  return null;
}
