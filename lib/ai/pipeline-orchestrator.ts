// lib/ai/pipeline-orchestrator.ts
// 6-Stage Ultra-Pro Interior Design Pipeline Orchestrator
// Chains all stages sequentially with VRAM flush between each

import axios from 'axios';
import type {
  Stage1Input, Stage1Output,
  Stage2Input, Stage2Output,
  Stage3Input, Stage3Output,
  Stage4Input, Stage4Output,
  Stage5Input, Stage5Output,
  Stage6Input, Stage6Output,
  MasterSelectorOptions,
  MasterToggles,
  LightingPreset,
  FurnitureItem,
  VRAM_CONFIG,
} from './workflows/types';

import { createStage1AnalysisWorkflow, parseStage1Output } from './workflows/stage-1-analysis';
import {
  createStableSceneUnderstandingWorkflow,
  parseStableSceneOutputs,
} from './comfyui-workflows-master';
import { createStage2RedesignWorkflow, parseStage2Output } from './workflows/stage-2-redesign';
import { createStage3FurnitureWorkflow, parseStage3Output } from './workflows/stage-3-furniture';
import { createStage4LightingWorkflow, parseStage4Output } from './workflows/stage-4-lighting';
import { createStage5UpscaleWorkflow, parseStage5Output } from './workflows/stage-5-upscale';
import { createStage6CompositeWorkflow, parseStage6Output } from './workflows/stage-6-composite';

// ─── Pipeline Configuration ──────────────────────────────────────────

export interface PipelineRequest {
  /** User-uploaded room photo (ComfyUI input-relative filename) */
  imagePath: string;
  /** Base64-encoded image (required for stable Stage 1 TS pathway) */
  imageBase64?: string;
  /** Room type for prompt context */
  roomType: string;
  /** User ID for file namespacing */
  userId: string;

  // Stage 2 — Master Selector
  masterSelector: MasterSelectorOptions;
  masterToggles: MasterToggles;

  // Stage 2 — Optional style reference
  styleReferenceImage?: string;

  // Stage 3 — Furniture
  furnitureItems?: FurnitureItem[];

  // Stage 4 — Lighting
  lightingPreset: LightingPreset;

  // Stage 5 — Upscale
  targetScale?: 2 | 4;

  // User masks from editor
  userMaskPath?: string;

  // Stages to skip (for partial runs)
  skipStages?: number[];

  // Use legacy CLIPSeg-based Stage 1 instead of stable DINO+SAM2
  useLegacyStage1?: boolean;
}

export interface PipelineResult {
  success: boolean;
  finalImage?: string;
  beforeImage?: string;
  comparisonImage?: string;
  stageOutputs: Record<string, any>;
  timings: Record<string, number>;
  error?: string;
}

export type PipelineStage = 1 | 2 | 3 | 4 | 5 | 6;

export type PipelineProgressCallback = (
  stage: PipelineStage,
  status: 'starting' | 'submitted' | 'processing' | 'completed' | 'skipped' | 'failed',
  detail?: string
) => void;

// ─── VRAM Config ─────────────────────────────────────────────────────

const CONFIG = {
  comfyUrl: process.env.COMFY_URL || 'http://127.0.0.1:8188',
  flushDelayMs: 500,
  freePayload: { unload_models: true, free_memory: true },
  stageTimeoutMs: 360_000,
  pollIntervalMs: 2_000,
};

// ─── Pipeline Orchestrator ───────────────────────────────────────────

export class PipelineOrchestrator {
  private baseUrl: string;
  private onProgress?: PipelineProgressCallback;

  constructor(onProgress?: PipelineProgressCallback) {
    this.baseUrl = CONFIG.comfyUrl;
    this.onProgress = onProgress;
  }

