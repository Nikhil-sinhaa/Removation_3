/**
 * GET /api/admin/designers/pending
 *
 * Returns all designers awaiting approval (isVerified: false, rejectionReason: null).
 * Admin only.
 *
 * Manual Test:
 * curl -X GET http://localhost:3000/api/admin/designers/pending \
 *   -H "Cookie: auth_token=YOUR_ADMIN_JWT_HERE"
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Designer } from '@/lib/db/models/Designer';

export async function GET(req: NextRequest) {
    try {
        const authResult = await requireRole(req, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        await connectToDatabase();

        const pending = await Designer.find({
            isVerified: false,
            rejectionReason: null,
        })
            .populate('userId', 'firstName lastName email imageUrl')
            .sort({ createdAt: 1 }); // oldest first — FIFO review queue

        return NextResponse.json({ designers: pending, total: pending.length }, { status: 200 });
    } catch (error) {
        console.error('Get pending designers error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
