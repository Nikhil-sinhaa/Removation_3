import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { signResetToken } from '@/lib/auth/jwt';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimiters } from '@/lib/redis/rateLimit';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
    const rl = await rateLimiters.auth(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { message: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email });

    if (!user) {
      // Return 200 to prevent email enumeration
      return NextResponse.json({ message: 'If you have an account, a reset link has been sent' }, { status: 200 });
    }

    const resetToken = signResetToken(user._id.toString());
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const emailSent = await sendPasswordResetEmail(email, resetLink);

    if (!emailSent) {
      return NextResponse.json({ message: 'Error sending reset email' }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'If you have an account, a reset link has been sent' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
