# Removation — Project Context for Claude Code

## What This Project Is

Removation is a Next.js 14 SaaS dashboard for AI-powered interior design.
Users upload room photos and apply AI transformations: change wall colors,
remove furniture, redesign rooms, change ceilings, generate 3D walkthroughs.

Backend orchestrates ComfyUI workflows (SDXL + segmentation + inpainting)
running on a local or cloud GPU, with automatic fallback between the two.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 App Router, React, TypeScript, Tailwind |
| Backend | Next.js API routes (Node.js) |
| Database | MongoDB via Mongoose |
| Auth | Custom JWT (HTTP-only cookie `auth_token`) — NOT Clerk |
| Payments | Stripe + Razorpay |
| AI | ComfyUI via HTTP + WebSocket, wrapped in `comfyBridge.js` |
| Real-time | Socket.IO |
| GPU Local | RTX 4060 8GB at localhost:8188 |
| GPU Cloud | Google Colab T4 15GB via Cloudflare tunnel |

---

## Authentication System (Fully Custom — Not Clerk)

The project migrated away from Clerk. The auth system is now fully custom.

### How It Works

1. User signs up or logs in via `/api/auth/signup` or `/api/auth/login`
2. Server issues an HTTP-only JWT cookie named `auth_token`
3. All API routes read this cookie to identify the user
4. `AuthProvider.tsx` calls `/api/auth/me` on load to get the session

### The clerkId Field (Critical)

The `User` schema has a `clerkId` field that 20+ API routes still use
to query the database: `User.findOne({ clerkId: userId })`.

**The fix:** The `User` schema pre-save hook automatically sets
`clerkId = _id.toString()` if not present. This keeps all existing
queries working without changing them.

Also: `mongodb.ts` runs a one-time async migration on connection that
backfills `clerkId` for any legacy users missing it.

**Never query users by `_id` directly in API routes.**
Always use `{ clerkId: userId }` — this is intentional for backward
compatibility.

### Development Mode

Do NOT use `NEXT_PUBLIC_SKIP_AUTH=true` or `SKIP_AUTH=true` unless
you explicitly need to bypass auth for testing a specific flow.

When these flags are off (default), the real auth system runs in dev.
`AuthProvider.tsx` calls `/api/auth/me` first — mock bypass only applies
if `NEXT_PUBLIC_SKIP_AUTH` is explicitly set.

### Auth Files

- `app/(auth)/sign-in/page.tsx` — login page
- `app/(auth)/sign-up/page.tsx` — signup page
- `app/(auth)/forgot-password/page.tsx` — forgot password
- `app/(auth)/reset-password/page.tsx` — reset password
- `app/(auth)/verify-otp/page.tsx` — OTP verification
- `app/api/auth/` — all auth API routes
- `lib/auth/` — JWT helpers
- `middleware.ts` — route protection (respects SKIP_AUTH flag)
- `components/providers/AuthProvider.tsx` — session context

### Layout

All auth pages inherit from `AuthLayout` — a split-screen layout.
Do NOT add extra wrapper divs, border cards, or centering blocks
inside auth pages. They already inherit the parent container.

---

## GPU Mode System

ComfyUI can run locally or on Google Colab. The system auto-switches.

### Three Modes (set in Dashboard → Settings → GPU)

| Mode | Behavior |
|------|---------|
| `local` | Always use localhost:8188 (RTX 4060 8GB) |
| `auto` | Try cloud first (3s ping), fall back to local |
| `cloud` | Always use Colab tunnel URL, error if unavailable |

### How It Works

`comfyBridge.js` calls `resolveComfyURL()` before every ComfyUI request.
This function reads the current mode from MongoDB (`AppSettings` collection)
and pings the cloud URL if needed.

**The URL is the only thing that changes between modes.**
All workflows, orchestrators, and features are identical in both modes.

### Settings Persistence

GPU mode and cloud URL are stored in MongoDB `appsettings` collection
via `src/lib/appSettings.js`. Never hardcode ComfyUI URLs anywhere.

### Colab Setup

