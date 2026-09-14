import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/utils/db';
import { User } from '@/models/User';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sleep, diet, smoking, social } = await req.json();

    if (!sleep || !diet || !smoking || !social) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      { 
        $set: { 
          lifestyle: { sleep, diet, smoking, social } 
        } 
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    return NextResponse.json({ success: true, lifestyle: updatedUser.lifestyle });

  } catch (error) {
    console.error('Error saving lifestyle preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
