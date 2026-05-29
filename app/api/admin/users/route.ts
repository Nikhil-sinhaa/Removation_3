/**
 * GET /api/admin/users
 *
 * Returns paginated list of users with filtering/sorting.
 * Query params: page, limit, search, plan, role, sort, order
 *
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
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
        const plan = searchParams.get('plan') ?? 'all';
        const role = searchParams.get('role') ?? 'all';
        const sort = searchParams.get('sort') ?? 'createdAt';
        const order = searchParams.get('order') === 'asc' ? 1 : -1;

        // Build query
        const query: Record<string, any> = {};

        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
            ];
        }

        if (plan !== 'all') {
            query['subscription.plan'] = plan;
        }

        if (role !== 'all') {
            query.role = role;
        }

        const sortField: Record<string, any> = {};
        sortField[sort === 'name' ? 'firstName' : sort] = order;

        const [users, total] = await Promise.all([
            User.find(query)
                .sort(sortField)
                .skip((page - 1) * limit)
                .limit(limit)
                .select('firstName lastName email imageUrl role credits createdAt updatedAt subscription isVerified')
                .lean(),
            User.countDocuments(query),
        ]);

        return NextResponse.json({
            users,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }, { status: 200 });
    } catch (error) {
        console.error('Admin users error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