Notebook: `scripts/RemovationColab.ipynb`
- Mounts Google Drive (models stored there — no re-download)
- Starts ComfyUI with `--listen 0.0.0.0`
- Creates Cloudflare tunnel
- Prints tunnel URL → paste in Dashboard → Settings → GPU

Model upload (one-time): `scripts/upload_models_to_drive.sh`

### ComfyUI Launch Flags (production)

```bash
python3 main.py \
  --listen 0.0.0.0 \
  --port 8188 \
  --preview-method taesd \
  --lowvram \
  --fp8_e4m3fn-unet
```

Launch scripts:
- `start-comfyui.sh`
- `start-all.sh`

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

If something is wrong with how a feature talks to ComfyUI, read
comfyBridge.js first before changing anything else.

Key methods:
- `_flushVRAM()` — `POST /free` with `unload_models:true`,
  `free_memory:true`, then `1000ms` sleep.
  Always add `4000ms` additional sleep after calling it
  when switching between heavy models.
- `getComfyRestUrl()` — returns current active URL
  (local or cloud depending on GPU mode setting)

---

## AI Features — All Follow This Pattern

Every AI feature follows this exact structure. Do not invent new patterns.

```
src/workflows/<Feature>.json          ← ComfyUI GUI format workflow
src/services/<feature>Orchestrator.js ← loads, converts, injects, dispatches
app/api/ai/<feature>/generate/route.js ← auth, validate, fire-and-forget
app/(app)/<feature>/page.tsx           ← UI with before/after slider
src/models/<Feature>Run.js             ← feature-specific MongoDB schema
```

### Step-by-Step for New Features

1. Confirm workflow JSON exists in `src/workflows/` and works in ComfyUI
2. Read `roomChangerOrchestrator.js` — it is the canonical template
3. Read `app/api/ai/room-changer/generate/route.js` — canonical API route
4. Read `app/(app)/room-changer/page.tsx` — canonical page
5. Propose file list — wait for confirmation before writing code
6. Implement: orchestrator → API route → page (type-check between each)
7. Add `processingType` to history route filter
8. Add description branch in history route

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
const result = await comfyBridge.submitAndWait(apiGraph);

// 5. Persist to MongoDB
await Project.create({ ... });
await FeatureRun.create({ ... });

// 6. Emit Socket.IO events
io.emit('comfy:<feature>:done', { projectId, afterUrl });
```

### Workflow Conversion

Workflows are stored in GUI format (with `nodes[]`, `links[]`, `groups[]`).
Converted to ComfyUI API format at runtime via `comfyWorkflowConverter.js`.

**Never feed GUI format directly to `/prompt`.** It silently fails.

`WIDGET_NAMES` in the converter must exactly match installed custom node
widget signatures. If you see `required_input_missing`, the WIDGET_NAMES
are out of sync. Fix by reading `INPUT_TYPES` in the node's source.

WIDGET_NAMES additions for Furniture Placement (in `comfyWorkflowConverter.js`):
- `VAEDecode`: []
- `VAEEncode`: []
- `VAEEncodeForInpaint`: ['grow_mask_by']

---

## Implemented AI Features

| Feature | Orchestrator | Workflow(s) | processingType |
|---------|-------------|-------------|----------------|
| Room Changer | `roomChangerOrchestrator.js` | Stage1_SceneUnderstanding + Stage3_WhiteWalls_Inpaint | `room-changer` |
| Ceiling Changer | `ceilingChangerOrchestrator.js` | Stage_CeilingDetect + Stage_CeilingInpaint | `ceiling-changer` |
| Furniture Remover | `furnitureRemoverOrchestrator.js` | `combinedremovernew.json` | `furniture-remover` |
| Multi-Room 3D | `multiRoomOrchestrator.js` | Room Changer × N + Marble API | `multi-room-3d` |
| Furniture Placement | `furniturePlacementOrchestrator.js` | `Stage_FurnitureBGRemove.json` + `Stage_FurnitureBlend.json` | `furniture-placement` |

### Furniture Remover — Key Details

Uses `combinedremovernew.json` — a combined pipeline:
- RMBG (INSPYRENET) detects salient foreground
- CLIPSeg + SAM2 detects named furniture by text
- MaskComposite combines both masks
- MinimaxImageRemover runs diffusion removal
- LaMa cleans up edges

**Two modes:**
- Auto: full CLIPSeg + MiniMax + LaMa pipeline
- Manual: user paints mask → LaMa only (fast, ~3s)

Manual brush canvas exports red pixels.
Convert red → white, rest → black before sending to LaMa.

Node injection points in `combinedremovernew.json`:
- Node 54: LoadImage → inject room image
- Node 40: MinimaxImageRemover → randomize seed
- Node 81: CLIPSegDetectorProvider → furniture text prompt (keep as-is)

### Multi-Room 3D — Key Details

Flow:
1. User uploads 6-15 photos + picks color
2. Room Changer runs on each photo sequentially (VRAM safety)
3. Painted photos uploaded to Marble API (max 8)
4. Marble generates explorable 3D world (~5 min)
5. Returns `marble.worldlabs.ai/world/{id}` URL

MongoDB model: `MultiRoomProject`
Services: `marbleService.js`, `multiRoomOrchestrator.js`
Marble API key: `MARBLE_API_KEY` in `.env.local`
Cost: ~$1.20 per 3D generation (Marble credits)

Download feature: `app/api/multi-room/download/[projectId]/route.js`
ZIP structure: `{projectId}/input/{id}_input_01.jpg` + `output/`

### Furniture Placement — Key Details

**V2 Flow (current — no SDXL, no OOM):**

```
User uploads room photo + furniture photo
        ↓
