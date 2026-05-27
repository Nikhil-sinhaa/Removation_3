/**
 * PATCH /api/admin/designers/[id]/reject
 *
 * Rejects a designer application with a mandatory reason.
 * The designer can see the reason in their dashboard and re-submit.
 * Admin only.
 *
 * Body: { reason: string }  (min 5 characters)
 *
 * Manual Test:
 * curl -X PATCH http://localhost:3000/api/admin/designers/DESIGNER_ID_HERE/reject \
 *   -H "Content-Type: application/json" \
 *   -H "Cookie: auth_token=YOUR_ADMIN_JWT_HERE" \
 *   -d '{ "reason": "Portfolio images are too small and blurry" }'
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

        const { id } = await params;

        // Validate ObjectId
        if (!Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Invalid designer ID' }, { status: 400 });
        }

        // Parse body
        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
        }

        const { reason } = body;

        // Reason is mandatory and must be meaningful (min 5 chars)
        if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
            return NextResponse.json(
                { message: 'Rejection reason is required (min 5 characters)' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const designer = await Designer.findById(id);
        if (!designer) {
            return NextResponse.json({ message: 'Designer not found' }, { status: 404 });
        }

        // Reject — clear any previous verification, set rejection reason
        designer.isVerified = false;
        designer.rejectionReason = reason.trim();
        designer.verifiedAt = null;
        designer.verifiedBy = null;

        await designer.save();

        return NextResponse.json(
            { message: 'Designer application rejected', designer },
            { status: 200 }
        );
    } catch (error) {
        console.error('Reject designer error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
