import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User } from '@/models/User';
import connectToDatabase from '@/utils/db';
import { PGProperty } from '@/models/PGProperty';

export async function GET() {
  try {
    const { userId } = await auth();
    let session = null;
    if (userId) {
      session = { user: await User.findOne({ clerkId: userId }) };
    }
    if (!session || (session.user as any).role !== 'owner') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const properties = await PGProperty.find({ owner_id: (session.user as any).id }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, properties });
  } catch (error: any) {
    console.error("Fetch properties error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
