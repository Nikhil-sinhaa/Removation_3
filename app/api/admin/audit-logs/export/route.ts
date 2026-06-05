/**
 * GET /api/admin/audit-logs/export
 *
 * Exports up to 10,000 audit log entries as a CSV file.
 * Accepts the same filter params as the main route.
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import AuditLog from '@/lib/db/models/AuditLog';

export const dynamic = 'force-dynamic';

/** Sanitise a cell to prevent CSV formula injection */
function sanitizeCell(val: unknown): string {
    const str = val == null ? '' : String(val).replace(/"/g, '""');
    // Strip leading chars that could trigger spreadsheet formula execution
    const safe = str.replace(/^[=+\-@\t\r]/, '');
    return `"${safe}"`;
}

function toCSVRow(cells: unknown[]): string {
    return cells.map(sanitizeCell).join(',');
}

export async function GET(req: NextRequest) {
    try {
        const auth = await requireRole(req, ['admin']);
        if (auth instanceof NextResponse) return auth;

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category') ?? '';
        const action   = searchParams.get('action')   ?? '';
        const adminId  = searchParams.get('adminId')  ?? '';
        const targetId = searchParams.get('targetId') ?? '';
        const search   = searchParams.get('search')   ?? '';
        const from     = searchParams.get('from')     ?? '';
        const to       = searchParams.get('to')       ?? '';

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

        const logs = await AuditLog.find(filter)
            .sort({ createdAt: -1 })
            .limit(10_000)
            .lean();

        const headers = [
            'Timestamp', 'Admin Name', 'Admin Email', 'Admin IP',
            'Action', 'Category', 'Target Type', 'Target Name', 'Target ID',
            'Description',
        ];

        const rows = [
            toCSVRow(headers),
            ...logs.map((log: any) =>
                toCSVRow([
                    new Date(log.createdAt).toISOString(),
                    log.adminName,
                    log.adminEmail,
                    log.adminIp,
                    log.action,
                    log.category,
                    log.targetType,
                    log.targetName ?? '',
                    log.targetId   ?? '',
                    log.description,
                ])
            ),
        ];

        const csv = rows.join('\n');
        const filename = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error) {
        console.error('Audit log export error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
