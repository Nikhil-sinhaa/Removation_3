import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Tour } from '@/lib/db/models/Tour';
import { TourProgress } from '@/lib/db/models/TourProgress';

export async function GET(req: Request) {
  try {
    const authUser = await getCurrentUser();
    const userId = authUser?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const pathname = searchParams.get('pathname');

    if (!pathname) {
      return NextResponse.json({ error: 'Missing pathname' }, { status: 400 });
    }

    await connectToDatabase();

    const tours = await Tour.find({
      isActive: true,
      pages: { $in: [pathname] }
    }).sort({ priority: -1 });

    if (!tours.length) {
      return NextResponse.json({ tour: null });
    }

    let activeTour = null;
    let currentStep = 0;

    for (const tour of tours) {
      const progress = await TourProgress.findOne({
        userId,
        tourId: tour.id
      });

      if (!progress || (!progress.isCompleted && !progress.isDismissed)) {
        activeTour = tour;
        currentStep = progress ? progress.currentStep : 0;
        break;
      }
    }

    if (!activeTour) {
      return NextResponse.json({ tour: null });
    }

    return NextResponse.json({
      tour: activeTour,
      currentStep
    });
  } catch (error) {
    console.error('[TOURS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
