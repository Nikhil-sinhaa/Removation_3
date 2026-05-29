/**
 * GET /api/admin/subscriptions
 *
 * Returns subscription stats and paginated subscriber list:
 * - Counts by plan / status
 * - Revenue totals
 * - Recent transactions list
 * - Paginated list of subscribed users
 *
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authResult = await requireRole(req, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1',  10));
        const limit  = Math.min(100, parseInt(searchParams.get('limit') ?? '50', 10));
        const plan   = searchParams.get('plan')   ?? 'all';
        const status = searchParams.get('status') ?? 'all';
        const search = searchParams.get('search') ?? '';

        const now            = new Date();
        const startOfMonth   = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        // ---- Aggregate stats in parallel ----
        const [
            totalSubscribers,
            activeSubscribers,
            proSubscribers,
            teamSubscribers,
            freeSubscribers,
            newThisMonth,
            newLastMonth,
            allUsersForRevenue,
            planBreakdown,
            statusBreakdown,
        ] = await Promise.all([
            // anyone with a paid plan
            User.countDocuments({ 'subscription.plan': { $in: ['pro', 'team'] } }),
            User.countDocuments({ 'subscription.status': 'active' }),
            User.countDocuments({ 'subscription.plan': 'pro' }),
            User.countDocuments({ 'subscription.plan': 'team' }),
            User.countDocuments({ 'subscription.plan': { $in: ['free', null, undefined] } }),
            User.countDocuments({
                'subscription.plan': { $in: ['pro', 'team'] },
                'subscription.startDate': { $gte: startOfMonth },
            }),
            User.countDocuments({
                'subscription.plan': { $in: ['pro', 'team'] },
                'subscription.startDate': { $gte: startOfLastMonth, $lte: endOfLastMonth },
            }),
            // get payment history for revenue calc
            User.find({ 'paymentHistory.0': { $exists: true } })
                .select('paymentHistory subscription email firstName lastName')
                .lean(),
            User.aggregate([
                { $group: { _id: '$subscription.plan', count: { $sum: 1 } } },
            ]),
            User.aggregate([
                { $match: { 'subscription.plan': { $in: ['pro', 'team'] } } },
                { $group: { _id: '$subscription.status', count: { $sum: 1 } } },
            ]),
        ]);

        // ---- Revenue calculations ----
        let totalRevenue = 0;
        let monthRevenue = 0;
        let lastMonthRevenue = 0;

        const transactions: Array<{
            id: string;
            userId: string;
            userName: string;
            userEmail: string;
            plan: string;
            amount: number;
            currency: string;
            status: string;
            createdAt: string;
            paymentMethod: string;
        }> = [];

        for (const u of allUsersForRevenue as any[]) {
            const userName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
            if (Array.isArray(u.paymentHistory)) {
                for (const p of u.paymentHistory) {
                    const amt  = Number(p.amount) || 0;
                    const date = p.createdAt ? new Date(p.createdAt) : null;
                    const isPaid =
                        p.status === 'completed' ||
                        p.status === 'succeeded'  ||
                        p.status === 'paid';

                    if (isPaid) {
                        totalRevenue += amt;
                        if (date && date >= startOfMonth)      monthRevenue     += amt;
                        if (date && date >= startOfLastMonth && date <= endOfLastMonth) lastMonthRevenue += amt;
                    }

                    transactions.push({
                        id:            p._id?.toString() ?? `${u._id}-${Math.random()}`,
                        userId:        u._id?.toString() ?? '',
                        userName,
                        userEmail:     u.email,
                        plan:          p.plan ?? u.subscription?.plan ?? 'pro',
                        amount:        amt,
                        currency:      p.currency ?? 'INR',
                        status:        p.status ?? 'unknown',
                        createdAt:     p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
                        paymentMethod: p.paymentMethod ?? p.provider ?? 'razorpay',
                    });
                }
            }
        }

        // Sort transactions newest-first
        transactions.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // ---- Plan / status maps ----
        const planMap: Record<string, number> = {};
        for (const p of planBreakdown) {
            planMap[p._id ?? 'free'] = p.count;
        }

        const statusMap: Record<string, number> = {};
        for (const s of statusBreakdown) {
            statusMap[s._id ?? 'unknown'] = s.count;
        }

        // ---- Paginated subscriber list ----
        const subQuery: Record<string, any> = {
            'subscription.plan': { $in: ['pro', 'team'] },
        };

        if (plan !== 'all')   subQuery['subscription.plan']   = plan;
        if (status !== 'all') subQuery['subscription.status'] = status;

        if (search) {
            subQuery.$or = [
                { email:     { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName:  { $regex: search, $options: 'i' } },
            ];
        }

        const [subscribers, subTotal] = await Promise.all([
            User.find(subQuery)
                .sort({ 'subscription.startDate': -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .select('firstName lastName email imageUrl subscription createdAt')
                .lean(),
            User.countDocuments(subQuery),
        ]);

        const revenueGrowth =
            lastMonthRevenue > 0
                ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
                : 0;

        return NextResponse.json({
            stats: {
                totalSubscribers,
                activeSubscribers,
                proSubscribers,
                teamSubscribers,
                freeSubscribers,
                newThisMonth,
                revenueGrowth,
                totalRevenue,
                monthRevenue,
                lastMonthRevenue,
                byPlan:   planMap,
                byStatus: statusMap,
            },
            subscribers,
            subTotal,
            page,
            limit,
            totalPages: Math.ceil(subTotal / limit),
            transactions: transactions.slice(0, 100), // cap at 100 recent
        }, { status: 200 });
    } catch (error) {
        console.error('Admin subscriptions error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
