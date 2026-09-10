import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/utils/db';
import { User } from '@/models/User';
import { PGProperty } from '@/models/PGProperty';
import { BookingInterest } from '@/models/BookingInterest';
import { SavedProperty } from '@/models/SavedProperty';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete the user
    await User.findByIdAndDelete(id);

    // If user is a searcher, delete their bookings and saved properties
    await BookingInterest.deleteMany({ searcher_id: id });
    await SavedProperty.deleteMany({ searcher_id: id });

    // If user is an owner, delete their properties and cascade delete related data for those properties
    if (user.role === 'owner') {
      const properties = await PGProperty.find({ owner_id: id });
      for (const property of properties) {
        await BookingInterest.deleteMany({ property_id: property._id });
        await SavedProperty.deleteMany({ property_id: property._id });
      }
      await PGProperty.deleteMany({ owner_id: id });
    }

    return NextResponse.json({ success: true, message: 'User and all related data deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
