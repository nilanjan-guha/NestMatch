import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User } from '@/models/User';
import connectToDatabase from '@/utils/db';
import { BookingInterest } from '@/models/BookingInterest';
import { PGProperty } from '@/models/PGProperty';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    let session = null;
    if (userId) {
      session = { user: await User.findOne({ clerkId: userId }) };
    }
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

      // Try sending an email notification using Resend
      if (process.env.RESEND_API_KEY) {
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        try {
          const userEmail = (session.user as any).email || 'test@example.com'; 
          
          await resend.emails.send({
            from: 'onboarding@resend.dev', // Resend default testing email
            to: process.env.ADMIN_EMAIL || userEmail,
            subject: `Visit Scheduled for ${property.name}`,
            html: `
              <h2>Visit Scheduled!</h2>
              <p>Great news! A visit has been scheduled for <strong>${property.name}</strong>.</p>
              <p>The owner has been notified and will contact you shortly.</p>
              <br/>
              <p>Thanks for using NestMatch!</p>
            `
          });
        } catch (emailError) {
          console.error("Failed to send email with Resend:", emailError);
        }
      }

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
