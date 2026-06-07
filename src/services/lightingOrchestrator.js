import { readFile } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { guiToApiGraph } from '../lib/comfyWorkflowConverter.js';
import AIRun from '../models/AIRun.js';
import LightingRun from '../models/LightingRun.js';
import comfyBridge, { ensureInputFile } from './comfyBridge.js';

export const LIGHTING_PRESETS = {
  night_lamp: {
    label: 'Night Lamp',
    icon: '🌙',
    description: 'Warm dim lamp in a dark room',
    // Shape
    shape: 'circle',
    lightWidth: 120,
    lightHeight: 80,
    // Behavior
    spread: 0.45,          // incremental_expandrate
    softness: 6.0,        // blur_radius
    invertLight: false,   // flip_input
    intensity: 0.60,      // RemapMaskRange max
    // Strength
    icMultiplier: 0.22,
    denoise: 1.00,
    cfg: 2.0,
    steps: 25,
    frames: 1,
    prompt: 'An eye-level medium shot of the cozy interior space, taken from a vantage point two and a half meters away. The warm glow of the lamp is centered in the frame, beautifully illuminating the surroundings while seamlessly blending with the existing room structure, wall colors, and layout details. Shallow depth of field keeps the immediate area sharp while the background softly blurs into smooth creamy bokeh. Dark and moody low-key style with warm 2700k incandescent lamp light, soft light bloom, and realistic shadows.',
  },

  dim_evening: {
    label: 'Dim Evening',
    icon: '🕯️',
    description: 'Soft low evening light',
    shape: 'rectangle',
    lightWidth: 80,
    lightHeight: 65,
    spread: 0.90,
    softness: 15.0,
    invertLight: false,
    intensity: 1.00,
    icMultiplier: 0.28,
    denoise: 1.00,
    cfg: 3.0,
    steps: 25,
    frames: 1,
    prompt: 'An eye-level full shot of the elegant interior space, taken from a vantage point four and a half meters away. The soft evening shadows and ambient lighting are balanced across the room, beautifully showcasing the original room structure, wall colors, and furniture layout. Medium depth of field keeps the main living area sharp while the far background gently softens. Cozy and moody low-key style with dim evening twilight illumination, gentle diffuse candlelight atmosphere, and realistic shadow falloff.',
  },

  window_day: {
    label: 'Window Daylight',
    icon: '🪟',
    description: 'Natural light through a window',
    shape: 'rectangle',
    lightWidth: 180,
    lightHeight: 330,
    spread: 0.55,
    softness: 30.0,
    invertLight: false,
    intensity: 0.80,
    icMultiplier: 0.30,
    denoise: 0.95,
    cfg: 7.5,
    steps: 25,
    frames: 1,
    prompt: 'An eye-level full shot of the bright interior space, taken from a vantage point four and a half meters away. The direct sunbeam from the side window is centered, casting beautiful sun rays across the room while strictly preserving the existing room structure, original wall colors, and architectural layout. Deep depth of field keeps everything from the foreground furniture to the background wall art in sharp focus. Clean architectural style with natural bright window daylight streaming in, crisp shadows, and an airy Architectural Digest aesthetic.',
  },

  bright_day: {
    label: 'Bright Daylight',
    icon: '☀️',
    description: 'Flood the room with bright light',
    shape: 'rectangle',
    lightWidth: 200,
    lightHeight: 400,
    spread: 0.8,
    softness: 40.0,
    invertLight: true,    // inverts → full room lit
    intensity: 0.90,
    icMultiplier: 0.35,
    denoise: 0.97,
    cfg: 9.0,
    steps: 25,
    frames: 1,
    prompt: 'An eye-level wide shot of the interior space, taken from a vantage point six and a half meters away. The entire room is visible, showcasing and fully preserving the original architectural structure, authentic wall colors, exact furniture textures, and room layout. Deep depth of field keeps the entire environment from foreground to background in razor-sharp focus. Highly realistic architectural style with natural vibrant daylight flooding the entire space, casting soft realistic shadows while perfectly retaining the original color palette and warm authentic tones of the room.',
  },

  dramatic_spot: {
    label: 'Dramatic Spotlight',
    icon: '🎭',
    description: 'High contrast theatrical beam',
    shape: 'circle',
    lightWidth: 90,
    lightHeight: 90,
    spread: 0.40,
    softness: 7.0,
    invertLight: false,
    intensity: 0.85,
    icMultiplier: 0.38,
    denoise: 1.00,
    cfg: 3.5,
    steps: 25,
    frames: 1,
    prompt: 'An eye-level medium shot of the dramatic interior space, taken from a vantage point two and a half meters away. A single highly focused theatrical spotlight beam streams down from above, casting a brilliant circular pool of intense bright light directly onto the floor and furniture below it. The surrounding room is enveloped in deep, high-contrast chiaroscuro darkness. Shallow depth of field keeps the brightly illuminated pool of light in sharp focus, showcasing realistic material textures, while the edges of the light fade out into soft shadow. Dramatic cinematic style with high contrast theatrical lighting, strong shadow falloff, and realistic light ray projection.',
  },

  golden_hour: {
    label: 'Golden Hour',
    icon: '🌅',
    description: 'Warm amber side light',
    shape: 'rectangle',
    lightWidth: 80,
    lightHeight: 300,
    spread: 0.60,
    softness: 35.0,
    invertLight: false,
    intensity: 0.85,
    icMultiplier: 0.32,
    denoise: 0.82,
    cfg: 5.0,
    steps: 25,
    frames: 1,
    prompt: 'An eye-level full shot of the warm interior space, taken from a vantage point four and a half meters away. Beautiful long sun shadows and golden light stretch across the room from the side, perfectly tracing and respecting the original room structure, wall colors, and layout. Deep depth of field keeps the entire living area and structural details in sharp focus. Cinematic style with warm 3000k golden hour sunset glow, warm amber side lighting, and atmospheric ray tracing.',
  },

  multi_view: {
    label: 'Multi-View',
    icon: '🔢',
    description: 'See 3 lighting variations at once',
    shape: 'circle',
    lightWidth: 80,
    lightHeight: 80,
    spread: 0.3,
    softness: 15.0,
    invertLight: false,
    intensity: 0.75,
    icMultiplier: 0.28,
    denoise: 0.87,
    cfg: 2.5,
    steps: 20,
    frames: 3,            // generates 3 results
    prompt: 'An eye-level full shot of the premium interior space, taken from a vantage point four and a half meters away. The layout is centered in the frame, showcasing and fully preserving the original room structure, wall colors, realistic material textures, and details. Deep depth of field keeps all elements from the foreground to the background in sharp focus. Clean architectural style with balanced, studio-grade clean lighting and professional high-end photography.',
  },
};

