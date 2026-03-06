import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const OTP_COOLDOWN_SECONDS = 60;

/** Generate a 6-digit numeric OTP */
export function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999));
}

/** Hash an OTP for secure storage */
export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

/** Compare a plain OTP against its stored hash */
export async function verifyOtp(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

/** Check if enough time has passed since last OTP send */
export function checkOtpCooldown(otpLastSentAt?: Date): {
  allowed: boolean;
  remainingSeconds: number;
} {
  if (!otpLastSentAt) return { allowed: true, remainingSeconds: 0 };
  const elapsed = (Date.now() - new Date(otpLastSentAt).getTime()) / 1000;
  const remaining = Math.ceil(OTP_COOLDOWN_SECONDS - elapsed);
  return {
    allowed: elapsed >= OTP_COOLDOWN_SECONDS,
    remainingSeconds: remaining > 0 ? remaining : 0,
  };
}
