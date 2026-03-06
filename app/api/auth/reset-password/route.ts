import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { verifyResetToken } from '@/lib/auth/jwt';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ message: 'Token and new password required' }, { status: 400 });
    }

    const decoded = verifyResetToken(token);

    if (!decoded) {
      return NextResponse.json({ message: 'Invalid or expired reset token' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    
    // Unlocking the user's account if it was locked.
    user.failedLoginAttempts = 0;
    user.lockoutUntil = undefined;

    await user.save();

    return NextResponse.json({ message: 'Password has been reset successfully' }, { status: 200 });
    
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
