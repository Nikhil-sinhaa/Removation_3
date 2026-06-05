/**
 * GET /api/designer/me
 *
 * Returns the calling user's Designer profile.
 * Accessible by any authenticated user (returns 404 if they don't have a profile).
 *
 * Manual Test:
 *   curl -X GET http://localhost:3000/api/designer/me \
 *     -H "Cookie: auth_token=YOUR_JWT_HERE"
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PATCH /api/designer/me
 *
 * Allows a verified designer to update their own pricing and availability toggles.
 * Strictly limits updatable fields to:
 *   - consultationFee.amount   (number in paise)
 *   - projectMinFee.amount     (number in paise)
 *   - acceptsConsultations     (boolean)
 *   - acceptsProjects          (boolean)
 *   - consultationDurationMinutes (number, 15–240)
 *
 * INTENTIONALLY NOT PATCHABLE via this route:
 *   - isVerified, verifiedAt, verifiedBy, rejectionReason  (admin-only)
 *   - isActive                                              (admin-only)
 *   - userId                                               (immutable)
 *   - displayName, bio, phone, city, specialties, portfolioImages, yearsOfExperience
 *     (profile fields — edited via /designer/register, reviewed by admin on re-submit)
 *
 * Auth: designer role only (no admin bypass — admins use the admin panel).
 *
 * Manual Test:
 *   curl -X PATCH http://localhost:3000/api/designer/me \
 *     -H "Content-Type: application/json" \
 *     -H "Cookie: auth_token=YOUR_DESIGNER_JWT" \
 *     -d '{
 *       "consultationFee": { "amount": 150000 },
 *       "projectMinFee": { "amount": 500000 },
 *       "acceptsConsultations": true,
 *       "acceptsProjects": false
 *     }'
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Designer } from '@/lib/db/models/Designer';

export async function GET(req: NextRequest) {
    try {
        // Authenticate any logged-in user
        const authResult = await requireRole(req, ['customer', 'designer', 'admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { user } = authResult;
        const userId = user._id;

        await connectToDatabase();

        // Retrieve calling user's Designer profile
        const designer = await Designer.findOne({ userId });

        if (!designer) {
            return NextResponse.json({ message: 'Designer profile not found' }, { status: 404 });
        }

        return NextResponse.json({ designer }, { status: 200 });
    } catch (error) {
        console.error('Get designer profile error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

const MIN_FEE_PAISE = 0;           // ₹0 — allows designers to set 0 (hide the service)
const MAX_FEE_PAISE = 10_000_000;  // ₹1,00,000 — matches Designer schema max
const MIN_DURATION_MINUTES = 15;
const MAX_DURATION_MINUTES = 240;

export async function PATCH(req: NextRequest) {
    try {
        // ── Auth: designer role only ────────────────────────────────────────────
        const authResult = await requireRole(req, ['designer']);
        if (authResult instanceof NextResponse) return authResult;
        const { user } = authResult;

        // ── Parse body ──────────────────────────────────────────────────────────
        let body: Record<string, unknown>;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
        }

        await connectToDatabase();

        // ── Find designer profile ───────────────────────────────────────────────
        const designer = await Designer.findOne({ userId: user._id });
        if (!designer) {
            return NextResponse.json({ message: 'Designer profile not found' }, { status: 404 });
        }

        // ── Build update: ONLY allowed pricing/availability fields ──────────────
        // We explicitly whitelist fields — any other keys in body are silently ignored,
        // so callers cannot set isVerified, isActive, userId, etc.

        const errors: string[] = [];

        // consultationFee.amount
        if (body.consultationFee !== undefined) {
            const cf = body.consultationFee as any;
            if (typeof cf?.amount !== 'number') {
                errors.push('consultationFee.amount must be a number');
            } else if (cf.amount < MIN_FEE_PAISE || cf.amount > MAX_FEE_PAISE) {
                errors.push(`consultationFee.amount must be between ${MIN_FEE_PAISE} and ${MAX_FEE_PAISE} paise`);
            } else if (!Number.isInteger(cf.amount)) {
                errors.push('consultationFee.amount must be an integer (paise, no decimals)');
            } else {
                designer.consultationFee = {
                    amount: cf.amount,
                    currency: 'INR',
                };
            }
        }

        // projectMinFee.amount
        if (body.projectMinFee !== undefined) {
            const pf = body.projectMinFee as any;
            if (typeof pf?.amount !== 'number') {
                errors.push('projectMinFee.amount must be a number');
            } else if (pf.amount < MIN_FEE_PAISE || pf.amount > MAX_FEE_PAISE) {
                errors.push(`projectMinFee.amount must be between ${MIN_FEE_PAISE} and ${MAX_FEE_PAISE} paise`);
            } else if (!Number.isInteger(pf.amount)) {
                errors.push('projectMinFee.amount must be an integer (paise, no decimals)');
            } else {
                designer.projectMinFee = {
                    amount: pf.amount,
                    currency: 'INR',
                };
            }
        }

        // acceptsConsultations
        if (body.acceptsConsultations !== undefined) {
            if (typeof body.acceptsConsultations !== 'boolean') {
                errors.push('acceptsConsultations must be a boolean');
            } else {
                designer.acceptsConsultations = body.acceptsConsultations;
            }
        }

        // acceptsProjects
        if (body.acceptsProjects !== undefined) {
            if (typeof body.acceptsProjects !== 'boolean') {
                errors.push('acceptsProjects must be a boolean');
            } else {
                designer.acceptsProjects = body.acceptsProjects;
            }
        }

        // consultationDurationMinutes
        if (body.consultationDurationMinutes !== undefined) {
            const dur = body.consultationDurationMinutes;
            if (typeof dur !== 'number' || !Number.isInteger(dur)) {
                errors.push('consultationDurationMinutes must be an integer');
            } else if (dur < MIN_DURATION_MINUTES || dur > MAX_DURATION_MINUTES) {
                errors.push(`consultationDurationMinutes must be between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES}`);
            } else {
                designer.consultationDurationMinutes = dur;
            }
        }

        // ── Return validation errors ────────────────────────────────────────────
        if (errors.length > 0) {
            return NextResponse.json({ message: errors[0], errors }, { status: 400 });
        }

        // ── Save ────────────────────────────────────────────────────────────────
        await designer.save();

        return NextResponse.json({
            success: true,
            designer: {
                consultationFee: designer.consultationFee,
                projectMinFee: designer.projectMinFee,
                acceptsConsultations: designer.acceptsConsultations,
                acceptsProjects: designer.acceptsProjects,
                consultationDurationMinutes: designer.consultationDurationMinutes,
            },
        });

    } catch (error) {
        console.error('[designer/me] PATCH error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
