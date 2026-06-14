/**
 * GET /api/ai/jobs/[jobId]/status
 *
 * Client polls this route to get job progress and, once completed, the full
 * Vastu analysis result in the same shape as the existing /api/vastu route.
 *
 * If status === 'completed' and `result` is not yet cached:
 *   1. Download the 8 mask buffers from Drive.
 *   2. Run extractBoundingBoxesFromMask() on each.
 *   3. Build detectedElements[] from bboxes + VASTU_PASS_DEFINITIONS.
 *   4. Run analyzeVastu() with detected elements + job params.
 *   5. Cache the scored result on the GpuJob document.
 *   6. Return { status, score, analysis, issues, suggestions, detectedElements }.
 *
 * Response shape is intentionally identical to /api/vastu so the frontend
 * needs zero changes once the job completes.
 */

import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { connectDB } from '@/lib/db/mongodb';
import GpuJob from '@/lib/db/models/GpuJob';
import { getAuthedClient, downloadFileFromDrive, getDriveService } from '@/src/lib/googleDrive';
import { extractBoundingBoxesFromMask } from '@/lib/ai/vastuElementExtractor';
import { analyzeVastu } from '@/lib/vastu-engine';
import { VASTU_PASS_DEFINITIONS } from '@/src/workflows/vastuDetectionBuilder.js';
import VASTU_RULES from '@/constants/vastu-rules';

export const runtime = 'nodejs';

// ── Types copied from vastu/route.ts ─────────────────────────────────────────

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

const ELEMENT_DISPLAY_NAMES: Record<string, string> = {
  bed:       'Bed',
  stove:     'Stove',
  sink:      'Sink',
  mirror:    'Mirror',
  door:      'Door',
  toilet:    'Toilet',
  idol:      'Idol',
  temple:    'Temple / Mandir',
  plant:     'Indoor Plant',
  aquarium:  'Aquarium',
  fountain:  'Water Fountain',
};

const ELEMENT_DISPLAY_NAMES_HI: Record<string, string> = {
  bed:       'पलंग',
  stove:     'गैस स्टोव',
  sink:      'सिंक',
  mirror:    'दर्पण',
  door:      'दरवाजा',
  toilet:    'शौचालय',
  idol:      'मूर्ति',
  temple:    'मंदिर',
  plant:     'इनडोर पौधा',
  aquarium:  'मछलीघर',
  fountain:  'फव्वारा',
};

const PASS_ELEMENT_TYPES: string[][] = [
  ['bed'], ['stove', 'sink'], ['mirror'], ['door'], ['toilet'],
  ['idol', 'temple'], ['plant'], ['aquarium', 'fountain'],
];

const generateId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ── Analysis helper ───────────────────────────────────────────────────────────

