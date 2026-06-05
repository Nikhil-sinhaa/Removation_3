/**
 * GET /api/admin/privacy
 * List privacy requests (export + delete). Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import PrivacyRequest from '@/lib/db/models/PrivacyRequest';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const type   = searchParams.get('type');
  const status = searchParams.get('status');
  const page   = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  const query: Record<string, unknown> = {};
  if (type)   query.type   = type;
  if (status) query.status = status;

  const [requests, total, pendingCount] = await Promise.all([
    PrivacyRequest.find(query).sort({ createdAt: -1 }).skip((page - 1) * 20).limit(20).lean(),
    PrivacyRequest.countDocuments(query),
    PrivacyRequest.countDocuments({ status: 'pending' }),
  ]);

  return NextResponse.json({ requests, total, pendingCount, page });
}
