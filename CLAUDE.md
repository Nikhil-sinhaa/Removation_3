# Removation — Project Context for Claude Code

## What This Project Is

Removation is a Next.js 15 SaaS platform for AI-powered interior design with a professional
marketplace. Users upload room photos and apply AI transformations (change wall colors, remove
furniture, redesign rooms, change ceilings, generate 3D walkthroughs, apply IC-Light lighting,
style transfer). The platform also connects customers with verified designers, contractors, and
vendors via a booking/payment system.

Backend orchestrates ComfyUI workflows (SDXL + IC-Light + segmentation + inpainting) on a
local or cloud GPU, with optional cloud AI fallback via Replicate and fal.ai.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 App Router, React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Next.js API routes (Node.js) |
| Database | MongoDB via Mongoose |
| Auth | Custom JWT (HTTP-only cookie `auth_token`) — NOT Clerk |
| Payments | Razorpay (primary INR) + Stripe (USD) |
| AI Local | ComfyUI via HTTP + WebSocket (`src/services/comfyBridge.js`) |
| AI Cloud | Replicate (`lib/ai/replicate.ts`) + fal.ai (`lib/ai/fal-adapter.ts`) |
| Real-time | Pusher Channels (chat/notifications) + Socket.IO (AI progress) |
| Storage | UploadThing (user uploads) + local `public/renders/` (AI outputs) |
| Cache/Queue | Redis via ioredis + Redlock distributed locking |
| Email | Resend (`lib/email.ts`) |
| LLM | Groq (`lib/ai/groq.ts`) |
| Analytics | PostHog (`posthog-js`) |
| GPU Local | RTX 4060 8GB at localhost:8188 |
| GPU Cloud | Google Colab T4 15GB via Cloudflare tunnel |
| i18n | Custom hook (`hooks/useLanguage.ts`) — Hindi + English |

---

## Authentication System (Fully Custom — Not Clerk)

### How It Works

1. User signs up or logs in via `/api/auth/signup` or `/api/auth/login`
2. Server issues an HTTP-only JWT cookie named `auth_token`
3. All API routes read this cookie via `getCurrentUser()` from `lib/auth/jwt.ts`
4. `AuthProvider.tsx` calls `/api/auth/me` on load to get the session
5. Google OAuth is available at `app/api/auth/google/` (state JWT + CSRF protection)

### The clerkId Field (Critical)

The `User` schema has a `clerkId` field that 20+ API routes still use
to query: `User.findOne({ clerkId: userId })`.

**The fix:** Pre-save hook sets `clerkId = _id.toString()` if not present.
`mongodb.ts` runs a one-time async migration on connection to backfill legacy users.

**In general application/AI code, prefer `User.findOne({ clerkId: userId })` over `findById(userId)`.**
This handles legacy Clerk users whose `clerkId` differs from `_id`.
Exception: `requireRole` internally uses `User.findById(authUser.id)` — correct because
the JWT always contains the MongoDB `_id` directly.

### Role-Based Access

Roles: `customer | designer | contractor | vendor | admin`
Guard: `requireRole(req, ['role1', 'role2'])` in every protected route.

### Auth Files

- `app/(auth)/sign-in/page.tsx` — login page
- `app/(auth)/sign-up/page.tsx` — signup page
- `app/(auth)/forgot-password/page.tsx` — forgot password
- `app/(auth)/reset-password/page.tsx` — reset password
- `app/(auth)/verify-otp/page.tsx` — OTP verification
- `app/api/auth/` — all auth API routes
- `lib/auth/jwt.ts` — `getCurrentUser()`, `issueJwt()`
- `lib/auth/requireRole.ts` — role guard for API routes
- `lib/auth/safeRedirect.ts` — OAuth redirect protection
- `middleware.ts` — route protection (respects SKIP_AUTH flag)
- `components/providers/AuthProvider.tsx` — session context

### Layout

All auth pages inherit from `AuthLayout` — a split-screen layout.
Do NOT add extra wrapper divs, border cards, or centering blocks
inside auth pages. They already inherit the parent container.

### Development Mode

Do NOT use `NEXT_PUBLIC_SKIP_AUTH=true` or `SKIP_AUTH=true` unless
explicitly needed to bypass auth. Leave OFF in normal dev.

---

## GPU Mode System

ComfyUI can run locally or on Google Colab. The system auto-switches.

### Three Modes (set in Dashboard → Settings → GPU)

| Mode | Behavior |
|------|---------|
| `local` | Always use localhost:8188 (RTX 4060 8GB) |
| `auto` | Try cloud first (3s ping), fall back to local |
| `cloud` | Always use Colab tunnel URL, error if unavailable |

### Key Env Vars

```bash
COMFYUI_ENABLED=true        # set to false to skip WebSocket on Vercel/serverless
COMFY_URL=http://127.0.0.1:8188  # override default local URL
COMFY_OUTPUT=/home/nikhil/Documents/Remo2/ComfyUI/output  # where ComfyUI saves files
```

### How It Works

`comfyBridge.js` calls `resolveComfyURL()` before every request. Reads GPU mode from
MongoDB (`AppSettings` collection via `src/lib/appSettings.ts`). Never hardcode ComfyUI URLs.

### Colab Setup