async function computeVastuResult(
  outputs: Map<string, { driveFileId: string; fileName: string }>,
  params: Record<string, unknown>,
  drive: ReturnType<typeof google.drive>,
) {
  const { roomType, direction, language = 'en' } = params as any;

  // Build a pass-name → driveFileId lookup from the outputs map
  const outputLookup: Record<string, string> = {};
  for (const [passName, fileRef] of outputs.entries()) {
    outputLookup[passName] = fileRef.driveFileId;
  }

  const detectedElements: any[] = [];

  for (const pass of VASTU_PASS_DEFINITIONS as any[]) {
    const driveFileId = outputLookup[pass.passName];
    if (!driveFileId) {
      console.warn(`[Status] No Drive file for pass '${pass.passName}'`);
      continue;
    }

    let maskBuffer: Buffer;
    try {
      maskBuffer = await downloadFileFromDrive(drive, driveFileId);
    } catch (err: any) {
      console.warn(`[Status] Could not download mask for '${pass.passName}': ${err.message}`);
      continue;
    }

    let bboxes: any[];
    try {
      bboxes = await extractBoundingBoxesFromMask(maskBuffer);
    } catch (err: any) {
      console.warn(`[Status] BBox extraction failed for '${pass.passName}': ${err.message}`);
      continue;
    }

    if (bboxes.length === 0) continue;

    for (const bbox of bboxes) {
      for (const elementType of pass.elementTypes) {
        detectedElements.push({
          id: generateId(`ve-${elementType}`),
          type: elementType,
          name: ELEMENT_DISPLAY_NAMES[elementType] || elementType,
          nameHi: ELEMENT_DISPLAY_NAMES_HI[elementType] || elementType,
          boundingBox: bbox,
          position: 'center',
          direction: undefined,
          vastuCompliance: 'not-applicable',
          issues: [],
          issuesHi: [],
          confidence: 0.7,
        });
      }
    }
  }

  // Pass-saturation guard (informational only)
  const detectedTypeSet = new Set(detectedElements.map((e: any) => e.type));
  const detectedPassCount = PASS_ELEMENT_TYPES.filter(
    passTypes => passTypes.some(t => detectedTypeSet.has(t)),
  ).length;
  const detectionConfidence: 'normal' | 'low' | 'failed' =
    detectedPassCount === 0 ? 'failed' : detectedPassCount >= 6 ? 'low' : 'normal';

  const expandedKeywords = [
    ...new Set(
      detectedElements.flatMap(
        (e: any) => ELEMENT_KEYWORD_EXPANSION[e.type] ?? [e.type],
      ),
    ),
  ];

  const engineResult = analyzeVastu({
    roomType,
    direction: direction || '',
    features: expandedKeywords,
    detectedElements,
    language,
  });

  // Compute compliance labels (same logic as /api/vastu)
  const violationKeywords = new Set<string>();
  for (const ev of (engineResult.ruleEvaluations ?? []) as any[]) {
    if (!ev.passed && ev.source === 'detection') {
      const rule = (VASTU_RULES as any[]).find((r: any) => r.id === ev.ruleId);
      if (rule) (rule.keywords as string[]).forEach((k: string) => violationKeywords.add(k.toLowerCase()));
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

  const elementsWithCompliance = detectedElements.map((el: any) => {
    const elKeywords = (ELEMENT_KEYWORD_EXPANSION[el.type] ?? [el.type]).map((k: string) => k.toLowerCase());
    let vastuCompliance: 'non-compliant' | 'compliant' | 'not-applicable' = 'not-applicable';
    if (elKeywords.some(k => violationKeywords.has(k))) {
      vastuCompliance = 'non-compliant';
    } else if (elKeywords.some(k => complianceKeywords.has(k))) {
      vastuCompliance = 'compliant';
    }
    return { ...el, vastuCompliance };
  });

  const overallScore = (engineResult as any).overallScore?.value ?? 0;

  // Return in the SAME shape as /api/vastu
  return {
    score: overallScore,
    issues: (engineResult as any).violations ?? [],
    suggestions: (engineResult as any).suggestions ?? [],
    detectedElements: elementsWithCompliance,
    detectionConfidence,
    detectedPassCount,
    analysis: {
      score: overallScore,
      ...(engineResult as any),
      detectedElements: elementsWithCompliance,
      detectionConfidence,
      detectedPassCount,
    },
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  await connectDB();
  const { jobId } = await params;

  const job = await GpuJob.findById(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Fast-path for in-progress or already-cached jobs
  if (job.status !== 'completed') {
    return NextResponse.json({ status: job.status, errorLogs: job.errorLogs });
  }

  // Already computed — return cached result
  if (job.result) {
    return NextResponse.json({ success: true, status: 'completed', ...job.result });
  }

  // ── Compute result on first poll after completion ─────────────────────────
  const driveClient = await getAuthedClient();
  if (!driveClient) {
    return NextResponse.json(
      { error: 'Google Drive not connected — cannot retrieve mask outputs' },
      { status: 503 },
    );
  }

  const drive = getDriveService(driveClient);

  let result: Record<string, unknown>;
  try {
    result = await computeVastuResult(job.outputs as any, job.params as any, drive);
  } catch (err: any) {
    console.error('[Status] Analysis computation failed:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  // Cache on the job document so subsequent polls are instant
  await GpuJob.updateOne({ _id: jobId }, { $set: { result } });

  return NextResponse.json({ success: true, status: 'completed', ...result });
}
