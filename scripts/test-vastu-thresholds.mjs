#!/usr/bin/env node
/**
 * test-vastu-thresholds.mjs
 *
 * Validates the recalibrated VASTU_PASS_DEFINITIONS thresholds against true-positive
 * test images. Runs the full 8-pass ComfyUI detection pipeline on each test image
 * and reports which elements are detected (TP confirmation) or missed (FN).
 *
 * Usage:
 *   node scripts/test-vastu-thresholds.mjs
 *
 * Expects ComfyUI running at localhost:8188.
 * Copies test images to ComfyUI/input/ before submission.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { readFile, rm } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const COMFY_URL = 'http://localhost:8188';
const COMFY_INPUT = '/home/nikhil/Documents/Remo2/ComfyUI/input';
const COMFY_OUTPUT = '/home/nikhil/Documents/Remo2/ComfyUI/output';

// ── Import builder (reads updated thresholds from VASTU_PASS_DEFINITIONS) ───
const { buildVastuElementDetection, VASTU_PASS_DEFINITIONS } = await import(
  path.join(PROJECT_ROOT, 'src/workflows/vastuDetectionBuilder.js')
);

// ── Test image inventory ──────────────────────────────────────────────────────
// For each changed pass, identify the best available test image.
// 'null' means no suitable image was found — deferred.
const TEST_IMAGES = [
  {
    label: 'kitchen (stove_sink)',
    src: path.join(PROJECT_ROOT, 'test-assets/kitchen.jpg'),
    comfyName: 'vastu_test_kitchen.jpg',
    expectDetected: ['stove_sink'],
    expectEmpty: ['toilet', 'idol_temple', 'aquarium_fountain'],
  },
  {
    label: 'bathroom ref-1 (toilet)',
    src: path.join(PROJECT_ROOT, 'public/style-references/modern/bathroom/ref-1.jpeg'),
    comfyName: 'vastu_test_bathroom_ref1.jpg',
    expectDetected: ['toilet'],
    expectEmpty: ['idol_temple', 'aquarium_fountain', 'stove_sink'],
  },
  {
    label: 'living room (aquarium — best available)',
    src: path.join(PROJECT_ROOT, 'test-assets/living-room.jpg'),
    comfyName: 'vastu_test_living.jpg',
    // Living room likely has no aquarium — treat as FP-control: expect 0 for all changed passes
    expectDetected: [],
    expectEmpty: ['stove_sink', 'toilet', 'idol_temple', 'aquarium_fountain'],
    note: 'No aquarium in image — serves as FP-control for aquarium_fountain and idol_temple on non-bedroom scene',
  },
  // DEFERRED: idol_temple — no pooja/puja room image found in test-assets,
  // public/samples, public/images, or public/style-references. Requires a
  // photo with a visible mandir/idol for empirical TP confirmation.
];

// ── bbox extractor (inline — mirrors vastuElementExtractor.js) ────────────────
async function extractBBoxes(buf, minAreaPercent = 0.5, maxAreaPercent = 30) {
  const { data, info } = await sharp(buf).grayscale().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const totalPixels = width * height;
  const minArea = (minAreaPercent / 100) * totalPixels;
  const maxArea = (maxAreaPercent / 100) * totalPixels;

  const fg = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) fg[i] = data[i] > 0 ? 1 : 0;
  const parent = new Int32Array(totalPixels + 1);
  const rnk = new Uint8Array(totalPixels + 1);
  for (let i = 0; i <= totalPixels; i++) parent[i] = i;
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const union = (a, b) => {
    a = find(a); b = find(b); if (a === b) return;
    if (rnk[a] < rnk[b]) { const t = a; a = b; b = t; }
    parent[b] = a; if (rnk[a] === rnk[b]) rnk[a]++;
  };
  const label = new Int32Array(totalPixels);
  let nextLabel = 1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!fg[idx]) continue;
      const ll = x > 0 && label[idx - 1] ? label[idx - 1] : 0;
      const tl = y > 0 && label[idx - width] ? label[idx - width] : 0;
      if (!ll && !tl) label[idx] = nextLabel++;
      else if (ll && !tl) label[idx] = ll;
      else if (!ll && tl) label[idx] = tl;
      else { union(ll, tl); label[idx] = ll; }
    }
  }
  const boxes = new Map();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!label[idx]) continue;
      const root = find(label[idx]);
      const ex = boxes.get(root);
      if (!ex) boxes.set(root, { minX: x, minY: y, maxX: x, maxY: y, count: 1 });
      else {
        if (x < ex.minX) ex.minX = x; if (x > ex.maxX) ex.maxX = x;
        if (y < ex.minY) ex.minY = y; if (y > ex.maxY) ex.maxY = y;
        ex.count++;
      }
    }
  }
  const result = [];
  for (const { minX, minY, maxX, maxY, count } of boxes.values()) {
    if (count >= minArea && count <= maxArea) {
      result.push({ x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1,
        pct: +(count / totalPixels * 100).toFixed(2) });
    }
  }
  return result.sort((a, b) => b.width * b.height - a.width * a.height);
}

// ── ComfyUI helpers ───────────────────────────────────────────────────────────
async function submitPrompt(workflow) {
  const body = JSON.stringify({ prompt: workflow });
  const res = await fetch(`${COMFY_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (!res.ok) throw new Error(`ComfyUI /prompt returned ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (data.error) throw new Error(`ComfyUI prompt error: ${JSON.stringify(data.error)}`);
  return data.prompt_id;
}

async function pollHistory(promptId, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 3000));
    const res = await fetch(`${COMFY_URL}/history/${promptId}`);
    if (!res.ok) continue;
    const history = await res.json();
    const entry = history[promptId];
    if (!entry) continue;
    if (entry.status?.completed) return entry.outputs;
    if (entry.status?.status_str === 'error') {
      throw new Error(`ComfyUI execution error for ${promptId}`);
    }
  }
  throw new Error(`Timeout waiting for prompt ${promptId}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  Vastu Threshold Calibration — True-Positive Validation     ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('Applied thresholds (from updated VASTU_PASS_DEFINITIONS):');
for (const p of VASTU_PASS_DEFINITIONS) {
  console.log(`  ${p.passName.padEnd(22)} threshold=${p.threshold}`);
}
console.log('');

const results = [];

for (const testCase of TEST_IMAGES) {
  if (!existsSync(testCase.src)) {
    console.log(`⚠ SKIP [${testCase.label}]: source image not found at ${testCase.src}`);
    results.push({ label: testCase.label, status: 'SKIP', reason: 'missing source image' });
    continue;
  }

  console.log(`\n── Test: ${testCase.label} ─────────────────────────`);
  if (testCase.note) console.log(`   Note: ${testCase.note}`);

  // Copy image to ComfyUI input (convert to PNG for consistency)
  const destPath = path.join(COMFY_INPUT, testCase.comfyName);
  const imgBuf = readFileSync(testCase.src);
  const pngBuf = await sharp(imgBuf).png().toBuffer();
  writeFileSync(destPath, pngBuf);
  console.log(`  → Copied to ComfyUI input: ${testCase.comfyName}`);

  // Build workflow with updated thresholds
  const workflow = buildVastuElementDetection(testCase.comfyName);
  console.log(`  → Submitting 8-pass workflow to ComfyUI…`);

  let outputs;
  try {
    const t0 = Date.now();
    const promptId = await submitPrompt(workflow);
    console.log(`  → prompt_id: ${promptId} — polling…`);
    outputs = await pollHistory(promptId, 180_000);
    console.log(`  → ComfyUI done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } catch (err) {
    console.error(`  ✗ ComfyUI error: ${err.message}`);
    results.push({ label: testCase.label, status: 'ERROR', reason: err.message });
    continue;
  }

  // SaveImage nodes are at IDs 30–37 (segment nodeId + 20)
  const passResults = {};
  for (const pass of VASTU_PASS_DEFINITIONS) {
    const saveNodeId = String(parseInt(pass.nodeId, 10) + 20);
    const images = outputs[saveNodeId]?.images;
    if (!images || images.length === 0) {
      passResults[pass.passName] = { bboxes: [], note: 'no output from ComfyUI node' };
      continue;
    }
    const img = images[0];
    const subfolder = img.subfolder || '';
    const candidates = [
      path.join(COMFY_OUTPUT, subfolder, img.filename),
      path.join(COMFY_OUTPUT, img.filename),
    ];
    let maskBuf = null;
    for (const c of candidates) {
      if (existsSync(c)) { maskBuf = readFileSync(c); break; }
    }
    if (!maskBuf) {
      passResults[pass.passName] = { bboxes: [], note: `mask file not found: ${img.filename}` };
      continue;
    }
    const bboxes = await extractBBoxes(maskBuf);
    passResults[pass.passName] = { bboxes, filename: img.filename };
  }

  // Evaluate expectations
  console.log('\n  Results:');
  let allOk = true;
  for (const pass of VASTU_PASS_DEFINITIONS) {
    const pr = passResults[pass.passName];
    const n = pr.bboxes.length;
    const pcts = pr.bboxes.map(b => b.pct + '%').join(', ') || 'none';
    const shouldDetect = testCase.expectDetected.includes(pass.passName);
    const shouldBeEmpty = testCase.expectEmpty.includes(pass.passName);
    let status = '  (unchanged pass)';
    if (shouldDetect) {
      status = n > 0 ? `✓ TP confirmed (${n} bbox: ${pcts})` : `✗ FN — missed! (expected detection)`;
      if (n === 0) allOk = false;
    } else if (shouldBeEmpty) {
      status = n === 0 ? `✓ 0 FP` : `✗ FP still present (${n} bbox: ${pcts})`;
      if (n > 0) allOk = false;
    } else {
      status = `  ${n} bbox${n !== 1 ? 'es' : ''} (${pcts})`;
    }
    console.log(`    ${pass.passName.padEnd(22)} ${status}`);
  }

  results.push({ label: testCase.label, status: allOk ? 'PASS' : 'ISSUES', passResults });
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  Summary                                                     ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
for (const r of results) {
  const icon = r.status === 'PASS' ? '✓' : r.status === 'SKIP' ? '⚠' : '✗';
  console.log(`  ${icon} ${r.label}: ${r.status}${r.reason ? ' — ' + r.reason : ''}`);
}

console.log('\n⚠ DEFERRED — idol_temple true-positive validation:');
console.log('   No pooja/puja room image found in test-assets/, public/samples/,');
console.log('   public/images/, or public/style-references/ (all style-ref categories');
console.log('   only have bathroom, bedroom, kitchen, livingroom subcategories).');
console.log('   Action required: add a pooja room photo to test-assets/pooja-room.jpg');
console.log('   and re-run this script to confirm idol/mandir detection at threshold=0.38.');
