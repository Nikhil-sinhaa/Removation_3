import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Booking } from '@/lib/db/models/Booking';
import { Message } from '@/lib/db/models/Message';
import { User } from '@/lib/db/models/User';
import { pusherServer } from '@/lib/pusher/server';

// Helper to check if a user is party to a booking
async function checkBookingAccess(bookingDoc: any, user: any) {
  if (user.role === 'admin') return true;

  const isCustomer = bookingDoc.customerId && bookingDoc.customerId.toString() === user._id.toString();

  // Populate or resolve designer/contractor userId
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

// Minimal helpers to avoid extra DB schema imports if they fail
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

    // Parse query params
    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || 50), 100);
    const before = req.nextUrl.searchParams.get('before');

    const query: any = { bookingId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Fetch messages (newest first for pagination limit, then reverse)
    const messagesDocs = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('senderId', 'firstName lastName imageUrl');

    const hasMore = messagesDocs.length > limit;
    const sliced = hasMore ? messagesDocs.slice(0, limit) : messagesDocs;
    const messages = sliced.reverse();

    // Mark messages from the OTHER party as read
    const now = new Date();
    const updateResult = await Message.updateMany(
      { bookingId, senderId: { $ne: user._id }, readAt: null },
      { readAt: now }
    );

    if (updateResult.modifiedCount > 0 && pusherServer) {
      try {
        await pusherServer.trigger(`booking-${bookingId}`, 'messages-read', {
          readBy: user._id.toString(),
          readAt: now.toISOString(),
        });
      } catch (pusherErr) {
        console.error('[messages GET pusher messages-read trigger] Failed:', pusherErr);
      }
    }

    return NextResponse.json({ messages, hasMore });
  } catch (error) {
    console.error('[messages GET] Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
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

    const body = await req.json().catch(() => ({}));
    const text = body.text?.trim();

    if (!text || text.length > 2000) {
      return NextResponse.json({ message: 'Message text must be between 1 and 2000 characters' }, { status: 400 });
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

    // Create Message document
    const message = await Message.create({
      bookingId,
      senderId: user._id,
      senderRole: user.role,
      text,
      readAt: null,
      isSystem: false,
    });

    const sender = await User.findById(user._id).select('firstName lastName imageUrl');
    const senderName = sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'User' : 'User';

    // Trigger Pusher event
    if (pusherServer) {
      try {
        await pusherServer.trigger(
          `booking-${bookingId}`,
          'new-message',
          {
            _id: message._id.toString(),
            bookingId,
            senderId: user._id.toString(),
            senderRole: user.role,
            senderName,
            text: message.text,
            readAt: null,
            isSystem: false,
            createdAt: message.createdAt.toISOString(),
          }
        );
      } catch (pusherErr) {
        console.error('[messages POST pusher new-message trigger] Failed:', pusherErr);
      }
    }

    // Return the message with sender info populated
    const populatedMessage = message.toObject() as any;
    populatedMessage.senderId = {
      _id: user._id.toString(),
      firstName: sender?.firstName || '',
      lastName: sender?.lastName || '',
      imageUrl: sender?.imageUrl || null,
    };

    return NextResponse.json({ message: populatedMessage }, { status: 201 });
  } catch (error) {
    console.error('[messages POST] Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