Notebook: `scripts/RemovationColab.ipynb`
- Mounts Google Drive (models stored there — no re-download)
- Starts ComfyUI with `--listen 0.0.0.0`
- Creates Cloudflare tunnel → paste URL in Dashboard → Settings → GPU

### ComfyUI Launch Flags (production)

```bash
python3 main.py \
  --listen 0.0.0.0 \
  --port 8188 \
  --preview-method taesd \
  --lowvram \
  --fp8_e4m3fn-unet
```

Launch scripts: `start-comfyui.sh`, `start-all.sh`

---

## Most Important File

`src/services/comfyBridge.js` — the unified ComfyUI bridge.

**Always use it. Never make raw fetch calls to ComfyUI.**

It handles:
- `/prompt` dispatch
- WebSocket events (`executing`, `progress`, `executed`, `execution_error`)
- `/history/{promptId}` polling fallback
- VRAM flush between stages
- GPU mode switching via `resolveComfyURL()`
- Per-user file namespacing

Key methods:
- `_flushVRAM()` — `POST /free` with `unload_models:true`, `free_memory:true`, then `1000ms` sleep.
  Always add `4000ms` additional sleep after it when switching between heavy models.
- `getComfyRestUrl()` — returns current active URL (local or cloud)

---

## AI Features — All Follow This Pattern

```
src/workflows/<Feature>.json              ← ComfyUI GUI format workflow
src/services/<feature>Orchestrator.js     ← loads, converts, injects, dispatches
app/api/ai/<feature>/generate/route.js   ← auth, validate, fire-and-forget
app/(app)/<feature>/page.tsx             ← UI with before/after slider
src/models/<Feature>Run.js               ← feature-specific MongoDB schema
```

### Step-by-Step for New Features

1. Confirm workflow JSON in `src/workflows/` works in ComfyUI
2. Read `roomChangerOrchestrator.js` — canonical orchestrator template
3. Read `app/api/ai/room-changer/generate/route.js` — canonical API route
4. Read `app/(app)/room-changer/page.tsx` — canonical page
5. Propose file list — wait for confirmation before writing code
6. Implement: orchestrator → API route → page (type-check between each)
7. Add `processingType` to `src/models/AIRun.js` enum
8. Add `processingType` to `ALLOWED_PROCESSING_TYPES` in `app/api/ai/history/route.ts`
9. Add description branch in `buildDescription()` in history route

### Orchestrator Template (Critical Points)

```javascript
// 1. Load workflow (GUI format)
const guiGraph = JSON.parse(fs.readFileSync(workflowPath));

// 2. Convert to API format
const apiGraph = guiToApiGraph(guiGraph);

// 3. Inject user inputs into specific node IDs
apiGraph['54'].inputs.image = comfyFilename;
apiGraph['40'].inputs.seed  = Math.floor(Math.random() * 2**32);

// 4. Dispatch via comfyBridge (never raw fetch)
// Progress events are emitted internally by comfyBridge's WebSocket handler.
// Newer orchestrators accept an optional emitProgress callback:
//   emitProgress?.({ step: 'starting', label: preset });
const result = await comfyBridge.submitAndWait(apiGraph);

// 5. Persist to MongoDB
// AIRun is the tracking document (created in the API route, updated here).
// There is no src/models/Project.js — do NOT call Project.create().
await AIRun.findByIdAndUpdate(projectId, { status: 'completed', resultImage: url });
await FeatureRun.create({ projectId, userId, ... });
```

**Do NOT add `io.emit(...)` in orchestrators.** comfyBridge.js emits Socket.IO
progress events internally. Orchestrators must not import or reference `io` or `socket`.

### Workflow Conversion

GUI format (`nodes[]`, `links[]`, `groups[]`) → API format at runtime via `comfyWorkflowConverter.js`.
**Never feed GUI format directly to `/prompt`.** It silently fails.

`WIDGET_NAMES` must match installed custom node `INPUT_TYPES`. If you see `required_input_missing`,
the WIDGET_NAMES are out of sync.

---

## Implemented AI Features

| Feature | Orchestrator | Workflow(s) | processingType |
|---------|-------------|-------------|----------------|
| Room Changer | `roomChangerOrchestrator.js` | Stage1_SceneUnderstanding + Stage3_WhiteWalls_Inpaint | `room-changer` |
| Ceiling Changer | `ceilingChangerOrchestrator.js` | Stage_CeilingDetect + Stage_CeilingInpaint | `ceiling-changer` |
| Furniture Remover | `furnitureRemoverOrchestrator.js` | `combinedremovernew.json` | `furniture-remover` |
| Furniture Placement | `furniturePlacementOrchestrator.js` | `Stage_FurniturePlace.json` | `furniture-placement` |
| Multi-Room 3D | `multiRoomOrchestrator.js` | Room Changer × N + Marble API | `multi-room-3d` |
| Lighting (IC-Light) | `lightingOrchestrator.js` | `src/workflows/lighting/0*.json` (8 workflows) | `lighting` |
| Style Transfer | `styleTransferOrchestrator.js` | `redesignff.json` | `tool-style-transfer` |
| Vastu Detection | `vastuDetectionOrchestrator.js` | `vastuDetectionBuilder.js` (8-pass SAM2) | *(jobs queue)* |

