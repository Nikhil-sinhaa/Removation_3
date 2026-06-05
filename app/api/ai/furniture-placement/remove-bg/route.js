/**
 * POST /api/ai/furniture-placement/remove-bg
 *
 * Accepts a furniture image, runs RMBG via ComfyUI (no SDXL),
 * copies the result to public/renders, returns a URL.
 *
 * Uses a minimal inline workflow: LoadImage → ImageSizeAdjuster → RMBG → SaveImage
 * ~5-10 seconds, ~600MB VRAM only.
 */

import { Readable } from 'stream';
import { NextResponse } from 'next/server';
import { mkdir, copyFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import { saveImageForComfy } from '@/lib/ai/save-image-for-comfy';
import comfyBridge from '@/src/services/comfyBridge';

export const runtime = 'nodejs';

const PUBLIC_RENDERS = path.join(process.cwd(), 'public', 'renders');
const COMFY_OUTPUT   = process.env.COMFY_OUTPUT || '/home/nikhil/Documents/Remo2/ComfyUI/output';

async function safeParseFormData(request) {
  try {
    return await request.formData();
  } catch (_) {
    const Busboy = (await import('busboy')).default;
    const contentType = request.headers.get('content-type') || '';
    return new Promise(async (resolve, reject) => {
      const fields = new Map();
      const files  = new Map();
      const bb     = Busboy({ headers: { 'content-type': contentType } });
      bb.on('file', (fieldname, fileStream, info) => {
        const { filename, mimeType } = info;
        const chunks = [];
        fileStream.on('data', c => chunks.push(c));
        fileStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const blob   = new Blob([buffer], { type: mimeType });
          blob.name          = filename;
          blob.arrayBuffer   = async () =>
            buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
          files.set(fieldname, blob);
        });
      });
      bb.on('field', (fieldname, value) => fields.set(fieldname, value));
      bb.on('close', () => resolve({ get: k => files.get(k) || fields.get(k) || null }));
      bb.on('error', reject);
      const ab = await request.arrayBuffer();
      Readable.from(Buffer.from(ab)).pipe(bb);
    });
  }
}

export async function POST(request) {
  try {
    const formData     = await safeParseFormData(request);
    const furnitureFile = formData.get('furnitureImage');

    if (!furnitureFile) {
      return NextResponse.json({ error: 'furnitureImage required' }, { status: 400 });
    }

    // Save furniture to ComfyUI input
    const bytes  = await furnitureFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ts     = Date.now();
    const uploadFilename = `furnplace_fur_${ts}_${furnitureFile.name || 'furniture.png'}`;
    const pngFilename    = `furnplace_fur_${ts}.png`;

    let comfyFilename;
    try {
      comfyFilename = await saveImageForComfy(buffer, pngFilename);
    } catch {
      comfyFilename = await saveImageForComfy(buffer, uploadFilename);
    }

    // Minimal RMBG workflow: no SDXL, no OOM
    const rmbgWorkflow = {
      '1': {
        class_type: 'LoadImage',
        inputs: { image: comfyFilename, upload_type: 'image' },
      },
      '2': {
        class_type: 'ImageSizeAdjuster',
        inputs: {
          image: ['1', 0],
          divisible_by: 16,
          adjustment_mode: 'resize',
          scale_by: 1,
          pad_color: 'black',
        },
      },
      '3': {
        class_type: 'RMBG',
        inputs: {
          image: ['2', 0],
          model: 'INSPYRENET',
          sensitivity: 1,
          process_res: 1024,
          mask_blur: 0,
          mask_offset: 0,
          invert_output: false,
          refine_foreground: true,
          background: 'Color',
          background_color: '#000000',
        },
      },
      '4': {
        class_type: 'SaveImage',
        inputs: {
          images: ['3', 0],
          filename_prefix: 'furniture-nobg/result',
        },
      },
    };

    // Submit and wait — uses the bridge's full polling + error handling
    // Acquire the bridge mutex so we don't conflict with other jobs
    const maxWait    = 300_000;
    const pollMs     = 3_000;
    let waited       = 0;
    while (comfyBridge._ultraProRunning && waited < maxWait) {
      await new Promise(r => setTimeout(r, pollMs));
      waited += pollMs;
    }
    comfyBridge._ultraProRunning = true;

    let outputs;
    try {
      outputs = await comfyBridge._submitStageAndWait(rmbgWorkflow);
    } finally {
      comfyBridge._ultraProRunning = false;
    }

    // Extract output filename from history outputs
    let outputFilename = null;
    let outputSubfolder = '';
    for (const nodeId in outputs) {
      const images = outputs[nodeId]?.images;
      if (images?.length) {
        outputFilename  = images[0].filename;
        outputSubfolder = images[0].subfolder || 'furniture-nobg';
        break;
      }
    }

    if (!outputFilename) {
      return NextResponse.json({ error: 'RMBG produced no output' }, { status: 500 });
    }

    // Copy result to public/renders
    await mkdir(PUBLIC_RENDERS, { recursive: true });

    const destFilename = `nobg_${ts}.png`;
    const destPath     = path.join(PUBLIC_RENDERS, destFilename);

    // Check cloud mode
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
      // Local: copy from output dir
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
        throw new Error(`RMBG output not found: ${outputFilename}`);
      }
    }

    // Also copy the no-bg image into ComfyUI input so composite step can use it
    const COMFY_INPUT    = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';
    const inputNobgPath  = path.join(COMFY_INPUT, destFilename);
    if (!fs.existsSync(inputNobgPath)) {
      fs.copyFileSync(destPath, inputNobgPath);
    }

    return NextResponse.json({
      success:               true,
      furnitureNoBgUrl:      `/renders/${destFilename}`,
      furnitureNoBgFilename: destFilename,
      furnitureComfyFilename: comfyFilename,  // original file for full_control workflow
    });

  } catch (err) {
    comfyBridge._ultraProRunning = false;
    console.error('[FurniturePlacementV2] remove-bg error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
