/**
 * POST /api/ai/furniture-placement/composite
 *
 * Runs the full furniture placement pipeline using furniture_full_control.json.
 * The workflow handles BG removal, scaling, rotation, and compositing in one shot.
 *
 * Request body (JSON):
 * {
 *   roomComfyFilename:     string   — room image in ComfyUI/input/
 *   furnitureComfyFilename: string  — ORIGINAL furniture (workflow does its own RMBG)
 *   roomImageUrl:          string   — public preview URL for MongoDB record
 *   roomWidth:             number   — actual room image width after save-image-for-comfy
 *   roomHeight:            number   — actual room image height
 *   placement: {
 *     posX:        number   — center X as % of room width (0-100)
 *     posY:        number   — center Y as % of room height (0-100)
 *     scaleFactor: number   — furniture size relative to original (e.g. 0.30 = 30%)
 *     rotation:    number   — clockwise degrees (-180 to 180); negated for OpenCV
 *     furNatW:     number   — furniture no-bg image naturalWidth (for coordinate math)
 *     furNatH:     number   — furniture no-bg image naturalHeight
 *   }
 * }
 */

import { NextResponse } from 'next/server';
import { mkdir, copyFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import { connectDB }   from '@/lib/db/mongodb';
import AIRun          from '@/src/models/AIRun.js';
import FurniturePlacementRun from '@/src/models/FurniturePlacementRun.js';
import comfyBridge     from '@/src/services/comfyBridge';
import { guiToApiGraph } from '@/src/lib/comfyWorkflowConverter.js';
import { getCurrentUser } from '@/lib/auth/jwt';
import { getQueueDepth } from '@/lib/redis/aiQueue';

export const runtime = 'nodejs';

const PUBLIC_RENDERS  = path.join(process.cwd(), 'public', 'renders');
const COMFY_OUTPUT    = process.env.COMFY_OUTPUT || '/home/nikhil/Documents/Remo2/ComfyUI/output';
const WORKFLOWS_DIR   = path.join(process.cwd(), 'src', 'workflows', 'furniture remover');

export async function POST(request) {
  await connectDB();

  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const finalUserId = authUser.id;

    const queueDepth = await getQueueDepth();
    if (queueDepth >= 10) {
      return NextResponse.json(
        { error: 'Server is busy. Please try again in a few minutes.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      roomComfyFilename,
      furnitureComfyFilename,
      roomImageUrl,
      roomWidth  = 1024,
      roomHeight = 768,
      placement,
    } = body;

    if (!roomComfyFilename || !furnitureComfyFilename || !placement) {
      return NextResponse.json(
        { error: 'roomComfyFilename, furnitureComfyFilename, and placement are required' },
        { status: 400 }
      );
    }

    const {
      posX        = 50,
      posY        = 60,
      scaleFactor = 0.30,
      rotation    = 0,
      furNatW     = 200,
      furNatH     = 200,
    } = placement;

    // ── Coordinate conversion ─────────────────────────────────────────────────
    // scaleFactor: e.g. 0.30 → furniture is 30% of its original size
    // posX/Y: center of furniture as % of room dimensions
    const furW = Math.max(10, Math.round(furNatW * scaleFactor));
    const furH = Math.max(10, Math.round(furNatH * scaleFactor));

    const centerX = Math.round((posX / 100) * roomWidth);
    const centerY = Math.round((posY / 100) * roomHeight);

    // ImageCompositeMasked x/y = top-left corner of furniture in room pixel space
    const roomX = Math.max(0, centerX - Math.round(furW / 2));
    const roomY = Math.max(0, centerY - Math.round(furH / 2));

    // ImageTransform: user clockwise → OpenCV counter-clockwise (negate)
    const angle = -rotation;

    console.log(
      `[FurniturePlacement] room(${roomWidth}×${roomHeight}) ` +
      `fur(${furW}×${furH}) pos(${roomX},${roomY}) scale=${scaleFactor} rot=${angle}°`
    );

    // ── Load and convert workflow ─────────────────────────────────────────────
    const wfPath = path.join(WORKFLOWS_DIR, 'furniture_full_control.json');
    const wfJson = JSON.parse(fs.readFileSync(wfPath, 'utf8'));
    const apiGraph = guiToApiGraph(wfJson);

    // Node 1: Load Room
    apiGraph['1'].inputs.image = roomComfyFilename;

    // Node 2: Load Furniture (original — workflow does its own RMBG)
    apiGraph['2'].inputs.image = furnitureComfyFilename;

    // Node 3: ImageScale room — override hardcoded 1024×768 to actual dimensions
    apiGraph['3'].inputs.width  = roomWidth;
    apiGraph['3'].inputs.height = roomHeight;

    // Node 7 & 9: ImageScaleBy — same scale factor for image and mask
    apiGraph['7'].inputs.scale_by = scaleFactor;
    apiGraph['9'].inputs.scale_by = scaleFactor;

    // Node 13 & 14: ImageTransform — same angle for image and mask
    apiGraph['13'].inputs.angle = angle;
    apiGraph['14'].inputs.angle = angle;

    // Node 11: ImageCompositeMasked — placement position
    apiGraph['11'].inputs.x = roomX;
    apiGraph['11'].inputs.y = roomY;

    // Node 12: SaveImage — output prefix for finding the result
    apiGraph['12'].inputs.filename_prefix = 'furniture-place/result';

    // ── Acquire bridge mutex ──────────────────────────────────────────────────
    const maxWait = 300_000;
    const pollMs  = 3_000;
    let waited    = 0;
    while (comfyBridge._ultraProRunning && waited < maxWait) {
      await new Promise(r => setTimeout(r, pollMs));
      waited += pollMs;
    }
    comfyBridge._ultraProRunning = true;

    let outputs;
    try {
      outputs = await comfyBridge._submitStageAndWait(apiGraph);
    } finally {
      comfyBridge._ultraProRunning = false;
    }

    // ── Extract output filename ───────────────────────────────────────────────
    // Node 12 is SaveImage (the actual result). We must prefer it over
    // intermediate preview nodes like AILab_Preview (node 6) which also
    // produce image outputs and would otherwise be picked up first.
    let outputFilename  = null;
    let outputSubfolder = 'furniture-place';

    // 1. Try the SaveImage node (node 12) first
    if (outputs['12']?.images?.length) {
      outputFilename  = outputs['12'].images[0].filename;
      outputSubfolder = outputs['12'].images[0].subfolder || 'furniture-place';
    }

    // 2. Fall back: scan all nodes for any image output
    if (!outputFilename) {
      for (const nodeId in outputs) {
        const images = outputs[nodeId]?.images;
        if (images?.length) {
          outputFilename  = images[0].filename;
          outputSubfolder = images[0].subfolder || 'furniture-place';
          break;
        }
      }
    }

    if (!outputFilename) {
      return NextResponse.json({ error: 'Composite produced no output' }, { status: 500 });
    }

    // ── Copy result to public/renders ─────────────────────────────────────────
    await mkdir(PUBLIC_RENDERS, { recursive: true });
    const ts           = Date.now();
    const destFilename = `placement_${ts}.png`;
    const destPath     = path.join(PUBLIC_RENDERS, destFilename);

    const isCloud = await comfyBridge._isCloud();
    if (isCloud) {
      const comfyUrl = await comfyBridge.getComfyRestUrl();
      const viewUrl  = `${comfyUrl}/view?filename=${encodeURIComponent(outputFilename)}&subfolder=${encodeURIComponent(outputSubfolder)}&type=output`;
      const res      = await fetch(viewUrl, { headers: { 'bypass-tunnel-reminder': 'true' } });
      if (!res.ok) throw new Error(`Cloud download failed: ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const { writeFile } = await import('fs/promises');
      await writeFile(destPath, buf);
    } else {
      const candidates = [
        path.join(COMFY_OUTPUT, outputSubfolder, outputFilename),
        path.join(COMFY_OUTPUT, outputFilename),
      ];
      let copied = false;
      for (const src of candidates) {
        if (fs.existsSync(src)) {
          await copyFile(src, destPath);
          copied = true;
          break;
        }
      }
      if (!copied) {
        throw new Error(`Composite output not found: ${outputFilename}`);
      }
    }

    const resultUrl = `/renders/${destFilename}`;

    // ── Persist to MongoDB ────────────────────────────────────────────────────
    const project = await AIRun.create({
      name:           'Furniture Placement',
      userId:         finalUserId,
      originalImage:  roomImageUrl || '',
      resultImage:    resultUrl,
      status:         'completed',
      processingType: 'furniture-placement',
    });

    await FurniturePlacementRun.create({
      userId:            finalUserId,
      projectId:         project._id,
      roomImageUrl:      roomImageUrl || '',
      furnitureImageUrl: furnitureComfyFilename,
      placement,
      resultUrl,
      status:            'done',
    });

    return NextResponse.json({
      success:   true,
      projectId: String(project._id),
      resultUrl,
    });

  } catch (err) {
    comfyBridge._ultraProRunning = false;
    console.error('[FurniturePlacement] composite error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
