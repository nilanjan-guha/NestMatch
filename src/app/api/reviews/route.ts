import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User } from '@/models/User';
import { PGProperty } from '@/models/PGProperty';
import { Review } from '@/models/Review';
import connectToDatabase from '@/utils/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const property_id = searchParams.get('property_id');

    if (!property_id) {
      return NextResponse.json({ error: 'property_id is required' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Check if the property is a real object ID or a google ID
    // Our reviews will be tied to the property_id. If it's a google ID, it won't be in PGProperty initially, 
    // but the Review model can still store the property_id string, as long as we define property_id as String.
    // Wait, in Review.ts we defined property_id as ObjectId ref 'PGProperty'.
    // Since Google Places have string IDs (e.g., 'ChIJ...'), we need to either store the Google PG in our DB first,
    // or change the Review schema to accept string property IDs. Let's change the Review schema to accept String to support Google Maps PGs!
    // But for now, we will query by property_id.
    const reviews = await Review.find({ property_id }).populate('user_id', 'firstName lastName avatar').sort({ createdAt: -1 });

    return NextResponse.json({ success: true, reviews });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
    const { property_id, rating, comment } = body;

    if (!property_id || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();
    const user_id = (session.user as any).id;

    // Create the review
    const newReview = await Review.create({
      user_id,
      property_id,
      rating,
      comment
    });

    // We should also update the property's average rating if it's in our DB.
    try {
      const property = await PGProperty.findById(property_id);
      if (property) {
        const totalReviews = property.userRatingCount + 1;
        const newRating = ((property.rating * property.userRatingCount) + rating) / totalReviews;
        property.rating = newRating;
        property.userRatingCount = totalReviews;
        await property.save();
      }
    } catch (err) {
      console.error('Failed to update PG property rating', err);
    }

    return NextResponse.json({ success: true, review: newReview });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'You have already reviewed this property.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
