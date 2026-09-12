import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import connectToDatabase from '@/utils/db';
import { User } from '@/models/User';

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

  if (clerkUser) {
    await connectToDatabase();
    const dbUser = await User.findOne({ clerkId: clerkUser.id });
    if (dbUser?.onboarded) {
      redirect('/');
    }
  }

  return <>{children}</>;
}
