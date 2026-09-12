import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User } from '@/models/User';
import connectToDatabase from '@/utils/db';
import { SavedProperty } from '@/models/SavedProperty';
import { PGProperty } from '@/models/PGProperty';

export async function GET() {
  try {
    const { userId } = await auth();
    let session = null;
    if (userId) {
      await connectToDatabase();
      session = { user: await User.findOne({ clerkId: userId }) };
    }
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Fetch all saved properties for the user, populated with the actual property data
    const saved = await SavedProperty.find({ user_id: (session.user as any)._id })
      .populate('property_id')
      .sort({ createdAt: -1 });

    const properties = saved.map(s => {
      // If it's a locally stored PG, property_id is populated as the full object
      if (s.property_id && typeof s.property_id === 'object' && (s.property_id as any).name) {
        return s.property_id;
      }
      // Otherwise, it's a Google Maps PG cached in property_data
      return s.property_data;
    }).filter(Boolean); // Filter out any nulls

    return NextResponse.json({ success: true, properties });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    let session = null;
    if (userId) {
      await connectToDatabase();
      session = { user: await User.findOne({ clerkId: userId }) };
    }
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { property_id, property_data } = body;
    if (!property_id) {
      return NextResponse.json({ error: 'property_id is required' }, { status: 400 });
    }

    await connectToDatabase();
    const user_id = (session.user as any)._id;

    // Check if it already exists
    const existing = await SavedProperty.findOne({ user_id, property_id });
    
    if (existing) {
      // Toggle off (remove)
      await SavedProperty.deleteOne({ _id: existing._id });
      try {
        await PGProperty.updateOne({ _id: property_id }, { $inc: { savesCount: -1 } });
      } catch (e) {} // Ignore error for non-ObjectId (e.g. Google Maps places)
      return NextResponse.json({ success: true, saved: false });
    } else {
      // Toggle on (add)
      await SavedProperty.create({ user_id, property_id, property_data: property_data || null });
      try {
        await PGProperty.updateOne({ _id: property_id }, { $inc: { savesCount: 1 } });
      } catch (e) {} // Ignore error for non-ObjectId
      return NextResponse.json({ success: true, saved: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
