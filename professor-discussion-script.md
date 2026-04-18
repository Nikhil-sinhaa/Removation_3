# Professor Discussion Script — Removation.ai Image Generation

**Student:** Nikhil Sinha
**Project:** Removation.ai — AI-powered interior room redesign
**Date:** April 10, 2026

---

## 0. Quick Context

Removation.ai generates photorealistic room redesigns from a single uploaded photo. The system runs entirely on a local RTX 4060 (8 GB VRAM) using ComfyUI as the inference backend and a Next.js fullstack frontend.

The pipeline is:

```
User photo → ComfyUI (SDXL + ControlNet-Canny) → SaveImage → MongoDB → Next.js UI
```

---

## 1. What We Have Built (Current Production State)

### 1.1 Workflow Architecture — `src/workflows/redesign.json`

Our ComfyUI graph has **8 active nodes**:

| Node | Class | Role |
|------|-------|------|
| 1 | `LoadImage` | Loads user-uploaded photo |
| 2 | `CheckpointLoaderSimple` | Loads `sd_xl_base_1.0.safetensors` |
| 3 | `CLIPTextEncode` | Positive prompt |
| 4 | `CLIPTextEncode` | Negative prompt |
| 5 | `VAEEncode` | Encodes input image → latent space |
| 9 | `Canny` | Extracts edge map from input (low=0.1, high=0.2) |
| 10 | `ControlNetLoader` | Loads `controlnet-canny-sdxl.safetensors` |
| 11 | `ControlNetApplyAdvanced` | Applies structural guidance (strength=0.75, end_percent=0.60) |
| 6 | `KSampler` | Sampling (30 steps, `dpmpp_2m`, Karras, denoise=0.70) |
| 7 | `VAEDecode` | Decodes latent → pixel image |
| 8 | `SaveImage` | Saves output to ComfyUI output dir |

**ControlNet is fully operational.** The Canny edge map forces the model to respect the room's wall positions, windows, and door openings while only redecorating furniture and surfaces.

### 1.2 Prompt Engineering — `app/api/ai/redesign/route.js`

We build structured prompts dynamically at request time. Example positive prompt:

```
(preserve exact room structure:1.5), (same floor plan layout:1.4),
(identical walls windows doors positions:1.4),
(professional interior design photography:1.3), photorealistic,
architectural visualization, same room geometry, same ceiling height,
same spatial proportions, 8k ultra detailed, sharp focus,
living room with sofa and coffee table,
modern contemporary design, clean lines, neutral tones,
neutral palette, white, cream, greige
```

Negative prompt rejects layout mutations, low quality, cartoon, watermarks.

The system supports two modes:
1. **Redesign mode** — style + colour palette from pre-defined maps
2. **Master Design mode** — per-element control (walls, ceiling, floor, furniture, lighting, decor) with user toggles

### 1.3 ControlNet Toggle — Architectural Mode

Users can enable/disable ControlNet guidance via the **Architectural Mode** switch in the UI (`app/(app)/ai-design/page.tsx`):

- **ON (default):** strength=0.75, end_percent=0.60 — Canny edges preserved throughout first 60% of diffusion
- **OFF:** strength=0.0, end_percent=0.0 — standard img2img, faster but no structural guarantee

The toggle is wired end-to-end: frontend → `formData.useControlNet` → API → workflow node 11.

### 1.4 Queue + Completion Detection — `src/services/comfyBridge.js`

- FIFO job queue with singleton ComfyBridge service
- Submits workflow to ComfyUI REST `/prompt`
- Listens on ComfyUI WebSocket for `executed` events
- Fallback polling of `/history/{prompt_id}` after 15 s
- On completion: copies output image to `public/renders/`, updates MongoDB project status, emits `comfy:done` via Socket.IO to frontend

---

## 2. Open Technical Questions for Discussion

### 2.1 ControlNet Canny vs Depth — Which edge representation is better for rooms?

