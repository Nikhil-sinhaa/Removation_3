/**
 * POST /api/vastu
 *
 * Runs the 8-pass Vastu element detection pipeline and returns a full Vastu
 * analysis result for the given room image.
 *
 * Request body (JSON):
 *   imageFilename  {string?} — filename already in ComfyUI/input/ (preferred)
 *   imageUrl       {string?} — public URL (/renders/…, /uploads/…, or https://…)
 *                              used when imageFilename is not supplied; the image
 *                              is fetched/read and saved to ComfyUI input first.
 *   roomType       {string}  — e.g. 'bedroom', 'kitchen', 'living_room'
 *   direction      {string?} — compass direction of the room (e.g. 'north')
 *   language       {string?} — 'en' (default) or 'hi'
 *   projectId      {string?} — for future association with a Project document
 *
 * Response (JSON):
 *   success           {boolean}
 *   score             {number}   — shortcut alias for overallScore.value (callers that
 *                                  read data.score directly — editor/page.tsx, [projectId]/page.tsx)
 *   issues            {array}    — alias for violations (callers that read data.issues)
 *   analysis          {object}   — full VastuAnalysisResult with an extra `score` alias
 *                                  (editor-store.ts reads data.analysis.score as a number)
 *   suggestions       {array}    — top-level alias (editor-store.ts reads data.suggestions)
 *   detectedElements  {array}    — DetectedElement[] from the detection pipeline
 *
 * Credit cost: 1 credit ('vastu-analysis').
 *   Rationale: detection-only operation (GroundingDINO + SAM2, no diffusion/generation).
 *   Comparable to 'segment' (1 credit) in deductCredits.ts DEFAULT_TOOL_COSTS.
 *   Cheaper than any generation tool (ceiling-changer=1, render=2, ultra-pro=3).
 *
 * NOTE — credit cost requires explicit acceptance before going to production.
 *   Proposed value: 1. Change DEFAULT_TOOL_COSTS in deductCredits.ts to override.
 */

