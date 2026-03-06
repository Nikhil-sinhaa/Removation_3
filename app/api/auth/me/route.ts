import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';

export async function GET() {
  try {
    const authUser = await getCurrentUser();

    if (!authUser) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    await connectToDatabase();
    // Only return safe user info
    const dbUser = await User.findById(authUser.id).select(
      '_id email firstName lastName imageUrl credits subscription plan status stripeCustomerId'
    );

    if (!dbUser) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: dbUser._id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        imageUrl: dbUser.imageUrl,
        credits: dbUser.credits,
        subscription: dbUser.subscription
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
