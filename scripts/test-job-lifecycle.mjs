/**
 * scripts/test-job-lifecycle.mjs
 *
 * Phase B integration test — drives the entire job lifecycle via HTTP
 * without needing a browser auth cookie.
 *
 * What it tests:
 *   1. Direct MongoDB job insertion (simulates POST /api/ai/jobs/vastu)
 *   2. GET /api/ai/jobs/:id/status → pending
 *   3. POST /api/ai/jobs/poll → job leased, workerId confirmed
 *   4. POST /api/ai/jobs/:id/heartbeat → lease extended
 *   5. POST /api/ai/jobs/:id/complete → status → completed
 *   6. GET /api/ai/jobs/:id/status → completed (Drive-free path: no outputs = fast)
 *   7. Regression: POST /api/vastu (requires auth, expected 401)
 *
 * Run with:
 *   node --env-file=.env.local scripts/test-job-lifecycle.mjs
 */

import mongoose from 'mongoose';

const BASE_URL  = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SECRET    = process.env.WORKER_SECRET;
const MONGO_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
const WORKER_ID = `test-worker-${Date.now()}`;

// ── Helpers ────────────────────────────────────────────────────────────────────

const W_HEADERS = {
  'Content-Type': 'application/json',
  'x-worker-secret': SECRET,
};

async function api(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: W_HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
}

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

// ── Pre-flight ─────────────────────────────────────────────────────────────────

console.log('\n🔬 Phase B Integration Test — Job Lifecycle\n');

if (!SECRET) {
  console.error('❌ WORKER_SECRET not set. Run with: node --env-file=.env.local scripts/test-job-lifecycle.mjs');
  process.exit(1);
}
if (!MONGO_URI) {
  console.error('❌ MONGODB_URI not set.');
  process.exit(1);
}

// ── Connect to MongoDB ─────────────────────────────────────────────────────────

console.log('── Step 0: MongoDB connection ─────────────────────────────────');
await mongoose.connect(MONGO_URI, { bufferCommands: false });
console.log('  ✅ MongoDB connected\n');

// Minimal GpuJob schema for direct insertion (mirrors lib/db/models/GpuJob.ts)
const GpuJobSchema = new mongoose.Schema({
  workflowType: { type: String, default: 'vastu-analysis' },
  status:       { type: String, default: 'pending' },
  inputs:       { type: mongoose.Schema.Types.Mixed },
  outputs:      { type: Map, of: mongoose.Schema.Types.Mixed, default: () => new Map() },
  params:       { type: mongoose.Schema.Types.Mixed },
  lease:        { type: mongoose.Schema.Types.Mixed },
  retryCount:   { type: Number, default: 0 },
  maxRetries:   { type: Number, default: 2 },
  errorLogs:    [String],
  result:       { type: mongoose.Schema.Types.Mixed },
  userId:       String,
  queuedAt:     { type: Date, default: Date.now },
  completedAt:  Date,
  failedAt:     Date,
}, { timestamps: true });

const GpuJob = mongoose.models.GpuJob || mongoose.model('GpuJob', GpuJobSchema);

// ── Step 1: Insert a test job ──────────────────────────────────────────────────

console.log('── Step 1: Insert test GpuJob ─────────────────────────────────');
const job = await GpuJob.create({
  workflowType: 'vastu-analysis',
  status: 'pending',
  userId: 'test-user-lifecycle',
  inputs: {
    originalImage: {
      driveFileId: 'fake-drive-id-for-test',
      fileName: 'vastu_input_test.png',
    },
  },
  params: { roomType: 'bedroom', direction: 'north', language: 'en' },
  queuedAt: new Date(),
});

const jobId = job._id.toString();
console.log(`  ✅ Created job ${jobId}\n`);

// ── Step 2: Status → pending ───────────────────────────────────────────────────

console.log('── Step 2: GET /api/ai/jobs/:id/status → pending ─────────────');
const t_start = Date.now();

const { status: s2, json: j2 } = await api('GET', `/api/ai/jobs/${jobId}/status`);
assert('HTTP 200', s2 === 200, `got ${s2}`);
assert('status === pending', j2.status === 'pending', `got ${j2.status}`);
console.log(`  (response: ${JSON.stringify(j2)})\n`);

// ── Step 3: Poll → lease ───────────────────────────────────────────────────────

console.log('── Step 3: POST /api/ai/jobs/poll → lease ─────────────────────');
const t_poll = Date.now();
const { status: s3, json: j3 } = await api('POST', '/api/ai/jobs/poll', { workerId: WORKER_ID });
const t_leased = Date.now();

assert('HTTP 200', s3 === 200, `got ${s3}`);
assert('jobId matches', j3.jobId === jobId, `got ${j3.jobId}`);
assert('workflowType', j3.workflowType === 'vastu-analysis', `got ${j3.workflowType}`);
assert('inputs present', !!j3.inputs?.originalImage, 'inputs.originalImage missing');
assert('params present', j3.params?.roomType === 'bedroom', `got ${JSON.stringify(j3.params)}`);
console.log(`  (poll latency: ${t_leased - t_poll}ms)\n`);

