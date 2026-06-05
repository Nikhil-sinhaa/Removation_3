/**
 * POST /api/pusher/auth
 *
 * Authenticates users for private Pusher channels.
 * Channel format: private-booking-{bookingId}
 *
 * Only allows access if the caller is a party to the booking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Booking } from '@/lib/db/models/Booking';
import { Designer } from '@/lib/db/models/Designer';
import { Contractor } from '@/lib/db/models/Contractor';
import { getPusherServer } from '@/lib/pusher';

export async function POST(req: NextRequest) {
    const authUser = await getCurrentUser();
    if (!authUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Pusher sends socket_id and channel_name as form data
    const formData = await req.formData().catch(() => null);
    if (!formData) {
        return NextResponse.json({ message: 'Bad request' }, { status: 400 });
    }

    const socketId = formData.get('socket_id') as string;
    const channelName = formData.get('channel_name') as string;

    if (!socketId || !channelName) {
        return NextResponse.json({ message: 'Missing socket_id or channel_name' }, { status: 400 });
    }

    // Only handle private-booking-{id} channels
    const match = channelName.match(/^private-booking-(.+)$/);
    if (!match) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const bookingId = match[1];
    if (!Types.ObjectId.isValid(bookingId)) {
        return NextResponse.json({ message: 'Invalid booking ID' }, { status: 400 });
    }

    await connectToDatabase();

    const dbUser = await User.findById(authUser.id);
    if (!dbUser) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const booking = await Booking.findById(bookingId)
        .populate({ path: 'designerId', select: 'userId' })
        .populate({ path: 'contractorId', select: 'userId' });

    if (!booking) {
        return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    const userId = dbUser._id.toString();
    const isCustomer = booking.customerId.toString() === userId;
    const designerDoc = booking.designerId as any;
    const isDesigner = designerDoc?.userId?.toString() === userId;
    const contractorDoc = booking.contractorId as any;
    const isContractor = contractorDoc?.userId?.toString() === userId;
    const isAdmin = dbUser.role === 'admin';

    if (!isCustomer && !isDesigner && !isContractor && !isAdmin) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const pusher = getPusherServer();
    if (!pusher) {
        return NextResponse.json({ message: 'Pusher is not configured' }, { status: 503 });
    }
    const authResponse = pusher.authorizeChannel(socketId, channelName);

    return NextResponse.json(authResponse);
}
