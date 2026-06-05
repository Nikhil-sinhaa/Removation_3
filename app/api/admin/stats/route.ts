/**
 * GET /api/admin/stats
 *
 * Returns aggregate stats for the admin dashboard:
 * - Total users, new users today/this month
 * - Total renders, renders today, by status
 * - Subscriptions by plan / active count
 * - Recent users (last 10)
 * - Recent renders (last 10)
 *
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Render } from '@/lib/db/models/Render';

export async function GET(req: NextRequest) {
    try {
        const authResult = await requireRole(req, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        await connectToDatabase();

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        // --- User stats ---
        const [
            totalUsers,
            newUsersToday,
            newUsersThisMonth,
            newUsersLastMonth,
            usersByPlan,
            usersByRole,
            recentUsers,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ createdAt: { $gte: startOfToday } }),
            User.countDocuments({ createdAt: { $gte: startOfMonth } }),
            User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
            User.aggregate([
                { $group: { _id: '$subscription.plan', count: { $sum: 1 } } },
            ]),
            User.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } },
            ]),
            User.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .select('firstName lastName email imageUrl subscription.plan createdAt role')
                .lean(),
        ]);

        // Active subscriptions = users with subscription.status === 'active'
        const activeSubscriptions = await User.countDocuments({ 'subscription.status': 'active' });
        const proUsers = await User.countDocuments({ 'subscription.plan': { $in: ['pro', 'team'] } });

        // --- Render stats ---
        const [
            totalRenders,
            rendersToday,
            rendersThisMonth,
            rendersLastMonth,
            rendersByStatus,
            rendersByMode,
            recentRenders,
        ] = await Promise.all([
            Render.countDocuments(),
            Render.countDocuments({ createdAt: { $gte: startOfToday } }),
            Render.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Render.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
            Render.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Render.aggregate([
                { $group: { _id: '$mode', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 8 },
            ]),
            Render.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('userId', 'firstName lastName email imageUrl')
                .lean(),
        ]);

        // Calculate growth % for display
        const userGrowth = newUsersLastMonth > 0
            ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
            : 0;
        const renderGrowth = rendersLastMonth > 0
            ? Math.round(((rendersThisMonth - rendersLastMonth) / rendersLastMonth) * 100)
            : 0;

        // Flatten aggregations into maps
        const planMap: Record<string, number> = {};
        for (const p of usersByPlan) { planMap[p._id ?? 'free'] = p.count; }

        const statusMap: Record<string, number> = {};
        for (const s of rendersByStatus) { statusMap[s._id ?? 'unknown'] = s.count; }

        const roleMap: Record<string, number> = {};
        for (const r of usersByRole) { roleMap[r._id ?? 'customer'] = r.count; }

        return NextResponse.json({
            users: {
                total: totalUsers,
                today: newUsersToday,
                thisMonth: newUsersThisMonth,
                growth: userGrowth,
                active: activeSubscriptions,
                pro: proUsers,
                byPlan: planMap,
                byRole: roleMap,
                recent: recentUsers,
            },
            renders: {
                total: totalRenders,
                today: rendersToday,
                thisMonth: rendersThisMonth,
                growth: renderGrowth,
                byStatus: statusMap,
                byMode: rendersByMode,
                recent: recentRenders,
            },
        }, { status: 200 });
    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
