import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Render } from '@/lib/db/models/Render';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRole(req, ['admin']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    await connectToDatabase();

    const [
      overallResult,
      byFeatureResult,
      topTagsResult,
      recentLowRatedResult,
      weeklyTrendResult,
      totalRendersCount,
    ] = await Promise.all([
      // 1. Overall stats
      Render.aggregate([
        { $match: { rating: { $ne: null, $exists: true } } },
        {
          $group: {
            _id: null,
            totalRatings: { $sum: 1 },
            averageRating: { $avg: '$rating' },
            count1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
            count2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            count3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            count4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            count5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          },
        },
      ]),

      // 2. Per-feature breakdown
      Render.aggregate([
        { $match: { rating: { $ne: null, $exists: true } } },
        {
          $group: {
            _id: '$mode',
            count: { $sum: 1 },
            avgRating: { $avg: '$rating' },
            positiveCount: { $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] } },
          },
        },
        {
          $project: {
            featureType: '$_id',
            count: 1,
            avgRating: { $round: ['$avgRating', 2] },
            positivePercent: {
              $round: [
                { $multiply: [{ $divide: ['$positiveCount', '$count'] }, 100] },
                1,
              ],
            },
          },
        },
        { $sort: { avgRating: -1 } },
      ]),

      // 3. Top feedback tags
      Render.aggregate([
        { $match: { rating: { $ne: null, $exists: true }, feedbackTags: { $exists: true, $ne: [] } } },
        { $unwind: '$feedbackTags' },
        { $group: { _id: '$feedbackTags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),

      // 4. Recent low-rated renders (rating <= 2)
      Render.find({ rating: { $lte: 2 } })
        .sort({ feedbackSubmittedAt: -1 })
        .limit(20)
        .select('_id mode rating feedbackTags feedbackComment createdAt userId')
        .lean(),

      // 5. Weekly trend (last 8 weeks)
      Render.aggregate([
        {
          $match: {
            rating: { $ne: null, $exists: true },
            feedbackSubmittedAt: {
              $gte: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $isoWeekYear: '$feedbackSubmittedAt' },
              week: { $isoWeek: '$feedbackSubmittedAt' },
            },
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } },
      ]),

      // Total renders
      Render.countDocuments(),
    ]);

    const overall = overallResult[0] ?? {
      totalRatings: 0,
      averageRating: 0,
      count1: 0,
      count2: 0,
      count3: 0,
      count4: 0,
      count5: 0,
    };

    const totalRatings = overall.totalRatings as number;

    const topTags = topTagsResult.map((t: { _id: string; count: number }) => ({
      tag: t._id,
      count: t.count,
      percent: totalRatings > 0 ? +((t.count / totalRatings) * 100).toFixed(1) : 0,
    }));

    const weeklyTrend = weeklyTrendResult.map(
      (w: { _id: { year: number; week: number }; avgRating: number; count: number }) => ({
        week: `${w._id.year}-W${String(w._id.week).padStart(2, '0')}`,
        avgRating: +w.avgRating.toFixed(2),
        count: w.count,
      })
    );

    return NextResponse.json({
      overall: {
        totalRatings,
        totalRenders: totalRendersCount,
        averageRating: overall.averageRating ? +overall.averageRating.toFixed(2) : 0,
        ratingDistribution: {
          1: overall.count1,
          2: overall.count2,
          3: overall.count3,
          4: overall.count4,
          5: overall.count5,
        },
      },
      byFeature: byFeatureResult,
      topTags,
      recentLowRated: recentLowRatedResult.map((r: any) => ({
        _id: r._id.toString(),
        featureType: r.mode,
        rating: r.rating,
        feedbackTags: r.feedbackTags ?? [],
        feedbackComment: r.feedbackComment ?? '',
        createdAt: r.createdAt,
        userId: r.userId?.toString(),
      })),
      weeklyTrend,
    });
  } catch (err) {
    console.error('[ADMIN_FEEDBACK_STATS]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
