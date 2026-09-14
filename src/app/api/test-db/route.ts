import { NextResponse } from 'next/server';
import connectToDatabase from '@/utils/db';
import { PGProperty } from '@/models/PGProperty';
import { User } from '@/models/User';

export async function GET() {
  try {
    await connectToDatabase();
    const properties = await PGProperty.find({});
    const users = await User.find({});
    return NextResponse.json({
      properties: properties.map(p => ({
        id: p._id,
        owner_id: p.owner_id,
        kyc_status: p.kyc_status,
        kyc_documents: p.kyc_documents
      })),
      users: users.map(u => ({
        id: u._id,
        role: u.role
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
