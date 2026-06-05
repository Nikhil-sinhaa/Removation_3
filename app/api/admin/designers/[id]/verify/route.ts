/**
 * PATCH /api/admin/designers/[id]/verify
 * Approves a designer application. Admin only.
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

        await connectToDatabase();

        const designer = await Designer.findById(id);
        if (!designer) {
            return NextResponse.json({ message: 'Designer not found' }, { status: 404 });
        }
        if (designer.isVerified) {
            return NextResponse.json({ message: 'Designer is already verified' }, { status: 400 });
        }

        designer.isVerified = true;
        designer.verifiedAt = new Date();
        designer.verifiedBy = authResult.user._id;
        designer.rejectionReason = null;
        await designer.save();

        const targetName = (designer as any).displayName || id;
        await writeAuditLog(req, authResult.user, {
            action: 'designer.approve',
            category: 'designers',
            targetType: 'designer',
            targetId: id,
            targetName,
            description: auditDescription('designer.approve', targetName),
        });

        return NextResponse.json({ message: 'Designer verified successfully', designer }, { status: 200 });
    } catch (error) {
        console.error('Verify designer error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
