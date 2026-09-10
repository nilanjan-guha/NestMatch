import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/utils/db';
import { BookingInterest } from '@/models/BookingInterest';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
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
