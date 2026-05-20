import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// In ES modules, we need to bypass module scope sometimes or just use dynamic imports.
// Since we are running this with Node, we can import the builders directly.
import { 
  buildStage1, 
  buildStage2, 
  buildStage3, 
  buildStage5, 
  buildStage6 
} from '../ultraProBuilder.js';

const COMFY_URL = "http://127.0.0.1:8188";
const COMFY_INPUT = "/home/nikhil/Documents/Remo2/ComfyUI/input";
const COMFY_OUTPUT = "/home/nikhil/Documents/Remo2/ComfyUI/output";

// Pick a test image from the input folder
const TEST_IMAGE = "ultrapro_1778080873545_test_living_room.png"; 

// Wait for a stage to complete
async function submitAndWait(workflow, stageName) {
  console.log(`\n🚀 Submitting ${stageName}...`);
  
  // 1. Flush VRAM
  try {
    await fetch(`${COMFY_URL}/free`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unload_models: true, free_memory: true })
    });
    console.log('🧹 VRAM flushed.');
    await new Promise(r => setTimeout(r, 2000));
  } catch(e) {
    console.log('⚠️ Could not flush VRAM:', e.message);
  }

  // 2. Submit prompt
  const res = await fetch(`${COMFY_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ComfyUI HTTP ${res.status}: ${text}`);
  }

  const { prompt_id } = await res.json();
  console.log(`✅ ${stageName} submitted. Prompt ID: ${prompt_id}`);

  // 3. Poll for completion
  const deadline = Date.now() + 600000; // 10 minutes
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const histRes = await fetch(`${COMFY_URL}/history/${prompt_id}`);
      const history = await histRes.json();
      const entry = history[prompt_id];
      if (!entry) {
        process.stdout.write('.');
        continue;
      }

      if (entry.status?.status_str === 'error' || (entry.status?.messages || []).some(m => m[0] === 'execution_error')) {
        throw new Error(`ComfyUI execution error in ${stageName}. Check ComfyUI terminal.`);
      }

      const outputs = entry.outputs || {};
      const hasImages = Object.values(outputs).some(o => o?.images?.length > 0);
      if (hasImages) {
        console.log(`\n🎉 ${stageName} completed!`);
        return outputs;
      }
    } catch (err) {
      if (err.message.includes('execution error')) throw err;
    }
  }
  throw new Error(`${stageName} timed out.`);
}

// Helper to copy outputs to input dir
async function copyOutputsToInput(outputs) {
  console.log('📋 Copying outputs to ComfyUI/input...');
  const extractedFiles = {};
  
  for (const nodeId in outputs) {
    const images = outputs[nodeId]?.images;
    if (!images) continue;
    for (const img of images) {
      const filename = img.filename || img.name;
      if (!filename) continue;
      
      const subfolder = img.subfolder || '';
      const src = path.join(COMFY_OUTPUT, subfolder, filename);
      const flatName = filename.includes('/') ? filename.split('/').pop() : filename;
      const dest = path.join(COMFY_INPUT, flatName);
      
      try {
        await fs.copyFile(src, dest);
        console.log(`  -> Copied ${flatName}`);
        
        // Save to extracted files dictionary for reference
        // Handle "stage1/wall_mask" -> "wall_mask" etc.
        const key = filename.replace(/^stage\d_?(final)?\//, '').replace(/_\d+_?\.\w+$/, '').trim();
        if (key) extractedFiles[key] = flatName;
        extractedFiles['_last'] = flatName;
      } catch (err) {
        console.log(`  -> ⚠️ Failed to copy ${filename}: ${err.message}`);
      }
    }
  }
  return extractedFiles;
}

async function runFullPipeline() {
  console.log("==========================================");
  console.log("   ULTRA-PRO PIPELINE AUTO-TEST RUNNER    ");
  console.log("==========================================");
  
  try {
    const opts = {
      roomType: 'Living Room',
      masterSelector: { wallColor: 'sage green', furnitureStyle: 'modern minimalist' },
      masterToggles: { walls: true, furniture: false }
    };

    // --- STAGE 1 ---
    const wf1 = buildStage1(TEST_IMAGE, opts);
    const out1 = await submitAndWait(wf1, "Stage 1 (Scene Understanding)");
    const files1 = await copyOutputsToInput(out1);
    const depthMap = files1.depth_map || 'depth_map_00001_.png';
    const wallMask = files1.wall_mask || 'wall_mask_00001_.png';
    const objectMask = files1.object_mask || 'object_mask_00001_.png';

    // --- STAGE 2 ---
    const wf2 = buildStage2(TEST_IMAGE, depthMap, opts);
    const out2 = await submitAndWait(wf2, "Stage 2 (Geometry Locking)");
    const files2 = await copyOutputsToInput(out2);
    const redesigned = files2.redesigned || 'redesigned_00001_.png';

    // --- STAGE 3 ---
    const wallPrompt = "interior wall painted sage green, smooth matte finish, solid even color, professional paint job, photorealistic";
    const furniturePrompt = "original furniture";
    const wf3 = buildStage3(redesigned, wallMask, objectMask, { wallPrompt, furniturePrompt, masterToggles: opts.masterToggles });
    const out3 = await submitAndWait(wf3, "Stage 3 (Regional Inpainting)");
    const files3 = await copyOutputsToInput(out3);
    const inpainted = files3.regional_inpainted || 'regional_inpainted_00001_.png';

    // SKIP STAGE 4 (Furniture) for now

    // --- STAGE 5 ---
    const wf5 = buildStage5(inpainted, wallMask, objectMask);
    const out5 = await submitAndWait(wf5, "Stage 5 (Detail Refinement)");
    const files5 = await copyOutputsToInput(out5);
    const refined = files5.refined || 'refined_00001_.png';

    // --- STAGE 6 ---
    const wf6 = buildStage6(refined);
    const out6 = await submitAndWait(wf6, "Stage 6 (4x Upscale)");
    const files6 = await copyOutputsToInput(out6);
    const finalImage = files6.ultra_hd_result || files6._last;

    console.log("==========================================");
    console.log(`🎉 Pipeline Complete!`);
    console.log(`Final image is ready: ComfyUI/output/stage6_final/${finalImage}`);
    
  } catch (error) {
    console.error(`\n❌ Pipeline failed:`, error.message);
  }
}

runFullPipeline();
