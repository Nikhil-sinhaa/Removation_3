/**
 * POST /api/multi-room/generate-3d
 *
 * Triggers Marble 3D world generation for a painted MultiRoomProject.
 * Requires:
 *   - paintingStatus === 'painted'
 *   - At least 3 successfully painted photos
 *   - MARBLE_API_KEY env variable set
 *
 * Returns { success: true, projectId } immediately.
 * Generation happens in the background; poll status to track progress.
 */

import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db/mongodb';
import MultiRoomProject from '../../../../src/models/MultiRoomProject.js';
import { generateMarbleView } from '../../../../src/services/multiRoomOrchestrator.js';

export const runtime = 'nodejs';

export async function POST(request) {
  await connectDB();

  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const mp = await MultiRoomProject.findById(projectId);
    if (!mp) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (mp.paintingStatus !== 'painted') {
      return NextResponse.json(
        {
          error: `Photos must be fully painted before generating 3D (current status: "${mp.paintingStatus}")`,
        },
        { status: 400 }
      );
    }

    if (!process.env.MARBLE_API_KEY) {
      return NextResponse.json(
        { error: 'Marble API key is not configured on this server' },
        { status: 500 }
      );
    }

    // Prevent double-trigger
    if (['uploading', 'generating'].includes(mp.marbleStatus)) {
      return NextResponse.json(
        { error: '3D generation is already in progress', projectId },
        { status: 409 }
      );
    }

    // Fire-and-forget
    generateMarbleView(projectId).catch(err => {
      console.error(
        `[multi-room/generate-3d] generateMarbleView error (project ${projectId}):`,
        err.message
      );
    });

    return NextResponse.json({ success: true, projectId });

  } catch (error) {
    console.error('❌ /api/multi-room/generate-3d POST error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
