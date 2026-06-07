/**
 * Multi-Room Orchestrator
 *
 * Two responsibilities:
 *   1. paintAllPhotos   — runs Room Changer on each uploaded photo sequentially
 *                         (sequential to avoid VRAM contention on the RTX 4060)
 *   2. generateMarbleView — uploads painted photos to Marble, starts 3D world
 *                           generation, polls until done, saves world URL to MongoDB
 *
 * IMPORTANT: This file only calls existing services — it does NOT modify
 * roomChangerOrchestrator.js, comfyBridge.js, or any other existing service.
 */

import fs from 'fs';
import path from 'path';
import MultiRoomProject from '../models/MultiRoomProject.js';
import AIRun from '../models/AIRun.js';
import { runRoomChanger } from './roomChangerOrchestrator.js';
import {
  uploadImageToMarble,
  generateMarbleWorld,
  pollMarbleOperation,
} from './marbleService.js';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

// ─────────────────────────────────────────────────────────────────────────────
// Phase 1 — Paint all photos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paint every photo in a MultiRoomProject using Room Changer.
 * Runs sequentially to avoid VRAM contention.
 *
 * @param {string} multiProjectId - MultiRoomProject._id
 */
export async function paintAllPhotos(multiProjectId) {
  const mp = await MultiRoomProject.findById(multiProjectId);
  if (!mp) throw new Error(`MultiRoomProject ${multiProjectId} not found`);

  await MultiRoomProject.findByIdAndUpdate(multiProjectId, {
    paintingStatus: 'painting',
  });

  let paintedCount = 0;

  for (const photo of mp.photos) {
    try {
      // Mark photo as in-progress
      await MultiRoomProject.updateOne(
        { _id: multiProjectId, 'photos._id': photo._id },
        { $set: { 'photos.$.status': 'processing' } }
      );

      // Create a lightweight Project doc so roomChangerOrchestrator can
      // persist its result (it always needs a projectId).
      const subProject = await AIRun.create({
        name: `Multi-Room — ${mp.colorName} — photo ${photo.order + 1}`,
        userId: mp.userId || '000000000000000000000000',
        originalImage: photo.originalUrl,
        status: 'queued',
        processingType: 'room-changer',
        aiConfig: { colorName: mp.colorName, hex: mp.colorHex },
      });

      // Save sub-project id so we can look it up later if needed
      await MultiRoomProject.updateOne(
        { _id: multiProjectId, 'photos._id': photo._id },
        { $set: { 'photos.$.subProjectId': String(subProject._id) } }
      );

      // Run Room Changer (handles its own mutex / VRAM flush)
      const result = await runRoomChanger({
        comfyFilename: photo.comfyFilename,
        inputImageUrl: photo.originalUrl,
        colorName: mp.colorName,
        hex: mp.colorHex,
        projectId: String(subProject._id),
        userId: mp.userId || undefined,
      });

      // Mark photo done
      await MultiRoomProject.updateOne(
        { _id: multiProjectId, 'photos._id': photo._id },
        {
          $set: {
            'photos.$.status': 'done',
            'photos.$.paintedUrl': result.afterUrl,
          },
        }
      );

      paintedCount++;
      await MultiRoomProject.findByIdAndUpdate(multiProjectId, { paintedCount });

    } catch (err) {
      console.error(
        `❌ Multi-Room: failed to paint photo ${photo.order} of project ${multiProjectId}:`,
        err.message
      );
      await MultiRoomProject.updateOne(
        { _id: multiProjectId, 'photos._id': photo._id },
        {
          $set: {
            'photos.$.status': 'error',
            'photos.$.errorMessage': err.message,
          },
        }
      );
    }
  }

  const finalStatus = paintedCount > 0 ? 'painted' : 'error';
  await MultiRoomProject.findByIdAndUpdate(multiProjectId, {
    paintingStatus: finalStatus,
    paintedCount,
    ...(finalStatus === 'error' && {
      errorMessage: 'All photos failed to paint — check server logs',
    }),
  });

  console.log(
    `✅ Multi-Room painting complete: ${paintedCount}/${mp.photos.length} photos succeeded`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 — Upload painted photos to Marble + generate 3D world
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upload the painted photos to Marble and kick off 3D world generation.
 * Polls until done (up to 15 minutes) and saves world URL to MongoDB.
 *
 * @param {string} projectId - MultiRoomProject._id
 */
export async function generateMarbleView(projectId) {
  const project = await MultiRoomProject.findById(projectId);
  if (!project) throw new Error('Project not found: ' + projectId);

  const paintedPhotos = project.photos.filter(
    p => p.status === 'done' && p.paintedUrl
  );

  console.log(
    `[multiRoom] generateMarbleView: ` +
    `${paintedPhotos.length} painted photos available`
  );

  if (paintedPhotos.length < 3) {
    await MultiRoomProject.findByIdAndUpdate(projectId, {
      marbleStatus: 'error',
      errorMessage: `Only ${paintedPhotos.length} painted photos — need at least 3`,
    });
    return;
  }

  // Reset if previously cancelled/errored
  await MultiRoomProject.findByIdAndUpdate(projectId, {
    marbleStatus: 'uploading',
    errorMessage: null,
    marbleOperationId: null,
    marbleWorldId: null,
    marbleWorldUrl: null,
  });

  // Upload up to 8 painted photos to Marble
  const toUpload = paintedPhotos.slice(0, 8);
  const assetIds = [];

  for (const photo of toUpload) {
    try {
      const paintedUrl = photo.paintedUrl;

      // Reject absolute URLs — Marble upload reads from local disk, not from URLs
      if (/^https?:\/\//i.test(paintedUrl)) {
        console.error(
          `[multiRoom] paintedUrl is an absolute URL, cannot read from disk: ${paintedUrl}`
        );
        continue;
      }

      // Build absolute file path from the public URL
      // e.g. /renders/abc.png → public/renders/abc.png
      const relPath = paintedUrl.replace(/^\//, '');
      const filePath = path.join(process.cwd(), 'public', relPath);

      console.log(`[multiRoom] Reading painted photo: ${filePath}`);

      if (!fs.existsSync(filePath)) {
        console.error(
          `[multiRoom] File not found on disk: ${filePath} (paintedUrl: ${paintedUrl})`
        );
        continue;
      }

      const imageBuffer = fs.readFileSync(filePath);
      const filename = `painted_${photo.order}.jpg`;

      const assetId = await uploadImageToMarble(imageBuffer, filename);
      assetIds.push(assetId);

      // Save asset ID
      await MultiRoomProject.updateOne(
        { _id: projectId, 'photos._id': photo._id },
        { $set: { 'photos.$.marbleAssetId': assetId } }
      );

    } catch (err) {
      console.error(
        `[multiRoom] Failed to upload photo ${photo.order}:`,
        err.message
      );
    }
  }

  console.log(`[multiRoom] Uploaded ${assetIds.length} photos to Marble`);

  if (assetIds.length < 3) {
    await MultiRoomProject.findByIdAndUpdate(projectId, {
      marbleStatus: 'error',
      errorMessage: `Only ${assetIds.length} photos uploaded successfully`,
    });
    return;
  }

  // Start world generation
  await MultiRoomProject.findByIdAndUpdate(projectId, {
    marbleStatus: 'generating',
  });

  const displayName = `${project.roomName} - ${project.colorName}`;
  let operationId;

  try {
    operationId = await generateMarbleWorld(assetIds, displayName);
  } catch (err) {
    console.error(`[multiRoom] generateMarbleWorld failed:`, err.message);
    await MultiRoomProject.findByIdAndUpdate(projectId, {
      marbleStatus: 'error',
      errorMessage: err.message,
    });
    return;
  }

  await MultiRoomProject.findByIdAndUpdate(projectId, {
    marbleOperationId: operationId,
  });

  // Poll until done — max 15 minutes
  const maxPolls = 90; // 90 × 10s = 15 min

  for (let i = 0; i < maxPolls; i++) {
    await new Promise(r => setTimeout(r, 10000));

    // Check for user cancellation
    const current = await MultiRoomProject.findById(projectId);
    if (current?.marbleStatus === 'cancelled') {
      console.log(`[multiRoom] Generation cancelled by user`);
      return;
    }

    try {
      const result = await pollMarbleOperation(operationId);

      if (result.done) {
        await MultiRoomProject.findByIdAndUpdate(projectId, {
          marbleStatus: 'done',
          marbleWorldId: result.worldId,
          marbleWorldUrl: result.worldUrl,
          marbleThumbnail: result.thumbnailUrl,
        });

        // Retrieve the latest multi-room project to have the updated photos, paintedCount, etc.
        const updatedProject = await MultiRoomProject.findById(projectId);

        // Save completed 3D room to general projects list
        await AIRun.create({
          userId: updatedProject.userId || null,
          name: `3D Room View — ${updatedProject.roomName}`,
          processingType: 'multi-room-3d',
          status: 'completed',
          originalImage: updatedProject.photos[0]?.originalUrl || '',
          resultImage: updatedProject.photos.find(p => p.paintedUrl)?.paintedUrl || '',
          aiConfig: {
            multiRoomProjectId: updatedProject._id.toString(),
            roomName: updatedProject.roomName,
            colorName: updatedProject.colorName,
            colorHex: updatedProject.colorHex,
            paintedCount: updatedProject.paintedCount,
            marbleWorldUrl: result.worldUrl,
            marbleThumbnail: result.thumbnailUrl || updatedProject.marbleThumbnail || '',
          },
        });

        console.log(
          `[multiRoom] ✅ Marble world ready: ${result.worldUrl}`
        );
        return;
      }

      const status = result.progress?.status || 'in_progress';
      console.log(
        `[multiRoom] Poll ${i+1}/${maxPolls}: ${status}`
      );

    } catch (err) {
      console.error(`[multiRoom] Poll error:`, err.message);
      await MultiRoomProject.findByIdAndUpdate(projectId, {
        marbleStatus: 'error',
        errorMessage: err.message,
      });
      return;
    }
  }

  // Timed out
  await MultiRoomProject.findByIdAndUpdate(projectId, {
    marbleStatus: 'error',
    errorMessage: 'Marble generation timed out after 15 minutes',
  });
}
