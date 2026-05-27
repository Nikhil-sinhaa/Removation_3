/**
 * PATCH /api/admin/designers/[id]/verify
 *
 * Approves a designer application — flips isVerified to true with audit trail.
 * Admin only.
 *
 * Manual Test:
 * curl -X PATCH http://localhost:3000/api/admin/designers/DESIGNER_ID_HERE/verify \
 *   -H "Cookie: auth_token=YOUR_ADMIN_JWT_HERE"
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Designer } from '@/lib/db/models/Designer';
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

        const { user: adminUser } = authResult;
        const { id } = await params;

        // Validate ObjectId
        if (!Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Invalid designer ID' }, { status: 400 });
        }

        await connectToDatabase();

        const designer = await Designer.findById(id);
        if (!designer) {
            return NextResponse.json({ message: 'Designer not found' }, { status: 404 });
        }

        if (designer.isVerified) {
            return NextResponse.json({ message: 'Designer is already verified' }, { status: 400 });
        }

        // Approve with full audit trail
        designer.isVerified = true;
        designer.verifiedAt = new Date();
        designer.verifiedBy = adminUser._id;
        designer.rejectionReason = null;

        await designer.save();

        return NextResponse.json(
            { message: 'Designer verified successfully', designer },
            { status: 200 }
        );
    } catch (error) {
        console.error('Verify designer error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