**Our current approach:** Canny edge detection (low=0.1, high=0.2).

**The question:** Canny captures *all* edges including furniture and texture noise, which can over-constrain the generation. A depth map (MiDaS or ZoeDepth) would capture spatial structure — walls, floor, ceiling — without furniture being preserved.

*Which is more appropriate for our use case: preserving the structural envelope vs preserving all geometry?*

### 2.2 Denoise Strength Trade-off on 8 GB VRAM

**Current:** denoise=0.70 for medium, 0.55 for light.

At denoise=0.70, ~70% of new content is AI-generated. At 0.55 it stays closer to the original. But higher denoising at 30 steps risks VRAM pressure with ControlNet active.

*Is there a principled way to pick denoise strength for a given structural preservation requirement?*

### 2.3 ControlNet End Percent — Why 0.60?

We currently terminate ControlNet guidance at 60% of the diffusion trajectory. The intuition is that early structure is important but fine details should be free.

*What does literature say about the optimal `end_percent` for architectural applications? Is there a training-time rationale for this hyperparameter?*

### 2.4 IP-Adapter for Style Consistency

**Current gap:** When a user selects "Luxury" style, we only encode the concept in text. There is no visual style reference.

An IP-Adapter (SDXL variant) would accept a reference image and blend its visual style into the generation without disturbing the ControlNet structural guidance.

*What's the recommended approach for combining IP-Adapter + ControlNet on 8 GB VRAM? Do they share the UNet attention layers without conflict?*

### 2.5 Quality vs Speed on RTX 4060 — 30 Steps vs 50 Steps

At 30 steps (dpmpp_2m, Karras) a generation completes in ~25 s. At 50 steps we'd approach 40–45 s but likely improve texture sharpness.

*Is there a point-of-diminishing-returns for dpmpp_2m on interior photography? Is Euler A appreciably better for photorealistic scenes?*

### 2.6 SDXL Base vs a Domain-Specific Checkpoint

We use the generic `sd_xl_base_1.0`. Interior design fine-tuned models (e.g., Juggernaut XL, RealVisXL) may produce better out-of-box furniture realism.

*Is swapping the base checkpoint the highest-leverage single improvement for interior design output quality?*

---

## 3. Remaining Engineering Gaps (Honest Assessment)

| Gap | Severity | Effort |
|-----|----------|--------|
| No super-resolution / upscaling stage (ESRGAN/4x-UltraSharp) | Medium | ~1 day |
| No IP-Adapter for visual style reference | Medium | ~2 days |
| Fixed ControlNet strength (not per-room-type adaptive) | Low | ~1 hour |
| No mask-based inpainting for selective edits | Medium | ~3 days |
| No depth ControlNet alternative | Low | ~2 hours (model already available) |

---

## 4. Key Research Questions

1. Is there an established metric for measuring *structural preservation* in image-to-image redesign? (SSIM captures pixel similarity too broadly; ControlNet guidance doesn't guarantee exact wall position.)
2. What is the best open benchmark dataset for evaluating interior design generation quality?
3. Is there published work combining ControlNet + IP-Adapter for architectural use cases that we should be citing?

---

## 5. What We Are Asking For

1. **Validation of ControlNet approach** — specifically the Canny vs Depth decision
2. **Guidance on IP-Adapter feasibility** within our 8 GB VRAM constraint
3. **Recommended checkpoint** — SDXL base vs interior fine-tune
4. **Pointer to any relevant papers** on architectural image generation quality metrics

---

## 6. Appendix — Hardware Profile

| Component | Spec |
|-----------|------|
| GPU | NVIDIA RTX 4060 8 GB VRAM |
| System RAM | 16 GB |
| ComfyUI version | Latest (stable) |
| PyTorch | 2.x with CUDA 12.x |
| Precision | fp16 (no quantization currently) |
| Tile size | None — full image inference |
| Batch size | 1 |
