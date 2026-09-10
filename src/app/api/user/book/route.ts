import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/utils/db';
import { BookingInterest } from '@/models/BookingInterest';
import { PGProperty } from '@/models/PGProperty';

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
    
    // Get the owner_id of this property
    const property = await PGProperty.findById(property_id);
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const searcher_id = (session.user as any).id;

    // Create the interest record (fails if already exists due to unique index)
    try {
      await BookingInterest.create({
        searcher_id,
        property_id,
        owner_id: property.owner_id
      });
      return NextResponse.json({ success: true, message: 'Interest registered successfully' });
    } catch (e: any) {
      if (e.code === 11000) {
        return NextResponse.json({ error: 'You have already expressed interest in this property.' }, { status: 400 });
      }
      throw e;
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
