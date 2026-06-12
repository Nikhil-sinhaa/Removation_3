/**
 * vastuDetectionBuilder.js
 *
 * Builds a ComfyUI API-format workflow for per-element Vastu object detection.
 *
 * Runs 8 GroundingDINO + SAM2 passes — one per Vastu-relevant element group —
 * and saves a separate binary mask image for each pass. The orchestrator
 * (vastuDetectionOrchestrator.js) retrieves these masks, extracts bounding
 * boxes via vastuElementExtractor.ts, and constructs DetectedElement[] for
 * the Vastu scoring engine.
 *
 * Models used (confirmed installed on this machine):
 *   GroundingDINO_SwinT_OGC (694MB)   — grounding_dino_model
 *   sam2_hiera_small.pt                — sam_model
 *
 * Peak VRAM: ~900 MB (same profile as buildStableStage1 — SAM2 hiera_small)
 *
 * Output files in ComfyUI output/vastu_detect/:
 *   bed_mask_00001_.png
 *   stove_sink_mask_00001_.png
 *   mirror_mask_00001_.png
 *   door_mask_00001_.png
 *   toilet_mask_00001_.png
 *   idol_temple_mask_00001_.png
 *   plant_mask_00001_.png
 *   aquarium_fountain_mask_00001_.png
 *
 * This file is purely additive — it does NOT modify ultraProBuilder.js or
 * any existing workflow builder.
 */

/**
 * Pass definitions for Vastu element detection.
 *
 * Exported so vastuDetectionOrchestrator.js can map output mask filenames back
 * to VastuElementType values without duplicating this table.
 *
 * Each entry:
 *   nodeId      — ComfyUI node ID of the GroundingDinoSAM2Segment node
 *   passName    — used as the SaveImage filename_prefix suffix
 *   elementTypes — VastuElementType values this pass covers
 *   prompt      — GroundingDINO text prompt (period-separated phrases)
 *   threshold   — DINO detection confidence threshold
 *
 * Grouping rationale:
 *   stove_sink      — Both are kitchen elements; their union mask supports the
 *                     fire–water clash rule (kitchen-003). Cannot distinguish
 *                     per-pixel in v1 — split into separate passes in v2 if
 *                     per-element position accuracy is needed.
 *   idol_temple     — Both indicate a puja zone; Vastu rules (pooja-001–006)
 *                     care about the zone's direction, not which specific item
 *                     is present. Safe to group.
 *   aquarium_fountain — Both are "water features" with identical Vastu
 *                       significance (NE placement). Visually distinct enough
 *                       that combined presence detection is sufficient for v1.
 *
 * @type {Array<{
 *   nodeId: string,
 *   passName: string,
 *   elementTypes: string[],
 *   prompt: string,
 *   threshold: number
 * }>}
 */
export const VASTU_PASS_DEFINITIONS = [
  {
    nodeId: '10',
    passName: 'bed',
    elementTypes: ['bed'],
    prompt: 'bed . bed frame . double bed . single bed . mattress . cot . bunk bed . sleeping mattress',
    threshold: 0.28,
  },
  {
    // NOTE: Combined mask — stove vs. sink pixels cannot be distinguished individually.
    // For v1, presence detection is sufficient for kitchen-003 (stove–sink clash rule).
    // Split into separate passes in v2 for per-element position accuracy.
    nodeId: '11',
    passName: 'stove_sink',
    elementTypes: ['stove', 'sink'],
    prompt: 'gas stove . cooktop . kitchen stove . hob . stovetop . cook stove . kitchen sink . sink . wash basin . tap',
    threshold: 0.25,
  },
  {
    nodeId: '12',
    passName: 'mirror',
    elementTypes: ['mirror'],
    prompt: 'mirror . wall mirror . dressing mirror . full length mirror . vanity mirror . bathroom mirror . mirror cabinet',
    threshold: 0.27,
  },
  {
    nodeId: '13',
    passName: 'door',
    elementTypes: ['door'],
    prompt: 'door . main door . entrance door . wooden door . room door . front door . doorway . door frame . entrance',
    threshold: 0.28,
  },
  {
    nodeId: '14',
    passName: 'toilet',
    elementTypes: ['toilet'],
    prompt: 'toilet . commode . toilet seat . western toilet . WC . toilet bowl . lavatory . Indian toilet . squat toilet',
    threshold: 0.28,
  },
  {
    // NOTE: Both idol and temple indicate a puja area. All pooja-category rules
    // evaluate the zone direction, not the specific object type.
    nodeId: '15',
    passName: 'idol_temple',
    elementTypes: ['idol', 'temple'],
    prompt: 'idol . statue . deity . god statue . brass idol . marble idol . mandir . temple . pooja stand . altar . puja shelf . shrine',
    threshold: 0.22,
  },
  {
    nodeId: '16',
    passName: 'plant',
    elementTypes: ['plant'],
    prompt: 'indoor plant . potted plant . plant pot . flower pot . tulsi . money plant . bamboo plant . cactus . succulent . houseplant . fern',
    threshold: 0.23,
  },
  {
    // NOTE: Both are water features with identical Vastu significance (NE placement).
    nodeId: '17',
    passName: 'aquarium_fountain',
    elementTypes: ['aquarium', 'fountain'],
    prompt: 'aquarium . fish tank . fish bowl . water fountain . indoor fountain . tabletop fountain . water feature',
    threshold: 0.22,
  },
];