upload-room → saves room to ComfyUI/input/
remove-bg   → inline RMBG workflow (LoadImage→RMBG→SaveImage), ~5s, ~600MB VRAM
        ↓
Frontend shows Fabric.js canvas:
  - Room photo as background
  - Furniture (black bg removed) as draggable/scalable/rotatable object
        ↓
User positions furniture, clicks "Place It"
composite → full furniture_minimal.json workflow injected with
  - room filename, nobg filename
  - ImageScale furniture to furW×furH (canvas coords → room image coords)
  - ImageCompositeMasked at roomX, roomY
  - SaveImage → furniture-place/result
        ↓
Result saved to public/renders + MongoDB
```

New API routes (V2):
- `app/api/ai/furniture-placement/upload-room/route.js`
- `app/api/ai/furniture-placement/remove-bg/route.js`
- `app/api/ai/furniture-placement/composite/route.js`

Workflow: `src/workflows/Stage_FurniturePlace.json`
(copied from `src/workflows/furniture remover/furniture_minimal.json`)

Node IDs in Stage_FurniturePlace.json:
- Node 1: LoadImage → room photo
- Node 2: LoadImage → furniture (nobg file)
- Node 3: ImageScale room → 1024×768
- Node 4: ImageSizeAdjuster furniture
- Node 5: RMBG (regenerates mask from nobg file)
- Node 6: AILab_Preview
- Node 7: ImageScale furniture → furW×furH (inject width/height)
- Node 8: MaskToImage
- Node 9: ImageScale mask → furW×furH (same as node 7)
- Node 10: ImageToMask
- Node 11: ImageCompositeMasked → inject x=roomX, y=roomY
- Node 12: SaveImage → furniture-place/result

Canvas coordinates → room image coordinates:
- Canvas: 800×500
- Room (after node 3 upscale): 1024×768
- scaleToRoomX = 1024/800 = 1.28
- scaleToRoomY = 768/500 = 1.536
- Fabric originX/Y = 'center', so top-left = (left - dispW/2, top - dispH/2)

WIDGET_NAMES added (in comfyWorkflowConverter.js):
- MaskToImage: []
- ImageCompositeMasked: ['x', 'y', 'resize_source']

**V1 Flow (legacy — uses SDXL, may OOM on 8GB):**

Flow — 3 stages run sequentially:

Stage 1 — Background Removal:
Furniture product photo (white bg) → RMBG INSPYRENET
→ transparent furniture PNG saved to ComfyUI output

Stage 2 — Python Composite:
`scripts/composite_furniture.py` pastes transparent
furniture onto room photo at exact canvas coordinates.
Outputs:
- `composite_{projectId}.png` — room with furniture pasted
- `mask_{projectId}.png` — white where furniture is, black elsewhere
Mask is dilated by 9px (MaxFilter) for clean blend edges.

Stage 3 — SDXL Inpainting:
Composite + mask → SDXL inpaints furniture area
with denoise 0.75 (keeps furniture shape, adds realistic
lighting and shadows).

Node IDs (confirmed from workflow JSON):
BGRemove workflow:
- Node 10: LoadImage → inject furniture image
- Node 11: RMBG (INSPYRENET)
- Node 12: SaveImage → furniture-nobg/result

Blend workflow:
- Node 20: LoadImage → inject composite image
- Node 21: LoadImage → inject mask image
- Node 22: VAEEncodeForInpaint
- Node 23: CheckpointLoaderSimple (sd_xl_base_1.0)
- Node 24: CLIPTextEncode positive
- Node 25: CLIPTextEncode negative
- Node 26: KSampler (steps: 25, cfg: 7.0, denoise: 0.75)
- Node 27: VAEDecode
- Node 28: SaveImage → furniture-blend/result
- Node 29: ImageToMask

Canvas: Fabric.js
- Room photo = canvas background
- Furniture = draggable/scalable/rotatable Fabric object
- On "Blend": extract placement {x, y, scaleX, scaleY, rotation}
- x/y are center coordinates in canvas space
- Scale back to room image coordinates before composite

Frontend sends to backend:
- roomImage (file)
- furnitureImage (file)
- placement (JSON string): {x, y, scaleX, scaleY, rotation, width, height}

MongoDB model: `FurniturePlacementRun`
processingType: `furniture-placement`

VRAM Management:
Stage 1 RMBG uses ~576MB. Stage 3 SDXL uses ~4.5GB.
Without flush between them → OOM crash on 8GB GPU.

Fix applied in furniturePlacementOrchestrator.js:
- After Stage 1 completes → call comfyBridge._flushVRAM()
- Then await 4000ms for GPU to fully release memory
- Then submit Stage 3 SDXL

KSampler overrides applied at runtime (not in workflow JSON):
- steps: 20 (reduced from 25)
- denoise: 0.75

VAE optimization applied at runtime:
- VAEDecode swapped to VAEDecodeTiled
- tile_size: 512, overlap: 64,
  temporal_size: 64, temporal_overlap: 8
- Saves ~1GB VRAM during decode
- All 4 params MUST be provided — ComfyUI rejects
  VAEDecodeTiled with missing params

---

## Saving User Uploads to ComfyUI

Always use `lib/ai/save-image-for-comfy.ts`.

Never bypass it. It handles:
- Resize/upscale to SDXL range (1024 longest side, never below 768)
- Re-encode to PNG (lossless)
- Cloud vs local upload routing

---

## MongoDB Models

| Model | File | Purpose |
|-------|------|---------|
| User | `src/models/User.ts` | Auth users (clerkId = _id) |
| Project | `src/models/Project.js` | All AI runs, shown in /projects |
| RoomChangerRun | `src/models/RoomChangerRun.js` | Room changer history |
| CeilingChangerRun | `src/models/CeilingChangerRun.js` | Ceiling changer history |
| MultiRoomProject | `src/models/MultiRoomProject.js` | 3D room projects |
| FurniturePlacementRun | `src/models/FurniturePlacementRun.js` | furniture-placement history |
| AppSettings | `src/models/AppSettings.js` | GPU mode, cloud URL, app config |
| Feedback | inline in `/api/feedback/route.js` | Star ratings |

**Project.processingType enum:**
`'redesign'`, `'room-changer'`, `'furniture-remover'`,
`'ceiling-changer'`, `'multi-room-3d'`, `'furniture-placement'`

When adding a new feature, add its processingType to:
1. `Project.js` enum
2. `app/api/ai/history/route.ts` filter array (e.g. `furniture-placement` was added here)
3. History route description branch

---

## Dashboard Layout

`app/(app)/layout.tsx` shows:
- Live credits (real data from auth context, not hardcoded)
- Animated progress bar based on remaining credits
- Dynamic plan name (Free Plan / Pro Plan) from auth context

Do NOT hardcode credits, plan names, or user data in the layout.

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
It reports success even if only 1 of 5 SaveImage nodes produced output.
Always count expected outputs vs actual. comfyBridge.js handles this —
don't regress it.

### 6. CLIPSeg threshold for ceilings
Threshold 0.4 is too strict. Use 0.25 for ceiling detection.
Coverage guard: throw error if mask covers <8% of image.

### 7. ComfyUI-SAM2 is enabled — no SAMLoader conflict
The original concern was a `SAMLoader` name collision between ComfyUI-SAM2 and
Impact Pack. Investigation (June 2026) found this no longer applies:
ComfyUI-SAM2's `__init__.py` registers nodes as `'SAM2ModelLoader (segment anything2)'`,
`'GroundingDinoModelLoader (segment anything2)'`, `'GroundingDinoSAM2Segment (segment anything2)'`,
and `'InvertMask (segment anything)'` — none of which collide with Impact Pack's `SAMLoader`.
The only true duplicate is `IsMaskEmpty` (also in `comfyui_segment_anything`) — benign,
identical implementations, last-load-wins.

**ComfyUI-SAM2 is now ENABLED** (folder: `custom_nodes/ComfyUI-SAM2`) and is required
for the Vastu element detection pipeline (`vastuDetectionOrchestrator.js`).
Do not disable it again unless a real conflict is confirmed in startup logs.

### 8. ControlNet Aux depth model path
`depth_anything_v2_vits.pth` must be at:
`custom_nodes/comfyui_controlnet_aux/ckpts/depth_anything_v2_vits.pth`
Use a symlink if needed. Subdirectories break it.

### 9. Wall mask coverage guard
If wall mask covers <15% of image → throw `WALL_MASK_INSUFFICIENT_COVERAGE`
and skip inpainting. Gives user a clear error instead of broken output.
Apply this pattern to any new auto-segmentation feature.

### 10. Mask and image must have identical dimensions
1px difference in height/width → edge fringe artifacts from SDXL.
Always use the same upload pipeline for both.

### 11. MiniMax needs 40 inference steps minimum
Using 20 steps gives incomplete removal. Keep at 40.

### 12. Manual brush canvas red pixels
The brush paints red on canvas. Before sending to LaMa/MiniMax,
convert: red channel dominant + alpha > 10 → white; rest → black.

### 13. GrowMask for coverage expansion
When RMBG mask misses nearby objects (e.g. coffee table near sofa),
add GrowMask (expand: 12-25, tapered_corners: true) after RMBG MASK
output before sending to MinimaxImageRemover.

### 14. Fabric.js coordinates need scaling back to image space
Fabric.js canvas is 800×500. The actual room image may be
1024×683 or any other size. When extracting placement data
from the canvas object, scale x/y back to the real image
dimensions before passing to the Python composite script.
Formula:
```
real_x = canvas_x * (room_image_width / canvas_width)
real_y = canvas_y * (room_image_height / canvas_height)
```
The composite script expects real image pixel coordinates.

### 15. ComfyUI does not support --medvram flag
ComfyUI's argument parser only accepts:
--gpu-only, --highvram, --normalvram,
--lowvram, --novram, --cpu
Using --medvram causes startup crash:
"main.py: error: unrecognized arguments: --medvram"
This project runs with --lowvram --fp8_e4m3fn-unet
on RTX 4060 8GB.

### 16. VAEDecodeTiled requires ALL 4 parameters
When swapping VAEDecode → VAEDecodeTiled at runtime,
you MUST provide all 4 inputs or ComfyUI throws
prompt_outputs_failed_validation:
  tile_size: 512
  overlap: 64
  temporal_size: 64
  temporal_overlap: 8
Missing any one of these = silent validation failure.

### 17. VRAM flush needs 4 seconds settle time
comfyBridge._flushVRAM() sends POST /free and
waits only 1000ms. On RTX 4060 8GB this is not
enough — RMBG model stays partially in VRAM.
Always add 4000ms additional sleep after _flushVRAM()
before loading SDXL:
  await comfyBridge._flushVRAM();
  await new Promise(r => setTimeout(r, 4000));

### 18. Bypass-tunnel-reminder header for cloud mode
When ComfyUI runs behind Cloudflare tunnel, the /free
endpoint requires header:
  'bypass-tunnel-reminder': 'true'
Without it, Cloudflare intercepts the request.
furniturePlacementOrchestrator.js already includes this.

---

## Known Working Custom Nodes

Location: `~/Documents/Remo2/ComfyUI/custom_nodes/`

- `ComfyUI-Impact-Pack` — SAMLoader, CLIPSegDetectorProvider,
  ImpactSimpleDetectorSEGS, SegsToCombinedMask
- `comfyui-CLIPSeg` (biegert) — required by CLIPSegDetectorProvider
- `comfyui_controlnet_aux` — DepthAnythingV2Preprocessor
- `comfyui_segment_anything` (storyicon) — GroundingDINO + SAM
- `comfyui-lama-remover` (Layer-norm) — LaMa inpainting
- `ComfyUI-RMBG` v3.0.0 — INSPYRENET, RMBG-2.0, BEN
- `ComfyUI-MiniMax-Remover` — diffusion-based object removal
- `ComfyUI-SAM2` — ENABLED — SAM2ModelLoader, GroundingDinoModelLoader, GroundingDinoSAM2Segment
  (all registered with `(segment anything2)` suffix — no collision with Impact Pack's SAMLoader).
  Required for `vastuDetectionOrchestrator.js`.

## Known Working Models

Location: `~/Documents/Remo2/ComfyUI/models/`

| Model | Size | Used By |
|-------|------|---------|
| sd_xl_base_1.0.safetensors | ~7GB | Room Changer, Ceiling Changer |
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

VRAM Usage Per Feature (RTX 4060 8GB, --lowvram):

| Stage | Model | Peak VRAM |
|-------|-------|-----------|
| RMBG BGRemove | INSPYRENET | ~576MB |
| SDXL Inpainting | sd_xl_base_1.0 | ~4.5GB |
| MiniMax Removal | MiniMax transformer | ~6-7GB |
| LaMa Inpainting | big-lama.pt | ~500MB |
| Depth Estimation | depth_anything_v2_vits | ~300MB |

Rule: Always flush VRAM between any two stages
that load different models. Use:
```javascript
await comfyBridge._flushVRAM();
await new Promise(r => setTimeout(r, 4000));
```

---

## Environment Variables

```bash
# Database
MONGODB_URI=

