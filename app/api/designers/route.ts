/**
 * GET /api/designers
 *
 * Public — no auth required.
 * Returns verified, active designers with optional filtering.
 *
 * Query params:
 *   city?       — filter by city (case-insensitive exact match)
 *   specialty?  — filter by specialty slug (e.g. "vastu")
 *   search?     — case-insensitive regex on displayName
 *   page?       — default 1
 *   limit?      — default 20, max 50
 *
 * Phone redaction:
 *   Logged-in users (any role) get the phone field.
 *   Unauthenticated requests do NOT receive phone.
 *
 * Manual Test (unauthenticated):
 * curl "http://localhost:3000/api/designers?city=Bangalore&specialty=vastu&search=Priya&page=1&limit=10"
 *
 * Manual Test (authenticated — gets phone too):
 * curl "http://localhost:3000/api/designers" \
 *   -H "Cookie: auth_token=YOUR_JWT_HERE"
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Designer } from '@/lib/db/models/Designer';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;

        // ── Parse query params ────────────────────────────────────────────
        const city      = searchParams.get('city')?.trim();
        const specialty = searchParams.get('specialty')?.trim();
        const search    = searchParams.get('search')?.trim();
        const page      = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit     = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)));
        const skip      = (page - 1) * limit;

        // ── Build filter ──────────────────────────────────────────────────
        // Always gate on isVerified + isActive — this is the public safety check
        const filter: Record<string, unknown> = {
            isVerified: true,
            isActive:   true,
        };

        if (city) {
            filter.city = { $regex: city, $options: 'i' };
        }

        if (specialty) {
            filter.specialties = specialty; // exact slug match inside array
        }

        if (search) {
            filter.displayName = { $regex: search, $options: 'i' };
        }

        await connectToDatabase();

        // ── Determine auth state (for phone redaction) ────────────────────
        const authUser  = await getCurrentUser();
        const isLoggedIn = !!authUser;

        // Fields always returned publicly (safe public profile)
        // Phone is conditionally included — not for unauthenticated callers
        const publicSelect = 'displayName bio city specialties portfolioImages yearsOfExperience isVerified createdAt';
        const authedSelect = publicSelect + ' phone';
        const selectFields = isLoggedIn ? authedSelect : publicSelect;

        // ── Query ─────────────────────────────────────────────────────────
        const [designers, total] = await Promise.all([
            Designer.find(filter)
                .select(selectFields)
                .populate('userId', 'firstName lastName imageUrl')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Designer.countDocuments(filter),
        ]);

        return NextResponse.json(
            {
                designers,
                total,
                page,
                pageCount: Math.ceil(total / limit),
                phoneIncluded: isLoggedIn, // transparency flag for the client
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('List designers error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
