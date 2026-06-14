#!/usr/bin/env node
/**
 * audit-vastu-hard-images.mjs
 *
 * Part B — Hard Image Testing for the Vastu Detection Robustness Audit.
 *
 * Runs full 8-pass GroundingDINO+SAM2 detection via ComfyUI, then feeds
 * detected elements into analyzeVastu() and prints the complete user-facing
 * output for each test case.
 *
 * Test cases:
 *   1. empty-room.jpg  + roomType='bedroom'   — does pipeline hallucinate?
 *   2. kitchen.jpg     + roomType='bedroom'   — room-type mismatch nonsense
 *   3. bedroom.jpg     + direction='west'     — wrong direction vs correct (east/south)
 *   4. living-room.jpg + roomType='bedroom'   — furnishings mismatch
 *
 * Usage:
 *   node scripts/audit-vastu-hard-images.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const COMFY_URL = 'http://localhost:8188';
const COMFY_INPUT = '/home/nikhil/Documents/Remo2/ComfyUI/input';
const COMFY_OUTPUT = '/home/nikhil/Documents/Remo2/ComfyUI/output';

// ── Import pipeline components ────────────────────────────────────────────────
const { buildVastuElementDetection, VASTU_PASS_DEFINITIONS } = await import(
  path.join(PROJECT_ROOT, 'src/workflows/vastuDetectionBuilder.js')
);

// analyzeVastu is ESM-compatible via .ts compiled to JS? We import via tsx path.
// Since we can't import TS directly, inline the keyword expansion + call the engine
// via a dynamic require trick.
// Instead, we replicate the keyword expansion logic and call the engine using
// the compiled JS via dynamic import with tsx.

// Keyword expansion (mirrors ELEMENT_KEYWORD_EXPANSION in app/api/vastu/route.ts)
const ELEMENT_KEYWORD_EXPANSION = {
  bed:      ['bed'],
  stove:    ['stove'],
  sink:     ['sink'],
  mirror:   ['mirror'],
  door:     ['door'],
  toilet:   ['toilet'],
  idol:     ['idol', 'idols', 'pooja'],
  temple:   ['temple', 'pooja'],
  plant:    ['plant', 'plants'],
  aquarium: ['aquarium'],
  fountain: ['fountain'],
};

// ── BBox extractor (mirrors vastuElementExtractor.ts) ─────────────────────────
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

  const find = (x) => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
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
      result.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1,
        pct: +(count / totalPixels * 100).toFixed(2) });
    }
  }
  return result.sort((a, b) => b.w * b.h - a.w * a.h);
}

// ── analyzeVastu (inlined from lib/vastu-engine.ts) ───────────────────────────
// Inlined to avoid TS import complexity in a .mjs test script.
// Kept in sync with the actual engine; update if vastu-engine.ts changes.

const VASTU_DIRECTIONS_RAW = [
  { direction: 'north', element: 'water', suitable: ['living room','entrance','office'], color: ['green','blue'] },
  { direction: 'south', element: 'fire', suitable: ['master bedroom','storage'], color: ['red','orange'] },
  { direction: 'east', element: 'air', suitable: ['entrance','living room','pooja room','study'], color: ['white','light blue'] },
  { direction: 'west', element: 'water', suitable: ['dining room','children bedroom','study'], color: ['blue','white'] },
  { direction: 'northeast', element: 'water', suitable: ['pooja room','meditation','water source'], color: ['light yellow','cream','white'] },
  { direction: 'northwest', element: 'air', suitable: ['guest room','girls bedroom','garage','bathroom'], color: ['white','light grey'] },
  { direction: 'southeast', element: 'fire', suitable: ['kitchen','electrical equipment'], color: ['red','orange','pink'] },
  { direction: 'southwest', element: 'earth', suitable: ['master bedroom','heavy storage'], color: ['brown','peach'] },
];

// Inline just the subset of VASTU_RULES relevant to our audit
// (full set is in constants/vastu-rules.ts — we only need to identify rule IDs and their violation text)
// Rather than duplicating 900 lines, we call out which specific rules fire and report their text.

// ── Simplified analyzeVastu for audit (reproduces the same featureSet logic) ──
function runAnalysis(roomType, direction, features) {
  // Normalize
  const roomTypeMap = {
    bedroom: 'bedroom', living_room: 'living-room', living: 'living-room',
    kitchen: 'kitchen', bathroom: 'bathroom', pooja_room: 'pooja-room',
    pooja: 'pooja-room', study: 'study', dining: 'dining', foyer: 'foyer',
  };
  const normalizedRoomType = roomTypeMap[roomType] || roomType;
  const normalizedDirection = (direction || '').toLowerCase();
  const featureSet = new Set(features.map(f => f.toLowerCase()));

  // Direction scoring
  const idealDirections = {
    bedroom: ['south', 'southwest', 'west'],
    kitchen: ['southeast', 'northwest'],
    'living-room': ['north', 'northeast', 'east'],
    study: ['north', 'northeast', 'east'],
    bathroom: ['west', 'northwest'],
    'pooja-room': ['northeast', 'north', 'east'],
  };
  const ideal = idealDirections[normalizedRoomType] || [];
  const directionScore = normalizedDirection && ideal.includes(normalizedDirection) ? 95 : normalizedDirection ? 55 : 70;

  // Vastu rules (copy from constants/vastu-rules.ts — keyword + severity logic only)
  const RULES = [
    // Bedroom rules
    { id: 'bedroom-003', category: 'bedroom', title: 'Avoid placing bed under beam',
      severity: 'major', points: 8, direction: null, roomTypes: ['bedroom'],
      description: 'Sleeping under a beam creates pressure and causes health issues',
      remedy: 'Cover beam with false ceiling or hang two bamboo flutes',
      keywords: ['bed', 'beam', 'ceiling'],
      // FIX-1: 'beam'/'ceiling' never appear in featureSet; AND logic silences this rule.
      requireAllKeywords: true },
    { id: 'bedroom-004', category: 'bedroom', title: 'No mirror facing the bed',
      severity: 'major', points: 8, direction: null, roomTypes: ['bedroom'],
      description: 'Mirrors reflecting the bed disturb sleep and can cause relationship issues',
      remedy: 'Cover mirror at night or relocate it so it does not reflect the bed',
      keywords: ['mirror', 'bed', 'reflection'] },
    { id: 'bedroom-007', category: 'bedroom', title: 'Bedroom door should not face toilet door',
      severity: 'major', points: 8, direction: null, roomTypes: ['bedroom', 'bathroom'],
      description: 'Direct alignment with toilet brings negative energy into bedroom',
      remedy: 'Keep toilet door closed always and place a curtain between',
      keywords: ['bedroom', 'toilet', 'door', 'alignment'],
      // FIX-1: 'alignment' never appears in featureSet; AND logic silences this rule.
      requireAllKeywords: true },
    // Kitchen rules
    { id: 'kitchen-003', category: 'kitchen', title: 'Stove and sink should not be adjacent',
      severity: 'major', points: 10, direction: null, roomTypes: ['kitchen'],
      description: 'Fire and water elements clash when placed together',
      remedy: 'Keep at least 2 feet gap or place green plants/wooden element between them',
      keywords: ['stove', 'sink', 'fire', 'water'] },
    { id: 'kitchen-004', category: 'kitchen', title: 'Kitchen should not be directly below or above toilet',
      severity: 'critical', points: 12, direction: null, roomTypes: ['kitchen', 'bathroom'],
      description: 'This creates negative energy affecting food and health',
      remedy: 'Place sea salt in copper bowl in kitchen, use Vastu pyramids',
      keywords: ['kitchen', 'toilet', 'above', 'below'],
      // FIX-1: 'above'/'below' never appear in featureSet; AND logic silences this rule.
      requireAllKeywords: true },
    // Mirror rules
    { id: 'mirror-002', category: 'mirror', title: 'Avoid broken or cracked mirrors',
      severity: 'major', points: 8, direction: null, roomTypes: ['living-room', 'bedroom', 'bathroom'],
      description: 'Damaged mirrors create negative energy and distorted reflections',
      remedy: 'Replace damaged mirrors immediately',
      // FIX-2: 'mirror' removed — no damage-assessment pass exists; re-add only when one does.
      keywords: ['broken', 'damaged'] },
    // Plant rules
    { id: 'plant-002', category: 'plants', title: 'Avoid cactus and thorny plants indoors',
      severity: 'minor', points: 5, direction: null, roomTypes: ['living-room', 'bedroom', 'balcony'],
      description: 'Thorny plants create negative energy and conflict',
      remedy: 'Replace with money plant, peace lily, or bamboo',
      // FIX-3: 'plants'/'avoid' removed — species-specific keywords only; re-add generic
      // 'plant'/'plants' only when plant species classification is implemented.
      keywords: ['cactus', 'thorny'] },
    // General rules that also apply to bedrooms
    { id: 'general-001', category: 'general', title: 'Keep home clutter-free',
      severity: 'major', points: 8, direction: null, roomTypes: ['living-room', 'bedroom', 'kitchen', 'bathroom'],
      description: 'Clutter blocks positive energy flow throughout home',
      remedy: 'Regular decluttering and organizing',
      keywords: ['clutter', 'organization', 'clean'] },
    // Pooja rules
    { id: 'pooja-005', category: 'pooja', title: 'Avoid placing toilet above or adjacent to pooja room',
      severity: 'critical', points: 15, direction: null, roomTypes: ['pooja-room', 'bathroom'],
      description: 'Toilet near sacred space causes severe negative impact',
      remedy: 'Relocate either room, use Vastu remedies like salt and pyramids',
      keywords: ['pooja', 'toilet', 'adjacent'],
      // FIX-1: 'adjacent' never appears in featureSet; AND logic silences this rule.
      requireAllKeywords: true },
  ];

  const negativeKeywords = ['avoid', 'no ', 'not ', 'never'];
  const violations = [];

  for (const rule of RULES) {
    const appliesToRoom = rule.roomTypes.some(rt => rt === normalizedRoomType || rt === roomType);
    if (!appliesToRoom) continue;

    const isNegativeRule = negativeKeywords.some(kw => rule.title.toLowerCase().includes(kw));
    if (!isNegativeRule) continue;

    if (rule.requireAllKeywords) {
      // AND logic: all keywords must be present.
      const allPresent = rule.keywords.every(kw => featureSet.has(kw.toLowerCase()));
      if (allPresent) {
        violations.push({
          ruleId: rule.id,
          keyword: rule.keywords.join('+'),
          description: rule.description,
          remedy: rule.remedy,
          severity: rule.severity,
          points: rule.points,
        });
      }
    } else {
      // OR logic (default): any keyword match triggers.
      for (const keyword of rule.keywords) {
        if (featureSet.has(keyword.toLowerCase())) {
          violations.push({
            ruleId: rule.id,
            keyword,
            description: rule.description,
            remedy: rule.remedy,
            severity: rule.severity,
            points: rule.points,
          });
          break;
        }
      }
    }
  }

  return { normalizedRoomType, normalizedDirection, ideal, directionScore, violations, featureSet: [...featureSet] };
}

// ── ComfyUI helpers ───────────────────────────────────────────────────────────
async function submitPrompt(workflow) {
  const res = await fetch(`${COMFY_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow }),
  });
  if (!res.ok) throw new Error(`ComfyUI /prompt ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (data.error) throw new Error(`ComfyUI error: ${JSON.stringify(data.error)}`);
  return data.prompt_id;
}

async function pollHistory(promptId, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 3000));
    const res = await fetch(`${COMFY_URL}/history/${promptId}`);
    if (!res.ok) continue;
    const history = await res.json();
    const entry = history[promptId];
    if (!entry) continue;
    if (entry.status?.completed) return entry.outputs;
    if (entry.status?.status_str === 'error') throw new Error(`ComfyUI execution error`);
  }
  throw new Error(`Timeout waiting for ${promptId}`);
}

// ── Run detection for one image ───────────────────────────────────────────────
async function runDetection(srcPath, comfyName) {
  const imgBuf = readFileSync(srcPath);
  const pngBuf = await sharp(imgBuf).png().toBuffer();
  writeFileSync(path.join(COMFY_INPUT, comfyName), pngBuf);

  const workflow = buildVastuElementDetection(comfyName);
  const t0 = Date.now();
  const promptId = await submitPrompt(workflow);
  console.log(`  prompt_id: ${promptId} — polling…`);
  const outputs = await pollHistory(promptId);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`  ComfyUI done in ${elapsed}s`);

  const passResults = {};
  for (const pass of VASTU_PASS_DEFINITIONS) {
    const saveNodeId = String(parseInt(pass.nodeId, 10) + 20);
    const images = outputs[saveNodeId]?.images;
    if (!images?.length) { passResults[pass.passName] = []; continue; }
    const img = images[0];
    const candidates = [
      path.join(COMFY_OUTPUT, img.subfolder || '', img.filename),
      path.join(COMFY_OUTPUT, img.filename),
    ];
    let maskBuf = null;
    for (const c of candidates) {
      if (existsSync(c)) { maskBuf = readFileSync(c); break; }
    }
    if (!maskBuf) { passResults[pass.passName] = []; continue; }
    passResults[pass.passName] = await extractBBoxes(maskBuf);
  }
  return passResults;
}

// ── Build detected element types from pass results ────────────────────────────
function buildDetectedTypes(passResults) {
  const detectedTypes = [];
  for (const pass of VASTU_PASS_DEFINITIONS) {
    const bboxes = passResults[pass.passName] || [];
    if (bboxes.length > 0) {
      detectedTypes.push(...pass.elementTypes);
    }
  }
  return [...new Set(detectedTypes)];
}

function buildFeatureSet(detectedTypes) {
  return [
    ...new Set(
      detectedTypes.flatMap(t => ELEMENT_KEYWORD_EXPANSION[t] ?? [t])
    )
  ];
}

// ── Print analysis result ─────────────────────────────────────────────────────
function printAnalysis(label, roomType, direction, passResults) {
  console.log(`\n${'═'.repeat(65)}`);
  console.log(`TEST: ${label}`);
  console.log(`  roomType='${roomType}'  direction='${direction || 'none'}'`);
  console.log('─'.repeat(65));

  console.log('\n  Detection results per pass:');
  for (const pass of VASTU_PASS_DEFINITIONS) {
    const bboxes = passResults[pass.passName] || [];
    const pcts = bboxes.map(b => b.pct + '%').join(', ') || 'none';
    console.log(`    ${pass.passName.padEnd(22)} ${bboxes.length} bbox  [${pcts}]`);
  }

  const detectedTypes = buildDetectedTypes(passResults);
  const features = buildFeatureSet(detectedTypes);
  console.log(`\n  Detected element types: [${detectedTypes.join(', ') || 'none'}]`);
  console.log(`  Features fed to engine:  [${features.join(', ') || 'none'}]`);

  const { normalizedDirection, ideal, directionScore, violations } = runAnalysis(roomType, direction, features);

  const dirOk = normalizedDirection && ideal.includes(normalizedDirection);
  const dirMsg = normalizedDirection
    ? (dirOk
        ? `✓ ${normalizedDirection} is ideal for ${roomType}`
        : `✗ ${normalizedDirection} is NOT ideal (ideal: ${ideal.join('/')})`
      )
    : '(no direction given)';
  console.log(`\n  Direction check: ${dirMsg}  [score component: ${directionScore}/100]`);

  if (violations.length === 0) {
    console.log('\n  Feature-triggered violations: NONE');
  } else {
    console.log(`\n  Feature-triggered violations (${violations.length}):`);
    for (const v of violations) {
      console.log(`\n    [${v.severity.toUpperCase()}] Rule: ${v.ruleId} (matched keyword: "${v.keyword}")`);
      console.log(`      User sees: "${v.description}"`);
      console.log(`      Remedy:    "${v.remedy}"`);
    }
  }

  // Flag any obviously wrong messages
  const flags = [];
  const dt = new Set(detectedTypes);
  if (dt.has('mirror') && violations.some(v => v.ruleId === 'mirror-002')) {
    flags.push('mirror-002 fires on mere mirror PRESENCE — tells user mirror is BROKEN/DAMAGED');
  }
  if (dt.has('plant') && violations.some(v => v.ruleId === 'plant-002')) {
    flags.push('plant-002 fires on any plant — tells user to remove potentially AUSPICIOUS plants (tulsi, money plant)');
  }
  if (dt.has('bed') && violations.some(v => v.ruleId === 'bedroom-003')) {
    flags.push('bedroom-003 fires on any bed detection — implies bed is under a BEAM (may not be)');
  }
  if (dt.has('door') && violations.some(v => v.ruleId === 'bedroom-007')) {
    flags.push('bedroom-007 fires on door detection — implies TOILET ALIGNMENT issue even with no toilet visible');
  }
  if (!dt.has('toilet') && violations.some(v => v.ruleId === 'kitchen-004')) {
    flags.push('kitchen-004 fires with no actual toilet detection — phantom toilet implied');
  }

  if (flags.length > 0) {
    console.log('\n  ⚠️  USER-MISLEADING FLAGS:');
    for (const f of flags) console.log(`     • ${f}`);
  } else {
    console.log('\n  (no actively misleading violations found for this test)');
  }
}

// ── Test cases ────────────────────────────────────────────────────────────────
const TEST_CASES = [
  {
    label: 'B.1 — Empty/sparse room tested as bedroom (no direction)',
    src: path.join(PROJECT_ROOT, 'test-assets/empty-room.jpg'),
    comfyName: 'audit_empty_room.jpg',
    roomType: 'bedroom',
    direction: '',
  },
  {
    label: 'B.2 — Kitchen photo tested as bedroom (intentional mismatch)',
    src: path.join(PROJECT_ROOT, 'test-assets/kitchen.jpg'),
    comfyName: 'audit_kitchen_as_bedroom.jpg',
    roomType: 'bedroom',
    direction: 'north',
  },
  {
    label: 'B.3 — Bedroom photo, correct roomType but WRONG direction (west instead of south)',
    src: path.join(PROJECT_ROOT, 'test-assets/bedroom.jpg'),
    comfyName: 'audit_bedroom_wrong_dir.jpg',
    roomType: 'bedroom',
    direction: 'west',
  },
  {
    label: 'B.4 — Bedroom photo, correct roomType, CORRECT direction (south)',
    src: path.join(PROJECT_ROOT, 'test-assets/bedroom.jpg'),
    comfyName: 'audit_bedroom_correct_dir.jpg',
    roomType: 'bedroom',
    direction: 'south',
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║  Vastu Detection Robustness Audit — Part B Hard Image Tests    ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

for (const tc of TEST_CASES) {
  if (!existsSync(tc.src)) {
    console.log(`\n⚠ SKIP [${tc.label}]: source not found: ${tc.src}`);
    continue;
  }

  console.log(`\n── Running: ${tc.label}`);
  console.log(`   Source: ${path.basename(tc.src)}`);

  let passResults;
  try {
    passResults = await runDetection(tc.src, tc.comfyName);
  } catch (err) {
    console.error(`   ✗ Detection failed: ${err.message}`);
    continue;
  }

  printAnalysis(tc.label, tc.roomType, tc.direction, passResults);
}

console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
console.log('║  Audit Complete                                                 ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
