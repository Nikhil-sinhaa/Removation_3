// app/api/admin/contractors/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Contractor } from '@/lib/db/models/Contractor';
import { Types } from 'mongoose';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireRole(req, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { id } = await params;

        if (!Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Invalid contractor ID' }, { status: 400 });
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
        }

        const { reason } = body;
        if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
            return NextResponse.json(
                { message: 'Rejection reason is required (min 5 characters)' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const contractor = await Contractor.findById(id);
        if (!contractor) {
            return NextResponse.json({ message: 'Contractor not found' }, { status: 404 });
        }

        contractor.isVerified = false;
        contractor.rejectionReason = reason.trim();
        contractor.verifiedAt = null;
        contractor.verifiedBy = null;

        await contractor.save();

        return NextResponse.json(
            { message: 'Contractor application rejected', contractor },
            { status: 200 }
        );
    } catch (error) {
        console.error('Reject contractor error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
