import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User } from '@/models/User';
import connectToDatabase from '@/utils/db';
import { BookingInterest } from '@/models/BookingInterest';
import { PGProperty } from '@/models/PGProperty';

export async function GET() {
  try {
    const { userId } = await auth();
    let session = null;
    if (userId) {
      session = { user: await User.findOne({ clerkId: userId }) };
    }
    if (!session || (session.user as any)?.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const ownerId = (session.user as any).id;

    // 1. Get total active properties and their performance
    const properties = await PGProperty.find({ owner_id: ownerId });
    
    let totalBeds = 0;
    let availableBeds = 0;
    const propertyPerformance = properties.map(p => {
      totalBeds += p.capacity?.total_beds || 0;
      availableBeds += p.capacity?.available_beds || 0;
      return {
        name: p.name,
        saves: p.savesCount || 0,
        rating: p.rating || 0
      };
    });
    const occupancyRate = totalBeds > 0 ? ((totalBeds - availableBeds) / totalBeds) * 100 : 0;

    // 2. Booking interests over the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const interests = await BookingInterest.find({ 
      owner_id: ownerId,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: 1 });

    // Group by day
    const chartDataMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      chartDataMap[dateStr] = 0;
    }

    interests.forEach(interest => {
      const dateStr = new Date(interest.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (chartDataMap[dateStr] !== undefined) {
        chartDataMap[dateStr]++;
      }
    });

    const timelineData = Object.keys(chartDataMap).map(date => ({
      date,
      interests: chartDataMap[date]
    }));

    return NextResponse.json({ 
      success: true, 
      timelineData, 
      propertyPerformance,
      stats: {
        totalProperties: properties.length,
        occupancyRate: Math.round(occupancyRate),
        totalInterests: interests.length
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
