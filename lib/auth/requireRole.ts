// lib/auth/requireRole.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User, type IUser } from '@/lib/db/models/User';
import { Document, Types } from 'mongoose';

export type RequiredUserType = Document<unknown, {}, IUser> & IUser & { _id: Types.ObjectId };

/**
 * Checks if the request is authenticated and the user has one of the allowed roles.
 * Returns the database user on success, or a NextResponse (401/403/404) on failure.
 */
export async function requireRole(
    req: NextRequest,
    roles: Array<'customer' | 'designer' | 'contractor' | 'vendor' | 'admin'>
): Promise<{ user: RequiredUserType } | NextResponse> {
    try {
        const authUser = await getCurrentUser();

        if (!authUser) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        
        // Fetch the user document from the database to inspect the role
        const dbUser = await User.findById(authUser.id);

        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Check if user's role is in the allowed list
        if (!roles.includes(dbUser.role)) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        // Return the full DB document
        return { user: dbUser as RequiredUserType };
    } catch (error) {
        console.error('requireRole error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
