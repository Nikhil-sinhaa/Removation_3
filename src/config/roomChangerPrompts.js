export function buildWallPrompt({ colorName, hex }) {
  // hex is intentionally NOT included in the prompt — CLIP has no semantic
  // encoding for hex codes, and high-weight unknown tokens (amplified by
  // CFG 9.5) were causing oversaturation. Kept in signature for logging only.
  void hex;
  return `(${colorName} painted walls:1.4), ` +
         `(soft matte ${colorName} paint:1.3), ` +
         `${colorName} wall color, smooth even ${colorName} finish, ` +
         `architectural ${colorName} interior, ` +
         `professional interior photography, natural soft daylight, ` +
         `accurate color reproduction, sharp focus, realistic shadows, ` +
         `preserved original furniture and floor, 8k, ultra detailed`;
}

export const NEGATIVE_PROMPT =
  "wrong color, color bleeding onto furniture, patterned wallpaper, " +
  "textured wallpaper, dirty walls, stained walls, blurry, low quality, " +
  "distorted, watermark, text, deformed objects, changed floor, changed furniture";
