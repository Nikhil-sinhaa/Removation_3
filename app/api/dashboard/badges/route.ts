// app/api/dashboard/badges/route.ts
// GET /api/dashboard/badges
// Returns the full badge catalog merged with the authenticated user's unlock state.

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import connectToDatabase from '@/lib/db/mongodb';
import { BADGE_CATALOG } from '@/lib/constants/badges';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { User } = await import('@/lib/db/models/User');
    const user = await User.findOne({ clerkId: authUser.id }).select('unlockedBadges').lean() as
      | { unlockedBadges?: Array<{ badgeId: string; unlockedAt: Date }> }
      | null;

    const unlockMap = new Map<string, Date>();
    for (const entry of user?.unlockedBadges ?? []) {
      unlockMap.set(entry.badgeId, entry.unlockedAt);
    }

    const badges = BADGE_CATALOG.map(badge => {
      const unlockedAt = unlockMap.get(badge.id);
      return {
        ...badge,
        unlocked: !!unlockedAt,
        unlockedAt: unlockedAt?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ badges });
  } catch (err: any) {
    console.error('[badges GET]', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