/**
 * Builds a ComfyUI API-format workflow for Vastu element detection.
 *
 * The returned object is in ComfyUI API format: { nodeId: { class_type, inputs } }.
 * Submit it via comfyBridge.submitAndWait() (never raw fetch to /prompt).
 *
 * Node layout:
 *   '1'       LoadImage               — input image
 *   '2'       GroundingDinoModelLoader — shared across all passes
 *   '3'       SAM2ModelLoader          — shared across all passes
 *   '10'–'17' GroundingDinoSAM2Segment — one per pass (output slot 1 = MASK)
 *   '20'–'27' MaskToImage              — convert MASK tensor → IMAGE tensor
 *   '30'–'37' SaveImage                — write each mask to output/vastu_detect/
 *
 * @param {string} imageFilename - Input image filename in ComfyUI/input/
 * @param {object} [opts]
 * @param {string} [opts.roomType] - Room type hint (reserved for future threshold tuning)
 * @returns {object} ComfyUI API-format workflow
 */
export function buildVastuElementDetection(imageFilename, opts = {}) {
  const w = {};

  // ── 1. Load Input Image ───────────────────────────────────────────────
  w['1'] = {
    class_type: 'LoadImage',
    inputs: { image: imageFilename, upload: 'image' },
  };

  // ── 2–3. Model Loaders (shared across all 8 passes) ──────────────────
  // Identical to buildStableStage1 — same confirmed-installed models.
  w['2'] = {
    class_type: 'GroundingDinoModelLoader (segment anything2)',
    inputs: { model_name: 'GroundingDINO_SwinT_OGC (694MB)' },
  };
  w['3'] = {
    class_type: 'SAM2ModelLoader (segment anything2)',
    inputs: { model_name: 'sam2_hiera_small.pt' },
  };

  // ── 10–17. GroundingDINO + SAM2 Segmentation Passes ──────────────────
  // Output slot 0 = IMAGE (visualization overlay)
  // Output slot 1 = MASK (binary tensor — used by MaskToImage nodes below)
  // keep_model_loaded: true on all but the last pass — avoids reloading DINO
  // and SAM2 between consecutive passes and saves ~3–5 s per transition.
  for (let i = 0; i < VASTU_PASS_DEFINITIONS.length; i++) {
    const pass = VASTU_PASS_DEFINITIONS[i];
    const isLast = i === VASTU_PASS_DEFINITIONS.length - 1;
    w[pass.nodeId] = {
      class_type: 'GroundingDinoSAM2Segment (segment anything2)',
      inputs: {
        sam_model: ['3', 0],
        grounding_dino_model: ['2', 0],
        image: ['1', 0],
        prompt: pass.prompt,
        threshold: pass.threshold,
        keep_model_loaded: !isLast,
      },
    };
  }

  // ── 20–27. MaskToImage Conversions ───────────────────────────────────
  // GroundingDinoSAM2Segment slot 1 is a MASK tensor; SaveImage requires
  // an IMAGE tensor. MaskToImage handles the conversion (grayscale 0–1 → RGB).
  // Node ID = segment node ID + 10 (e.g. '10' → '20', '17' → '27').
  for (const pass of VASTU_PASS_DEFINITIONS) {
    const mtiId = String(parseInt(pass.nodeId, 10) + 10);
    w[mtiId] = {
      class_type: 'MaskToImage',
      inputs: { mask: [pass.nodeId, 1] },
    };
  }

  // ── 30–37. SaveImage Outputs ──────────────────────────────────────────
  // Node ID = segment node ID + 20 (e.g. '10' → '30', '17' → '37').
  // filename_prefix uses the 'vastu_detect/' subdirectory so these outputs
  // don't pollute the top-level output/ directory.
  for (const pass of VASTU_PASS_DEFINITIONS) {
    const mtiId = String(parseInt(pass.nodeId, 10) + 10);
    const saveId = String(parseInt(pass.nodeId, 10) + 20);
    w[saveId] = {
      class_type: 'SaveImage',
      inputs: {
        images: [mtiId, 0],
        filename_prefix: `vastu_detect/${pass.passName}_mask`,
      },
    };
  }

  return w;
}
