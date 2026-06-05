// app/api/admin/contractors/[id]/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Contractor } from '@/lib/db/models/Contractor';
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
            return NextResponse.json({ message: 'Invalid contractor ID' }, { status: 400 });
        }

        await connectToDatabase();

        const contractor = await Contractor.findById(id);
        if (!contractor) {
            return NextResponse.json({ message: 'Contractor not found' }, { status: 404 });
        }
        if (contractor.isVerified) {
            return NextResponse.json({ message: 'Contractor is already verified' }, { status: 400 });
        }

        contractor.isVerified = true;
        contractor.verifiedAt = new Date();
        contractor.verifiedBy = authResult.user._id;
        contractor.rejectionReason = null;
        await contractor.save();

        const targetName = (contractor as any).displayName || id;
        await writeAuditLog(req, authResult.user, {
            action: 'contractor.approve',
            category: 'contractors',
            targetType: 'contractor',
            targetId: id,
            targetName,
            description: auditDescription('contractor.approve', targetName),
        });

        return NextResponse.json({ message: 'Contractor verified successfully', contractor }, { status: 200 });
    } catch (error) {
        console.error('Verify contractor error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
