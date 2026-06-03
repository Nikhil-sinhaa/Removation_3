/**
 * PATCH /api/admin/privacy/[id]
 * Admin approves or rejects a privacy request.
 * action: 'approve' | 'reject'
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import PrivacyRequest from '@/lib/db/models/PrivacyRequest';
import { cascadeDeleteUser } from '@/lib/privacy/deletionCascade';
import { writeAuditLog } from '@/lib/audit/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  await connectToDatabase();

  const request = await PrivacyRequest.findById(id);
  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  const body = await req.json();
  const { action, adminNotes } = body as { action: 'approve' | 'reject'; adminNotes?: string };

  if (action === 'reject') {
    request.status     = 'rejected';
    request.adminNotes = adminNotes || 'Rejected by admin';
    request.processedBy  = auth.user._id;
    request.processedAt  = new Date();
    await request.save();
    return NextResponse.json({ success: true });
  }

  if (action === 'approve' && request.type === 'delete') {
    request.status = 'processing';
    await request.save();

    const report = await cascadeDeleteUser(String(request.userId));

    request.status      = 'completed';
    request.processedBy   = auth.user._id;
    request.processedAt   = new Date();
    request.adminNotes    = JSON.stringify(report.deleted);
    await request.save();

    await writeAuditLog(req, auth.user, {
      action:      'user.delete',
      category:    'users',
      targetType:  'user',
      targetId:    String(request.userId),
      targetName:  request.userEmail,
      description: `Admin approved account deletion for ${request.userEmail} (via privacy request)`,
      metadata:    { report, via: 'privacy_request' },
    });

    return NextResponse.json({ success: true, report });
  }

  return NextResponse.json({ error: 'Invalid action or request type' }, { status: 400 });
}
