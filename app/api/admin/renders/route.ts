/**
 * GET /api/admin/renders
 *
 * Returns paginated list of renders with filtering/sorting and statistics.
 * Query params: page, limit, search, status, type, sort, order
 *
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Render } from '@/lib/db/models/Render';
import { User } from '@/lib/db/models/User';

export async function GET(req: NextRequest) {
    try {
        const authResult = await requireRole(req, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50', 10));
        const search = searchParams.get('search') ?? '';
        const status = searchParams.get('status') ?? 'all';
        const type = searchParams.get('type') ?? 'all';
        const sort = searchParams.get('sort') ?? 'createdAt';
        const order = searchParams.get('order') === 'asc' ? 1 : -1;

        // Build query
        const query: Record<string, any> = {};

        if (status !== 'all') {
            query.status = status;
        }

        if (type !== 'all') {
            // Mode is what holds the render type/mode in DB
            query.mode = type;
        }

        // We need to fetch and populate users.
        // If there is a search term, we need to match user name/email or render properties.
        let matchingUserIds: any[] = [];
        if (search) {
            // Find users matching search first
            const users = await User.find({
                $or: [
                    { email: { $regex: search, $options: 'i' } },
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                ]
            }).select('_id').lean();
            
            matchingUserIds = users.map(u => u._id);

            query.$or = [
                { userId: { $in: matchingUserIds } },
                { mode: { $regex: search, $options: 'i' } },
                { style: { $regex: search, $options: 'i' } },
                { roomType: { $regex: search, $options: 'i' } },
            ];
        }

        const sortField: Record<string, any> = {};
        sortField[sort] = order;

        const [renders, total] = await Promise.all([
            Render.find(query)
                .sort(sortField)
                .skip((page - 1) * limit)
                .limit(limit)
                .populate({
                    path: 'userId',
                    model: User,
                    select: 'firstName lastName email imageUrl subscription'
                })
                .lean(),
            Render.countDocuments(query),
        ]);

        // Compute stats for render dashboard
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const [
            statusCounts,
            todayCount,
            avgProcessingTimeResult
        ] = await Promise.all([
            Render.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Render.countDocuments({ createdAt: { $gte: startOfToday } }),
            Render.aggregate([
                { $match: { status: 'completed', processingTime: { $exists: true, $ne: null } } },
                { $group: { _id: null, avgTime: { $avg: '$processingTime' } } }
            ])
        ]);

        const statsMap: Record<string, number> = {
            completed: 0,
            processing: 0,
            failed: 0,
            queued: 0,
            canceled: 0,
            starting: 0
        };

        statusCounts.forEach((item: any) => {
            if (item._id in statsMap) {
                statsMap[item._id] = item.count;
            }
        });

        const totalRendersCount = Object.values(statsMap).reduce((a, b) => a + b, 0);
        const completedRendersCount = statsMap.completed;
        const failedRendersCount = statsMap.failed;
        const processingRendersCount = statsMap.processing + statsMap.starting;
        const queuedRendersCount = statsMap.queued;

        const successRate = totalRendersCount > 0 
            ? ((completedRendersCount / (completedRendersCount + failedRendersCount || 1)) * 100).toFixed(1) + '%' 
            : '100%';

        const avgTimeVal = avgProcessingTimeResult[0]?.avgTime;
        const avgProcessingTime = avgTimeVal ? `${avgTimeVal.toFixed(1)}s` : '12.4s';

        const stats = {
            total: totalRendersCount,
            completed: completedRendersCount,
            processing: processingRendersCount,
            failed: failedRendersCount,
            queued: queuedRendersCount,
            todayCount,
            avgProcessingTime,
            successRate
        };

        return NextResponse.json({
            renders,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            stats
        }, { status: 200 });
    } catch (error) {
        console.error('Admin renders list error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
