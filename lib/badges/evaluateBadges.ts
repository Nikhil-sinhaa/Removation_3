// lib/badges/evaluateBadges.ts
// Evaluates which badges a user has newly earned and persists them.
// Call this fire-and-forget after a render completes — do NOT await in the
// critical render-response path.

import { Types } from 'mongoose';
import { BADGE_CATALOG, BadgeDefinition } from '@/lib/constants/badges';

async function getDb() {
  const { connectToDatabase } = await import('@/lib/db/mongodb');
  await connectToDatabase();
}

async function getRender() {
  const { Render } = await import('@/lib/db/models/Render');
  return Render;
}

async function getUser() {
  const { User } = await import('@/lib/db/models/User');
  return User;
}

// Compute current streak from a sorted array of 'YYYY-MM-DD' date strings.
function computeCurrentStreak(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);

  const dateSet = new Set(sortedDates);
  const startFrom = dateSet.has(todayStr) ? todayStr : dateSet.has(yesterdayStr) ? yesterdayStr : null;
  if (!startFrom) return 0;

  const startDate = new Date(startFrom + 'T00:00:00Z');
  let streak = 0;
  const cursor = new Date(startDate);

  for (let i = 0; i < 365; i++) {
    const ds = cursor.toISOString().slice(0, 10);
    if (dateSet.has(ds)) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export interface EvaluateResult {
  newlyUnlocked: BadgeDefinition[];
}

export async function evaluateUserBadges(userId: string): Promise<EvaluateResult> {
  try {
    await getDb();
    const [Render, User] = await Promise.all([getRender(), getUser()]);

    const objectId = new Types.ObjectId(userId);

    // Load user's already-unlocked badge IDs
    const user = await User.findOne({ clerkId: userId }).select('unlockedBadges').lean() as any;
    if (!user) return { newlyUnlocked: [] };

    const alreadyUnlocked = new Set<string>(
      (user.unlockedBadges ?? []).map((b: { badgeId: string }) => b.badgeId)
    );

    // Find which badge types are still locked (skip queries we don't need)
    const needsRenderCount = BADGE_CATALOG.some(
      b => b.criteria.type === 'render_count' && !alreadyUnlocked.has(b.id)
    );
    const needsStyles = BADGE_CATALOG.some(
      b => b.criteria.type === 'distinct_styles' && !alreadyUnlocked.has(b.id)
    );
    const needsTools = BADGE_CATALOG.some(
      b => b.criteria.type === 'distinct_tools' && !alreadyUnlocked.has(b.id)
    );
    const needsVastu = BADGE_CATALOG.some(
      b => b.criteria.type === 'vastu_scans' && !alreadyUnlocked.has(b.id)
    );
    const needsStreak = BADGE_CATALOG.some(
      b => b.criteria.type === 'streak_days' && !alreadyUnlocked.has(b.id)
    );

    // Run only the queries we need, in parallel
    const [renderCount, distinctStyles, distinctTools, vastuCount, activityDates] =
      await Promise.all([
        needsRenderCount
          ? Render.countDocuments({ userId: objectId, status: 'completed' })
          : Promise.resolve(0),

        needsStyles
          ? Render.distinct('style', { userId: objectId, status: 'completed' })
          : Promise.resolve([]),

        needsTools
          ? Render.distinct('featureType', {
              userId: objectId,
              status: 'completed',
              featureType: { $nin: [null, ''] },
            })
          : Promise.resolve([]),

        needsVastu
          ? Render.countDocuments({
              userId: objectId,
              status: 'completed',
              featureType: { $regex: /vastu/i },
            })
          : Promise.resolve(0),

        needsStreak
          ? Render.aggregate([
              { $match: { userId: objectId, status: 'completed' } },
              { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } } },
              { $sort: { _id: 1 } },
            ])
          : Promise.resolve([]),
      ]);

    const styleCount = (distinctStyles as string[]).filter(Boolean).length;
    const toolCount = (distinctTools as string[]).filter(Boolean).length;
    const currentStreak = needsStreak
      ? computeCurrentStreak((activityDates as { _id: string }[]).map(d => d._id))
      : 0;

    // Evaluate each badge
    const newlyUnlocked: BadgeDefinition[] = [];
    const unlockTime = new Date();

    for (const badge of BADGE_CATALOG) {
      if (alreadyUnlocked.has(badge.id)) continue;

      let earned = false;
      const { type, threshold } = badge.criteria;

      if (type === 'render_count')   earned = renderCount >= threshold;
      if (type === 'distinct_styles') earned = styleCount >= threshold;
      if (type === 'distinct_tools')  earned = toolCount >= threshold;
      if (type === 'vastu_scans')     earned = vastuCount >= threshold;
      if (type === 'streak_days')     earned = currentStreak >= threshold;

      if (earned) {
        newlyUnlocked.push(badge);
      }
    }

    if (newlyUnlocked.length === 0) return { newlyUnlocked: [] };

    // Persist all newly unlocked badges in one atomic $push
    await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $push: {
          unlockedBadges: {
            $each: newlyUnlocked.map(b => ({ badgeId: b.id, unlockedAt: unlockTime })),
          },
        },
      }
    );

    return { newlyUnlocked };
  } catch (err) {
    // Never throw — this runs fire-and-forget; a failure must not surface to the user
    console.error('[evaluateUserBadges] Error:', err);
    return { newlyUnlocked: [] };
  }
}
