import { NextResponse } from 'next/server';
import { disconnectDrive } from '@/src/lib/googleDrive';

export const runtime = 'nodejs';

export async function POST() {
  try {
    await disconnectDrive();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
