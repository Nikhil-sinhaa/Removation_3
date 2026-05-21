/**
 * Ceiling Changer prompt builder.
 *
 * Rules learned from Room Changer:
 * - NO hex codes — CLIP tokenizes them as noise
 * - Weights MAX 1.4 — higher causes overshoot at CFG 9.5
 * - Ceiling-specific terms — guides SDXL to treat it as ceiling, not wall
 */

export function buildCeilingPrompt({ colorName }) {
  // hex is intentionally NOT included in the prompt — CLIP has no semantic
  // encoding for hex codes, and high-weight unknown tokens (amplified by
  // CFG 9.5) were causing oversaturation. Kept in signature for logging only.
  return `(${colorName} ceiling:1.4), ` +
         `(${colorName} painted ceiling:1.3), ` +
         `smooth ${colorName} ceiling surface, ` +
         `flat matte ${colorName} ceiling paint, ` +
         `${colorName} overhead surface, ` +
         `professional interior photography, ` +
         `natural soft lighting, accurate color reproduction, ` +
         `sharp focus, preserved walls and floor, ` +
         `preserved light fixtures, preserved crown moulding, ` +
         `8k, ultra detailed`;
}

export const CEILING_NEGATIVE_PROMPT =
  'wrong color, color bleeding onto walls, color bleeding onto floor, ' +
  'patterned ceiling, textured wallpaper, exposed beams, popcorn texture, ' +
  'water stains, dirty ceiling, blurry, low quality, distorted, ' +
  'watermark, text, changed walls, changed furniture, changed floor';
