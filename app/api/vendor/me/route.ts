// app/api/vendor/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Vendor } from '@/lib/db/models/Vendor';

export async function GET(req: NextRequest) {
    try {
        const authResult = await requireRole(req, ['customer', 'vendor', 'admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { user } = authResult;
        const userId = user._id;

        await connectToDatabase();

        const vendor = await Vendor.findOne({ userId });

        if (!vendor) {
            return NextResponse.json({ message: 'Vendor profile not found' }, { status: 404 });
        }

        return NextResponse.json({ vendor }, { status: 200 });
    } catch (error) {
        console.error('Get vendor profile error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
