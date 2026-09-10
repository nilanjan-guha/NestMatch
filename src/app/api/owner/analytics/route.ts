import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User } from '@/models/User';
import connectToDatabase from '@/utils/db';
import { BookingInterest } from '@/models/BookingInterest';

export async function GET() {
  try {
    const { userId } = await auth();
    let session = null;
    if (userId) {
      session = { user: await User.findOne({ clerkId: userId }) };
    }
    if (!session || (session.user as any)?.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Fetch all interests expressed for this owner's properties, populate searcher and property details
    const interests = await BookingInterest.find({ owner_id: (session.user as any).id })
      .populate('searcher_id', 'name email phone')
      .populate('property_id', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, interests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
