// app/api/admin/vendors/[id]/verify/route.ts
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

        await connectToDatabase();

        const vendor = await Vendor.findById(id);
        if (!vendor) {
            return NextResponse.json({ message: 'Vendor not found' }, { status: 404 });
        }
        if (vendor.isVerified) {
            return NextResponse.json({ message: 'Vendor is already verified' }, { status: 400 });
        }

        vendor.isVerified = true;
        vendor.verifiedAt = new Date();
        vendor.verifiedBy = authResult.user._id;
        vendor.rejectionReason = null;
        await vendor.save();

        const targetName = (vendor as any).displayName || id;
        await writeAuditLog(req, authResult.user, {
            action: 'vendor.approve',
            category: 'vendors',
            targetType: 'vendor',
            targetId: id,
            targetName,
            description: auditDescription('vendor.approve', targetName),
        });

        return NextResponse.json({ message: 'Vendor verified successfully', vendor }, { status: 200 });
    } catch (error) {
        console.error('Verify vendor error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
