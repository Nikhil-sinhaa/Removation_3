// app/api/vendor/inquiries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Vendor } from '@/lib/db/models/Vendor';
import { VendorInquiry } from '@/lib/db/models/VendorInquiry';

export async function GET(req: NextRequest) {
    try {
        const authResult = await requireRole(req, ['vendor', 'admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { user } = authResult;

        await connectToDatabase();

        // Find vendor profile
        const vendor = await Vendor.findOne({ userId: user._id });
        if (!vendor) {
            return NextResponse.json({ message: 'Vendor profile not found' }, { status: 404 });
        }

        // Get inquiries
        const inquiries = await VendorInquiry.find({ vendorId: vendor._id })
            .populate('customerId', 'firstName lastName email')
            .sort({ createdAt: -1 });

        return NextResponse.json({ inquiries, total: inquiries.length }, { status: 200 });
    } catch (error) {
        console.error('List vendor inquiries error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
