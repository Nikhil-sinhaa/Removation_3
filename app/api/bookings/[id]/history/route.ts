import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/auth/jwt';
import WorkflowEvent from '@/lib/db/models/WorkflowEvent';
import mongoose from 'mongoose';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/bookings/[id]/history
 * Returns the full state transition history for a booking.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;

  const events = await WorkflowEvent.find({
    bookingId: new mongoose.Types.ObjectId(id),
  })
  .sort({ createdAt: 1 })
  .populate('triggeredBy', 'firstName lastName email')
  .lean();

  return NextResponse.json({ events });
}