  /**
   * Execute the full 6-stage pipeline sequentially.
   * VRAM is flushed between each stage via POST /free.
   */
  async execute(request: PipelineRequest): Promise<PipelineResult> {
    const timings: Record<string, number> = {};
    const stageOutputs: Record<string, any> = {};
    const skipSet = new Set(request.skipStages || []);

    try {
      // ═══════════════════════════════════════════════════════════
      // STAGE 1: Scene Understanding (Stable DINO+SAM2 or Legacy)
      // ═══════════════════════════════════════════════════════════
      //
      // Stable (default): Pure GroundingDINO+SAM2, produces 6 outputs:
      //   wall_mask, floor_mask, ceiling_mask, object_mask, empty_mask, depth_map
      //
      // Legacy (useLegacyStage1: true): CLIPSeg+DINO hybrid, produces 3 outputs:
      //   cannyEdgeMap, depthMap, furnitureMask
      //
      // Stable masks are higher quality and feed directly into Stages 2-6.

      let stage1Result: Record<string, string>;

      if (!skipSet.has(1)) {
        const t0 = Date.now();

        if (request.useLegacyStage1 || !request.imageBase64) {
          // ── Legacy pathway ────────────────────────────────────
          this.emitProgress(1, 'starting', 'Extracting edges, depth, and masks (legacy CLIPSeg)');
          const stage1Workflow = createStage1AnalysisWorkflow({
            imagePath: request.imagePath,
            roomType: request.roomType,
            userMaskPath: request.userMaskPath,
          });
          const stage1History = await this.submitAndWait(stage1Workflow);
          const legacyResult = parseStage1Output(stage1History);
          // Map legacy 3-output format to unified format
          stage1Result = {
            depth_map: legacyResult.depthMap || '',
            object_mask: legacyResult.furnitureMask || '',
            wall_mask: '',
            floor_mask: '',
            ceiling_mask: '',
            empty_space_mask: '',
          };
        } else {
          // ── Stable pathway (pure DINO+SAM2) ───────────────────
          this.emitProgress(1, 'starting', 'Scene Understanding (Stable DINO+SAM2, 6 outputs)');
          const { workflow } = createStableSceneUnderstandingWorkflow(
            request.imageBase64,
            request.roomType,
          );
          const stage1History = await this.submitAndWait({ prompt: workflow });
          stage1Result = parseStableSceneOutputs(stage1History);
        }

        stageOutputs.stage1 = stage1Result;
        timings.stage1 = Date.now() - t0;
        this.emitProgress(1, 'completed', `Done in ${timings.stage1}ms — ${Object.keys(stage1Result).filter(k => stage1Result[k]).length} outputs`);

        await this.flushVRAM();
      } else {
        this.emitProgress(1, 'skipped');
        stage1Result = stageOutputs.stage1 || {
          depth_map: '', object_mask: '', wall_mask: '',
          floor_mask: '', ceiling_mask: '', empty_space_mask: '',
        };
      }

      // ═══════════════════════════════════════════════════════════
      // STAGE 2: Base Room Redesign
      // ═══════════════════════════════════════════════════════════
      // Now receives depth_map from Stage 1 for dual-ControlNet guidance.
      let stage2Result: ReturnType<typeof parseStage2Output>;

      if (!skipSet.has(2)) {
        const t0 = Date.now();
        this.emitProgress(2, 'starting', 'Redesigning room with master selector');

        const stage2Workflow = createStage2RedesignWorkflow({
          imagePath: request.imagePath,
          // Unified format: use depth_map from stable Stage 1
          // The Canny edge map is generated inline by Stage 2 from the original image.
          cannyEdgeMap: '',  // Stage 2 generates Canny internally from imagePath
          depthMap: stage1Result.depth_map || stage1Result['depthMap'] || '',
          masterSelector: request.masterSelector,
          masterToggles: request.masterToggles,
          styleReferenceImage: request.styleReferenceImage,
          userMaskPath: request.userMaskPath,
          // New: pass full scene masks for enhanced redesign context
          wallMask: stage1Result.wall_mask || '',
          floorMask: stage1Result.floor_mask || '',
          objectMask: stage1Result.object_mask || '',
        });

        const stage2History = await this.submitAndWait(stage2Workflow);
        stage2Result = parseStage2Output(stage2History);
        stageOutputs.stage2 = stage2Result;
        timings.stage2 = Date.now() - t0;
        this.emitProgress(2, 'completed', `Done in ${timings.stage2}ms`);

        await this.flushVRAM();
      } else {
        this.emitProgress(2, 'skipped');
        stage2Result = stageOutputs.stage2 || { baseRedesignedImage: '' };
      }

      // ═══════════════════════════════════════════════════════════
      // STAGE 3: Furniture Compositing (per furniture item)
      // ═══════════════════════════════════════════════════════════
      // Uses object_mask from Stage 1 for precise furniture placement areas.
      let stage3Result: ReturnType<typeof parseStage3Output>;
      let currentImage = stage2Result.baseRedesignedImage;

      if (!skipSet.has(3) && request.furnitureItems && request.furnitureItems.length > 0) {
        const t0 = Date.now();

        // Process each furniture item sequentially (VRAM flush between each)
        for (let i = 0; i < request.furnitureItems.length; i++) {
          const item = request.furnitureItems[i];
          this.emitProgress(3, 'processing', `Placing furniture ${i + 1}/${request.furnitureItems.length}: ${item.title}`);

          const stage3Workflow = createStage3FurnitureWorkflow({
            baseRedesignedImage: currentImage,
            // Use pre-computed object_mask from Stage 1, or item-specific mask
            furnitureMask: item.placementMask || stage1Result.object_mask || stage1Result['furnitureMask'] || '',
            furnitureReferenceImage: item.processedImagePath,
            furnitureStyleText: `${item.category} in ${request.masterSelector.furnitureStyle} style`,
            userMaskPath: request.userMaskPath,
          });

          const stage3History = await this.submitAndWait(stage3Workflow);
          const result = parseStage3Output(stage3History);
          currentImage = result.roomWithFurniture;

          // Flush between furniture items too
          if (i < request.furnitureItems.length - 1) {
            await this.flushVRAM();
          }
        }

        stage3Result = { roomWithFurniture: currentImage };
        stageOutputs.stage3 = stage3Result;
        timings.stage3 = Date.now() - t0;
        this.emitProgress(3, 'completed', `${request.furnitureItems.length} items placed in ${timings.stage3}ms`);

        await this.flushVRAM();
      } else {
        this.emitProgress(3, 'skipped', 'No furniture items to place');
        stage3Result = { roomWithFurniture: currentImage };
        stageOutputs.stage3 = stage3Result;
      }

      // ═══════════════════════════════════════════════════════════
      // STAGE 4: Lighting & Atmosphere
      // ═══════════════════════════════════════════════════════════
      let stage4Result: ReturnType<typeof parseStage4Output>;

      if (!skipSet.has(4)) {
        const t0 = Date.now();
        this.emitProgress(4, 'starting', `Applying ${request.lightingPreset} lighting`);

        const stage4Workflow = createStage4LightingWorkflow({
          roomWithFurniture: stage3Result.roomWithFurniture,
          lightingPreset: request.lightingPreset,
        });

        const stage4History = await this.submitAndWait(stage4Workflow);
        stage4Result = parseStage4Output(stage4History);
        stageOutputs.stage4 = stage4Result;
        timings.stage4 = Date.now() - t0;
        this.emitProgress(4, 'completed', `Done in ${timings.stage4}ms`);

        await this.flushVRAM();
      } else {
        this.emitProgress(4, 'skipped');
        stage4Result = { litRoomImage: stage3Result.roomWithFurniture };
        stageOutputs.stage4 = stage4Result;
      }

      // ═══════════════════════════════════════════════════════════
      // STAGE 5: Smart Upscale
      // ═══════════════════════════════════════════════════════════
      let stage5Result: ReturnType<typeof parseStage5Output>;

      if (!skipSet.has(5)) {
        const t0 = Date.now();
        this.emitProgress(5, 'starting', `Upscaling ${request.targetScale || 2}× with RealESRGAN`);

        const stage5Workflow = createStage5UpscaleWorkflow({
          litRoomImage: stage4Result.litRoomImage,
          targetScale: request.targetScale || 2,
        });

        const stage5History = await this.submitAndWait(stage5Workflow);
        stage5Result = parseStage5Output(stage5History);
        stageOutputs.stage5 = stage5Result;
        timings.stage5 = Date.now() - t0;
        this.emitProgress(5, 'completed', `Done in ${timings.stage5}ms`);

        await this.flushVRAM();
      } else {
        this.emitProgress(5, 'skipped');
        stage5Result = { upscaledImage: stage4Result.litRoomImage };
        stageOutputs.stage5 = stage5Result;
      }

      // ═══════════════════════════════════════════════════════════
      // STAGE 6: Final Composite & Export
      // ═══════════════════════════════════════════════════════════
      if (!skipSet.has(6)) {
        const t0 = Date.now();
        this.emitProgress(6, 'starting', 'Generating final composite and before/after');

        const maskStack = [
          stage1Result.furnitureMask,
        ].filter(Boolean);

        const stage6Workflow = createStage6CompositeWorkflow({
          upscaledImage: stage5Result.upscaledImage,
          originalImage: request.imagePath,
          maskStack,
        });

        const stage6History = await this.submitAndWait(stage6Workflow);
        const stage6Result = parseStage6Output(stage6History);
        stageOutputs.stage6 = stage6Result;
        timings.stage6 = Date.now() - t0;
        this.emitProgress(6, 'completed', `Done in ${timings.stage6}ms`);

        return {
          success: true,
          finalImage: stage6Result.finalImagePng,
          beforeImage: stage6Result.beforeImage,
          comparisonImage: stage6Result.comparisonImage,
          stageOutputs,
          timings,
        };
      }

      // If Stage 6 skipped, return Stage 5 output as final
      return {
        success: true,
        finalImage: stage5Result.upscaledImage,
        stageOutputs,
        timings,
      };

    } catch (error: any) {
      console.error('❌ Pipeline failed:', error.message);
      return {
        success: false,
        error: error.message,
        stageOutputs,
        timings,
      };
    }
  }

