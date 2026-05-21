# Removation — Project Context for Claude Code

## What This Project Is

Removation is a Next.js dashboard that lets users transform interior room photos 
using AI: change wall colors, redesign rooms, remove objects/furniture, etc. 
Backend orchestrates ComfyUI workflows (SDXL + custom segmentation + inpainting) 
running on a local or remote ComfyUI instance.

## Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind
- **Backend:** Next.js API routes (Node.js)
- **Database:** MongoDB via Mongoose
- **Auth + Payments:** Clerk, Stripe, Razorpay
- **AI:** ComfyUI (Python) reached via HTTP + WebSocket using the `comfyui-node` 
  library, wrapped in `src/services/comfyBridge.js`
- **GPU:** RTX 4060 8GB local, with cloud fallback adapter

## Most Important File

`src/services/comfyBridge.js` is the unified ComfyUI Closed-Loop Bridge. 
**Always use it. Never make raw fetch/axios calls to ComfyUI.** It handles:

- `/prompt` dispatch
- WebSocket events (`executing`, `progress`, `executed`, `execution_error`)
- `/history/{promptId}` polling fallback
- VRAM flush between stages
- GPU mode switching (local vs cloud)
- Per-user file namespacing

If something looks wrong with how a feature talks to ComfyUI, it's almost 
always missing a pattern that comfyBridge already implements. Read it first.

## Project Conventions

### How AI features are structured

Every AI feature (Room Changer, Professional Studio, Object Removal, etc.) 
follows this exact pattern:

1. **Workflow JSON(s)** in `src/workflows/` — exported from ComfyUI Manager 
   in GUI format (not API format).
2. **Orchestrator** in `src/services/<feature>Orchestrator.js` — loads the 
   workflow JSON, converts GUI→API via `guiToApiGraph`, injects user inputs 
   into specific node IDs, dispatches via `comfyBridge`, persists results.
3. **API route** in `app/api/ai/<feature>/generate/route.js` (or `.ts`) — 
   auth check, input validation, fire-and-forget call to orchestrator, 
   returns `{ success: true, projectId }` immediately.
4. **Frontend page** in `app/(app)/<feature>/page.tsx` — input panel on left, 
   result panel on right, before/after slider from `@/components/ui/before-after-slider`.
5. **MongoDB persistence** — orchestrator creates a Project document AND a 
   feature-specific Run document (e.g. RoomChangerRun) on every generation.
6. **Real-time updates** to frontend via Socket.IO channels named 
   `comfy:<feature>:progress` and `comfy:<feature>:error`.

When building a new AI feature, **copy Room Changer's pattern exactly**. Don't 
invent new patterns. The closest working reference for any new feature is 
usually `roomChangerOrchestrator.js`.

### Workflow JSON files

- Stored in `src/workflows/` 
- Always GUI format (with `nodes`, `links`, `groups` arrays)
- Converted to ComfyUI API format at runtime via `src/lib/comfyWorkflowConverter.js`
- **Never edit the converter in isolation** — it has explicit `WIDGET_NAMES` 
  mappings that must match the installed Impact Pack / segment-anything / 
  ControlNet Aux widget signatures. If a workflow returns `required_input_missing` 
  errors, the WIDGET_NAMES are out of sync with the installed custom node version.

### Project + History persistence

- All AI runs create a `Project` document in MongoDB
- The `/projects` page queries `/api/ai/history`
- The history route filters by `processingType` — currently accepts 
  `'redesign'` and `'room-changer'`. **When adding a new feature, add its 
  `processingType` to this filter.**
- Description-building logic in the history route has per-feature branches. 
  Add a branch for any new feature that needs a useful display name.

### Saving user uploads to ComfyUI

Always use `lib/ai/save-image-for-comfy.ts`. This is the single entry point 
for getting a user image into ComfyUI's input directory. It handles:

- Resize/upscale to SDXL operating range (1024 longest side, never below 768)
- Re-encode to PNG (lossless, no JPEG artifacts)
- Cloud vs local upload via the GPU mode router

**Never bypass it.** If you need different resize behavior, extend the function 
rather than working around it.

