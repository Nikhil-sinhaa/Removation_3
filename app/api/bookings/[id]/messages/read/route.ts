import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Booking } from '@/lib/db/models/Booking';
import { Message } from '@/lib/db/models/Message';
import { pusherServer } from '@/lib/pusher/server';

async function checkBookingAccess(bookingDoc: any, user: any) {
  if (user.role === 'admin') return true;

  const isCustomer = bookingDoc.customerId && bookingDoc.customerId.toString() === user._id.toString();

  let isDesignerOwner = false;
  if (bookingDoc.designerId) {
    const designer = await mongooseModelGetDesigner(bookingDoc.designerId);
    if (designer && designer.userId.toString() === user._id.toString()) {
      isDesignerOwner = true;
    }
  }

  let isContractorOwner = false;
  if (bookingDoc.contractorId) {
    const contractor = await mongooseModelGetContractor(bookingDoc.contractorId);
    if (contractor && contractor.userId.toString() === user._id.toString()) {
      isContractorOwner = true;
    }
  }

  return isCustomer || isDesignerOwner || isContractorOwner;
}

async function mongooseModelGetDesigner(id: any) {
  try {
    const { Designer } = await import('@/lib/db/models/Designer');
    return await Designer.findById(id);
  } catch {
    return null;
  }
}

async function mongooseModelGetContractor(id: any) {
  try {
    const { Contractor } = await import('@/lib/db/models/Contractor');
    return await Contractor.findById(id);
  } catch {
    return null;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(req, ['customer', 'designer', 'contractor', 'admin']);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id: bookingId } = await params;
    if (!bookingId || !Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json({ message: 'Invalid booking ID' }, { status: 400 });
    }

    await connectToDatabase();

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    const hasAccess = await checkBookingAccess(booking, user);
    if (!hasAccess) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const result = await Message.updateMany(
      { bookingId, senderId: { $ne: user._id }, readAt: null },
      { readAt: now }
    );

    if (result.modifiedCount > 0 && pusherServer) {
      try {
        await pusherServer.trigger(`booking-${bookingId}`, 'messages-read', {
          readBy: user._id.toString(),
          readAt: now.toISOString(),
        });
      } catch (pusherErr) {
        console.error('[messages-read trigger] Failed:', pusherErr);
      }
    }

    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('[messages read POST] Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