**Full processingType enum** (in `src/models/AIRun.js`):
`'redesign'`, `'object_removal'`, `'recolor'`, `'ultra-pro'`, `'room-changer'`,
`'furniture-remover'`, `'ceiling-changer'`, `'floor-plan'`, `'multi-room-3d'`,
`'furniture-placement'`, `'lighting'`, `'tool-style-transfer'`

### Lighting (IC-Light) — Key Details

Orchestrator: `src/services/lightingOrchestrator.js`
Workflows: `src/workflows/lighting/` — 8 JSON files:
- `01_ic_light_static_circle.json` — single circular light source
- `02_ic_light_static_gradient.json` — gradient light
- `03_ic_light_animated_circle.json` — animated circle (GIF output)
- `04_ic_light_animated_gradient.json` — animated gradient
- `05_ic_light_animated_multilight.json` — multi-source animation
- `06_ic_light_fbc_background.json` — background illumination
- `07_ic_light_normals_4dir.json` — 4-directional normals
- `08_ic_light_simple_4dir.json` — simplified 4-direction

Preset config in `lightingOrchestrator.js` (`LIGHTING_PRESETS`):
- `night_lamp`, `dim_evening`, and others
- Each preset defines: `shape`, `spread`, `softness`, `invertLight`, `intensity`,
  `icMultiplier`, `denoise`, `cfg`, `steps`, `frames`, `prompt`

MongoDB model: `src/models/LightingRun.js`

### Style Transfer — Key Details

Orchestrator: `src/services/styleTransferOrchestrator.js`
Workflow: `src/workflows/redesignff.json` (IPAdapter high-weight + double ControlNet)
Presets config: `src/config/transferPresetsData.js` + `src/config/transferPresets.js`

Data flow:
- Node 1, 6: LoadImage → room photo (uploaded file)
- Node 17: LoadImage → style reference image
- Node 11: EmptyLatentImage → dynamic aspect resolution (`resolution-helper.js`)
- Node 12: CLIPTextEncode → positive prompt from preset
- Node 13: CLIPTextEncode → negative prompt
- Node 14: KSampler → randomized seed

MongoDB model: `src/models/StyleTransferRun.js`
processingType: `tool-style-transfer`

### Furniture Remover — Key Details

Uses `combinedremovernew.json`:
- RMBG (INSPYRENET) detects salient foreground
- CLIPSeg + SAM2 detects named furniture by text
- MaskComposite combines both masks
- MinimaxImageRemover runs diffusion removal
- LaMa cleans up edges

Two modes:
- Auto: full CLIPSeg + MiniMax + LaMa pipeline
- Manual: user paints mask → LaMa only (fast, ~3s)

Manual brush canvas exports red pixels. Convert: red dominant + alpha > 10 → white; rest → black.

Node injection points in `combinedremovernew.json`:
- Node 54: LoadImage → room image
- Node 40: MinimaxImageRemover → randomize seed
- Node 81: CLIPSegDetectorProvider → furniture text prompt (keep as-is)

### Furniture Placement — Key Details (V2 — current)

```
User uploads room photo + furniture photo
        ↓
upload-room → saves room to ComfyUI/input/
remove-bg   → inline RMBG workflow, ~5s, ~600MB VRAM
        ↓
Frontend shows Fabric.js canvas:
  - Room photo as background
  - Furniture (bg removed) as draggable/scalable/rotatable
        ↓
User positions furniture → "Place It"
composite → Stage_FurniturePlace.json injected with positions
  - ImageScale furniture to furW×furH
  - ImageCompositeMasked at roomX, roomY
  - SaveImage → furniture-place/result
```

API routes: `upload-room`, `remove-bg`, `composite` under `/api/ai/furniture-placement/`
Workflow: `src/workflows/Stage_FurniturePlace.json`

Canvas → image coordinate scaling:
- Canvas: 800×500, Room (after upscale): 1024×768
- scaleX = 1024/800 = 1.28, scaleY = 768/500 = 1.536
- Fabric originX/Y = 'center': top-left = (left - dispW/2, top - dispH/2)

WIDGET_NAMES added in `comfyWorkflowConverter.js`:
- `MaskToImage`: []
- `ImageCompositeMasked`: ['x', 'y', 'resize_source']
- `VAEDecode`: [], `VAEEncode`: [], `VAEEncodeForInpaint`: ['grow_mask_by']

### Multi-Room 3D — Key Details

1. User uploads 6-15 photos + picks color
2. Room Changer runs on each photo sequentially (VRAM safety)
3. Painted photos uploaded to Marble API (max 8)
4. Marble generates explorable 3D world (~5 min)
5. Returns `marble.worldlabs.ai/world/{id}` URL

MongoDB model: `src/models/MultiRoomProject.js`
Services: `marbleService.js`, `multiRoomOrchestrator.js`
Cost: ~$1.20 per generation (Marble credits)

---

## Saving User Uploads to ComfyUI

Always use `lib/ai/save-image-for-comfy.ts`.

Never bypass it. It handles:
- Resize/upscale to SDXL range (1024 longest side, never below 768)
- Re-encode to PNG (lossless)
- Cloud vs local upload routing

---

## MongoDB Models

### AI / Feature Run Models (`src/models/`)

