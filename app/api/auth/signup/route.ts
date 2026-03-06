import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { generateOtp, hashOtp } from '@/lib/auth/otp';
import { sendOtpEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
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

    if (user && user.isVerified) {
      return NextResponse.json(
        { message: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    if (user) {
      // Unverified user trying to sign up again, update their details
      user.password = hashedPassword;
      user.firstName = firstName;
      user.lastName = lastName;
      user.otp = hashedOtp;
      user.otpExpiry = otpExpiry;
      await user.save();
    } else {
      user = await User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        otp: hashedOtp,
        otpExpiry,
        isVerified: false,
      });
    }

    // Send OTP
    const emailSent = await sendOtpEmail(email, otp);

    if (!emailSent) {
      return NextResponse.json(
        { message: 'Error sending verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'OTP sent to email', userId: user._id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