import path from 'path';
import { readFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { checkAndDeductCredits } from '@/lib/ai/deductCredits';
import { saveImageForComfy } from '@/lib/ai/save-image-for-comfy';
import { connectDB } from '@/lib/db/mongodb';
import { analyzeVastu } from '@/lib/vastu-engine';
import { detectVastuElements } from '@/src/services/vastuDetectionOrchestrator.js';
import VASTU_RULES from '@/constants/vastu-rules';
import { getSetting } from '@/src/lib/appSettings';
import { createVastuJob } from '@/lib/ai/createVastuJob';

export const runtime = 'nodejs';

// ── ELEMENT_KEYWORD_EXPANSION ─────────────────────────────────────────────────
//
// Maps each VastuElementType produced by the detection pipeline to the keyword
// strings that vastu-engine.ts's featureSet recognizes.
//
// Why it lives here (not in vastuDetectionOrchestrator.js):
//   The orchestrator's job is to detect elements and return DetectedElement[].
//   Translating element types to scoring-engine keywords is the route's concern —
//   it bridges the detection output to the analysis input. If a second consumer
//   of this mapping emerges (e.g. a /api/vastu/batch route), move it to
//   src/config/vastuKeywordExpansion.ts.
//
// Why some types expand to multiple keywords:
//   'temple' and 'idol' both indicate a puja zone; the engine's featureSet needs
//   'pooja' in addition to the object name so pooja-category rules fire.
//   'plant' expands to plural ('plants') to cover both singular and plural rule
//   keywords without assuming the engine normalises them.
//   All other types map to themselves (single-element arrays).
const ELEMENT_KEYWORD_EXPANSION: Record<string, string[]> = {
  bed:       ['bed'],
  stove:     ['stove'],
  sink:      ['sink'],
  mirror:    ['mirror'],
  door:      ['door'],
  toilet:    ['toilet'],
  idol:      ['idol', 'idols', 'pooja'],
  temple:    ['temple', 'pooja'],
  plant:     ['plant', 'plants'],
  aquarium:  ['aquarium'],
  fountain:  ['fountain'],
};

// ── Image → ComfyUI input resolver ───────────────────────────────────────────

/**
 * Given a public URL or absolute path pointing to an already-rendered image,
 * saves a copy to ComfyUI/input/ and returns the ComfyUI input filename.
 *
 * Handles three forms:
 *   /renders/{filename}  → read from public/renders/, save via saveImageForComfy
 *   /uploads/{filename}  → read from public/uploads/, save via saveImageForComfy
 *   https://…            → fetch, save via saveImageForComfy
 */
async function resolveImageToComfyFilename(imageUrl: string): Promise<string> {
  let buffer: Buffer;

  if (imageUrl.startsWith('/renders/') || imageUrl.startsWith('/uploads/')) {
    const relativePath = imageUrl.replace(/^\//, '');
    const filePath = path.join(process.cwd(), 'public', relativePath);
    buffer = await readFile(filePath);
  } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Failed to fetch image: HTTP ${res.status}`);
    buffer = Buffer.from(await res.arrayBuffer());
  } else {
    throw new Error(`Unsupported imageUrl format: ${imageUrl}`);
  }

  const slug = path.basename(imageUrl).replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `vastu_input_${Date.now()}_${slug}`;
  return saveImageForComfy(buffer, filename);
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  await connectDB();

  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authUser.id;

    // ── Parse body ──────────────────────────────────────────────────────────
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const {
      imageFilename: bodyImageFilename,
      imageUrl,
      roomType,
      direction,
      language = 'en',
    } = body;

    if (!roomType) {
      return NextResponse.json({ error: 'roomType is required' }, { status: 400 });
    }
    if (!bodyImageFilename && !imageUrl) {
      return NextResponse.json({ error: 'imageFilename or imageUrl is required' }, { status: 400 });
    }

    // ── Resolve to ComfyUI input filename ───────────────────────────────────
    let imageFilename: string;
    if (bodyImageFilename) {
      imageFilename = bodyImageFilename;
    } else {
      try {
        imageFilename = await resolveImageToComfyFilename(imageUrl);
      } catch (resolveErr: any) {
        return NextResponse.json(
          { error: `Could not resolve image: ${resolveErr.message}` },
          { status: 400 }
        );
      }
    }

    // ── Credit check ────────────────────────────────────────────────────────
    // Proposed cost: 1 credit ('vastu-analysis').
    // Detection-only (GroundingDINO + SAM2); no generation pipeline runs.
    // Comparable to 'segment' (1 credit). Awaiting explicit acceptance.
    const creditResult = await checkAndDeductCredits(userId, 'vastu-analysis');
    if (!creditResult.success) {
      return NextResponse.json(
        { error: 'insufficient_credits', message: creditResult.reason },
        { status: 402 }
      );
    }

    // ── Mode toggle ─────────────────────────────────────────────────────────
    // Priority: env var → AppSettings key → default 'local'.
    // Valid values: 'local' | 'drive'.
    const rawMode =
      process.env.VASTU_PROCESSING_MODE ||
      (await getSetting('VASTU_PROCESSING_MODE')) ||
      'local';
    const processingMode: 'local' | 'drive' =
      rawMode === 'drive' ? 'drive' : 'local';

    // ── Drive mode: delegate to async pipeline ───────────────────────────────
    if (processingMode === 'drive') {
      try {
        const { jobId } = await createVastuJob({
          imageUrl: imageUrl ?? undefined,
          imageFilename: bodyImageFilename ?? undefined,
          roomType,
          direction: direction ?? undefined,
          language,
          userId,
        });
        return NextResponse.json({
          success: true,
          mode: 'drive',
          jobId,
          status: 'pending',
          pollUrl: `/api/ai/jobs/${jobId}/status`,
        });
      } catch (driveErr: any) {
        console.error('❌ /api/vastu drive-mode error:', driveErr.message);
        return NextResponse.json(
          { error: driveErr.message || 'Failed to enqueue async Vastu job' },
          { status: 503 }
        );
      }
    }

    // ── Local (synchronous) mode continues below ─────────────────────────────

    // ── Detection pipeline ──────────────────────────────────────────────────
    // detectVastuElements returns [] on any ComfyUI or extraction failure;
    // we always proceed to analyzeVastu so the request doesn't fail entirely.
    const detectedElements = await detectVastuElements(imageFilename, { roomType });

    // ── Pass-saturation guard ────────────────────────────────────────────────
    // Count how many of the 8 detection passes produced at least one element.
    // A pass "fired" if any element of its corresponding types appears in
    // detectedElements. When ≥6 passes fire, the model is likely detecting noise
    // (e.g. bathrooms confuse all 8 pass prompts). This is purely informational —
    // the full analysis still runs and is returned unchanged.
    const PASS_ELEMENT_TYPES: string[][] = [
      ['bed'],
      ['stove', 'sink'],
      ['mirror'],
      ['door'],
      ['toilet'],
      ['idol', 'temple'],
      ['plant'],
      ['aquarium', 'fountain'],
    ];
    const detectedTypeSet = new Set((detectedElements as any[]).map((e: any) => e.type));
    const detectedPassCount = PASS_ELEMENT_TYPES.filter(
      passTypes => passTypes.some(t => detectedTypeSet.has(t))
    ).length;
    const detectionConfidence: 'normal' | 'low' | 'failed' =
      detectedPassCount === 0 ? 'failed' : detectedPassCount >= 6 ? 'low' : 'normal';

    // Build features array from detected element types using keyword expansion.
    // This populates vastu-engine.ts's featureSet for keyword-based rule evaluation.
    // De-duplicate via Set so each keyword appears at most once.
    const expandedKeywords = [
      ...new Set(
        detectedElements.flatMap(
          (e: any) => ELEMENT_KEYWORD_EXPANSION[e.type] ?? [e.type]
        )
      ),
    ];

    // ── Analysis ────────────────────────────────────────────────────────────
    const engineResult = analyzeVastu({
      roomType,
      direction: direction || '',
      features: expandedKeywords,
      detectedElements,       // passes through to result.detectedElements via the engine edit
      language,
    });

    // ── Set vastuCompliance on each detected element ─────────────────────────
    // Rules that fired as detection-triggered violations → 'non-compliant'
    // Positive rules whose keywords are present via detected elements → 'compliant'
    // Neither → 'not-applicable'
    const violationKeywords = new Set<string>();
    for (const ev of (engineResult.ruleEvaluations ?? []) as any[]) {
      if (!ev.passed && ev.source === 'detection') {
        const rule = (VASTU_RULES as any[]).find((r: any) => r.id === ev.ruleId);
        if (rule) (rule.keywords as string[]).forEach(k => violationKeywords.add(k.toLowerCase()));
      }
    }

    const NEGATIVE_TITLE_WORDS = ['avoid', 'no ', 'not ', 'never'];
    const complianceKeywords = new Set<string>();
    for (const rule of VASTU_RULES as any[]) {
      const isNegative = NEGATIVE_TITLE_WORDS.some(nk => (rule.title as string).toLowerCase().includes(nk));
      if (!isNegative && rule.severity !== 'suggestion') {
        for (const kw of rule.keywords as string[]) {
          if (expandedKeywords.includes(kw) || expandedKeywords.includes(kw.toLowerCase())) {
            complianceKeywords.add(kw.toLowerCase());
          }
        }
      }
    }

    const elementsWithCompliance = (detectedElements as any[]).map(el => {
      const elKeywords = (ELEMENT_KEYWORD_EXPANSION[el.type] ?? [el.type]).map((k: string) => k.toLowerCase());
      let vastuCompliance: 'non-compliant' | 'compliant' | 'not-applicable' = 'not-applicable';
      if (elKeywords.some(k => violationKeywords.has(k))) {
        vastuCompliance = 'non-compliant';
      } else if (elKeywords.some(k => complianceKeywords.has(k))) {
        vastuCompliance = 'compliant';
      }
      return { ...el, vastuCompliance };
    });

    // ── Response shape ──────────────────────────────────────────────────────
    // Three callers exist with different expectations (see Step 7 mismatch report):
    //   editor-store.ts reads:   data.analysis.score (number), data.analysis.violations,
    //                            data.analysis.directionalAnalysis, data.suggestions
    //   editor/page.tsx reads:   data.score (number), data.issues
    //   [projectId]/page.tsx:    data.score (number), data.issues
    //
    // We serve all three by:
    //   • top-level `score`     → alias for overallScore.value
    //   • top-level `issues`    → alias for violations
    //   • top-level `analysis`  → full engineResult with an extra `score` field added
    //   • top-level `suggestions` → engineResult.suggestions
    //
    // The alias fields are intentional bridges to existing callers.
    // The canonical shape is `analysis` (full VastuAnalysisResult).
    const overallScore = engineResult.overallScore?.value ?? 0;

    return NextResponse.json({
      success: true,
      score: overallScore,
      issues: engineResult.violations ?? [],
      suggestions: engineResult.suggestions ?? [],
      detectedElements: elementsWithCompliance,
      // Pass-saturation metadata — annotation only; does not alter analysis logic.
      detectionConfidence,
      detectedPassCount,
      analysis: {
        score: overallScore,     // flat number; editor-store reads `a.score ?? 75`
        ...engineResult,
        detectedElements: elementsWithCompliance,
        detectionConfidence,
        detectedPassCount,
      },
    });

  } catch (error: any) {
    console.error('❌ /api/vastu POST error:', error.message);
    if (error?.code === 'insufficient_credits' || error?.message?.includes('insufficient_credits')) {
      return NextResponse.json(
        { error: 'insufficient_credits', message: error.message },
        { status: 402 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
