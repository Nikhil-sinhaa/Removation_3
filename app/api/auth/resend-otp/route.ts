import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { generateOtp, hashOtp } from '@/lib/auth/otp';
import { sendOtpEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Rate limiting logic can be added here
    if (user.otpExpiry && new Date() < user.otpExpiry) {
      const remainingTime = Math.ceil((user.otpExpiry.getTime() - Date.now()) / 1000);
      if (remainingTime > 13 * 60) { // If requested within 2 mins of previous request
        return NextResponse.json({ message: 'Please wait before requesting another OTP' }, { status: 429 });
      }
    }

    const otp = generateOtp();
    user.otp = await hashOtp(otp);
    user.otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    const emailSent = await sendOtpEmail(email, otp);

    if (!emailSent) {
      return NextResponse.json({ message: 'Error sending OTP email' }, { status: 500 });
    }

    return NextResponse.json({ message: 'OTP resent successfully' }, { status: 200 });
    
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
