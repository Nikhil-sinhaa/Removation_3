// app/api/vendors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Vendor } from '@/lib/db/models/Vendor';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;

        // Parse query params
        const city      = searchParams.get('city')?.trim();
        const specialty = searchParams.get('specialty')?.trim();
        const search    = searchParams.get('search')?.trim();
        const page      = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit     = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)));
        const skip      = (page - 1) * limit;

        // Build filter - always enforce isVerified and isActive for public listings
        const filter: Record<string, unknown> = {
            isVerified: true,
            isActive:   true,
        };

        if (city) {
            filter.city = { $regex: city, $options: 'i' };
        }

        if (specialty) {
            filter.specialties = specialty; // exact slug match inside array
        }

        if (search) {
            filter.displayName = { $regex: search, $options: 'i' };
        }

        await connectToDatabase();

        // Check login status for phone redaction
        const authUser  = await getCurrentUser();
        const isLoggedIn = !!authUser;

        const publicSelect = 'displayName bio city storeAddress specialties portfolioImages isVerified createdAt';
        const authedSelect = publicSelect + ' phone';
        const selectFields = isLoggedIn ? authedSelect : publicSelect;

        const [vendors, total] = await Promise.all([
            Vendor.find(filter)
                .select(selectFields)
                .populate('userId', 'firstName lastName imageUrl')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Vendor.countDocuments(filter),
        ]);

        return NextResponse.json(
            {
                vendors,
                total,
                page,
                pageCount: Math.ceil(total / limit),
                phoneIncluded: isLoggedIn,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('List vendors error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
