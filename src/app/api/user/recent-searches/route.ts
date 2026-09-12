import { NextResponse } from 'next/server';
import connectToDatabase from '@/utils/db';
import { User } from '@/models/User';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findOne({ clerkId: userId }).select('recent_searches').lean();
    
    return NextResponse.json({ recent_searches: user?.recent_searches || [] });
  } catch (error) {
    console.error("Error fetching recent searches:", error);
    return NextResponse.json({ recent_searches: [] }, { status: 500 });
  }
}
