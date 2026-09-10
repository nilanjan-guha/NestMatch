import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress;
  const phone = clerkUser?.phoneNumbers?.[0]?.phoneNumber;
  
  const isSuperAdmin = 
    (email && email === process.env.ADMIN_EMAIL) || 
    (phone && phone === process.env.ADMIN_PHONE);

  if (isSuperAdmin) {
    redirect('/admin/dashboard');
  }

  return <>{children}</>;
}
