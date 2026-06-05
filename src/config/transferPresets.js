/**
 * Style Transfer Preset Definitions
 * Shared between JS orchestrator and TS frontend/API code.
 *
 * Each preset contains:
 *  - prompt: Detailed positive prompt targeting style, materials, lighting, mood, and quality
 *  - negativePrompt: Targeted negative prompt to repel conflicting aesthetics
 */

export const TRANSFER_PRESETS = [
  {
    id: 'japandi',
    name: 'Japandi',
    description: 'Minimalist blend of Japanese elegance and Scandinavian warmth with organic textures',
    prompt:
      'Japandi style interior design, minimalist Japanese and Scandinavian blend, warm neutral colors, natural light wood, simple lines',
    negativePrompt:
      'cluttered, busy, chaotic, maximalist, bright neon colors, saturated hues, ornate gold molding, ' +
      'baroque decoration, heavy dark mahogany furniture, industrial metal pipes, glitzy chandeliers, ' +
      'cartoon, painting, illustration, low quality, blurry, distorted, watermark, oversaturated, ' +
      'overexposed, underexposed, deformed, bad proportions, unrealistic',
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    description: 'Bright, functional simplicity with cozy hygge textures and light Nordic wood',
    prompt:
      'Scandinavian interior design, bright and airy Nordic style, light wood furniture, cozy textures, soft neutral colors',
    negativePrompt:
      'dark walls, heavy mahogany or walnut wood, gold ornate accents, baroque or rococo furniture, ' +
      'cluttered surfaces, gothic or Victorian style, deep jewel tones, tropical patterns, ' +
      'industrial exposed pipes, rusty metal, cartoon, painting, low quality, blurry, distorted, ' +
      'oversaturated, watermark, unrealistic, deformed',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Sleek, sophisticated contemporary design with luxury materials and elegant accents',
    prompt:
      'Contemporary modern interior design, sleek clean lines, black and white palette, marble and brass accents, minimalist furniture',
    negativePrompt:
      'rustic, farmhouse, country cottage, floral chintz patterns, cluttered shelves, ' +
      'antique or vintage furniture, traditional dark wood, brass candelabras, ' +
      'plastic furniture, cheap materials, cartoon, illustration, low quality, blurry, distorted, ' +
      'oversaturated, watermark, deformed, unrealistic proportions',
  },
  {
    id: 'industrial',
    name: 'Industrial',
    description: 'Urban loft aesthetic with exposed brick, concrete, raw steel, and reclaimed wood',
    prompt:
      'Industrial loft style, exposed brick walls, concrete flooring, raw steel, reclaimed wood furniture, dark metal accents',
    negativePrompt:
      'classical Georgian or Victorian style, gold leaf, delicate ornate molding, ' +
      'pastel pink or baby blue, floral wallpaper, soft feminine ruffles, ' +
      'overly polished and pristine surfaces, Japandi minimalism, cartoon, ' +
      'low quality, blurry, distorted, oversaturated, watermark, unrealistic',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Extreme clarity — clutter-free spaces celebrating form, void, and light',
    prompt:
      'Ultra-minimalist interior design, clutter-free open space, monochromatic palette, essential functional furniture, natural light',
    negativePrompt:
      'cluttered, layered, many decorations, patterned wallpaper, bold colors, maximalist, ' +
      'many furniture pieces, busy rugs, excessive textiles, gallery walls, ornate, baroque, ' +
      'rustic, farmhouse, cartoon, illustration, low quality, blurry, distorted, ' +
      'watermark, oversaturated, dark shadows, deformed',
  },
  {
    id: 'bohemian',
    name: 'Bohemian',
    description: 'Eclectic, free-spirited sanctuary rich with global textiles, plants, and layered warmth',
    prompt:
      'Bohemian style interior, terracotta and warm tones, layered rugs, green houseplants, rattan furniture, cozy textured fabrics',
    negativePrompt:
      'sterile, clinical, extreme minimalism, white box, corporate office, high-tech modern, ' +
      'cold grey metal and glass, absence of color, bare empty spaces, ' +
      'Scandinavian plain white walls, cartoon, illustration, low quality, blurry, distorted, ' +
      'watermark, oversaturated, deformed, unrealistic',
  },
  {
    id: 'traditional',
    name: 'Traditional',
    description: 'Timeless classical sophistication with refined dark wood, rich fabrics, and heirloom detail',
    prompt:
      'Traditional classic interior, dark wood furniture, rich elegant colors, decorative moldings, button-tufted leather seating, classical rugs and crystal lighting',
    negativePrompt:
      'ultra-modern, futuristic, sci-fi, neon lights, industrial concrete, exposed pipes, ' +
      'Scandinavian minimalism, IKEA flat-pack style, plastic furniture, ' +
      'bright pop colors, cartoon, illustration, low quality, blurry, distorted, ' +
      'watermark, oversaturated, deformed, unrealistic proportions',
  },
  {
    id: 'general',
    name: 'General',
    description: 'A versatile preset for photorealistic contemporary interior spaces',
    prompt:
      'Photorealistic contemporary style bedroom with books on the sidetable',
    negativePrompt:
      'blurred distorted,nfsw',
  },
];

export const DEFAULT_NEGATIVE_PROMPT =
  'low quality, blurry, distorted, watermark, text overlay, signature, deformed objects, ' +
  'bad anatomy, bad proportions, color bleeding, oversaturated, unrealistic lighting, ' +
  'dark and gloomy, underexposed, overexposed, noise, grain, artifacts, nsfw, ' +
  'cartoon, illustration, painting, drawing, sketch, anime, CGI, 3D render';
