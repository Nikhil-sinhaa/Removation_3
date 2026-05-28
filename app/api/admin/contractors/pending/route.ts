// app/api/admin/contractors/pending/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Contractor } from '@/lib/db/models/Contractor';

export async function GET(req: NextRequest) {
    try {
        const authResult = await requireRole(req, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        await connectToDatabase();

        const pending = await Contractor.find({
            isVerified: false,
            rejectionReason: null,
        })
            .populate('userId', 'firstName lastName email imageUrl')
            .sort({ createdAt: 1 }); // oldest first

        return NextResponse.json({ contractors: pending, total: pending.length }, { status: 200 });
    } catch (error) {
        console.error('Get pending contractors error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
