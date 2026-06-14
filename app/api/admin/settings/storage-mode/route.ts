/**
 * GET  /api/admin/settings/storage-mode  → returns { mode: 'local' | 'drive' }
 * POST /api/admin/settings/storage-mode  → { mode } → saves to AppSettings, returns { ok: true, mode }
 *
 * Admin-only. Reads/writes the STORAGE_MODE key via getSetting/setSetting.
 * Invalidates the in-process cache in storageService after a successful write.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectDB } from '@/lib/db/mongodb';
import { getSetting, setSetting } from '@/src/lib/appSettings';
import { invalidateStorageModeCache } from '@/lib/storage/storageService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, ['admin']);
  if (authResult instanceof NextResponse) return authResult;

  await connectDB();
  const stored = await getSetting('STORAGE_MODE');
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
  await setSetting('STORAGE_MODE', mode);

  // Bust the in-process cache so the next image save picks up the new mode immediately
  invalidateStorageModeCache();

  console.log(`[Admin] STORAGE_MODE set to '${mode}'`);
  return NextResponse.json({ ok: true, mode });
}
