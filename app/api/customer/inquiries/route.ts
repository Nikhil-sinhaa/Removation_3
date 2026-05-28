// app/api/customer/inquiries/route.ts
//
// GET  /api/customer/inquiries
//   Returns all vendor inquiries that the authenticated customer has submitted,
//   sorted newest-first. Populates the associated vendor's displayName and city.
//   Auth: any logged-in user (customer / vendor / admin).

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { VendorInquiry } from '@/lib/db/models/VendorInquiry';
// Import Vendor model so mongoose knows about it for population
import '@/lib/db/models/Vendor';

export async function GET(req: NextRequest) {
    try {
        const authResult = await requireRole(req, ['customer', 'vendor', 'admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { user } = authResult;

        await connectToDatabase();

        const inquiries = await VendorInquiry.find({ customerId: user._id })
            .populate('vendorId', 'displayName city storeAddress specialties')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ inquiries, total: inquiries.length }, { status: 200 });
    } catch (error) {
        console.error('List customer inquiries error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
