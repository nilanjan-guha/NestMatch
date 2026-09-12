import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SearchAlert from '@/lib/models/SearchAlert';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    // Optional: we can check if user is logged in to associate, but anyone can subscribe
    const body = await req.json();
    const { phoneNumber, query, coordinates } = body;

    if (!phoneNumber || !query) {
      return NextResponse.json({ success: false, error: 'Phone number and query are required' }, { status: 400 });
    }

    const newAlert = await SearchAlert.create({
      phoneNumber,
      query,
      coordinates
    });

    return NextResponse.json({ success: true, data: newAlert });
  } catch (error: any) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
