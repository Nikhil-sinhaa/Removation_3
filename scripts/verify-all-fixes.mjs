#!/usr/bin/env node
/**
 * REMOVATION.AI — FULL FIX VERIFICATION SCRIPT
 *
 * Verifies every security, pipeline, payment, and database fix
 * implemented across all sessions. Run this any time before a
 * deploy to confirm nothing has been accidentally reverted.
 *
 * Usage: node scripts/verify-all-fixes.mjs
 * Exit code 0 = all pass, Exit code 1 = failures found
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const results = { pass: 0, fail: 0, warn: 0, failures: [] };

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function readFile(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function check(id, description, passed, evidence = '') {
  if (passed) {
    results.pass++;
    console.log(`  ✅ ${id}: ${description}`);
  } else {
    results.fail++;
    results.failures.push({ id, description, evidence });
    console.log(`  ❌ ${id}: ${description}`);
    if (evidence) console.log(`     → ${evidence}`);
  }
}

function warn(id, description, evidence = '') {
  results.warn++;
  console.log(`  ⚠️  ${id}: ${description}`);
  if (evidence) console.log(`     → ${evidence}`);
}

function section(name) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${name}`);
  console.log('═'.repeat(60));
}

function contains(content, str) {
  return content !== null && content.includes(str);
}

function notContains(content, str) {
  return content !== null && !content.includes(str);
}

function matchesRegex(content, regex) {
  return content !== null && regex.test(content);
}

function grep(pattern, extensions = ['ts', 'js']) {
  try {
    const ext = extensions.map(e => `--include="*.${e}"`).join(' ');
    const result = execSync(
      `grep -rn "${pattern}" ${ext} . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git 2>/dev/null`,
      { cwd: ROOT, encoding: 'utf8' }
    );
    return result.trim();
  } catch {
    return '';
  }
}

// ─── SESSION 1: SECURITY & AUTH ──────────────────────────────────────────────

section('SESSION 1 — Security & Auth');

// FIX-2: JWT Secret fallback removed
console.log('\n  FIX-2: JWT_SECRET fallback removed from OAuth routes');
{
  const googleRoute = readFile('app/api/auth/google/route.ts');
  const callbackRoute = readFile('app/api/auth/google/callback/route.ts');

  check('A01', 'google/route.ts exists', googleRoute !== null);
  check('A02', 'No change-me-in-production in google/route.ts',
    notContains(googleRoute, 'change-me-in-production'),
    'Found fallback secret string');
  check('A03', 'Startup throw if JWT_SECRET missing in google/route.ts',
    contains(googleRoute, 'JWT_SECRET environment variable is required'),
    'Missing startup validation');

  check('A04', 'google/callback/route.ts exists', callbackRoute !== null);
  check('A05', 'No change-me-in-production in callback route',
    notContains(callbackRoute, 'change-me-in-production'),
    'Found fallback secret string');
  check('A06', 'Startup throw if JWT_SECRET missing in callback route',
    contains(callbackRoute, 'JWT_SECRET environment variable is required'),
    'Missing startup validation');
}

// FIX-1: OAuth CSRF state validation
console.log('\n  FIX-1: OAuth callback hard-rejects invalid state');
{
  const callbackRoute = readFile('app/api/auth/google/callback/route.ts');

  check('A07', 'stateParam extracted from searchParams',
    contains(callbackRoute, 'searchParams.get(\'state\')') ||
    contains(callbackRoute, 'searchParams.get("state")'),
    'stateParam extraction not found');
  check('A08', 'null guard for missing stateParam',
    contains(callbackRoute, '!stateParam'),
    'Missing null guard for stateParam');
  check('A09', 'Redirects to /sign-in?error=invalid_state on missing state',
    contains(callbackRoute, 'invalid_state'),
    'invalid_state redirect not found');
  check('A10', 'catch block does not just console.warn and continue',
    matchesRegex(callbackRoute, /catch[^}]*invalid_state/s) ||
    matchesRegex(callbackRoute, /catch[^}]*return NextResponse\.redirect/s),
    'catch block may not redirect on state failure');
}

// FIX-3: Admin gates on monitoring/system routes
console.log('\n  FIX-3: Admin gates on monitoring and system routes');
{
  const files = [
    'app/api/monitoring/dashboard/route.ts',
    'app/api/system/memory/route.ts',
    'app/api/system/redis/route.ts',
  ];

  for (const f of files) {
    const content = readFile(f);
    const label = f.split('/').slice(-2).join('/');
    check(`A11-${label}`, `requireRole(['admin']) in ${label}`,
      contains(content, "requireRole(req, ['admin'])"),
      'requireRole admin gate missing');
    check(`A12-${label}`, `authResult instanceof NextResponse check in ${label}`,
      contains(content, 'authResult instanceof NextResponse'),
      'NextResponse check missing');
  }
}

// FIX-3 BONUS: Health route public
console.log('\n  FIX-3 BONUS: /api/health in PUBLIC_PREFIXES');
{
  const middleware = readFile('middleware.ts');
  check('A13', '/api/health in PUBLIC_PREFIXES',
    contains(middleware, "'/api/health'"),
    '/api/health not found in PUBLIC_PREFIXES');
  check('A14', '/api/auth still in PUBLIC_PREFIXES',
    contains(middleware, "'/api/auth'"),
    '/api/auth accidentally removed');
  check('A15', '/api/webhook still in PUBLIC_PREFIXES',
    contains(middleware, "'/api/webhook'"),
    '/api/webhook accidentally removed');
  check('A16', '/api/uploadthing still in PUBLIC_PREFIXES',
    contains(middleware, "'/api/uploadthing'"),
    '/api/uploadthing accidentally removed');
  check('A17', '/api/test still in PUBLIC_PREFIXES',
    contains(middleware, "'/api/test'"),
    '/api/test accidentally removed');
}

// FIX-4: Rate limiting on OTP and forgot-password
console.log('\n  FIX-4: Rate limiting on OTP verify and forgot-password');
{
  const otpRoute = readFile('app/api/auth/verify-otp/route.ts');
  const forgotRoute = readFile('app/api/auth/forgot-password/route.ts');

  check('A18', 'rateLimiters imported in verify-otp',
    contains(otpRoute, 'rateLimiters'),
    'rateLimiters import missing');
  check('A19', 'rateLimiters.auth(ip) called in verify-otp',
    contains(otpRoute, 'rateLimiters.auth(ip)'),
    'rateLimiters.auth(ip) call missing');
  check('A20', '429 returned in verify-otp',
    contains(otpRoute, '429'),
    '429 status not found');
  check('A21', 'rateLimiters imported in forgot-password',
    contains(forgotRoute, 'rateLimiters'),
    'rateLimiters import missing');
  check('A22', 'rateLimiters.auth(ip) called in forgot-password',
    contains(forgotRoute, 'rateLimiters.auth(ip)'),
    'rateLimiters.auth(ip) call missing');
  check('A23', '429 returned in forgot-password',
    contains(forgotRoute, '429'),
    '429 status not found');
}

// ENV file checks
console.log('\n  ENV: JWT_SECRET in example files');
{
  const envExample = readFile('.env.example');
  const envLocal = readFile('.env.local.example');
  check('A24', 'JWT_SECRET entry in .env.example',
    contains(envExample, 'JWT_SECRET='),
    'JWT_SECRET= not found in .env.example');
  check('A25', 'JWT_SECRET generation hint in .env.example',
    contains(envExample, 'openssl rand -hex 32'),
    'Generation hint missing from .env.example');
  check('A26', 'JWT_SECRET entry in .env.local.example',
    contains(envLocal, 'JWT_SECRET='),
    'JWT_SECRET= not found in .env.local.example');
}

// ─── SESSION 2: AI PIPELINE ───────────────────────────────────────────────────

section('SESSION 2 — AI Pipeline');

// PIPE-01: GPU mode router used correctly
console.log('\n  PIPE-01: GPU mode router used in monitoring, comfyui.ts, health route');
{
  const monitoring = readFile('lib/ai/comfyui-monitoring.ts');
  const comfyui = readFile('lib/ai/comfyui.ts');
  const healthRoute = readFile('app/api/ai/status/health/route.js');

  check('B01', 'No COMFYUI_URL env var in comfyui-monitoring.ts',
    notContains(monitoring, 'COMFYUI_URL'),
    'COMFYUI_URL still referenced');
  check('B02', 'getActiveComfyBaseUrl imported in comfyui-monitoring.ts',
    contains(monitoring, 'getActiveComfyBaseUrl'),
    'getActiveComfyBaseUrl not imported');
  check('B03', 'No hardcoded 127.0.0.1:8188 in comfyui-monitoring.ts',
    notContains(monitoring, '127.0.0.1:8188'),
    'Hardcoded localhost URL found');

  check('B04', 'No COMFYUI_URL env var in comfyui.ts',
    notContains(comfyui, 'COMFYUI_URL'),
    'COMFYUI_URL still referenced');
  check('B05', 'getActiveComfyBaseUrl imported in comfyui.ts',
    contains(comfyui, 'getActiveComfyBaseUrl'),
    'getActiveComfyBaseUrl not imported');
  check('B06', 'No hardcoded 127.0.0.1:8188 in comfyui.ts',
    notContains(comfyui, '127.0.0.1:8188'),
    'Hardcoded localhost URL found');

  check('B07', 'No COMFYUI_URL in health route',
    notContains(healthRoute, 'COMFYUI_URL'),
    'COMFYUI_URL still referenced');
  check('B08', 'getActiveComfyBaseUrl used in health route',
    contains(healthRoute, 'getActiveComfyBaseUrl'),
    'getActiveComfyBaseUrl not used');
  check('B09', 'AbortSignal.timeout used in health route',
    contains(healthRoute, 'AbortSignal.timeout'),
    'Old {timeout} fetch option still used');
  check('B10', 'No hardcoded 127.0.0.1:8188 in health route',
    notContains(healthRoute, '127.0.0.1:8188'),
    'Hardcoded localhost URL found');
}

// PIPE-02: preflight.ts uses dynamic URL
console.log('\n  PIPE-02: preflight.ts uses getActiveComfyBaseUrl()');
{
  const preflight = readFile('lib/ai/preflight.ts');
  check('B11', 'No module-level COMFY_URL constant in preflight.ts',
    notContains(preflight, 'const COMFY_URL ='),
    'Module-level COMFY_URL constant still exists');
  check('B12', 'getActiveComfyBaseUrl used in checkNodeAvailable',
    contains(preflight, 'getActiveComfyBaseUrl()'),
    'getActiveComfyBaseUrl() not found in preflight');
}

// PIPE-03: useArchAi3d guard
console.log('\n  PIPE-03: useArchAi3d throws instead of calling broken workflow');
{
  const master = readFile('lib/ai/comfyui-workflows-master.ts');
  check('B13', 'useArchAi3d if block exists',
    contains(master, 'useArchAi3d'),
    'useArchAi3d block not found');
  check('B14', 'useArchAi3d block throws Error',
    contains(master, 'throw new Error') && contains(master, 'ArchAi3d'),
    'useArchAi3d does not throw - may call broken workflow');
  check('B15', 'createArchAi3dWorkflow not called directly',
    notContains(master, 'createArchAi3dWorkflow(request)'),
    'createArchAi3dWorkflow(request) is still being called');
}

// PIPE-04: deductCredits null-guards
console.log('\n  PIPE-04: deductCredits.ts null-guards on subscription access');
{
  const deduct = readFile('lib/ai/deductCredits.ts');
  check('B16', 'null-guard pattern present in deductCredits.ts',
    contains(deduct, 'user.subscription\n') ||
    contains(deduct, 'user.subscription ?') ||
    matchesRegex(deduct, /user\.subscription\s*\?/),
    'Ternary null-guard on user.subscription not found');
  check('B17', 'Fallback to user.credits when subscription null',
    contains(deduct, 'user.credits ?? 0'),
    'user.credits ?? 0 fallback not found');
}

// PIPE-05: PERMANENT_ERROR_CODES
console.log('\n  PIPE-05: generation function expired in PERMANENT_ERROR_CODES');
{
  const worker = readFile('lib/ai/queueWorker.ts');
  check('B18', 'generation function expired in PERMANENT_ERROR_CODES',
    contains(worker, 'generation function expired'),
    'generation function expired not in permanent errors list');
}

// PIPE-07: Subscription status check
console.log('\n  PAY-07 (in deductCredits): Subscription status gate');
{
  const deduct = readFile('lib/ai/deductCredits.ts');
  check('B19', 'blockedStatuses array exists',
    contains(deduct, 'blockedStatuses'),
    'blockedStatuses array not found');
  check('B20', 'canceled in blockedStatuses',
    contains(deduct, "'canceled'"),
    'canceled not in blockedStatuses');
  check('B21', 'past_due in blockedStatuses',
    contains(deduct, "'past_due'"),
    'past_due not in blockedStatuses');
  check('B22', 'isPaidPlan checks pro or team',
    contains(deduct, "=== 'pro'") && contains(deduct, "=== 'team'"),
    'isPaidPlan check for pro/team not found');
  check('B23', 'isBlocked variable exists',
    contains(deduct, 'isBlocked'),
    'isBlocked variable not found');
}

// ─── SESSION 3: CREDITS & PAYMENTS ───────────────────────────────────────────

section('SESSION 3 — Credits & Payments');

// PAY-01: PUT credits admin only
console.log('\n  PAY-01: PUT /api/payment/credits restricted to admin');
{
  const credits = readFile('app/api/payment/credits/route.ts');
  check('C01', 'requireRole imported in credits route',
    contains(credits, 'requireRole'),
    'requireRole not imported');
  check('C02', "requireRole(['admin']) in PUT handler",
    contains(credits, "requireRole(req, ['admin'])"),
    'Admin gate not found in PUT handler');
  check('C03', 'authResult instanceof NextResponse check present',
    contains(credits, 'authResult instanceof NextResponse'),
    'NextResponse check missing');
}

// PAY-02: Ultra-Pro credit check
console.log('\n  PAY-02: Ultra-Pro calls checkAndDeductCredits before generation');
{
  const ultraPro = readFile('app/api/ai/ultra-pro/route.js');
  check('C04', 'checkAndDeductCredits imported in ultra-pro',
    contains(ultraPro, 'checkAndDeductCredits'),
    'checkAndDeductCredits not imported');
  check('C05', "action key is 'ultra-pro'",
    contains(ultraPro, "'ultra-pro'"),
    "ultra-pro action key not found");
  check('C06', '402 returned on credit failure in ultra-pro',
    contains(ultraPro, '402'),
    '402 status not found');
}

// PAY-03: Idempotency
console.log('\n  PAY-03: Idempotency on Razorpay verify and webhook');
{
  const verify = readFile('app/api/payment/verify/route.ts');
  const webhook = readFile('app/api/webhook/razorpay/route.ts');

  check('C07', 'paymentHistory duplicate check in payment/verify',
    contains(verify, 'paymentHistory.paymentId') ||
    contains(verify, "paymentHistory"),
    'Duplicate payment check not found in verify route');
  check('C08', 'Already processed returns 200 in verify route',
    contains(verify, 'Payment already processed'),
    'Already processed 200 response not found');
  check('C09', 'paymentHistory duplicate check in webhook',
    contains(webhook, 'paymentHistory.paymentId') ||
    contains(webhook, 'alreadyProcessed'),
    'Duplicate payment check not found in webhook');
}

// PAY-04: Booking webhook safety net
console.log('\n  PAY-04: Booking webhook safety net');
{
  const webhook = readFile('app/api/webhook/razorpay/route.ts');
  check('C10', 'bookingId check in webhook handler',
    contains(webhook, 'bookingId'),
    'bookingId handling not found in webhook');
  check('C11', 'handleBookingPaymentCaptured function exists',
    contains(webhook, 'handleBookingPaymentCaptured') ||
    contains(webhook, 'BookingPaymentCaptured'),
    'Booking payment capture handler not found');
  check('C12', 'pending_designer status set in booking webhook',
    contains(webhook, 'pending_designer'),
    'pending_designer status not found in webhook');
}

// PAY-05+06: Timing-safe and amount validation
console.log('\n  PAY-05+06: timingSafeEqual and amount validation in booking verify');
{
  const bookingVerify = readFile('app/api/bookings/[id]/payment-verify/route.ts');
  check('C13', 'crypto imported in booking verify',
    contains(bookingVerify, "import crypto") ||
    contains(bookingVerify, "require('crypto')"),
    'crypto module not imported');
  check('C14', 'timingSafeEqual used in booking verify',
    contains(bookingVerify, 'timingSafeEqual'),
    'timingSafeEqual not used - vulnerable to timing attacks');
  check('C15', 'Buffer length check before timingSafeEqual',
    contains(bookingVerify, '.length') && contains(bookingVerify, 'timingSafeEqual'),
    'Length check before timingSafeEqual not found');
  check('C16', 'Razorpay payments.fetch called for amount validation',
    contains(bookingVerify, 'payments.fetch'),
    'Amount validation via Razorpay API not found');
  check('C17', '400 returned on amount mismatch',
    contains(bookingVerify, 'Payment amount does not match') ||
    contains(bookingVerify, 'amount mismatch'),
    'Amount mismatch 400 response not found');
  check('C18', '502 returned on Razorpay API failure',
    contains(bookingVerify, '502'),
    '502 fallback for Razorpay API failure not found');
}

// ─── SESSION 4: DATABASE & MODELS ────────────────────────────────────────────

section('SESSION 4 — Database & Models');

console.log('\n  DB-01: src/models/Project.js renamed to AIRun.js');
{
  // Project.js must NOT exist
  check('D01', 'src/models/Project.js does NOT exist',
    !fileExists('src/models/Project.js'),
    'src/models/Project.js still exists - model collision risk');

  // AIRun.js must exist and be correct
  const aiRun = readFile('src/models/AIRun.js');
  check('D02', 'src/models/AIRun.js exists',
    aiRun !== null,
    'src/models/AIRun.js not found');
  check('D03', "AIRun model name is 'AIRun' not 'Project'",
    contains(aiRun, "'AIRun'") || contains(aiRun, '"AIRun"'),
    'Model name is not AIRun');
  check('D04', "AIRun uses 'projects' collection",
    contains(aiRun, "'projects'") || contains(aiRun, '"projects"'),
    'Collection name projects not found in AIRun.js');
  check('D05', 'AIRun uses safe mongoose.models guard',
    contains(aiRun, 'mongoose.models.AIRun'),
    'Safe guard pattern not found');
  check('D06', 'No delete mongoose.models in AIRun.js',
    notContains(aiRun, 'delete mongoose.models'),
    'Dangerous delete mongoose.models found in AIRun.js');

  // All orchestrators must import AIRun
  const orchestrators = [
    'src/services/roomChangerOrchestrator.js',
    'src/services/ceilingChangerOrchestrator.js',
    'src/services/furnitureRemoverOrchestrator.js',
    'src/services/furniturePlacementOrchestrator.js',
    'src/services/multiRoomOrchestrator.js',
  ];

  for (const orch of orchestrators) {
    const content = readFile(orch);
    const label = path.basename(orch);
    check(`D07-${label}`, `${label} imports AIRun not Project`,
      contains(content, 'AIRun') && notContains(content, "from '../models/Project'"),
      'Still importing from Project instead of AIRun');
  }

  // history route must use AIRun
  const history = readFile('app/api/ai/history/route.ts');
  check('D08', 'history route does not import lib/db/models/Project for AI runs',
    !matchesRegex(history, /from ['"]@\/lib\/db\/models\/Project['"]/),
    'history route still importing from lib/db/models/Project');
  check('D09', 'history route references AIRun',
    contains(history, 'AIRun'),
    'history route does not use AIRun model');
}

// Real Project model intact
console.log('\n  DB: lib/db/models/Project.ts (real user project model) intact');
{
  const project = readFile('lib/db/models/Project.ts');
  check('D10', 'lib/db/models/Project.ts exists',
    project !== null,
    'Real Project model file missing');
  check('D11', "Real Project model name is 'Project'",
    contains(project, "'Project'") || contains(project, '"Project"'),
    'Real Project model name changed');
  check('D12', 'renders[] field in real Project model',
    contains(project, 'renders'),
    'renders field missing from real Project model');
  check('D13', 'isFavorite field in real Project model',
    contains(project, 'isFavorite'),
    'isFavorite field missing from real Project model');
  check('D14', 'isArchived field in real Project model',
    contains(project, 'isArchived'),
    'isArchived field missing from real Project model');
}

// ─── REGRESSION CHECKS ───────────────────────────────────────────────────────

section('REGRESSION CHECKS — Nothing Accidentally Broken');

console.log('\n  Auth routes unchanged');
{
  const login = readFile('app/api/auth/login/route.ts');
  const signup = readFile('app/api/auth/signup/route.ts');

  check('R01', 'Login route still has rateLimiters.auth(ip)',
    contains(login, 'rateLimiters.auth(ip)') ||
    contains(login, 'rateLimiters'),
    'Rate limiting removed from login route');
  check('R02', 'Login route still has bcrypt.compare',
    contains(login, 'bcrypt.compare'),
    'bcrypt.compare removed from login route');
  check('R03', 'Login route has no requireRole (must stay public)',
    notContains(login, 'requireRole'),
    'requireRole accidentally added to login route');
  check('R04', 'Signup route still has rate limiting',
    contains(signup, 'rateLimiters'),
    'Rate limiting removed from signup route');
  check('R05', 'Signup route has no getCurrentUser guard (must stay public)',
    notContains(signup, 'if (!authUser)') || !contains(signup, 'requireRole'),
    'Auth gate accidentally added to signup route');
}

console.log('\n  GPU mode router intact');
{
  const router = readFile('lib/ai/gpu-mode-router.ts');
  check('R06', 'getActiveComfyBaseUrl exported from gpu-mode-router',
    contains(router, 'getActiveComfyBaseUrl'),
    'getActiveComfyBaseUrl removed from gpu-mode-router');
  check('R07', 'getGPUMode exported from gpu-mode-router',
    contains(router, 'getGPUMode'),
    'getGPUMode removed from gpu-mode-router');
  check('R08', 'pingComfyUI still in gpu-mode-router',
    contains(router, 'pingComfyUI'),
    'pingComfyUI removed from gpu-mode-router');
}

console.log('\n  ComfyUI bridge intact');
{
  const bridge = readFile('lib/ai/comfyui-bridge.ts');
  check('R09', 'flushVRAM still in comfyui-bridge',
    contains(bridge, 'flushVRAM'),
    'flushVRAM removed from comfyui-bridge');
  check('R10', 'generateMultiStage still in comfyui-bridge',
    contains(bridge, 'generateMultiStage') || contains(bridge, 'MultiStage'),
    'generateMultiStage removed from comfyui-bridge');
}

console.log('\n  Queue system intact');
{
  const queue = readFile('lib/ai/queuedGeneration.ts');
  check('R11', 'enqueueGeneration still in queuedGeneration',
    contains(queue, 'enqueueGeneration'),
    'enqueueGeneration removed');
  check('R12', 'Redis fallback still in queuedGeneration',
    contains(queue, 'ECONNREFUSED') || contains(queue, 'fallback'),
    'Redis fallback removed from queuedGeneration');
}

console.log('\n  Projects API uses correct model');
{
  const projectsRoute = readFile('app/api/projects/route.ts');
  check('R13', 'app/api/projects/route.ts imports from lib/db/models/Project',
    contains(projectsRoute, 'lib/db/models/Project') ||
    contains(projectsRoute, '@/lib/db/models/Project'),
    'Projects route not using the real Project model');
}

// ─── GLOBAL GREP CHECKS ──────────────────────────────────────────────────────

section('GLOBAL GREP SAFETY CHECKS');

console.log('\n  Scanning entire codebase for known-bad patterns...\n');

{
  // Must not exist anywhere
  const fallbackSecret = grep('change-me-in-production');
  check('G01', 'No change-me-in-production anywhere in codebase',
    fallbackSecret === '',
    `Found in:\n${fallbackSecret}`);

  // src/models/Project imports (must be zero outside lib/db)
  const projectImports = grep('from.*models/Project')
    .split('\n')
    .filter(l => l.trim())
    .filter(l => !l.includes('lib/db/models/Project'))
    .filter(l => !l.includes('node_modules'));
  check('G02', 'No imports of src/models/Project anywhere',
    projectImports.length === 0,
    `Found:\n${projectImports.join('\n')}`);

  // delete mongoose.models must not be in AIRun.js specifically
  const dangerousDelete = grep('delete mongoose\\.models')
    .split('\n')
    .filter(l => l.includes('AIRun'));
  check('G03', 'No delete mongoose.models in AIRun.js',
    dangerousDelete.length === 0,
    `Found dangerous delete in:\n${dangerousDelete.join('\n')}`);

  // Warn about other files with delete mongoose.models (known debt)
  const allDangerousDeletes = grep('delete mongoose\\.models')
    .split('\n')
    .filter(l => l.trim())
    .filter(l => !l.includes('AIRun'));
  if (allDangerousDeletes.length > 0) {
    warn('G04',
      `${allDangerousDeletes.length} other model files still use delete mongoose.models (known debt)`,
      allDangerousDeletes.join('\n'));
  }

  // Warn about hardcoded ComfyUI URLs in non-audited files
  const hardcodedUrls = grep('127\\.0\\.0\\.1:8188')
    .split('\n')
    .filter(l => l.trim())
    .filter(l => !l.includes('node_modules'))
    .filter(l => !l.includes('.env'));
  if (hardcodedUrls.length > 0) {
    warn('G05',
      `${hardcodedUrls.length} hardcoded ComfyUI URLs remain (some may be in non-audited files)`,
      hardcodedUrls.slice(0, 5).join('\n') + (hardcodedUrls.length > 5 ? `\n  ...and ${hardcodedUrls.length - 5} more` : ''));
  }

  // test-user-123 bypass must not exist
  const testUserBypass = grep('test-user-123');
  check('G06', 'No test-user-123 bypass in codebase',
    testUserBypass === '',
    `Found test bypass:\n${testUserBypass}`);
}

// ─── FINAL REPORT ─────────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(60));
console.log('  FINAL VERIFICATION REPORT');
console.log('═'.repeat(60));
console.log(`\n  Total checks run:  ${results.pass + results.fail}`);
console.log(`  ✅ Passed:         ${results.pass}`);
console.log(`  ❌ Failed:         ${results.fail}`);
console.log(`  ⚠️  Warnings:       ${results.warn}`);

if (results.failures.length > 0) {
  console.log('\n' + '─'.repeat(60));
  console.log('  FAILURES — FIX THESE BEFORE DEPLOYING');
  console.log('─'.repeat(60));
  for (const f of results.failures) {
    console.log(`\n  ❌ [${f.id}] ${f.description}`);
    if (f.evidence) console.log(`     Evidence: ${f.evidence}`);
  }
}

if (results.warn > 0) {
  console.log('\n  (Warnings are known technical debt — not blocking)');
}

console.log('\n' + '─'.repeat(60));

if (results.fail === 0) {
  console.log('\n  ✅ ALL CHECKS PASSED — SAFE TO DEPLOY\n');
  process.exit(0);
} else {
  console.log(`\n  ❌ ${results.fail} CHECKS FAILED — DO NOT DEPLOY UNTIL FIXED\n`);
  process.exit(1);
}
