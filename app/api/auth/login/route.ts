import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { issueJwt } from '@/lib/auth/jwt';
import { generateOtp, hashOtp } from '@/lib/auth/otp';
import { sendOtpEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 mins

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password required' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Check lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      return NextResponse.json(
        { message: 'Account locked due to too many failed attempts. Try again later.' },
        { status: 403 }
      );
    }

    // Verify Password
    const passwordMatch = user.password && await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      }
      
      await user.save();
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Reset failed attempts
    user.failedLoginAttempts = 0;
    user.lockoutUntil = undefined;

    // Send OTP if 2FA/Verification required
    const otp = generateOtp();
    user.otp = await hashOtp(otp);
    user.otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
    
    await user.save();
    
    const emailSent = await sendOtpEmail(email, otp);
    if (!emailSent) {
      return NextResponse.json({ message: 'Error sending login verification email' }, { status: 500 });
    }

    return NextResponse.json({ message: 'OTP sent for verification', userId: user._id }, { status: 200 });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
