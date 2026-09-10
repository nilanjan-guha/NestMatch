'use server'

import { auth, currentUser } from '@clerk/nextjs/server';
import { User } from '@/models/User';
import connectToDatabase from '@/utils/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function completeOnboarding(role: 'owner' | 'searcher', name: string, phone: string) {
  const { userId } = await auth();
  const clerkUser = await currentUser();

  if (!userId || !clerkUser) {
    throw new Error('Not authenticated');
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;

  await connectToDatabase();

  let user = await User.findOne({ clerkId: userId });
  
  if (!user && email) {
    user = await User.findOne({ email });
  }

  if (user) {
    user.role = role;
    user.onboarded = true;
    user.clerkId = userId;
    if (name) user.name = name;
    if (phone) user.phone = phone;
    await user.save();
  } else {
    user = await User.create({
      clerkId: userId,
      email: email || `${userId}@placeholder.com`,
      name: name || clerkUser.firstName || email?.split('@')[0] || 'User',
      phone: phone || '',
      role,
      onboarded: true
    });
  }

  // Clear Next.js cache so the Navbar updates immediately
  revalidatePath('/', 'layout');
}
