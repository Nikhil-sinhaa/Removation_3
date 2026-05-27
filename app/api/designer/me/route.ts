/**
 * GET /api/designer/me
 * 
 * Manual Test:
 * curl -X GET http://localhost:3000/api/designer/me \
 *   -H "Cookie: auth_token=YOUR_JWT_HERE"
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Designer } from '@/lib/db/models/Designer';

export async function GET(req: NextRequest) {
    try {
        // Authenticate any logged-in user
        const authResult = await requireRole(req, ['customer', 'designer', 'admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { user } = authResult;
        const userId = user._id;

        await connectToDatabase();

        // Retrieve calling user's Designer profile
        const designer = await Designer.findOne({ userId });

        if (!designer) {
            return NextResponse.json({ message: 'Designer profile not found' }, { status: 404 });
        }

        return NextResponse.json({ designer }, { status: 200 });
    } catch (error) {
        console.error('Get designer profile error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
