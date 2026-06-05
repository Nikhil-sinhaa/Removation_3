// app/api/admin/vendors/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Vendor } from '@/lib/db/models/Vendor';
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
            return NextResponse.json({ message: 'Invalid vendor ID' }, { status: 400 });
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

        const vendor = await Vendor.findById(id);
        if (!vendor) {
            return NextResponse.json({ message: 'Vendor not found' }, { status: 404 });
        }

        vendor.isVerified = false;
        vendor.rejectionReason = reason.trim();
        vendor.verifiedAt = null;
        vendor.verifiedBy = null;
        await vendor.save();

        const targetName = (vendor as any).displayName || id;
        await writeAuditLog(req, authResult.user, {
            action: 'vendor.reject',
            category: 'vendors',
            targetType: 'vendor',
            targetId: id,
            targetName,
            description: auditDescription('vendor.reject', targetName),
            metadata: { reason: reason.trim() },
        });

        return NextResponse.json({ message: 'Vendor application rejected', vendor }, { status: 200 });
    } catch (error) {
        console.error('Reject vendor error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
