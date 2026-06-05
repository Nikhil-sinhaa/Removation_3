import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { issueJwt } from '@/lib/auth/jwt';
import bcrypt from 'bcryptjs';
import { getFreeCreditsOnSignup } from '@/lib/ai/appMode';
import { rateLimiters } from '@/lib/redis/rateLimit';

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const rateLimit = await rateLimiters.auth(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { email, password, firstName, lastName } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return NextResponse.json(
        { message: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    const signupCredits = await getFreeCreditsOnSignup().catch(err => {
      console.error('Error fetching dynamic free credits on signup:', err);
      return 10;
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isVerified: true,
      credits: signupCredits,
      subscription: {
        plan: 'free',
        status: 'inactive',
        credits: signupCredits,
        creditsUsed: 0,
        cancelAtPeriodEnd: false,
        paymentMethod: 'none',
      }
    });

    const response = NextResponse.json(
      {
        message: 'Signup successful',
        isNewUser: true,
        redirectTo: '/onboarding',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      },
      { status: 201 }
    );
    
    // Issue authentication cookie
    issueJwt(response, { _id: String(user._id), email: user.email });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

