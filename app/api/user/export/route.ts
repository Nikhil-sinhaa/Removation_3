import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/auth/jwt';
import { collectUserData } from '@/lib/privacy/dataCollector';
import { generateHtmlReport } from '@/lib/privacy/reportGenerator';
import PrivacyRequest from '@/lib/db/models/PrivacyRequest';
import mongoose from 'mongoose';

/**
 * POST /api/user/export
 * Collects all user data, returns JSON + HTML report, records an audit entry.
 */
export async function POST() {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();

  const data = await collectUserData(authUser.id);
  const html = generateHtmlReport(data);

  const profile = data.profile as Record<string, unknown> | null;
  const userName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim() || authUser.email;

  await PrivacyRequest.create({
    userId:      new mongoose.Types.ObjectId(authUser.id),
    userEmail:   authUser.email,
    userName,
    type:        'export',
    status:      'completed',
    processedAt: new Date(),
  });

  return NextResponse.json({
    success:     true,
    data,
    htmlReport:  html,
    exportedAt:  data.exportedAt,
    summary:     data._meta,
  });
}

/**
 * GET /api/user/export
 * Returns the latest export request for the current user.
 */
export async function GET() {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();

  const latest = await PrivacyRequest.findOne({
    userId: new mongoose.Types.ObjectId(authUser.id),
    type: 'export',
  }).sort({ createdAt: -1 });

  return NextResponse.json({ request: latest });
}
