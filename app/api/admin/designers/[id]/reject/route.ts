/**
 * PATCH /api/admin/designers/[id]/reject
 * Rejects a designer application. Body: { reason: string }
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Designer } from '@/lib/db/models/Designer';
import { Types } from 'mongoose';
import { writeAuditLog, auditDescription } from '@/lib/audit/logger';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireRole(req, ['admin']);
        if (authResult instanceof NextResponse) return authResult;

        const { id } = await params;

        if (!Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Invalid designer ID' }, { status: 400 });
        }

        let body;
        try { body = await req.json(); } catch {
            return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
        }

        const { reason } = body;
        if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
            return NextResponse.json({ message: 'Rejection reason is required (min 5 characters)' }, { status: 400 });
        }

        await connectToDatabase();

        const designer = await Designer.findById(id);
        if (!designer) {
            return NextResponse.json({ message: 'Designer not found' }, { status: 404 });
        }

        designer.isVerified = false;
        designer.rejectionReason = reason.trim();
        designer.verifiedAt = null;
        designer.verifiedBy = null;
        await designer.save();

        const targetName = (designer as any).displayName || id;
        await writeAuditLog(req, authResult.user, {
            action: 'designer.reject',
            category: 'designers',
            targetType: 'designer',
            targetId: id,
            targetName,
            description: auditDescription('designer.reject', targetName),
            metadata: { reason: reason.trim() },
        });

        return NextResponse.json({ message: 'Designer application rejected', designer }, { status: 200 });
    } catch (error) {
        console.error('Reject designer error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
