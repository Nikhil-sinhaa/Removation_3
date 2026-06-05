import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Booking } from '@/lib/db/models/Booking';
import { Message } from '@/lib/db/models/Message';

// Helper to check if a user is party to a booking
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

export async function GET(
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

    const count = await Message.countDocuments({
      bookingId,
      senderId: { $ne: user._id },
      readAt: null,
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('[unread-count GET] Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
