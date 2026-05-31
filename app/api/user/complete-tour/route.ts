import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';

export async function POST(req: Request) {
  try {
    const authUser = await getCurrentUser();

    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { tourKey } = await req.json();
    if (!tourKey) {
      return NextResponse.json({ success: false, message: 'tourKey is required' }, { status: 400 });
    }

    await connectToDatabase();
    await User.findByIdAndUpdate(authUser.id, {
      $addToSet: { completedTours: tourKey }  // addToSet prevents duplicates
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing tour:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
