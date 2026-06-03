import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Tour } from '@/lib/db/models/Tour';
import { requireRole } from '@/lib/auth/requireRole';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const authError = await requireRole(req, ['admin']);
    if (authError instanceof NextResponse) return authError;

    const { tourId } = params;
    const body = await req.json();

    await connectToDatabase();

    const updatedTour = await Tour.findOneAndUpdate(
      { id: tourId },
      { $set: body },
      { new: true }
    );

    if (!updatedTour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    return NextResponse.json(updatedTour);
  } catch (error) {
    console.error('[ADMIN_TOUR_PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const authError = await requireRole(req, ['admin']);
    if (authError instanceof NextResponse) return authError;

    const { tourId } = params;

    await connectToDatabase();

    const deletedTour = await Tour.findOneAndDelete({ id: tourId });

    if (!deletedTour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN_TOUR_DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
