import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/utils/db';
import { PGProperty } from '@/models/PGProperty';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'owner') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    await connectToDatabase();

    const newProperty = await PGProperty.create({
      ...data,
      owner_id: (session.user as any).id
    });

    return NextResponse.json({ success: true, property: newProperty });
  } catch (error: any) {
    console.error("Property creation error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    // Fetch all properties, potentially with a limit for the homepage
    const properties = await PGProperty.find({}).limit(20).lean();
    return NextResponse.json({ success: true, data: properties });
  } catch (error: any) {
    console.error("Fetch properties error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
