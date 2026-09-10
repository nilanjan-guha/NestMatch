import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/utils/db';
import { PGProperty } from '@/models/PGProperty';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
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
