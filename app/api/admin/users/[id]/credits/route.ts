import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

interface RouteContext {
    params: {
        id: string;
    };
}

export async function POST(
    req: NextRequest,
    { params }: RouteContext
) {
    try {
        // 1. Authorize Admin role
        const authResult = await requireRole(req, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { id: userId } = params;
        if (!userId) {
            return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
        }

        // 2. Parse and validate amount parameter
        const body = await req.json();
        const amount = body.amount;

        if (amount === undefined || amount === null) {
            return NextResponse.json({ message: 'Amount parameter is required' }, { status: 400 });
        }

        if (typeof amount !== 'number' || !Number.isInteger(amount)) {
            return NextResponse.json({ message: 'Amount must be a valid integer' }, { status: 400 });
        }

        if (Math.abs(amount) > 10000) {
            return NextResponse.json({ message: 'Amount magnitude must not exceed 10000 credits' }, { status: 400 });
        }

        await connectToDatabase();

        // 3. Find user and build query filter (support both ObjectId format and fallback clerkId string)
        const filter: Record<string, any> = {};
        if (mongoose.Types.ObjectId.isValid(userId)) {
            filter.$or = [{ _id: new mongoose.Types.ObjectId(userId) }, { clerkId: userId }];
        } else {
            filter.clerkId = userId;
        }

        const dbUser = await User.findOne(filter);
        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // 4. Atomically modify the user record using $inc and push to creditHistory
        const updatedUser = await User.findOneAndUpdate(
            filter,
            {
                $inc: { 'subscription.credits': amount },
                $push: {
                    creditHistory: {
                        amount: amount,
                        type: amount >= 0 ? 'admin_grant' : 'admin_deduct',
                        description: `Credits ${amount >= 0 ? 'granted' : 'deducted'} by admin ${authResult.user.email}`,
                        createdAt: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ message: 'Failed to update user credits' }, { status: 500 });
        }

        const credits = updatedUser.subscription.credits || 0;
        const creditsUsed = updatedUser.subscription.creditsUsed || 0;
        const newBalance = credits - creditsUsed;

        // 5. Return status with updated balance details for the admin frontend
        return NextResponse.json({
            userId: updatedUser._id.toString(),
            newBalance,
            subscription: updatedUser.subscription,
            success: true
        }, { status: 200 });

    } catch (error) {
        console.error('POST admin user credits error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