// Verify DB state is 'leased'
const jobAfterLease = await GpuJob.findById(jobId).lean();
assert('DB status === leased', jobAfterLease.status === 'leased', `got ${jobAfterLease.status}`);
assert('lease.workerId matches', jobAfterLease.lease?.workerId === WORKER_ID, `got ${jobAfterLease.lease?.workerId}`);
assert('lease.expiresAt in future', new Date(jobAfterLease.lease?.expiresAt) > new Date(), 'lease already expired');
console.log();

// ── Step 4: Heartbeat ──────────────────────────────────────────────────────────

console.log('── Step 4: POST /api/ai/jobs/:id/heartbeat ────────────────────');
const { status: s4, json: j4 } = await api('POST', `/api/ai/jobs/${jobId}/heartbeat`, { workerId: WORKER_ID });
assert('HTTP 200', s4 === 200, `got ${s4}`);
assert('ok: true', j4.ok === true, `got ${JSON.stringify(j4)}`);
assert('expiresAt present', !!j4.expiresAt, 'expiresAt missing from response');
console.log(`  (new expiresAt: ${j4.expiresAt})\n`);

// ── Step 5: Wrong workerId is rejected ────────────────────────────────────────

console.log('── Step 5: Complete with wrong workerId → 404 ─────────────────');
const { status: s5 } = await api('POST', `/api/ai/jobs/${jobId}/complete`, {
  workerId: 'wrong-worker',
  outputs: {},
});
assert('HTTP 404 for wrong workerId', s5 === 404, `got ${s5}`);
console.log();

// ── Step 6: Complete with correct workerId ─────────────────────────────────────

console.log('── Step 6: POST /api/ai/jobs/:id/complete ─────────────────────');
// Pass empty outputs so status route fast-returns without Drive calls
const { status: s6, json: j6 } = await api('POST', `/api/ai/jobs/${jobId}/complete`, {
  workerId: WORKER_ID,
  outputs: {},  // no masks — triggers Drive-free path in status route
});
const t_completed = Date.now();
assert('HTTP 200', s6 === 200, `got ${s6}`);
assert('ok: true', j6.ok === true, `got ${JSON.stringify(j6)}`);
assert('status === completed', j6.status === 'completed', `got ${j6.status}`);
console.log(`  (total lifecycle time: ${t_completed - t_start}ms)\n`);

const jobAfterComplete = await GpuJob.findById(jobId).lean();
assert('DB status === completed', jobAfterComplete.status === 'completed', `got ${jobAfterComplete.status}`);
assert('completedAt set', !!jobAfterComplete.completedAt, 'completedAt not set in DB');
console.log();

// ── Step 7: Status → completed ────────────────────────────────────────────────

console.log('── Step 7: GET /api/ai/jobs/:id/status → completed ───────────');
const { status: s7, json: j7 } = await api('GET', `/api/ai/jobs/${jobId}/status`);
assert('HTTP 200', s7 === 200, `got ${s7}`);
assert('status === completed', j7.status === 'completed', `got ${j7.status}`);
// With empty outputs, computeVastuResult will return detectedElements: []
// and a vastu score — check for the field shape
assert('success field present', j7.success === true, `got ${JSON.stringify(j7)}`);
console.log(`  (result keys: ${Object.keys(j7).join(', ')})\n`);

// ── Step 8: Poll again — queue should be empty ────────────────────────────────

console.log('── Step 8: Poll again → no job (queue empty) ──────────────────');
const { status: s8, json: j8 } = await api('POST', '/api/ai/jobs/poll', { workerId: WORKER_ID });
assert('HTTP 200', s8 === 200, `got ${s8}`);
assert('jobId: null (no more jobs)', j8.jobId === null, `got ${JSON.stringify(j8)}`);
console.log();

// ── Step 9: Security — no secret ──────────────────────────────────────────────

console.log('── Step 9: Security — missing secret → 401 ────────────────────');
const noSecretRes = await fetch(`${BASE_URL}/api/ai/jobs/poll`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ workerId: WORKER_ID }),
});
assert('HTTP 401 without secret', noSecretRes.status === 401, `got ${noSecretRes.status}`);
console.log();

// ── Step 10: Regression — /api/vastu is still there ───────────────────────────

console.log('── Step 10: Regression — /api/vastu still returns 401 (not 404) ');
const vastuRes = await fetch(`${BASE_URL}/api/vastu`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageUrl: '/renders/test.png', roomType: 'bedroom' }),
});
assert('vastu route exists (401 not 404)', vastuRes.status === 401 || vastuRes.status === 400, `got ${vastuRes.status} — route may be missing`);
console.log();

// ── Cleanup ────────────────────────────────────────────────────────────────────

await GpuJob.deleteOne({ _id: jobId });
console.log(`  (test job ${jobId} cleaned up)\n`);

// ── Summary ────────────────────────────────────────────────────────────────────

console.log('══════════════════════════════════════════════════════════════');
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log('══════════════════════════════════════════════════════════════\n');

await mongoose.disconnect();
process.exit(failed > 0 ? 1 : 0);
