import { NextResponse } from 'next/server';
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { User } from '@/models/User';
import connectToDatabase from '@/utils/db';
import { PGProperty } from '@/models/PGProperty';
import { BookingInterest } from '@/models/BookingInterest';
import { SavedProperty } from '@/models/SavedProperty';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;
    const phone = clerkUser?.phoneNumbers?.[0]?.phoneNumber;
    const isSuperAdmin = (email && email === process.env.ADMIN_EMAIL) || (phone && phone === process.env.ADMIN_PHONE);

    let session = null;
    if (userId) {
      session = { user: await User.findOne({ clerkId: userId }) };
    }
    
    // Check if the user is a super admin OR a database admin
    if (!isSuperAdmin && (!session || (session.user as any).role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isTargetSuperAdmin = (user.email && user.email === process.env.ADMIN_EMAIL) || (user.phone && user.phone === process.env.ADMIN_PHONE);
    
    if (isTargetSuperAdmin) {
      return NextResponse.json({ error: 'Cannot delete the Super Admin.' }, { status: 403 });
    }

    // Completely delete the user from Clerk so they are forced to register again!
    if (user.clerkId) {
      try {
        const client = await clerkClient();
        await client.users.deleteUser(user.clerkId);
      } catch (clerkError) {
        console.error("Failed to delete from Clerk (they may already be deleted):", clerkError);
      }
    }

    // Delete the user from MongoDB
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
