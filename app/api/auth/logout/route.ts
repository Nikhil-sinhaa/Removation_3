import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth/jwt';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
  
  // Clear the auth cookie
  response.cookies.delete(COOKIE_NAME);
  
  return response;
}
