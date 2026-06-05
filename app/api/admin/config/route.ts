import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AdminConfig } from '@/lib/db/models/AdminConfig';

export async function GET(req: NextRequest) {
    try {
        const authResult = await requireRole(req, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        await connectToDatabase();

        const configs = await AdminConfig.find({}).lean();
        
        // Convert array to map
        const configMap: Record<string, any> = {};
        for (const c of configs) {
            configMap[c.key] = c.value;
        }

        return NextResponse.json(configMap, { status: 200 });
    } catch (error) {
        console.error('GET admin config error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authResult = await requireRole(req, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const body = await req.json();
        
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ message: 'Invalid body' }, { status: 400 });
        }

        await connectToDatabase();

        const adminId = authResult.user._id;

        // Update each key in body
        for (const [key, value] of Object.entries(body)) {
            // Find existing config or create new one
            await AdminConfig.findOneAndUpdate(
                { key },
                {
                    key,
                    value,
                    updatedBy: adminId,
                    updatedAt: new Date()
                },
                { upsert: true, new: true }
            );
        }

        return NextResponse.json({ success: true, message: 'Configuration updated successfully' }, { status: 200 });
    } catch (error) {
        console.error('POST admin config error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
