import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/auth/jwt';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const AIRun = require('../../../../src/models/AIRun.js').default;

const PROCESSING_TYPES = [
  'redesign', 'room-changer', 'furniture-remover', 'ceiling-changer',
  'floor-plan', 'multi-room-3d', 'furniture-placement', 'lighting',
  'tool-style-transfer',
];

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);

    if (!Number.isFinite(year) || year < 2020 || year > 2100) {
      return new NextResponse('Invalid year', { status: 400 });
    }

    await connectDB();

    const userId = new mongoose.Types.ObjectId(authUser.id);
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    // Daily counts for the requested year
    const dailyCounts: { _id: string; count: number }[] = await AIRun.aggregate([
      {
        $match: {
          userId,
          status: 'completed',
          processingType: { $in: PROCESSING_TYPES },
          createdAt: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]);

    // All-time active dates for streak calculation (lightweight: just dates)
    const allActiveDates: { _id: string }[] = await AIRun.aggregate([
      {
        $match: {
          userId,
          status: 'completed',
          processingType: { $in: PROCESSING_TYPES },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Available years for the year selector
    const availableYearsResult: { _id: number }[] = await AIRun.aggregate([
      {
        $match: {
          userId,
          status: 'completed',
          processingType: { $in: PROCESSING_TYPES },
        },
      },
      {
        $group: { _id: { $year: '$createdAt' } },
      },
      { $sort: { _id: -1 } },
    ]);

    const days = dailyCounts.map(d => ({ date: d._id, count: d.count }));
    const activeDays = days.length;

    // Build an ordered date set for streak calculations
    const allDates = allActiveDates.map(d => d._id).sort();
    const allDateSet = new Set(allDates);

    // Max streak: single pass over sorted dates
    let maxStreak = 0;
    let tempStreak = 0;
    let prevDate: string | null = null;

    for (const dateStr of allDates) {
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const prev = new Date(prevDate + 'T00:00:00Z');
        const curr = new Date(dateStr + 'T00:00:00Z');
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
        tempStreak = diffDays === 1 ? tempStreak + 1 : 1;
      }
      maxStreak = Math.max(maxStreak, tempStreak);
      prevDate = dateStr;
    }

    // Current streak: walk back from today
    let currentStreak = 0;
    const checkDate = new Date();
    const todayStr = [
      checkDate.getUTCFullYear(),
      String(checkDate.getUTCMonth() + 1).padStart(2, '0'),
      String(checkDate.getUTCDate()).padStart(2, '0'),
    ].join('-');

    // If today has no activity, start counting from yesterday
    if (!allDateSet.has(todayStr)) {
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    }

    for (let i = 0; i < 365; i++) {
      const ds = [
        checkDate.getUTCFullYear(),
        String(checkDate.getUTCMonth() + 1).padStart(2, '0'),
        String(checkDate.getUTCDate()).padStart(2, '0'),
      ].join('-');
      if (allDateSet.has(ds)) {
        currentStreak++;
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      } else {
        break;
      }
    }

    const currentYear = new Date().getFullYear();
    const availableYears = availableYearsResult.map(r => r._id);
    if (!availableYears.includes(currentYear)) {
      availableYears.push(currentYear);
      availableYears.sort((a, b) => b - a);
    }

    return NextResponse.json({
      year,
      days,
      activeDays,
      currentStreak,
      maxStreak,
      availableYears,
    });
  } catch (error) {
    console.error('[ACTIVITY_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
