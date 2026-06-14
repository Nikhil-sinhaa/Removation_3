/**
 * GET  /api/admin/settings/vastu-mode  → returns { mode: 'local' | 'drive' }
 * POST /api/admin/settings/vastu-mode  → { mode } → saves to AppSettings, returns { ok: true, mode }
 *
 * Admin-only. Reads/writes the VASTU_PROCESSING_MODE key via getSetting/setSetting.
 * The env var VASTU_PROCESSING_MODE always takes precedence at runtime (server-side),
 * but this route controls the DB-stored fallback read by /api/vastu.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectDB } from '@/lib/db/mongodb';
import { getSetting, setSetting } from '@/src/lib/appSettings';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, ['admin']);
  if (authResult instanceof NextResponse) return authResult;

  await connectDB();
  const stored = await getSetting('VASTU_PROCESSING_MODE');
  const mode = stored === 'drive' ? 'drive' : 'local';
  return NextResponse.json({ mode });
}

export async function POST(request: NextRequest) {
  const authResult = await requireRole(request, ['admin']);
  if (authResult instanceof NextResponse) return authResult;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { mode } = body;
  if (mode !== 'local' && mode !== 'drive') {
    return NextResponse.json(
      { error: "mode must be 'local' or 'drive'" },
      { status: 400 },
    );
  }

  await connectDB();
  await setSetting('VASTU_PROCESSING_MODE', mode);
  console.log(`[Admin] VASTU_PROCESSING_MODE set to '${mode}'`);
  return NextResponse.json({ ok: true, mode });
}
