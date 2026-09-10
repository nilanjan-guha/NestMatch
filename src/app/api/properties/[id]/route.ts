import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { User } from '@/models/User';
import connectToDatabase from '@/utils/db';
import { PGProperty } from '@/models/PGProperty';
import { BookingInterest } from '@/models/BookingInterest';
import { SavedProperty } from '@/models/SavedProperty';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    let session = null;
    if (userId) {
      session = { user: await User.findOne({ clerkId: userId }) };
    }
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();

    const property = await PGProperty.findById(id);
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Only allow editing if the user is the owner or an admin
    const userRole = (session.user as any).role;
    const sessionUserId = (session.user as any).id;
    
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;
    const phone = clerkUser?.phoneNumbers?.[0]?.phoneNumber;
    const isSuperAdmin = (email && email === process.env.ADMIN_EMAIL) || (phone && phone === process.env.ADMIN_PHONE);

    if (!isSuperAdmin && userRole !== 'admin' && property.owner_id.toString() !== sessionUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prevent owner_id from being changed
    delete body.owner_id;

    const updatedProperty = await PGProperty.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, property: updatedProperty });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    let session = null;
    if (userId) {
      session = { user: await User.findOne({ clerkId: userId }) };
    }
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const property = await PGProperty.findById(id);
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Only allow deletion if the user is the owner or an admin
    const userRole = (session.user as any).role;
    const sessionUserId = (session.user as any).id;
    
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;
    const phone = clerkUser?.phoneNumbers?.[0]?.phoneNumber;
    const isSuperAdmin = (email && email === process.env.ADMIN_EMAIL) || (phone && phone === process.env.ADMIN_PHONE);

    if (!isSuperAdmin && userRole !== 'admin' && property.owner_id.toString() !== sessionUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await PGProperty.findByIdAndDelete(id);

    // Cascade delete related records
    await BookingInterest.deleteMany({ property_id: id });
    await SavedProperty.deleteMany({ property_id: id });

    return NextResponse.json({ success: true, message: 'Property and related data deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