## Hard-Won Lessons (Do Not Re-Learn)

### 1. ComfyUI workflows have TWO formats — GUI and API

GUI format is what ComfyUI Manager exports (with `nodes[]`, `links[]`, `groups[]`).  
API format is what `/prompt` accepts (flat `{nodeId: {class_type, inputs}}`).  

The converter `guiToApiGraph` handles this. Never feed GUI format directly 
to `/prompt` — it silently fails.

### 2. SDXL hates low-resolution inputs

SDXL was trained at ~1024×1024. Feed it a 525×350 thumbnail and you get 
oversaturation, warped geometry, color bleeding. Always upscale to ≥768 on 
the longest side before SDXL inpainting. `save-image-for-comfy.ts` does this 
automatically.

### 3. CLIP doesn't understand hex codes

Putting `#9CAF88` in an SDXL prompt at high weight injects noise. CLIP can't 
parse hex codes; it tokenizes them as junk. **Never include hex codes in 
positive prompts.** Use color names only.

### 4. SDXL prompt weights are aggressive

`(text:1.8)` overshoots dramatically when CFG is 9.5. Keep weights at `:1.3` 
to `:1.4` max for color/style instructions. Reserve higher weights for 
genuinely critical structural cues.

### 5. ComfyUI returns "success" even on partial failures

If a multi-stage workflow has 5 SaveImage nodes and only 1 produces output, 
ComfyUI's `/history` may still report status as complete. The old bridge used 
`Array.prototype.some(o => o?.images?.length > 0)` which returned true on 
the first node with images, masking the failure. **Always count SaveImage 
outputs against expected count.** This is fixed in current `comfyBridge.js` 
— don't regress it.

### 6. CLIPSeg fails on strongly-colored / textured walls

CLIPSeg's wall detection works well on neutral walls and dark walls but fails 
on cluttered rooms, painted furniture, busy patterns, low-res photos. Don't 
keep tuning CLIPSeg parameters past a point — the limits are model-imposed. 
Better segmenters (OneFormer, Florence-2) or user-driven masking are the 
real fix when CLIPSeg hits its ceiling.

### 7. SAMLoader name conflicts

ComfyUI-SAM2 and ComfyUI-Impact-Pack both register `SAMLoader`. The second 
to load silently overwrites the first, which breaks workflows expecting Impact 
Pack's API. Keep `ComfyUI-SAM2` disabled (rename to `.disabled`) unless 
explicitly needed.

### 8. ControlNet Aux looks for depth models in flat paths

`depth_anything_v2_vits.pth` must be at 
`custom_nodes/comfyui_controlnet_aux/ckpts/depth_anything_v2_vits.pth` directly, 
not in a subfolder. Use a symlink if needed.

### 9. Wall-mask coverage guard

`roomChangerOrchestrator.js` has a coverage guard: if the wall mask covers 
<15% of the image, throw `WALL_MASK_INSUFFICIENT_COVERAGE` and skip Stage 3. 
This catches catastrophic CLIPSeg failures and gives users a clear error 
instead of broken output. **Apply this pattern to any new feature that uses 
auto-segmentation.**

### 10. Image uploads must match mask dimensions

If the input image is 1024×683 but the wall mask is 1024×684, SDXL's latent 
crop misaligns the mask by ~1 latent token. This produces edge fringe 
artifacts. Always ensure mask and image come from the same upload pipeline 
so dimensions match exactly.

## Known Working Custom Nodes

These are installed and working in `~/Documents/Remo2/ComfyUI/custom_nodes/`:

