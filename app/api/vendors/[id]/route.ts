// app/api/vendors/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Vendor } from '@/lib/db/models/Vendor';
import { Types } from 'mongoose';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Vendor not found' }, { status: 404 });
        }

        await connectToDatabase();

        // Check login status for phone redaction
        const authUser   = await getCurrentUser();
        const isLoggedIn = !!authUser;

        const publicSelect = 'displayName bio city storeAddress specialties portfolioImages isVerified createdAt userId';
        const authedSelect = publicSelect + ' phone';
        const selectFields = isLoggedIn ? authedSelect : publicSelect;

        const vendor = await Vendor.findOne({ _id: id })
            .select(selectFields)
            .populate('userId', 'firstName lastName imageUrl');

        if (!vendor) {
            return NextResponse.json({ message: 'Vendor not found' }, { status: 404 });
        }

        const isOwner = authUser && vendor.userId && (
            (vendor.userId as any)._id 
                ? (vendor.userId as any)._id.toString() === authUser._id.toString() 
                : vendor.userId.toString() === authUser._id.toString()
        );

        if (!isOwner && (!vendor.isVerified || !vendor.isActive)) {
            return NextResponse.json({ message: 'Vendor not found' }, { status: 404 });
        }

        return NextResponse.json({ vendor }, { status: 200 });
    } catch (error) {
        console.error('Get vendor error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
