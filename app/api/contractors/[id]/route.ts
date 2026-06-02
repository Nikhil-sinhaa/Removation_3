// app/api/contractors/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Contractor } from '@/lib/db/models/Contractor';
import { Types } from 'mongoose';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Contractor not found' }, { status: 404 });
        }

        await connectToDatabase();

        // Check login status for phone redaction
        const authUser   = await getCurrentUser();
        const isLoggedIn = !!authUser;

        const publicSelect = 'displayName bio city specialties portfolioImages yearsOfExperience isVerified createdAt consultationFee acceptsConsultations acceptsProjects projectMinFee consultationDurationMinutes averageRating totalReviews';
        const authedSelect = publicSelect + ' phone';
        const selectFields = isLoggedIn ? authedSelect : publicSelect;

        const contractor = await Contractor.findOne({ _id: id })
            .select(selectFields)
            .populate('userId', 'firstName lastName imageUrl');

        if (!contractor) {
            return NextResponse.json({ message: 'Contractor not found' }, { status: 404 });
        }

        const isOwner = authUser && contractor.userId && (
            (contractor.userId as any)._id 
                ? (contractor.userId as any)._id.toString() === authUser._id.toString() 
                : contractor.userId.toString() === authUser._id.toString()
        );

        if (!isOwner && (!contractor.isVerified || !contractor.isActive)) {
            return NextResponse.json({ message: 'Contractor not found' }, { status: 404 });
        }

        return NextResponse.json({ contractor }, { status: 200 });
    } catch (error) {
        console.error('Get contractor error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