async function withRetry(fn, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`⚠️ Retrying ComfyUI execution (${i + 1}/${retries}) after error: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function runLightingWorkflow({
  comfyFilename,
  imageWidth,        // actual uploaded image width in pixels
  imageHeight,       // actual uploaded image height in pixels
  preset,            // LIGHTING_PRESETS key OR null for manual
  // All manual overrides (from sliders):
  manualPrompt,
  shape,             // 'circle' | 'rectangle' | 'triangle'
  lightX,            // canvas click X → will be converted to comfy coords
  lightY,            // canvas click Y → will be converted to comfy coords
  canvasWidth,       // frontend canvas display width
  canvasHeight,      // frontend canvas display height
  lightWidth,        // shape_width
  lightHeight,       // shape_height
  spread,            // incremental_expandrate 0.0-1.0
  softness,          // blur_radius 0-50
  invertLight,       // flip_input boolean
  intensity,         // RemapMaskRange max 0.3-1.0
  icMultiplier,      // ICLightConditioning multiplier
  denoise,           // KSampler denoise
  cfg,               // KSampler cfg
  frames,            // CreateShapeMask frames (1/3/5)
  saveFilename,
  emitProgress,
  // Database integrations
  projectId,
  userId,
  clerkId,
  inputImageUrl
}) {
  // Mutex lock to prevent overlapping runs on GPU
  const maxWait = 300_000;
  const pollInterval = 3_000;
  let waited = 0;
  while (comfyBridge._ultraProRunning && waited < maxWait) {
    console.log(`⏳ LightingOrchestrator waiting for bridge mutex (${Math.round(waited / 1000)}s)…`);
    await new Promise(r => setTimeout(r, pollInterval));
    waited += pollInterval;
  }
  if (comfyBridge._ultraProRunning) {
    throw new Error('ComfyUI bridge is currently busy. Please wait for the running task to finish.');
  }
  comfyBridge._ultraProRunning = true;

  try {
    // Merge preset with manual overrides
    const base = preset ? LIGHTING_PRESETS[preset] : {};
    const p = {
      shape:        shape        ?? base.shape        ?? 'circle',
      lightWidth:   lightWidth   ?? base.lightWidth   ?? 80,
      lightHeight:  lightHeight  ?? base.lightHeight  ?? 80,
      spread:       spread       ?? base.spread       ?? 0.3,
      softness:     softness     ?? base.softness     ?? 15.0,
      invertLight:  invertLight  ?? base.invertLight  ?? false,
      intensity:    intensity    ?? base.intensity    ?? 0.70,
      icMultiplier: icMultiplier ?? base.icMultiplier ?? 0.28,
      denoise:      denoise      ?? base.denoise      ?? 0.85,
      cfg:          cfg          ?? base.cfg          ?? 2.0,
      frames:       frames       ?? base.frames       ?? 1,
      prompt:       manualPrompt || base.prompt || 'interior lighting, photorealistic',
    };

    // Convert canvas click position to ComfyUI coordinates (0-512)
    // If no click provided, default to center
    const comfyX = lightX != null
      ? Math.max(0, Math.min(511, Math.round(lightX * 512 / canvasWidth)))
      : 256;
    const comfyY = lightY != null
      ? Math.max(0, Math.min(511, Math.round(lightY * 512 / canvasHeight)))
      : 256;

    // Calculate resize dimensions matching uploaded image aspect ratio
    // Round to nearest multiple of 8, cap at 1024
    const maxDim = 768;
    const scale = Math.min(maxDim / imageWidth, maxDim / imageHeight, 1);
    const resizeW = Math.round((imageWidth  * scale) / 8) * 8;
    const resizeH = Math.round((imageHeight * scale) / 8) * 8;

    // Ensure image is uploaded/available in cloud if running cloud mode
    await ensureInputFile({
      filename: comfyFilename,
      logPrefix: '[Lighting]'
    });

    // Load and convert workflow
    const raw = JSON.parse(fs.readFileSync(
      path.resolve('src/workflows/lighting/01_ic_light_static_circle.json'), 'utf8'
    ));
    const apiGraph = guiToApiGraph(raw);

    // Log all params before injection
    console.log('=== LIGHTING PARAMS ===', {
      preset, comfyX, comfyY, resizeW, resizeH,
      shape: p.shape, frames: p.frames,
      spread: p.spread, softness: p.softness, invertLight: p.invertLight,
      intensity: p.intensity, icMultiplier: p.icMultiplier,
      denoise: p.denoise, cfg: p.cfg
    });

    // ── NODE 9: Image ──────────────────────────────────────────
    apiGraph['9'].inputs.image = comfyFilename;

    // ── NODE 46: Resize to actual image dimensions ─────────────
    apiGraph['46'].inputs.width  = resizeW;
    apiGraph['46'].inputs.height = resizeH;

    // ── NODE 22: CreateShapeMask ───────────────────────────────
    apiGraph['22'].inputs.shape        = p.shape === 'rectangle' ? 'square' : p.shape;
    apiGraph['22'].inputs.frames       = p.frames;
    apiGraph['22'].inputs.location_x   = comfyX;
    apiGraph['22'].inputs.location_y   = comfyY;
    apiGraph['22'].inputs.grow         = 5;
    apiGraph['22'].inputs.shape_width  = p.lightWidth;
    apiGraph['22'].inputs.shape_height = p.lightHeight;

    // ── NODE 43: RemapMaskRange ────────────────────────────────
    apiGraph['43'].inputs.min = 0.0;
    apiGraph['43'].inputs.max = p.intensity;

    // ── NODE 42: GrowMaskWithBlur ──────────────────────────────
    apiGraph['42'].inputs.expand                = 5;
    apiGraph['42'].inputs.incremental_expandrate = p.spread;
    apiGraph['42'].inputs.tapered_corners       = true;
    apiGraph['42'].inputs.flip_input            = p.invertLight;
    apiGraph['42'].inputs.blur_radius           = p.softness;
    apiGraph['42'].inputs.lerp_alpha            = 1.0;
    apiGraph['42'].inputs.decay_factor          = 1.0;
    apiGraph['42'].inputs.fill_holes            = true;

    // ── NODE 44: ICLightConditioning ───────────────────────────
    apiGraph['44'].inputs.multiplier = p.icMultiplier;
    delete apiGraph['44'].inputs.opt_background;  // FC model: must be disconnected

    // ── NODE 4: Positive Prompt ────────────────────────────────
    apiGraph['4'].inputs.text = p.prompt;

    // ── NODE 19: KSampler ─────────────────────────────────────
    const seed = Math.floor(Math.random() * 2**32);
    apiGraph['19'].inputs.seed    = seed;
    apiGraph['19'].inputs.steps   = 25;
    apiGraph['19'].inputs.cfg     = p.cfg;
    apiGraph['19'].inputs.denoise = p.denoise;

    // ── NODE 36: Output ────────────────────────────────────────
    // IMPORTANT: only patch filename_prefix — do NOT replace the whole inputs object.
    // guiToApiGraph already resolved the `images` connected link (["7", 0]).
    // Replacing inputs entirely would drop that link and cause "Required input missing: images".
    apiGraph['36'].class_type = 'SaveImage';
    apiGraph['36'].inputs.filename_prefix = saveFilename;

    // Log final critical nodes
    console.log('SAMPLER NODE 19:', JSON.stringify(apiGraph['19']));
    console.log('ICLIGHTCOND NODE 44:', JSON.stringify(apiGraph['44']));

    // Update Project to processing
    await AIRun.findByIdAndUpdate(projectId, { status: 'processing', processingStartedAt: new Date() });

    emitProgress?.({ step: 'starting', label: preset || 'custom' });

    const result = await withRetry(async () =>
      comfyBridge.submitAndWait(apiGraph, (progress) => {
        emitProgress?.({
          step: 'generating',
          currentStep: progress.value,
          totalSteps: progress.max,
        });
      })
    );

    await comfyBridge._flushVRAM();
    await new Promise(r => setTimeout(r, 3000));

    // Get output — filter out temp mask files
    const allUrls = await comfyBridge.getAllOutputUrls(result, saveFilename);

    const primaryUrl = allUrls[0] || '';
    await AIRun.findByIdAndUpdate(projectId, {
      resultImage: primaryUrl,
      status: 'completed',
      processingCompletedAt: new Date(),
      aiConfig: {
        preset,
        shape: p.shape,
        prompt: p.prompt,
        results: allUrls.map(url => ({ label: 'spotlight', url })),
        seed,
        params: p
      }
    });

    try {
      const { notifyGenerationComplete } = await import('@/lib/notifications/send');
      await notifyGenerationComplete(userId, projectId, primaryUrl, 'lighting');
    } catch (notifErr) {
      console.error('[Notify] Generation notification failed:', notifErr);
    }

    const mappedResults = allUrls.map((url, i) => ({
      label: `view_${i + 1}`,
      url
    }));

    await LightingRun.create({
      projectId,
      userId,
      clerkId,
      inputImageUrl,
      scene: preset || 'custom',
      manualPrompt: manualPrompt || undefined,
      workflow: '01_circle',
      lightX,
      lightY,
      lightRadius: p.lightWidth / 2,
      lightIntensity: p.intensity,
      icMultiplier: p.icMultiplier,
      results: mappedResults,
      isBatch: p.frames > 1,
      status: 'completed'
    }).catch(err => {
      console.warn('[Lighting] Could not create LightingRun record:', err.message);
    });

    comfyBridge.notifyFrontend('comfy:lighting:done', {
      projectId,
      urls: allUrls,
      seed,
      frames: p.frames
    });

    return { urls: allUrls, seed, params: p };

  } catch (error) {
    console.error('❌ LightingOrchestrator failed:', error.message);

    await AIRun.findByIdAndUpdate(projectId, {
      status: 'failed',
      errorMessage: `Lighting failed: ${error.message}`,
      processingCompletedAt: new Date()
    }).catch(() => {});

    comfyBridge.notifyFrontend('comfy:lighting:error', {
      projectId,
      error: error.message
    });

    throw error;
  } finally {
    comfyBridge._ultraProRunning = false;
    if (comfyBridge.queue.length > 0) {
      setTimeout(() => comfyBridge.processQueue(), 2000);
    }
  }
}
