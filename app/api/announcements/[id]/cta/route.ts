import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Announcement from '@/lib/db/models/Announcement';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  await connectToDatabase();
  const { id } = await params;

  Announcement.findByIdAndUpdate(id, { $inc: { ctaClicks: 1 } }).catch(() => {});

  return NextResponse.json({ success: true });
}