- `ComfyUI-Impact-Pack` — SAMLoader, CLIPSegDetectorProvider, ImpactSimpleDetectorSEGS, SegsToCombinedMask
- `comfyui-CLIPSeg` (biegert) — required by CLIPSegDetectorProvider
- `comfyui_controlnet_aux` — DepthAnythingV2Preprocessor (depth maps)
- `comfyui_segment_anything` (storyicon) — GroundingDINO + SAM (alternative to Impact Pack's segmentation)
- `comfyui-lama-remover` (Layer-norm) — LaMa inpainting for object removal

When adding workflows, prefer these existing nodes over installing new ones.

## Custom Node Widget Signatures (Critical)

`guiToApiGraph` in `src/lib/comfyWorkflowConverter.js` has hardcoded 
`WIDGET_NAMES` for each node type. If you ever see a 
`required_input_missing` error from ComfyUI for a custom node, the widget 
signature in the installed version doesn't match WIDGET_NAMES.

To check the canonical signature: read the node's source in 
`ComfyUI/custom_nodes/<package>/` — look for `INPUT_TYPES` in the class 
definition. Update WIDGET_NAMES to match the installed version exactly.

## Coding Style + Constraints

- TypeScript for new files; existing `.js` files stay `.js` unless rewriting
- No new state libraries — use whatever each page already uses
- No new UI primitive libraries — match existing design system
- Tailwind for styling, match existing token usage
- Imports use the `@/` path alias for project-internal modules
- All AI endpoints are auth-protected via the project's existing auth middleware 
  (see `app/api/ai/redesign/route.js` for the pattern)
- API routes accept multipart uploads via the existing file-handling helpers; 
  don't reinvent file handling
- Errors thrown from orchestrators should set `err.code` to a stable string 
  (e.g. `WALL_MASK_INSUFFICIENT_COVERAGE`, `COMFY_PARTIAL_EXECUTION`) so API 
  routes can distinguish user-recoverable errors from system errors

## What NOT to Do

- ❌ Don't modify working features when working on a new one. Redesign, 
  Professional Studio, Object Removal, Master Design Studio, Dream Room, 
  Color Visualizer, Editor — all are protected. Touch only the feature 
  being built.
- ❌ Don't modify workflow JSON files in `src/workflows/` mid-feature-build 
  unless explicitly asked. They're tested artifacts.
- ❌ Don't introduce new MongoDB collections when an existing one can be 
  extended.
- ❌ Don't bypass `comfyBridge.js` for ComfyUI calls.
- ❌ Don't bypass `save-image-for-comfy.ts` for user image uploads.
- ❌ Don't silently `console.log` debug code into production paths. Remove 
  diagnostic logs after the feature ships.
- ❌ Don't refactor adjacent code while fixing a bug. If you notice something 
  concerning, list it at the end of your response — don't act on it.

## Workflow for New AI Features

When asked to build a new AI feature (e.g. Furniture Remover, Ceiling Changer, 
Floor Painter), follow this order:

1. **Confirm the workflow JSON(s) exist** in `src/workflows/` and have been 
   tested manually in ComfyUI Manager. Don't start coding until this is true.
2. **Read `roomChangerOrchestrator.js`** in full — it's the canonical template.
3. **Read the working API route** at `app/api/ai/room-changer/generate/route.js`.
4. **Read the working page** at `app/(app)/room-changer/page.tsx`.
5. **Propose a file list** before generating any code. Wait for confirmation.
6. **Implement orchestrator first**, then API route, then page. Type-check 
   between each.
7. **Add the new feature's `processingType` to the history route filter** so 
   results appear in `/projects`.
8. **Add a description branch** in the history route for the new feature.

## File Reference

Key files to read when working on AI features:

- `src/services/comfyBridge.js` — ComfyUI client
- `src/services/roomChangerOrchestrator.js` — canonical orchestrator template
- `src/lib/comfyWorkflowConverter.js` — GUI→API converter (WIDGET_NAMES)
- `lib/ai/save-image-for-comfy.ts` — user upload handler
- `src/config/roomChangerPrompts.js` — example prompt config (no hex, weights ≤1.4)
- `app/api/ai/room-changer/generate/route.js` — canonical API route
- `app/(app)/room-changer/page.tsx` — canonical feature page
- `app/api/ai/history/route.ts` — projects listing (filter by processingType)
- `src/models/Project.js` — main project schema
- `src/models/RoomChangerRun.js` — example feature-run schema

## Final Note

If something in this file contradicts what you observe in the actual code, 
trust the code and tell the user — this file may be out of date for that 
specific area.