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

  const updateData: any = {
    role,
    onboarded: true,
    clerkId: userId,
  };
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;

  if (user) {
    await User.updateOne({ _id: user._id }, { $set: updateData });
  } else {
    await User.create({
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
