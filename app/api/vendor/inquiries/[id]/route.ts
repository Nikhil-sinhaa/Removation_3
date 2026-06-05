// app/api/vendor/inquiries/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Vendor } from '@/lib/db/models/Vendor';
import { VendorInquiry } from '@/lib/db/models/VendorInquiry';
import { Types } from 'mongoose';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireRole(req, ['vendor', 'admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { user } = authResult;
        const { id } = await params;

        if (!Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Invalid inquiry ID' }, { status: 400 });
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
        }

        const { response, status } = body;
        if (!response || typeof response !== 'string' || response.trim().length < 5) {
            return NextResponse.json(
                { message: 'Response message is required (min 5 characters)' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Find vendor profile
        const vendor = await Vendor.findOne({ userId: user._id });
        if (!vendor) {
            return NextResponse.json({ message: 'Vendor profile not found' }, { status: 404 });
        }

        // Find inquiry
        const inquiry = await VendorInquiry.findById(id);
        if (!inquiry) {
            return NextResponse.json({ message: 'Inquiry not found' }, { status: 404 });
        }

        // Verify this inquiry belongs to the authenticated vendor
        if (inquiry.vendorId.toString() !== vendor._id.toString()) {
            return NextResponse.json({ message: 'Unauthorized access to this inquiry' }, { status: 403 });
        }

        // Update inquiry
        inquiry.vendorResponse = response.trim();
        inquiry.respondedAt = new Date();
        inquiry.status = status && ['responded', 'closed'].includes(status) ? status : 'responded';

        await inquiry.save();

        return NextResponse.json({ message: 'Inquiry response updated successfully', inquiry }, { status: 200 });
    } catch (error) {
        console.error('Update vendor inquiry error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
