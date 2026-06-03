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

    await connectToDatabase();

    const tours = await Tour.find({ isActive: true }).sort({ priority: -1 });
    const progressList = await TourProgress.find({ userId });
    const progressMap = progressList.reduce((acc, curr) => {
      acc[curr.tourId] = curr;
      return acc;
    }, {} as Record<string, any>);

    const mappedTours = tours.map(tour => {
      const prog = progressMap[tour.id];
      return {
        id: tour.id,
        name: tour.name,
        description: tour.description,
        pages: tour.pages,
        isCompleted: prog ? prog.isCompleted : false,
      };
    });

    return NextResponse.json(mappedTours);
  } catch (error) {
    console.error('[TOURS_ALL_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
