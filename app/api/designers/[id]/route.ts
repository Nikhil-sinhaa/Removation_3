/**
 * GET /api/designers/[id]
 *
 * Public — no auth required.
 * Returns a single verified, active designer's full profile.
 *
 * Phone redaction:
 *   Logged-in users get phone. Unauthenticated users do not.
 *
 * Returns 404 if:
 *   - Designer doesn't exist
 *   - Designer is not verified
 *   - Designer is not active
 * (All three cases return the same 404 — no information leakage about
 *  pending/rejected status to the public)
 *
 * Manual Test (unauthenticated):
 * curl "http://localhost:3000/api/designers/DESIGNER_ID_HERE"
 *
 * Manual Test (authenticated — gets phone too):
 * curl "http://localhost:3000/api/designers/DESIGNER_ID_HERE" \
 *   -H "Cookie: auth_token=YOUR_JWT_HERE"
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Designer } from '@/lib/db/models/Designer';
import { Types } from 'mongoose';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Designer not found' }, { status: 404 });
        }

        await connectToDatabase();

        // ── Determine auth state (for phone redaction) ────────────────────
        const authUser   = await getCurrentUser();
        const isLoggedIn = !!authUser;

        const publicSelect = 'displayName bio city specialties portfolioImages yearsOfExperience isVerified createdAt consultationFee acceptsConsultations acceptsProjects projectMinFee consultationDurationMinutes';
        const authedSelect = publicSelect + ' phone';
        const selectFields = isLoggedIn ? authedSelect : publicSelect;

        // ── Query — only show verified + active profiles ───────────────────
        const designer = await Designer.findOne({
            _id:        id,
            isVerified: true,
            isActive:   true,
        })
            .select(selectFields)
            .populate('userId', 'firstName lastName imageUrl');

        // Unified 404 — don't leak whether a profile is pending/rejected
        if (!designer) {
            return NextResponse.json({ message: 'Designer not found' }, { status: 404 });
        }

        return NextResponse.json({ designer }, { status: 200 });
    } catch (error) {
        console.error('Get designer error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
