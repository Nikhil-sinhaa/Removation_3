import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';

export async function GET() {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(authUser.id).select('onboardingCompleted');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Existing users (field undefined) are treated as already completed
    const onboardingCompleted = user.onboardingCompleted !== false;

    return NextResponse.json({ onboardingCompleted });
  } catch (error) {
    console.error('onboarding-status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
