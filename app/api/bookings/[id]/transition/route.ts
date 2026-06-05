import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/auth/jwt';
import { User } from '@/lib/db/models/User';
import { executeTransition } from '@/lib/workflow/engine';
import WorkflowTransition from '@/lib/db/models/WorkflowTransition';
import type { BookingStateId } from '@/lib/db/models/WorkflowState';
import mongoose from 'mongoose';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/bookings/[id]/transition
 * Body: { transitionId, message?, rating? }
 * Single endpoint for ALL booking state changes.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;

  const dbUser = await User.findById(authUser.id).lean();
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
  const { transitionId, message, rating } = body;

  if (!transitionId) {
    return NextResponse.json({ error: 'transitionId is required' }, { status: 400 });
  }

  const result = await executeTransition({
    bookingId:        id,
    transitionId,
    triggeredById:    authUser.id,
    triggeredByRole:  dbUser.role || 'customer',
    triggeredByEmail: dbUser.email,
    triggeredByName:  [dbUser.firstName, dbUser.lastName].filter(Boolean).join(' ') || dbUser.email,
    message,
    rating,
    req,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success:  true,
    booking:  result.booking,
    newState: result.newState,
    effects:  result.effects,
  });
}

/**
 * GET /api/bookings/[id]/transition
 * Returns available transitions for the current user on this booking.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;

  const dbUser = await User.findById(authUser.id).lean();
  const userRole = dbUser?.role || 'customer';

  const Booking = mongoose.models['Booking'];
  if (!Booking) return NextResponse.json({ transitions: [], currentState: null });

  const booking = await Booking.findById(id).lean();
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const currentState = (booking as unknown as { status: BookingStateId }).status;

  const transitions = await WorkflowTransition.find({
    fromStates:   currentState,
    allowedRoles: userRole,
    enabled:      true,
  }).sort({ order: 1 }).lean();

  return NextResponse.json({ transitions, currentState });
}
