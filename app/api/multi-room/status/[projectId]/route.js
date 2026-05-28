/**
 * GET /api/multi-room/status/[projectId]
 *
 * Returns the full painting + Marble 3D status for a MultiRoomProject.
 * Frontend polls this every 4 s to update the UI.
 */

import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db/mongodb';
import MultiRoomProject from '../../../../../src/models/MultiRoomProject.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  await connectDB();

  const { projectId } = await params;

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  try {
    const mp = await MultiRoomProject.findById(projectId).lean();
    if (!mp) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      projectId: String(mp._id),
      roomName: mp.roomName,
      colorName: mp.colorName,
      colorHex: mp.colorHex,

      // Painting
      paintingStatus: mp.paintingStatus,
      paintedCount: mp.paintedCount,
      totalCount: mp.totalCount,

      // Per-photo detail
      photos: mp.photos.map(p => ({
        order: p.order,
        originalUrl: p.originalUrl,
        paintedUrl: p.paintedUrl,
        status: p.status,
        errorMessage: p.errorMessage,
      })),

      // Marble 3D
      marbleStatus: mp.marbleStatus,
      marbleWorldUrl: mp.marbleWorldUrl,
      marbleThumbnail: mp.marbleThumbnail,

      errorMessage: mp.errorMessage,
      updatedAt: mp.updatedAt,
    });
  } catch (error) {
    console.error('❌ /api/multi-room/status GET error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
