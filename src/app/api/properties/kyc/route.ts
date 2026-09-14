import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/utils/db';
import { User } from '@/models/User';
import { PGProperty } from '@/models/PGProperty';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { propertyId, documents } = await req.json();

    if (!propertyId || !documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json({ error: 'Property ID and documents are required' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Find the user to ensure they are an owner
    const user = await User.findOne({ clerkId: userId });
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can upload KYC documents' }, { status: 403 });
    }

    // Find the property and make sure this owner owns it
    const property = await PGProperty.findById(propertyId);
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (property.owner_id.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'You do not have permission to modify this property' }, { status: 403 });
    }

    // Update KYC status
    property.kyc_documents = documents;
    property.kyc_status = 'pending';
    
    await property.save();

    return NextResponse.json({ success: true, message: 'KYC documents submitted successfully' });

  } catch (error) {
    console.error('Error submitting KYC docs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
