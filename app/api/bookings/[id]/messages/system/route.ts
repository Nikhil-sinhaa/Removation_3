import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Booking } from '@/lib/db/models/Booking';
import { sendSystemMessage } from '@/lib/messages/system';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── Internal Secret / Role Check ─────────────────────────────────────────
    const internalSecret = process.env.INTERNAL_SECRET;
    const headerSecret = req.headers.get('X-Internal-Secret');

    let isAuthorized = false;
    if (internalSecret && headerSecret === internalSecret) {
      isAuthorized = true;
    }

    // If not authorized by internal secret, check if they are admin
    if (!isAuthorized) {
      const { requireRole } = await import('@/lib/auth/requireRole');
      const authResult = await requireRole(req, ['admin']);
      if (!(authResult instanceof NextResponse)) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id: bookingId } = await params;
    if (!bookingId || !Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json({ message: 'Invalid booking ID' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { text } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ message: 'Text content is required' }, { status: 400 });
    }

    await connectToDatabase();

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    const message = await sendSystemMessage(bookingId, text);

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('[bookings/[id]/messages/system] POST error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
