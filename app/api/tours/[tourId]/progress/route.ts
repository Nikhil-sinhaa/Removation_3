import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db/mongodb';
import { TourProgress } from '@/lib/db/models/TourProgress';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tourId: string }> }
) {
  try {
    const authUser = await getCurrentUser();
    const userId = authUser?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tourId } = await params;
    const body = await req.json();
    const { step, action } = body;

    await connectToDatabase();

    const updateData: any = {};
    if (action === 'next' && typeof step === 'number') {
      updateData.currentStep = step;
    } else if (action === 'complete') {
      updateData.isCompleted = true;
      updateData.completedAt = new Date();
    } else if (action === 'dismiss') {
      updateData.isDismissed = true;
      updateData.dismissedAt = new Date();
    } else if (action === 'reset') {
      updateData.isCompleted = false;
      updateData.isDismissed = false;
      updateData.currentStep = 0;
      updateData.completedAt = null;
      updateData.dismissedAt = null;
    }

    const progress = await TourProgress.findOneAndUpdate(
      { userId, tourId },
      { $set: updateData },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error('[TOUR_PROGRESS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
