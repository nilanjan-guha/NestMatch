'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function OnboardingRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/onboarding') {
      router.push('/onboarding');
    }
  }, [pathname, router]);

  return null;
}
