import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/utils/db';
import { SavedProperty } from '@/models/SavedProperty';
import { PGProperty } from '@/models/PGProperty';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Fetch all saved properties for the user, populated with the actual property data
    const saved = await SavedProperty.find({ user_id: (session.user as any).id })
      .populate('property_id')
      .sort({ createdAt: -1 });

    const properties = saved.map(s => s.property_id);
    return NextResponse.json({ success: true, properties });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { property_id } = body;
    if (!property_id) {
      return NextResponse.json({ error: 'property_id is required' }, { status: 400 });
    }

    await connectToDatabase();
    const user_id = (session.user as any).id;

    // Check if it already exists
    const existing = await SavedProperty.findOne({ user_id, property_id });
    
    if (existing) {
      // Toggle off (remove)
      await SavedProperty.deleteOne({ _id: existing._id });
      return NextResponse.json({ success: true, saved: false });
    } else {
      // Toggle on (add)
      await SavedProperty.create({ user_id, property_id });
      return NextResponse.json({ success: true, saved: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
