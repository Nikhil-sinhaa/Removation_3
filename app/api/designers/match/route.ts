/**
 * GET /api/designers/match
 *
 * Public endpoint — no auth required.
 * Returns a short ranked list of designers for the "Make It Real" banner.
 *
 * Query params:
 *   city      (required)           — user's city, case-insensitive
 *   roomType  (optional)           — e.g. "living-room" or "living_room"
 *   style     (optional)           — e.g. "minimalist" or "contemporary"
 *   maxFee    (optional, paise)    — filters designers where projectMinFee.amount <= maxFee
 *   limit     (optional)           — default 3, max 5
 *
 * Matching logic:
 *   1. Map roomType + style to DESIGNER_SPECIALTIES slugs.
 *   2. Query: isVerified + isActive + acceptsProjects + city (regex) + specialties $in mapped.
 *   3. If 0 results, fall back to city-only (no specialty filter).
 *   4. Score each result by specialty overlap count, break ties with yearsOfExperience.
 *   5. Return top `limit` docs.
 *
 * Response: { designers, matchedOn: { city, specialties }, phoneIncluded }
 *
 * Phone redaction:
 *   Logged-in users receive the phone field; unauthenticated callers do not.
 *
 * Manual test (unauthenticated):
 *   curl "http://localhost:3000/api/designers/match?city=Bangalore&roomType=living-room&style=minimalist"
 */

import { NextRequest, NextResponse } from 'next/server';
import type { HydratedDocument } from 'mongoose';
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Designer } from '@/lib/db/models/Designer';
import type { IDesigner, DesignerSpecialty } from '@/lib/db/models/Designer';

const DEFAULT_LIMIT = 3;
const MAX_LIMIT     = 5;
// Fetch more than the limit before scoring so overlap-sort is accurate
const FETCH_POOL    = MAX_LIMIT * 4;

// ── Specialty maps ────────────────────────────────────────────────────────────

const ROOM_TYPE_MAP: Record<string, DesignerSpecialty[]> = {
    'living-room':     ['living-room'],
    'bedroom':         ['bedroom'],
    'kitchen':         ['modular-kitchen'],
    'modular-kitchen': ['modular-kitchen'],
    'bathroom':        ['bathroom'],
    'office':          ['office'],
    'home-office':     ['office'],
    'kids-room':       ['kids-room'],
    'nursery':         ['kids-room'],
};

const STYLE_MAP: Record<string, DesignerSpecialty[]> = {
    'minimalist':   ['minimalist'],
    'traditional':  ['traditional'],
    'contemporary': ['contemporary'],
    'modern':       ['contemporary'],
    'luxury':       ['luxury'],
    'budget':       ['budget'],
    'vastu':        ['vastu'],
};

function buildSpecialties(roomType?: string, style?: string): DesignerSpecialty[] {
    const set = new Set<DesignerSpecialty>();
    if (roomType) for (const s of (ROOM_TYPE_MAP[roomType] ?? [])) set.add(s);
    if (style)    for (const s of (STYLE_MAP[style]       ?? [])) set.add(s);
    return [...set];
}

function overlapScore(designerSpecialties: string[], targets: DesignerSpecialty[]): number {
    const targetSet = new Set<string>(targets);
    return designerSpecialties.filter(s => targetSet.has(s)).length;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;

        const city    = searchParams.get('city')?.trim();
        const rawRoom = searchParams.get('roomType')?.trim().replace(/_/g, '-');
        const rawStyle = searchParams.get('style')?.trim().replace(/_/g, '-');
        const rawFee  = searchParams.get('maxFee');
        const limit   = Math.min(
            MAX_LIMIT,
            Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10))
        );

        if (!city) {
            return NextResponse.json({ message: '`city` query param is required' }, { status: 400 });
        }

        const mappedSpecialties = buildSpecialties(rawRoom ?? undefined, rawStyle ?? undefined);

        await connectToDatabase();

        // ── Phone redaction — mirrors listing API ─────────────────────────
        const authUser   = await getCurrentUser();
        const isLoggedIn = !!authUser;

        const publicSelect = 'displayName bio city specialties portfolioImages yearsOfExperience isVerified createdAt consultationFee acceptsConsultations acceptsProjects projectMinFee consultationDurationMinutes averageRating totalReviews';
        const selectFields = isLoggedIn ? publicSelect + ' phone' : publicSelect;

        // ── Base filter (always applied) ──────────────────────────────────
        const baseFilter: Record<string, unknown> = {
            isVerified:      true,
            isActive:        true,
            acceptsProjects: true,
            city:            { $regex: city, $options: 'i' },
        };

        if (rawFee) {
            const maxFeePaise = parseInt(rawFee, 10);
            if (!isNaN(maxFeePaise) && maxFeePaise >= 0) {
                baseFilter['projectMinFee.amount'] = { $lte: maxFeePaise };
            }
        }

        // ── Query: specialty match, then city-only fallback ───────────────
        let pool: HydratedDocument<IDesigner>[] = [];
        let matchedSpecialties: DesignerSpecialty[] = [];

        if (mappedSpecialties.length > 0) {
            pool = await Designer.find({
                ...baseFilter,
                specialties: { $in: mappedSpecialties },
            })
                .select(selectFields)
                .populate('userId', 'firstName lastName imageUrl')
                .sort({ yearsOfExperience: -1 })
                .limit(FETCH_POOL);

            if (pool.length > 0) {
                matchedSpecialties = mappedSpecialties;
            }
        }

        // Fall back to city-only if specialty query returned nothing
        if (pool.length === 0) {
            pool = await Designer.find(baseFilter)
                .select(selectFields)
                .populate('userId', 'firstName lastName imageUrl')
                .sort({ yearsOfExperience: -1 })
                .limit(FETCH_POOL);
        }

        // ── Score, sort by overlap then experience, trim to limit ─────────
        const scored = pool
            .map(doc => ({
                doc,
                score: overlapScore(doc.specialties as string[], matchedSpecialties),
            }))
            .sort((a, b) =>
                b.score - a.score ||
                (b.doc.yearsOfExperience ?? 0) - (a.doc.yearsOfExperience ?? 0)
            )
            .slice(0, limit)
            .map(({ doc }) => doc);

        return NextResponse.json(
            {
                designers:    scored,
                matchedOn:    { city, specialties: matchedSpecialties },
                phoneIncluded: isLoggedIn,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Match designers error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