| Model | File | Purpose |
|-------|------|---------|
| AIRun | `src/models/AIRun.js` | **Parent schema** — all AI runs share this, contains `processingType` enum |
| RoomChangerRun | `src/models/RoomChangerRun.js` | Room changer history |
| CeilingChangerRun | `src/models/CeilingChangerRun.js` | Ceiling changer history |
| LightingRun | `src/models/LightingRun.js` | IC-Light history |
| StyleTransferRun | `src/models/StyleTransferRun.js` | Style transfer history |
| FurniturePlacementRun | `src/models/FurniturePlacementRun.js` | Furniture placement history |
| FurnitureRemoverRun | `src/models/FurnitureRemoverRun.js` | Furniture remover history |
| MultiRoomProject | `src/models/MultiRoomProject.js` | Multi-room 3D projects |
| FloorPlanProject | `src/models/FloorPlanProject.js` | Floor plan projects |
| AppSettings | `src/models/AppSettings.js` | GPU mode, cloud URL, app config |

**processingType lives in `AIRun.js`**, not in `Project.ts`.
When adding a new feature, add its processingType to the enum in `AIRun.js` AND
to `ALLOWED_PROCESSING_TYPES` in `app/api/ai/history/route.ts`.

### Domain Models (`lib/db/models/`)

| Model | Purpose |
|-------|---------|
| `User.ts` | Auth users (clerkId = _id), credits, subscription, roles |
| `Project.ts` | User projects (simple: userId, name, renders[], tags) |
| `Render.ts` | Individual AI render records linked to Project |
| `Subscription.ts` | Razorpay/Stripe subscription records |
| `AdminConfig.ts` | Key-value config store (app_mode, credit_costs) |
| `Designer.ts` | Designer profiles — portfolio, specialties, pricing, averageRating, isVerified |
| `Contractor.ts` | Contractor profiles — serviceCategories, serviceRadius, pricing, isVerified |
| `Vendor.ts` | Vendor profiles — businessType, address |
| `Booking.ts` | Booking records — 6-state machine (see below) |
| `VendorInquiry.ts` | Customer inquiries to vendors |
| `Review.ts` | Rating + designer reply |
| `Message.ts` | Booking chat messages (Pusher real-time) |
| `ChatMessage.ts` | General chat |
| `Notification.ts` | In-app notifications |
| `WorkflowState.ts` / `WorkflowEvent.ts` / `WorkflowTransition.ts` | Workflow engine state |
| `GpuJob.ts` | GPU job queue records |
| `AuditLog.ts` | Admin audit trail |
| `Announcement.ts` / `DismissedAnnouncement.ts` | In-app announcements |
| `Tour.ts` / `TourProgress.ts` | Product tour tracking |
| `Tag.ts` / `Tagging.ts` | Content tagging system |
| `ScheduledTask.ts` | Cron/scheduler task definitions |
| `Snapshot.ts` | Versioned snapshots |
| `Redirect.ts` / `NotFoundLog.ts` | Redirect management and 404 logging |
| `PrivacyRequest.ts` | DPDPA data deletion/export requests |

---

## Booking System

### State Machine (6 states)

```
pending_payment → pending_designer → confirmed → completed
                ↘ rejected              (designer rejects — refund issued)
                ↘ cancelled_by_customer (customer cancels before accept — refund issued)
                ↘ expired               (designer didn't respond in 48h — refund issued)
```

### Key Files

- `lib/db/models/Booking.ts` — schema + BookingStatus type
- `lib/booking/refund.ts` — `issueBookingRefund()` — never throws, returns discriminated union
- `lib/booking/expiry.ts` — handles expired bookings
- `lib/booking/money.ts` — amount/currency helpers
- `lib/booking/validators.ts` — booking validation
- `lib/workflow/engine.ts` — `executeTransition()` — workflow state machine
- `lib/workflow/defaultWorkflow.ts` — default transition definitions

### Booking API Routes

- `POST /api/bookings` — create booking (creates Razorpay order)
- `GET /api/bookings/me` — customer's bookings
- `POST /api/bookings/[id]/payment-verify` — HMAC verify + amount check → pending_designer
- `POST /api/bookings/[id]/cancel` — customer cancels → refund
- `POST /api/bookings/[id]/reject` — designer rejects → refund
- `GET/PATCH /api/bookings/[id]` — read/update booking
- `GET /api/designer/bookings` — designer's incoming queue
- `GET /api/contractor/bookings` — contractor's incoming queue

### Razorpay Webhook

Handler: `app/api/webhook/razorpay/route.ts` (canonical — singular path)
- Uses `req.text()` before any parsing — required for HMAC
- Handles: `payment.captured`, `payment.failed`, `subscription.*`, `order.paid`
- `payment.captured` with `notes.bookingId` → safety net for dropped browser sessions
- Idempotency checked via `paymentHistory.paymentId` lookup before credit grants
- `/api/webhooks/razorpay` (plural) is a 307 redirect to the singular canonical

**Razorpay signature formats:**
- One-time payment: `HMAC-SHA256(orderId + "|" + paymentId, KEY_SECRET)`
- Subscription: `HMAC-SHA256(paymentId + "|" + subscriptionId, KEY_SECRET)`
- Webhook: `HMAC-SHA256(rawBody, WEBHOOK_SECRET)`

**Critical:** After signature verification in `payment-verify`, the route fetches the payment
from Razorpay API and checks `paymentDetails.amount === booking.amount`. Never skip this.