# Auth (custom JWT — NOT Clerk)
JWT_SECRET=
NEXTAUTH_SECRET=

# Auth bypass (development only — leave OFF in normal dev)
NEXT_PUBLIC_SKIP_AUTH=false
SKIP_AUTH=false

# Payments
STRIPE_SECRET_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# GPU
MARBLE_API_KEY=          # from platform.worldlabs.ai/api-keys
GEMINI_API_KEY=          # from aistudio.google.com (optional)

# GPU mode is stored in MongoDB AppSettings, not env vars
# Edit via Dashboard → Settings → GPU
```

---

## Frontend Dependencies (Non-Standard)

- `fabric` — Fabric.js canvas for Furniture Placement feature
- `jszip` — ZIP download for Multi-Room 3D projects
- `@google/genai` — Gemini SDK (optional, for future view generation)

---

## Key File Reference

```
src/services/comfyBridge.js              ← ComfyUI client (READ FIRST)
src/services/roomChangerOrchestrator.js  ← canonical orchestrator template
src/lib/comfyWorkflowConverter.js        ← GUI→API converter + WIDGET_NAMES
src/lib/appSettings.js                   ← GPU mode settings helper
lib/ai/save-image-for-comfy.ts           ← user upload handler
src/config/roomChangerPrompts.js         ← prompt config (no hex, ≤1.4)
src/config/asianPaintsPalette.js         ← 50-color Indian paint palette
app/api/ai/room-changer/generate/        ← canonical API route
app/(app)/room-changer/page.tsx          ← canonical feature page
app/api/ai/history/route.ts              ← projects listing
app/api/settings/gpu/route.js            ← GPU mode API
app/(app)/settings/gpu/page.tsx          ← GPU settings UI
src/models/Project.js                    ← main project schema
src/models/User.ts                       ← user schema (clerkId fix)
src/lib/mongodb.ts                       ← DB connection + migration
components/providers/AuthProvider.tsx    ← session context
middleware.ts                            ← route protection
scripts/RemovationColab.ipynb            ← Colab GPU notebook
scripts/upload_models_to_drive.sh        ← one-time Drive upload
scripts/composite_furniture.py           ← Python: paste furniture + generate mask
```

---

## What NOT to Do

- ❌ Never make raw fetch calls to ComfyUI — use `comfyBridge.js`
- ❌ Never bypass `save-image-for-comfy.ts` for image uploads
- ❌ Never hardcode `127.0.0.1:8188` or `localhost:8188` anywhere
- ❌ Never put hex codes in SDXL prompts
- ❌ Never use prompt weights above 1.4
- ❌ Never query users by `_id` — always use `{ clerkId: userId }`
- ❌ Never set `NEXT_PUBLIC_SKIP_AUTH=true` in production
- ❌ Never modify working features when building a new one
- ❌ Never edit workflow JSONs in `src/workflows/` mid-build
- ❌ Never introduce new MongoDB collections if an existing one can be extended
- ❌ Never leave diagnostic `console.log` in production paths
- ❌ Never refactor adjacent code while fixing a bug — list concerns at end of response

---

## If Something Contradicts the Code

Trust the code over this file. This file may lag behind recent changes.
If you notice a discrepancy, tell the user — don't silently follow
whichever version seems right.

---

## Project Status (Updated: June 2026)

### Tech Stack
- **Frontend:** Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Next.js API routes, MongoDB/Mongoose, JWT auth, Google OAuth
- **AI:** ComfyUI (local RTX 4060 8GB), RealESRGAN upscaling, SAM2 segmentation
- **Payments:** Razorpay (primary, INR), Stripe (USD)
- **Real-time:** Pusher Channels (chat), Socket.io (AI progress)
- **Storage:** UploadThing (images), local public/renders (AI outputs)
- **Cache/Queue:** Redis (ioredis), Redlock distributed locking
- **i18n:** Hindi + English (hooks/useLanguage.ts + hooks/i18n/)

---

## Architecture Overview

### Authentication
- Custom JWT auth (not Clerk) — `lib/auth/jwt.ts`
- Google OAuth with state JWT + CSRF protection — `app/api/auth/google/`
- Role-based access: `customer | designer | contractor | vendor | admin`
- `requireRole(req, ['role'])` pattern for all protected API routes
- `SKIP_AUTH=false` must be set in all environments

### Database Models (lib/db/models/)
- `User` — credits, subscription, onboardingCompleted, tourCompleted, completedTours
- `Designer` — portfolio, specialties, pricing, averageRating, isVerified
- `Contractor` — serviceCategories, serviceRadius, pricing, isVerified
- `Vendor` — businessType, address, inquiries
- `Booking` — 7-state machine, Razorpay payment, refunds
- `Review` — rating, designerReply, isVisible
- `Message` — bookingId, Pusher real-time
- `Project` + `Render` — userId required (never null)
- `Subscription` — plan, status, currentPeriodEnd, razorpaySubscriptionId
- `AdminConfig` — key-value store for app settings (app_mode, credit_costs)
- `VendorInquiry`, `ChatMessage`

### Critical Rules

**userId is NEVER null or ghost ID:**
Every AI route must call `getCurrentUser()` and use `authUser?.id`.
The ghost ID `000000000000000000000000` must never appear in production code.
```js
const authUser = await getCurrentUser();
const finalUserId = authUser?.id || null;
```

**Credit system:**
- Dev mode: no credits deducted (check AdminConfig `app_mode`)
- Production mode: `checkAndDeductCredits(userId, toolName)` before every AI render
- Returns 402 with `{ error: 'insufficient_credits' }` if balance insufficient
- Uses `subscription.creditsUsed` increment pattern (not root `credits` field)

**Booking state machine:**
`pending_payment → pending_designer → confirmed → completed`
Also: `rejected`, `cancelled`, `expired`
Refunds are automatic via Razorpay on rejection/cancellation.

**Redis patterns:**
- Always use `getRedisClient()` singleton — never `new Redis()` directly
- Use `withLock()` for critical sections
- Use `acquireRenderLock(userId, toolName)` before AI renders
- Cache keys: `cache:*`, lock keys: `lock:*`, queue keys: `queue:*`, rate limit: `ratelimit:*`

**Razorpay:**
- Subscriptions use `subscription_id` not `order_id` in frontend
- Signature: `payment_id|subscription_id` for subscriptions, `order_id|payment_id` for one-time
- Webhook URL: `/api/webhook/razorpay` (singular, not webhooks)
- Plan IDs from env: `RAZORPAY_PLAN_PRO_MONTHLY`, `RAZORPAY_PLAN_TEAM_MONTHLY`
- Razorpay SDK loaded via `<Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="beforeInteractive" />` in root layout

**Stripe:**
- Use `getStripe()` lazy initializer — never top-level `new Stripe()`
- Returns null if `STRIPE_SECRET_KEY` is missing — fail gracefully

---

## File Structure (Key Files)

### Auth
- `lib/auth/jwt.ts` — `getCurrentUser()`, `issueJwt()`
- `lib/auth/requireRole.ts` — role guard for API routes
- `lib/auth/safeRedirect.ts` — OAuth redirect protection

### AI Infrastructure
- `lib/ai/comfyui-bridge.ts` — ComfyUI job submission
- `lib/ai/comfyui.ts` — ComfyUI client
- `lib/ai/appMode.ts` — dev/prod mode with Redis cache
- `lib/ai/deductCredits.ts` — atomic credit deduction
- `src/services/roomChangerOrchestrator.js` — reference pattern for all AI orchestrators

### Redis
- `lib/redis/client.ts` — singleton ioredis client
- `lib/redis/lock.ts` — Redlock distributed locking
- `lib/redis/cache.ts` — cache helpers
- `lib/redis/rateLimit.ts` — sliding window rate limiting
- `lib/redis/aiQueue.ts` — AI job queue

### Payments
- `app/api/payment/create-checkout/route.ts` — create Razorpay order or Stripe session
- `app/api/payment/verify/route.ts` — verify payment signatures
- `app/api/payment/credits/route.ts` — credit package purchases
- `app/api/webhook/razorpay/route.ts` — Razorpay webhook handler
- `app/api/webhook/stripe/route.ts` — Stripe webhook handler

### i18n
- `hooks/useLanguage.ts` — main hook, imports from hooks/i18n/
- `hooks/i18n/index.ts` — merges all translation categories
- `hooks/i18n/dashboard.ts`, `booking.ts`, `ai.ts`, `common.ts`, `nav.ts`, etc.

### Memory Management
- `lib/server/memoryWatchdog.ts` — kills server at 90% RAM
- `instrumentation.ts` — starts watchdog on server boot
- `scripts/predev.cjs` — pre-flight checks before npm run dev
- `start.sh` — recommended entry point for dev

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

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# Pusher (real-time chat)
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=ap2
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=ap2

# UploadThing
UPLOADTHING_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Known Issues (KNOWN_ISSUES.md)

See `KNOWN_ISSUES.md` for the full list. Key items:
- Pusher keys not configured — chat works but no real-time
- Stripe keys not configured — USD payments disabled
- Razorpay Plan IDs need to be created in Razorpay Dashboard
- 21 AI routes have userId fixed to null (not real user ID yet)
- Admin sub-route pages redirect to parent without tab context
- User.role is single-valued — admin cannot also be designer

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
cd ~/ComfyUI && python main.py --listen 0.0.0.0 --port 8188 --lowvram --fp8_e4m3fn-unet

# Memory check
curl http://localhost:3000/api/system/memory
curl http://localhost:3000/api/system/redis
```

---

## Deployment Checklist

Before deploying to production:
- [ ] `SKIP_AUTH=false` in all env files
- [ ] Real Razorpay plan IDs set in env
- [ ] Pusher keys configured
- [ ] Redis URL set (Upstash recommended for serverless)
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] Run DB migration: mark existing users as onboarded
- [ ] Switch `app_mode` to `production` in AdminConfig
- [ ] Verify webhook URL in Razorpay Dashboard: `https://yourdomain.com/api/webhook/razorpay`
- [ ] Verify Razorpay SDK loads: check Network tab for checkout.razorpay.com