  // ─── ComfyUI API Helpers ────────────────────────────────────────

  /**
   * Submit workflow to ComfyUI and wait for completion.
   * Returns the outputs from the history endpoint.
   */
  private async submitAndWait(
    workflow: { prompt: Record<string, any> }
  ): Promise<Record<string, any>> {
    // Submit
    const response = await axios.post(`${this.baseUrl}/prompt`, workflow);
    const promptId: string = response.data.prompt_id;
    console.log(`📤 Submitted prompt: ${promptId}`);

    // Poll for completion
    const deadline = Date.now() + CONFIG.stageTimeoutMs;

    while (Date.now() < deadline) {
      await this.sleep(CONFIG.pollIntervalMs);

      try {
        const historyRes = await axios.get(`${this.baseUrl}/history/${promptId}`);
        const promptHistory = historyRes.data[promptId];

        if (!promptHistory) continue;

        if (promptHistory.status?.status_str === 'success' ||
            promptHistory.status?.completed) {
          console.log(`✅ Prompt completed: ${promptId}`);
          return promptHistory.outputs || {};
        }

        if (promptHistory.status?.status_str === 'error') {
          const errMsg = promptHistory.status?.messages?.[0]?.[1] ||
                         'Unknown ComfyUI error';
          throw new Error(`ComfyUI execution failed: ${errMsg}`);
        }
      } catch (error: any) {
        if (error.message.includes('ComfyUI execution failed')) throw error;
        // Network errors during polling are non-fatal, just retry
        console.warn(`⚠️ Poll error (retrying): ${error.message}`);
      }
    }

    throw new Error(`Stage timed out after ${CONFIG.stageTimeoutMs / 1000}s`);
  }

