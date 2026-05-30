import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';

export async function POST() {
  try {
    const authUser = await getCurrentUser();

    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    await User.findByIdAndUpdate(authUser.id, {
      tourCompleted: true,
      tourCompletedAt: new Date()
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing tour:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
