// app/api/vendors/[id]/inquiry/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Vendor } from '@/lib/db/models/Vendor';
import { VendorInquiry } from '@/lib/db/models/VendorInquiry';
import { Types } from 'mongoose';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Authenticate user - customers or any registered user can send inquiries
        const authResult = await requireRole(req, ['customer', 'designer', 'contractor', 'vendor', 'admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { user } = authResult;
        const customerId = user._id;

        const { id: vendorId } = await params;
        if (!Types.ObjectId.isValid(vendorId)) {
            return NextResponse.json({ message: 'Invalid vendor ID' }, { status: 400 });
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
        }

        const { message, phone, email } = body;

        if (!message || typeof message !== 'string' || message.trim().length < 10) {
            return NextResponse.json(
                { message: 'Inquiry message is required (min 10 characters)' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Check if the vendor is verified and active
        const vendor = await Vendor.findOne({ _id: vendorId, isVerified: true, isActive: true });
        if (!vendor) {
            return NextResponse.json({ message: 'Vendor not found' }, { status: 404 });
        }

        // Prevent vendors from inquiring to themselves
        if (vendor.userId.toString() === customerId.toString()) {
            return NextResponse.json({ message: 'You cannot send an inquiry to yourself' }, { status: 400 });
        }

        // Create the inquiry
        const inquiry = await VendorInquiry.create({
            customerId,
            vendorId: vendor._id,
            message: message.trim(),
            phone: phone ? phone.trim() : undefined,
            email: email ? email.trim() : undefined,
            status: 'pending',
        });

        return NextResponse.json({ message: 'Inquiry sent successfully', inquiry }, { status: 201 });
    } catch (error) {
        console.error('Create vendor inquiry error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
