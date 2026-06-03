/**
 * GET /api/admin/audit-logs
 *
 * Query params:
 *   page, limit, category, action, adminId, targetId, search, from, to
 *
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import AuditLog from '@/lib/db/models/AuditLog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const auth = await requireRole(req, ['admin']);
        if (auth instanceof NextResponse) return auth;

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1',   10));
        const limit    = Math.min(100, parseInt(searchParams.get('limit') ?? '50',  10));
        const category = searchParams.get('category') ?? '';
        const action   = searchParams.get('action')   ?? '';
        const adminId  = searchParams.get('adminId')  ?? '';
        const targetId = searchParams.get('targetId') ?? '';
        const search   = searchParams.get('search')   ?? '';
        const from     = searchParams.get('from')     ?? '';
        const to       = searchParams.get('to')       ?? '';

        // Build filter
        const filter: Record<string, unknown> = {};

        if (category) filter.category = category;
        if (action)   filter.action   = action;
        if (adminId)  filter.adminId  = adminId;
        if (targetId) filter.targetId = targetId;

        if (from || to) {
            const dateRange: Record<string, Date> = {};
            if (from) dateRange.$gte = new Date(from);
            if (to)   dateRange.$lte = new Date(to);
            filter.createdAt = dateRange;
        }

        if (search) {
            filter.$or = [
                { description: { $regex: search, $options: 'i' } },
                { adminName:   { $regex: search, $options: 'i' } },
                { adminEmail:  { $regex: search, $options: 'i' } },
                { targetName:  { $regex: search, $options: 'i' } },
            ];
        }

        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments(filter),
        ]);

        // Stats (always across all logs — no filter)
        const [totalCount, todayCount, categoryBreakdown] = await Promise.all([
            AuditLog.countDocuments({}),
            AuditLog.countDocuments({
                createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            }),
            AuditLog.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
            ]),
        ]);

        const stats = {
            total: totalCount,
            today: todayCount,
            byCategory: Object.fromEntries(
                categoryBreakdown.map((c: any) => [c._id, c.count])
            ),
        };

        return NextResponse.json({
            logs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            stats,
        }, { status: 200 });

    } catch (error) {
        console.error('GET audit-logs error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
