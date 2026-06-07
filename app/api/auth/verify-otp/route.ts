import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { verifyOtp } from '@/lib/auth/otp';
import { issueJwt } from '@/lib/auth/jwt';
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

    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ message: 'Email and OTP required' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (!user.otp || !user.otpExpiry) {
      return NextResponse.json({ message: 'No OTP request found' }, { status: 400 });
    }

    if (new Date() > user.otpExpiry) {
      return NextResponse.json({ message: 'OTP has expired' }, { status: 400 });
    }

    const isValid = await verifyOtp(otp, user.otp);

    if (!isValid) {
      return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 });
    }

    // OTP is valid
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Create session
    const response = NextResponse.json({ message: 'Login successful', user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, imageUrl: user.imageUrl } }, { status: 200 });
    issueJwt(response, { _id: String(user._id), email: user.email });

    return response;
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
