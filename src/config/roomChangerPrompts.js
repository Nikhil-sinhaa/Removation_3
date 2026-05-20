export function buildWallPrompt({ colorName, hex }) {
  return `(${colorName} walls:1.8), (${hex} ${colorName} paint:1.7), ` +
         `(flat ${colorName} matte surface:1.6), (${colorName} wall color:1.5), ` +
         `solid ${colorName} walls, ${colorName} painted walls, ` +
         `crisp ${colorName} interior, architectural ${colorName}, ` +
         `clean ${colorName} plaster, ${colorName} interior walls, ` +
         `professional interior photography, natural soft daylight, ` +
         `accurate color reproduction, sharp focus, realistic shadows, ` +
         `preserved original furniture and floor, 8k, ultra detailed`;
}

export const NEGATIVE_PROMPT =
  "wrong color, color bleeding onto furniture, patterned wallpaper, " +
  "textured wallpaper, dirty walls, stained walls, blurry, low quality, " +
  "distorted, watermark, text, deformed objects, changed floor, changed furniture";