---

## Marketplace (Designers, Contractors, Vendors)

### Listing APIs

- `GET /api/designers` — list verified designers with filters
- `GET /api/designers/match` — AI-matched designers for user's brief
- `GET /api/designers/[id]` — designer profile
- `GET /api/contractors`, `GET /api/contractors/[id]` — same pattern
- `GET /api/vendors`, `GET /api/vendors/[id]` — same pattern

### Registration APIs

- `POST /api/designer/register` — apply as designer
- `POST /api/contractor/register` — apply as contractor
- `POST /api/vendor/register` — register as vendor
- `GET /api/designer/me`, `GET /api/contractor/me`, `GET /api/vendor/me` — own profile

### Admin Verification

- `POST /api/admin/designers/[id]/verify` — approve/reject designer
- `POST /api/admin/contractors/[id]/verify` — approve/reject contractor
- `POST /api/admin/vendors/[id]/verify` — approve/reject vendor

---

## Dashboard Layout

`app/(app)/layout.tsx` shows live credits, animated progress bar, and dynamic plan name
from auth context. Do NOT hardcode credits, plan names, or user data in the layout.

---

## Critical Rules

### userId is NEVER null

Every AI route must call `getCurrentUser()` and use `authUser?.id`.
The ghost ID `000000000000000000000000` must never appear in production code.

### Credit System

- Dev mode: no credits deducted (checks `AdminConfig.app_mode` via Redis-cached config)
- Production: call `checkAndDeductCredits(userId, toolName, options?)` from `lib/ai/deductCredits.ts`
- Returns a `DeductionResult` — check `.success` and return 402 `{ error: 'insufficient_credits' }` if false
- Atomic deduction: increments `subscription.creditsUsed` AND decrements root `credits` field simultaneously
- Onboarding bypass: pass `{ source: 'onboarding' }` for first-render-free during onboarding
- Blocked statuses: canceled/past_due/halted/unpaid subscriptions on paid plans are blocked (free plan is not)

### Redis Patterns

- Always use `getRedisClient()` singleton — never `new Redis()` directly
- `lib/redis/lock.ts` — Redlock distributed locking
- `lib/redis/cache.ts` — cache helpers
- `lib/redis/rateLimit.ts` — sliding window rate limiting
- `lib/redis/aiQueue.ts` — AI job queue
- Cache keys: `cache:*`, lock: `lock:*`, queue: `queue:*`, rate limit: `ratelimit:*`

**Render lock — always use `tryAcquireRenderLock`, not `acquireRenderLock` or `withLock`:**
```typescript
// Returns Lock | null immediately. If null → user already has a render running → return 429.
const renderLock = await tryAcquireRenderLock(userId, 'tool-name', 180000 /* ttlMs */);
if (!renderLock) {
  return NextResponse.json({ error: 'render_in_progress', ... }, { status: 429 });
}
// ... do work ...
await renderLock.release();
```
`acquireRenderLock` (blocking) and `withLock` exist in the file but are NOT used in
production AI routes. Do not introduce them for new features.

### Stripe

Use `getStripe()` lazy initializer — never top-level `new Stripe()`.
Returns null if key missing — fail gracefully.

---

## Hard-Won Lessons — Do Not Re-Learn

### 1. Two ComfyUI formats — GUI and API
GUI = what ComfyUI Manager exports (`nodes[]`, `links[]`).
API = what `/prompt` accepts (flat `{nodeId: {class_type, inputs}}`).
`guiToApiGraph` converts between them. Never skip this.

### 2. SDXL needs ≥768px input
Feed SDXL a 525×350 thumbnail → oversaturation, warped geometry.
`save-image-for-comfy.ts` upscales automatically. Never bypass it.

### 3. No hex codes in SDXL prompts
`#9CAF88` in a prompt injects noise — CLIP tokenizes it as junk.
Use color names only: `"sky blue"`, not `"#87CEEB"`.

### 4. SDXL prompt weights max 1.4
`(text:1.8)` with CFG 9.5 overshoots. Keep weights at 1.3–1.4 max.

### 5. ComfyUI lies about completion
Reports success even if only 1 of 5 SaveImage nodes produced output.
Always count expected outputs vs actual. comfyBridge.js handles this — don't regress it.

### 6. CLIPSeg threshold for ceilings
Threshold 0.4 is too strict. Use 0.25 for ceiling detection.
Coverage guard: throw error if mask covers <8% of image.

### 7. ComfyUI-SAM2 is ENABLED — no SAMLoader conflict
ComfyUI-SAM2 registers as `'SAM2ModelLoader (segment anything2)'` etc. — no collision with
Impact Pack's `SAMLoader`. Only duplicate is `IsMaskEmpty` — benign, last-load-wins.
Required for `vastuDetectionOrchestrator.js`. Do not disable unless a real conflict appears in logs.

### 8. ControlNet Aux depth model path
`depth_anything_v2_vits.pth` must be at:
`custom_nodes/comfyui_controlnet_aux/ckpts/depth_anything_v2_vits.pth`
Subdirectories break it. Use a symlink if needed.

### 9. Wall mask coverage guard
If wall mask covers <15% of image → throw `WALL_MASK_INSUFFICIENT_COVERAGE`.
Apply this pattern to any new auto-segmentation feature.