  /**
   * Flush GPU VRAM between stages via POST /free.
   * Critical for staying under 8 GB on RTX 4060.
   */
  private async flushVRAM(): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/free`, CONFIG.freePayload);
      console.log('🧹 VRAM flushed via POST /free');
      await this.sleep(CONFIG.flushDelayMs);
    } catch (error: any) {
      console.warn(`⚠️ VRAM flush failed (non-fatal): ${error.message}`);
      // Non-fatal — ComfyUI's --lowvram will still manage memory
    }
  }

  /** Emit progress event if callback registered. */
  private emitProgress(
    stage: PipelineStage,
    status: 'starting' | 'submitted' | 'processing' | 'completed' | 'skipped' | 'failed',
    detail?: string
  ): void {
    const emoji = { starting: '🔄', submitted: '📤', processing: '⚙️', completed: '✅', skipped: '⏭️', failed: '❌' };
    console.log(`${emoji[status]} Stage ${stage}: ${status}${detail ? ` — ${detail}` : ''}`);
    this.onProgress?.(stage, status, detail);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ─── Ultra-Pro Pipeline (Verified Stages) ──────────────────────

  /**
   * Execute the Ultra-Pro pipeline using verified stage builders
   * from `ultra-pro-pipeline.ts`.
   *
   * ⚠️  NOT CALLED BY THE ACTIVE API ROUTE.
   * The active path is: app/api/ai/ultra-pro/route.js
   *   → src/services/comfyBridge.js::enqueueUltraProJob()
   *   → src/workflows/ultraProBuilder.js::buildStage1..6()
   *
   * `ultra-pro-pipeline.ts` uses Impact Pack nodes (SAMLoader, RegionalSampler,
   * MaskDetailerPipe) that are not confirmed installed in ComfyUI.
   *
   * This method is kept for reference. Do not call in production.
   */
  async executeUltraPro(
    request: import('./workflows/ultra-pro-pipeline').UltraProPipelineRequest
  ): Promise<PipelineResult> {
    const { buildUltraProStages } = await import('./workflows/ultra-pro-pipeline');
    const stages = buildUltraProStages(request);
    const timings: Record<string, number> = {};
    const stageOutputs: Record<string, Record<string, string>> = {};

    try {
      for (const { stage, name, workflow, outputPrefix } of stages) {
        const t0 = Date.now();
        this.emitProgress(
          Math.min(stage, 6) as PipelineStage,
          'starting',
          `${name}`,
        );

        // Resolve {{stageN.xxx}} placeholders in the workflow
        const resolvedWorkflow = this.resolvePlaceholders(workflow, stageOutputs);

        // Submit and wait
        const outputs = await this.submitAndWait(resolvedWorkflow);

        // Extract output filenames (e.g. "stage1/wall_mask_00001_.png")
        const stageKey = `stage${stage}`;
        stageOutputs[stageKey] = {};
        for (const nodeId in outputs) {
          const images = outputs[nodeId]?.images;
          if (images && images.length > 0) {
            for (const img of images) {
              // Map prefix to key: "stage1/wall_mask_00001_.png" → "wall_mask"
              const filename = img.filename || img.name;
              if (filename) {
                const baseName = filename
                  .replace(outputPrefix, '')
                  .replace(/_\d+_?\.\w+$/, '')
                  .trim();
                if (baseName) {
                  stageOutputs[stageKey][baseName] = filename;
                }
                // Also store the last image as the default output
                stageOutputs[stageKey]['_last'] = filename;
              }
            }
          }
        }

        timings[stageKey] = Date.now() - t0;
        this.emitProgress(
          Math.min(stage, 6) as PipelineStage,
          'completed',
          `${name} done in ${timings[stageKey]}ms`,
        );

        // Flush VRAM between stages
        await this.flushVRAM();
      }

      // Final image is the last output of the last stage
      const lastStage = stages[stages.length - 1];
      const lastKey = `stage${lastStage.stage}`;
      const finalImage = stageOutputs[lastKey]?.['_last'] || '';

      return {
        success: true,
        finalImage,
        beforeImage: request.imagePath,
        stageOutputs: stageOutputs as any,
        timings,
      };

    } catch (error: any) {
      console.error('❌ Ultra-Pro Pipeline failed:', error.message);
      return {
        success: false,
        error: error.message,
        stageOutputs: stageOutputs as any,
        timings,
      };
    }
  }

  /**
   * Resolve `{{stageN.output_name}}` placeholders in workflow JSON.
   * Walks all string values in all node inputs and replaces matches.
   */
  private resolvePlaceholders(
    workflow: { prompt: Record<string, any> },
    stageOutputs: Record<string, Record<string, string>>
  ): { prompt: Record<string, any> } {
    const json = JSON.stringify(workflow);
    const resolved = json.replace(
      /\{\{(stage\d+)\.(\w+)\}\}/g,
      (match, stageKey, outputKey) => {
        const outputs = stageOutputs[stageKey];
        if (outputs && outputs[outputKey]) {
          return outputs[outputKey];
        }
        console.warn(`⚠️ Unresolved placeholder: ${match}`);
        return match;
      }
    );
    return JSON.parse(resolved);
  }
}

// ─── Convenience exports ─────────────────────────────────────────────

/**
 * Execute the full 6-stage pipeline with a progress callback.
 * This is the primary entry point for the rest of the application.
 */
export async function runFullPipeline(
  request: PipelineRequest,
  onProgress?: PipelineProgressCallback
): Promise<PipelineResult> {
  const orchestrator = new PipelineOrchestrator(onProgress);
  return orchestrator.execute(request);
}

/**
 * Execute the Ultra-Pro verified pipeline.
 * Uses validated node class_types from ComfyUI source code.
 */
export async function runUltraProPipeline(
  request: import('./workflows/ultra-pro-pipeline').UltraProPipelineRequest,
  onProgress?: PipelineProgressCallback
): Promise<PipelineResult> {
  const orchestrator = new PipelineOrchestrator(onProgress);
  return orchestrator.executeUltraPro(request);
}
