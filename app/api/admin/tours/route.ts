import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Tour } from '@/lib/db/models/Tour';
import { TourProgress } from '@/lib/db/models/TourProgress';
import { requireRole } from '@/lib/auth/requireRole';
import { defaultTours } from '@/lib/tours/defaultTours';

export async function GET(req: NextRequest) {
  try {
    const authError = await requireRole(req, ['admin']);
    if (authError instanceof NextResponse) return authError;

    await connectToDatabase();

    let tours = await Tour.find().sort({ createdAt: -1 }).lean();
    if (tours.length === 0) {
      const count = await Tour.countDocuments();
      if (count === 0) {
        await Tour.insertMany(defaultTours);
        tours = await Tour.find().sort({ createdAt: -1 }).lean();
      }
    }
    
    const toursWithStats = await Promise.all(
      tours.map(async (tour) => {
        const stats = await TourProgress.aggregate([
          { $match: { tourId: tour.id } },
          {
            $group: {
              _id: null,
              totalStarts: { $sum: 1 },
              completions: { $sum: { $cond: [{ $eq: ['$isCompleted', true] }, 1, 0] } },
              dismissals: { $sum: { $cond: [{ $eq: ['$isDismissed', true] }, 1, 0] } }
            }
          }
        ]);
        
        return {
          ...tour,
          stats: stats[0] || { totalStarts: 0, completions: 0, dismissals: 0 }
        };
      })
    );

    return NextResponse.json(toursWithStats);
  } catch (error) {
    console.error('[ADMIN_TOURS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = await requireRole(req, ['admin']);
    if (authError instanceof NextResponse) return authError;

    const body = await req.json();
    await connectToDatabase();

    const newTour = await Tour.create(body);

    return NextResponse.json(newTour);
  } catch (error) {
    console.error('[ADMIN_TOURS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