### 10. Mask and image must have identical dimensions
1px difference → edge fringe artifacts from SDXL.
Always use the same upload pipeline for both.

### 11. MiniMax needs 40 inference steps minimum
Using 20 steps gives incomplete removal. Keep at 40.

### 12. Manual brush canvas red pixels
Brush paints red. Before sending to LaMa/MiniMax:
red channel dominant + alpha > 10 → white; rest → black.

### 13. GrowMask for coverage expansion
When RMBG mask misses nearby objects, add GrowMask (expand: 12-25, tapered_corners: true)
after RMBG MASK output before MinimaxImageRemover.

### 14. Fabric.js coordinates need scaling back to image space
Canvas: 800×500. Scale x/y back to real image dimensions before backend composite.
```
real_x = canvas_x * (room_image_width / canvas_width)
real_y = canvas_y * (room_image_height / canvas_height)
```

### 15. ComfyUI does not support --medvram
Only accepts: --gpu-only, --highvram, --normalvram, --lowvram, --novram, --cpu
`--medvram` causes startup crash. This project uses `--lowvram --fp8_e4m3fn-unet`.

### 16. VAEDecodeTiled requires ALL 4 parameters
When swapping VAEDecode → VAEDecodeTiled at runtime:
```
tile_size: 512, overlap: 64, temporal_size: 64, temporal_overlap: 8
```
Missing any one = silent validation failure.

### 17. VRAM flush needs 4 seconds settle time
`_flushVRAM()` waits only 1000ms — not enough on RTX 4060 8GB.
Always add 4000ms additional sleep:
```javascript
await comfyBridge._flushVRAM();
await new Promise(r => setTimeout(r, 4000));
```

### 18. Bypass-tunnel-reminder header for cloud mode
When ComfyUI runs behind Cloudflare tunnel, POST /free needs:
`'bypass-tunnel-reminder': 'true'`
Without it, Cloudflare intercepts the request.

### 19. Razorpay webhook must use req.text()
`app/api/webhook/razorpay/route.ts` uses `const body = await req.text()` before parsing.
HMAC is computed on that raw string. Parsing first (req.json()) destroys signature validity.

### 20. Razorpay amount validation after signature
After HMAC verification in booking payment-verify, always fetch payment from Razorpay
and confirm `paymentDetails.amount === booking.amount`. Signature alone doesn't prove amount.

---

## Known Working Custom Nodes

Location: `~/Documents/Remo2/ComfyUI/custom_nodes/`

- `ComfyUI-Impact-Pack` — SAMLoader, CLIPSegDetectorProvider, ImpactSimpleDetectorSEGS, SegsToCombinedMask
- `comfyui-CLIPSeg` (biegert) — required by CLIPSegDetectorProvider
- `comfyui_controlnet_aux` — DepthAnythingV2Preprocessor
- `comfyui_segment_anything` (storyicon) — GroundingDINO + SAM
- `comfyui-lama-remover` (Layer-norm) — LaMa inpainting
- `ComfyUI-RMBG` v3.0.0 — INSPYRENET, RMBG-2.0, BEN
- `ComfyUI-MiniMax-Remover` — diffusion-based object removal
- `ComfyUI-SAM2` — ENABLED — SAM2ModelLoader, GroundingDinoModelLoader, GroundingDinoSAM2Segment
  (registered with `(segment anything2)` suffix — no collision with Impact Pack's SAMLoader)
  Required for `vastuDetectionOrchestrator.js`.
- IC-Light custom nodes — required by `src/workflows/lighting/` workflows

## Known Working Models

Location: `~/Documents/Remo2/ComfyUI/models/`

| Model | Size | Used By |
|-------|------|---------|
| sd_xl_base_1.0.safetensors | ~7GB | Room Changer, Ceiling Changer, Style Transfer |
| big-lama.pt | ~200MB | Furniture Remover (LaMa) |
| sam_vit_h | ~2.4GB | Impact Pack segmentation |
| sam2_hiera_small.pt | ~180MB | SAM2 in Furniture Remover |
| groundingdino_swint_ogc | ~700MB | GroundingDINO |
| depth_anything_v2_vits.pth | ~100MB | Depth estimation |
| INSPYRENET | ~200MB | RMBG foreground detection |
| RMBG-2.0 | ~200MB | Alternative foreground detection |
| MiniMax (vae + transformer + scheduler) | ~8GB | Furniture Remover |

---

## VRAM Usage

| Stage | Model | Peak VRAM |
|-------|-------|-----------|
| RMBG BGRemove | INSPYRENET | ~576MB |
| SDXL Inpainting | sd_xl_base_1.0 | ~4.5GB |
| MiniMax Removal | MiniMax transformer | ~6-7GB |
| LaMa Inpainting | big-lama.pt | ~500MB |
| Depth Estimation | depth_anything_v2_vits | ~300MB |
| IC-Light | IC-Light model | ~2-3GB |

Rule: Always flush VRAM between any two stages loading different models:
```javascript
await comfyBridge._flushVRAM();
await new Promise(r => setTimeout(r, 4000));
```

---

## Key File Reference

```
# ComfyUI
src/services/comfyBridge.js                   ← ComfyUI client (READ FIRST)
src/lib/comfyWorkflowConverter.js             ← GUI→API converter + WIDGET_NAMES
src/lib/appSettings.ts                        ← GPU mode settings helper

# Canonical AI feature templates
src/services/roomChangerOrchestrator.js       ← canonical orchestrator template
app/api/ai/room-changer/generate/route.js    ← canonical API route
app/(app)/room-changer/page.tsx              ← canonical feature page

# New AI features
src/services/lightingOrchestrator.js          ← IC-Light orchestrator
src/services/styleTransferOrchestrator.js     ← style transfer orchestrator
src/services/vastuDetectionOrchestrator.js    ← vastu detection (SAM2)

# Auth
lib/auth/jwt.ts                               ← getCurrentUser(), issueJwt()
lib/auth/requireRole.ts                       ← role guard for API routes
components/providers/AuthProvider.tsx         ← session context
middleware.ts                                 ← route protection

# AI infrastructure
lib/ai/save-image-for-comfy.ts               ← user upload handler
lib/ai/appMode.ts                            ← dev/prod mode with Redis cache
lib/ai/deductCredits.ts                      ← atomic credit deduction
lib/ai/replicate.ts                          ← Replicate cloud AI
lib/ai/fal-adapter.ts                        ← fal.ai cloud AI
lib/ai/groq.ts                               ← Groq LLM
lib/ai/pipeline-orchestrator.ts             ← pipeline orchestration
lib/ai/queuedGeneration.ts                  ← queued AI jobs

# Payments
app/api/webhook/razorpay/route.ts            ← Razorpay webhook (canonical)
app/api/payment/verify/route.ts              ← payment verification
app/api/bookings/[id]/payment-verify/route.ts ← booking payment verify
lib/booking/refund.ts                        ← Razorpay refund helper

# Booking system
lib/booking/refund.ts                        ← issueBookingRefund()
lib/workflow/engine.ts                       ← executeTransition()
lib/db/models/Booking.ts                     ← booking schema + BookingStatus

# Redis
lib/redis/client.ts                          ← singleton ioredis
lib/redis/lock.ts                            ← Redlock distributed locking
lib/redis/aiQueue.ts                         ← AI job queue

# Database
lib/db/mongodb.ts                            ← DB connection + clerkId migration; exports connectToDatabase (default) and connectDB (alias — used in older JS routes)
lib/db/models/User.ts                        ← user schema (clerkId = _id)
lib/db/models/Project.ts                     ← simple project schema (no processingType)
src/models/AIRun.js                          ← parent AI run schema + processingType enum

# History
app/api/ai/history/route.ts                  ← AI history listing (ALLOWED_PROCESSING_TYPES)

# Email
lib/email.ts                                 ← Resend email (OTP + password reset)

# Configs
src/config/roomChangerPrompts.js             ← prompt config (no hex, ≤1.4)
src/config/asianPaintsPalette.js             ← 50-color Indian paint palette
src/config/transferPresetsData.js            ← style transfer presets

# i18n
hooks/useLanguage.ts                         ← main i18n hook
hooks/i18n/index.ts                          ← merges all translation categories

# Memory management
lib/server/memoryWatchdog.ts                 ← kills server at 90% RAM
instrumentation.ts                           ← starts watchdog on server boot
scripts/predev.cjs                           ← pre-flight checks before npm run dev
start.sh                                     ← recommended dev entry point

# Scripts
scripts/RemovationColab.ipynb               ← Colab GPU notebook
scripts/upload_models_to_drive.sh           ← one-time Drive upload
scripts/composite_furniture.py              ← Python: paste furniture + generate mask
```

---

## App Pages (`app/(app)/`)

| Page | Path | Purpose |
|------|------|---------|
| Dashboard | `/dashboard` | Overview, activity, badges |
| Room Changer | `/room-changer` | SDXL wall color change |
| Ceiling Changer | `/ceiling-changer` | Ceiling color/material |
| Furniture Remover | `/furniture-remover` | Remove objects (MiniMax + LaMa) |
| Furniture Placement | `/furniture-placement` | Place furniture with Fabric.js |
| Lighting | `/lighting` | IC-Light preset lighting |
| Style Transfer | `/style-transfer` | IPAdapter style application |
| AI Design | `/ai-design` | General AI design tools |
| Color Visualizer | `/color-visualizer` | Paint color preview |
| Floor Plan | `/floor-plan` | 3D floor plan |
| Room 3D | `/room-3d` | Multi-room 3D (Marble API) |
| Dream Room | `/dream-room` | Freeform design |
| Remove Object | `/remove-object` | Object removal |
| Vastu | `/vastu` | Vastu analysis |
| Studio | `/studio` | Advanced editor |
| Editor | `/editor` | Image editor |
| Staging | `/staging` | Virtual staging |
| Master Design | `/master-design` | Master design view |
| Professional Design | `/professional-design` | Pro mode |
| Projects | `/projects` | Project gallery |
| History | `/history` | AI run history |
| Favorites | `/favorites` | Saved renders |
| Designers | `/designers` | Marketplace — designers |
| Contractors | `/contractors` | Marketplace — contractors |
| Vendors | `/vendors` | Marketplace — vendors |
| My Bookings | `/my-bookings` | Customer booking history |
| Marketplace | `/marketplace` | Browse all professionals |
| Search | `/search` | Search across platform |
| Billing | `/billing` | Plans + payment |
| Settings | `/settings` | User + GPU settings |
| Onboarding | `/onboarding` | First-time setup |

---

## Environment Variables Required

```bash
# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/removation_ai

# Auth
JWT_SECRET=<strong-hex-secret>
NEXTAUTH_SECRET=<secret>
SKIP_AUTH=false

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Razorpay (required)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_PLAN_PRO_MONTHLY=plan_...
RAZORPAY_PLAN_PRO_YEARLY=plan_...
RAZORPAY_PLAN_TEAM_MONTHLY=plan_...
RAZORPAY_PLAN_TEAM_YEARLY=plan_...

# Stripe (optional — for USD payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_WEBHOOK_SECRET=

# Redis — REDIS_URL takes priority (Upstash/Vercel). Individual vars are for local dev only.
REDIS_URL=                         # set this on Vercel/Upstash; overrides all vars below
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_USERNAME=
REDIS_TLS=false

# Pusher (real-time chat + notifications)
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=ap2
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=ap2

# UploadThing
UPLOADTHING_TOKEN=

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=Removation <no-reply@removation.ai>

# Cloud AI (optional — for Replicate-based features)
REPLICATE_API_TOKEN=
REPLICATE_WEBHOOK_SECRET=
REPLICATE_USE_SYNC=false

# LLM
GROQ_API_KEY=

# AI / GPU
MARBLE_API_KEY=                    # from platform.worldlabs.ai/api-keys
GEMINI_API_KEY=                    # optional
COMFYUI_ENABLED=true               # set false on Vercel/serverless
COMFY_URL=http://127.0.0.1:8188    # override ComfyUI URL
COMFY_OUTPUT=/home/nikhil/Documents/Remo2/ComfyUI/output

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## What NOT to Do

- ❌ Never make raw fetch calls to ComfyUI — use `comfyBridge.js`
- ❌ Never bypass `save-image-for-comfy.ts` for image uploads
- ❌ Never hardcode `127.0.0.1:8188` or `localhost:8188` anywhere
- ❌ Never put hex codes in SDXL prompts
- ❌ Never use prompt weights above 1.4
- ❌ Never query users by `_id` in application/AI code — use `{ clerkId: userId }` (exception: `requireRole` uses `findById` because JWT already contains `_id`)
- ❌ Never set `NEXT_PUBLIC_SKIP_AUTH=true` in production
- ❌ Never modify working features when building a new one
- ❌ Never edit workflow JSONs in `src/workflows/` mid-build
- ❌ Never introduce new MongoDB collections if an existing one can be extended
- ❌ Never leave diagnostic `console.log` in production paths
- ❌ Never refactor adjacent code while fixing a bug — list concerns at end of response
- ❌ Never add processingType to `lib/db/models/Project.ts` — it belongs in `src/models/AIRun.js`
- ❌ Never call `req.json()` before signature verification in webhook routes — use `req.text()` first
- ❌ Never skip amount verification after Razorpay signature check in booking payment-verify

---

## If Something Contradicts the Code

Trust the code over this file. This file may lag behind recent changes.
If you notice a discrepancy, tell the user — don't silently follow whichever version seems right.

---

## Development Commands

```bash
./start.sh              # recommended — pre-flight checks + dev server
npm run dev             # direct dev server (runs predev.cjs first)
npm run build           # production build (8GB heap)
npm run type-check      # tsc without building

# Redis
redis-cli ping          # check Redis running
./scripts/setup-redis.sh  # configure Redis for dev

# ComfyUI (start separately)
cd ~/Documents/Remo2/ComfyUI && python main.py --listen 0.0.0.0 --port 8188 --lowvram --fp8_e4m3fn-unet

# System checks
curl http://localhost:3000/api/system/memory
curl http://localhost:3000/api/system/redis
curl http://localhost:3000/api/health/comfyui
```

---

## Deployment Checklist

Before deploying to production:
- [ ] `SKIP_AUTH=false` in all env files
- [ ] `COMFYUI_ENABLED=false` on Vercel (no local GPU)
- [ ] Real Razorpay plan IDs set in env
- [ ] Pusher keys configured
- [ ] Resend API key + EMAIL_FROM configured
- [ ] Redis URL set (Upstash recommended for serverless)
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] Run DB migration: mark existing users as onboarded
- [ ] Switch `app_mode` to `production` in AdminConfig
- [ ] Verify webhook URL in Razorpay Dashboard: `https://yourdomain.com/api/webhook/razorpay`
- [ ] Verify Razorpay SDK loads: check Network tab for checkout.razorpay.com

## Project Status (Updated: June 2026)

### What's Implemented and Working
- Full custom JWT auth + Google OAuth + OTP email verification
- 8 ComfyUI AI features (room changer, ceiling changer, furniture remover, furniture placement, multi-room 3D, IC-Light lighting, style transfer, vastu)
- Marketplace: designer/contractor/vendor profiles + booking + Razorpay payments + refunds
- Admin panel: user management, analytics, audit logs, announcements, config, scheduler
- Badge/gamification system (10 badges, evaluated after AI renders)
- In-app notifications (Pusher) + email notifications (Resend)
- Product tours (driver.js)
- Content tagging system
- Redis queue for AI jobs
- Versioning/snapshots
- i18n Hindi + English
