import manifest from '../public/style-references/manifest.json';

/**
 * Style Preset Configuration
 *
 * Each preset has 6-8 curated reference images. When the user picks one,
 * that image becomes the IP-Adapter input to ComfyUI (via styleImageFilename).
 * The result visually matches that specific reference photo, not just a text prompt.
 */

export interface StyleReference {
  id: string;
  imageUrl: string;       // path in public/style-references/
  label: string;          // short description e.g. "Warm wood tones"
  prompt: string;         // positive prompt for this specific reference
  negativePrompt: string;
}

export interface StylePreset {
  id: string;
  label: string;
  labelHi: string;        // Hindi translation
  category: 'minimal' | 'traditional' | 'modern' | 'luxury' | 'nature' | 'industrial';
  description: string;
  references: StyleReference[];  // 6-8 curated reference images
  defaultPrompt: string;         // fallback if no reference selected
  defaultNegativePrompt: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'japandi',
    label: 'Japandi',
    labelHi: 'जापांडी',
    category: 'minimal',
    description: 'Japanese minimalism meets Scandinavian warmth',
    defaultPrompt: 'japandi interior design, wabi-sabi aesthetic, natural wood, neutral palette, zen atmosphere, minimalist furniture, warm lighting, (professional architectural photography:1.3)',
    defaultNegativePrompt: 'colorful, busy, ornate, dark, cold, cluttered, cartoon, blurry, distorted',
    references: [
      {
        id: 'japandi-1',
        imageUrl: '/style-references/japandi/warm-wood.jpg',
        label: 'Warm wood tones',
        prompt: 'japandi style, warm oak wood furniture, cream walls, natural linen, paper lamp, bamboo accents, serene minimal, (professional architectural photography:1.3)',
        negativePrompt: 'colorful, busy, ornate, dark, cold, cluttered',
      },
      {
        id: 'japandi-2',
        imageUrl: '/style-references/japandi/dark-zen.jpg',
        label: 'Dark zen palette',
        prompt: 'japandi dark interior, charcoal walls, black accents, warm wood floor, minimal decor, moody zen atmosphere, (professional architectural photography:1.3)',
        negativePrompt: 'colorful, busy, bright white, cluttered, ornate',
      },
      {
        id: 'japandi-3',
        imageUrl: '/style-references/japandi/natural-light.jpg',
        label: 'Bright natural light',
        prompt: 'japandi bright interior, floor to ceiling windows, white walls, light oak, indoor plants, airy minimal, (professional architectural photography:1.3)',
        negativePrompt: 'dark, cluttered, colorful, ornate, busy',
      },
      {
        id: 'japandi-4',
        imageUrl: '/style-references/japandi/stone-texture.jpg',
        label: 'Stone and linen',
        prompt: 'japandi interior, raw stone wall, natural linen textiles, organic shapes, wabi-sabi, neutral earthy palette, (professional architectural photography:1.3)',
        negativePrompt: 'plastic, shiny, colorful, ornate, busy',
      },
      {
        id: 'japandi-5',
        imageUrl: '/style-references/japandi/rattan-accents.jpg',
        label: 'Rattan accents',
        prompt: 'japandi interior, rattan pendant light, white walls, blonde wood, natural textures, cozy hygge, minimal clutter, (professional architectural photography:1.3)',
        negativePrompt: 'dark, ornate, colorful, metal dominant, plastic',
      },
      {
        id: 'japandi-6',
        imageUrl: '/style-references/japandi/clay-palette.jpg',
        label: 'Clay and cream',
        prompt: 'japandi interior, clay-toned walls, cream linen sofa, terracotta pots, dried botanicals, warm neutral palette, (professional architectural photography:1.3)',
        negativePrompt: 'cold, dark, colorful, ornate, busy',
      },
    ],
  },
  {
    id: 'traditional-indian',
    label: 'Traditional Indian',
    labelHi: 'पारंपरिक भारतीय',
    category: 'traditional',
    description: 'Rich colors, carved wood, and timeless Indian craftsmanship',
    defaultPrompt: 'traditional Indian interior, rich jewel tones, carved wooden furniture, brass accents, block print textiles, warm lighting, heritage aesthetic, (professional architectural photography:1.3)',
    defaultNegativePrompt: 'modern, minimal, plain, cold, industrial, cluttered mess',
    references: [
      {
        id: 'indian-1',
        imageUrl: '/style-references/traditional-indian/rajasthani.jpg',
        label: 'Rajasthani royal',
        prompt: 'Rajasthani interior design, deep blue and gold, carved jharokha, colorful cushions, brass diyas, royal heritage, (professional architectural photography:1.3)',
        negativePrompt: 'modern, minimal, plain, cold, industrial',
      },
      {
        id: 'indian-2',
        imageUrl: '/style-references/traditional-indian/kerala.jpg',
        label: 'Kerala traditional',
        prompt: 'Kerala traditional interior, teak wood furniture, terracotta floor tiles, coir mat, brass lamps, natural materials, (professional architectural photography:1.3)',
        negativePrompt: 'modern, bright colors, plastic, minimal',
      },
      {
        id: 'indian-3',
        imageUrl: '/style-references/traditional-indian/mughal.jpg',
        label: 'Mughal elegance',
        prompt: 'Mughal-inspired interior, intricate lattice screens, jewel-toned velvet, gold accents, arched doorways, ornate patterns, (professional architectural photography:1.3)',
        negativePrompt: 'plain, modern, minimal, cold, industrial',
      },
      {
        id: 'indian-4',
        imageUrl: '/style-references/traditional-indian/gujarat.jpg',
        label: 'Gujarati folk art',
        prompt: 'Gujarati interior, mirror work embroidery, vibrant textiles, carved wooden furniture, colorful rangoli motifs, warm lighting, (professional architectural photography:1.3)',
        negativePrompt: 'plain, cold, modern, minimal, dark',
      },
      {
        id: 'indian-5',
        imageUrl: '/style-references/traditional-indian/bengali.jpg',
        label: 'Bengali colonial',
        prompt: 'Bengali colonial interior, terracotta accents, jute textiles, wooden furniture, white walls, traditional crafts, (professional architectural photography:1.3)',
        negativePrompt: 'industrial, plastic, minimal, cold, western modern',
      },
      {
        id: 'indian-6',
        imageUrl: '/style-references/traditional-indian/haveli.jpg',
        label: 'Haveli courtyard',
        prompt: 'Indian haveli interior, arched courtyard, sandstone walls, brass urns, carved pillars, terracotta pots, warm afternoon light, (professional architectural photography:1.3)',
        negativePrompt: 'modern, minimal, cold, industrial, glass',
      },
    ],
  },
  {
    id: 'scandinavian',
    label: 'Scandinavian',
    labelHi: 'स्कैंडिनेवियन',
    category: 'minimal',
    description: 'Clean lines, functional beauty, hygge warmth',
    defaultPrompt: 'Scandinavian interior, white walls, light pine wood, hygge cozy, simple functional furniture, warm textiles, (professional architectural photography:1.3)',
    defaultNegativePrompt: 'dark, ornate, colorful, busy, industrial, cluttered',
    references: [
      {
        id: 'scandi-1',
        imageUrl: '/style-references/scandinavian/white-cozy.jpg',
        label: 'White and cozy',
        prompt: 'Scandinavian white interior, fluffy throws, candles, light wood, minimal clutter, warm cozy atmosphere, (professional architectural photography:1.3)',
        negativePrompt: 'dark, ornate, colorful, busy, cluttered',
      },
      {
        id: 'scandi-2',
        imageUrl: '/style-references/scandinavian/grey-nordic.jpg',
        label: 'Grey Nordic tones',
        prompt: 'Scandinavian grey interior, charcoal accents, light ash wood, geometric textiles, functional design, muted palette, (professional architectural photography:1.3)',
        negativePrompt: 'colorful, busy, ornate, dark, cluttered',
      },
      {
        id: 'scandi-3',
        imageUrl: '/style-references/scandinavian/nature-inspired.jpg',
        label: 'Nature inspired',
        prompt: 'Scandinavian interior, sage green, natural pine, potted plants, rattan accents, organic textures, warm natural light, (professional architectural photography:1.3)',
        negativePrompt: 'dark, ornate, colorful excess, busy, cluttered',
      },
      {
        id: 'scandi-4',
        imageUrl: '/style-references/scandinavian/minimalist-black.jpg',
        label: 'Black accents minimal',
        prompt: 'Scandinavian black accent interior, white walls, black metal frames, light oak, graphic prints, minimal functional, (professional architectural photography:1.3)',
        negativePrompt: 'colorful, busy, ornate, cluttered, cold',
      },
      {
        id: 'scandi-5',
        imageUrl: '/style-references/scandinavian/warm-hygge.jpg',
        label: 'Warm hygge',
        prompt: 'hygge Scandinavian interior, warm amber lighting, chunky knit throws, candles everywhere, wood burning fireplace, cozy layered textiles, (professional architectural photography:1.3)',
        negativePrompt: 'cold, minimal, stark, dark, cluttered',
      },
    ],
  },
  {
    id: 'industrial',
    label: 'Industrial',
    labelHi: 'इंडस्ट्रियल',
    category: 'industrial',
    description: 'Raw materials, exposed brick, urban edge',
    defaultPrompt: 'industrial interior design, exposed brick wall, metal accents, concrete floor, Edison bulbs, raw materials, urban loft, (professional architectural photography:1.3)',
    defaultNegativePrompt: 'soft, minimal, white, clean, ornate, traditional, delicate',
    references: [
      {
        id: 'industrial-1',
        imageUrl: '/style-references/industrial/raw-brick.jpg',
        label: 'Raw exposed brick',
        prompt: 'industrial loft, exposed red brick, metal pipe shelving, concrete floor, warm Edison lights, rustic wood, (professional architectural photography:1.3)',
        negativePrompt: 'soft, minimal, white, clean, ornate',
      },
      {
        id: 'industrial-2',
        imageUrl: '/style-references/industrial/concrete-steel.jpg',
        label: 'Concrete and steel',
        prompt: 'modern industrial interior, polished concrete floor, steel beams, exposed ductwork, factory windows, minimal furniture, (professional architectural photography:1.3)',
        negativePrompt: 'soft, colorful, ornate, traditional, warm',
      },
      {
        id: 'industrial-3',
        imageUrl: '/style-references/industrial/dark-loft.jpg',
        label: 'Dark urban loft',
        prompt: 'dark industrial loft, charcoal walls, black metal frames, aged wood, dramatic pendant lights, moody urban, (professional architectural photography:1.3)',
        negativePrompt: 'bright, soft, colorful, ornate, traditional',
      },
      {
        id: 'industrial-4',
        imageUrl: '/style-references/industrial/warehouse.jpg',
        label: 'Warehouse conversion',
        prompt: 'warehouse loft interior, high ceilings, factory windows, salvaged wood, metal trusses, rough textures, raw aesthetic, (professional architectural photography:1.3)',
        negativePrompt: 'soft, delicate, ornate, colorful, traditional',
      },
      {
        id: 'industrial-5',
        imageUrl: '/style-references/industrial/steampunk.jpg',
        label: 'Steampunk accents',
        prompt: 'steampunk industrial interior, copper pipe accents, gear motifs, leather chesterfield, Edison bulb chandelier, aged brass, (professional architectural photography:1.3)',
        negativePrompt: 'minimal, clean, modern, colorful, delicate',
      },
    ],
  },
  {
    id: 'luxury',
    label: 'Luxury',
    labelHi: 'लग्जरी',
    category: 'luxury',
    description: 'Premium materials, statement pieces, opulent finishes',
    defaultPrompt: 'luxury interior design, marble floors, velvet furniture, gold accents, crystal chandelier, high-end finishes, opulent, (professional architectural photography:1.3)',
    defaultNegativePrompt: 'plain, minimal, cheap, dull, industrial, rustic',
    references: [
      {
        id: 'luxury-1',
        imageUrl: '/style-references/luxury/marble-gold.jpg',
        label: 'Marble and gold',
        prompt: 'luxury interior, white marble floor, gold hardware, velvet sofa, crystal chandelier, tall ceilings, opulent, (professional architectural photography:1.3)',
        negativePrompt: 'plain, minimal, cheap, dull, industrial',
      },
      {
        id: 'luxury-2',
        imageUrl: '/style-references/luxury/dark-glamour.jpg',
        label: 'Dark glamour',
        prompt: 'dark luxury interior, deep navy walls, gold accents, velvet furniture, art deco details, dramatic lighting, glamorous, (professional architectural photography:1.3)',
        negativePrompt: 'plain, minimal, bright white, rustic, industrial',
      },
      {
        id: 'luxury-3',
        imageUrl: '/style-references/luxury/french-chateau.jpg',
        label: 'French château',
        prompt: 'French château interior, ornate moldings, antique furniture, silk drapes, gilded mirrors, herringbone parquet, aristocratic, (professional architectural photography:1.3)',
        negativePrompt: 'modern, minimal, industrial, plain, dark',
      },
      {
        id: 'luxury-4',
        imageUrl: '/style-references/luxury/contemporary-luxury.jpg',
        label: 'Contemporary luxury',
        prompt: 'contemporary luxury interior, travertine stone, warm beige palette, sculptural furniture, statement art, ambient lighting, (professional architectural photography:1.3)',
        negativePrompt: 'ornate, traditional, industrial, plain, cluttered',
      },
      {
        id: 'luxury-5',
        imageUrl: '/style-references/luxury/penthouse.jpg',
        label: 'Penthouse modern',
        prompt: 'penthouse luxury interior, floor-to-ceiling glass, city views, bespoke furniture, Italian marble, designer lighting, premium materials, (professional architectural photography:1.3)',
        negativePrompt: 'traditional, ornate, rustic, plain, cheap',
      },
      {
        id: 'luxury-6',
        imageUrl: '/style-references/luxury/art-deco.jpg',
        label: 'Art Deco opulence',
        prompt: 'art deco interior, geometric patterns, gold leaf ceiling, lacquered furniture, mirrored surfaces, fan motifs, glamorous 1920s, (professional architectural photography:1.3)',
        negativePrompt: 'minimal, rustic, plain, industrial, modern minimal',
      },
    ],
  },
  {
    id: 'bohemian',
    label: 'Bohemian',
    labelHi: 'बोहेमियन',
    category: 'nature',
    description: 'Eclectic, layered, free-spirited and colorful',
    defaultPrompt: 'bohemian interior, layered rugs, macrame wall art, plants everywhere, colorful cushions, rattan furniture, eclectic art, (professional architectural photography:1.3)',
    defaultNegativePrompt: 'minimal, plain, dark, corporate, industrial, sterile',
    references: [
      {
        id: 'boho-1',
        imageUrl: '/style-references/bohemian/colorful-plants.jpg',
        label: 'Colorful with plants',
        prompt: 'boho interior, hanging plants, colorful throw pillows, macrame, vintage rugs, natural light, eclectic mix, (professional architectural photography:1.3)',
        negativePrompt: 'minimal, plain, dark, corporate, sterile',
      },
      {
        id: 'boho-2',
        imageUrl: '/style-references/bohemian/moroccan.jpg',
        label: 'Moroccan boho',
        prompt: 'Moroccan bohemian interior, lanterns, colorful zellige tiles, poufs, patterned textiles, arched doorways, rich jewel tones, (professional architectural photography:1.3)',
        negativePrompt: 'minimal, cold, industrial, plain, modern',
      },
      {
        id: 'boho-3',
        imageUrl: '/style-references/bohemian/earthy-boho.jpg',
        label: 'Earthy tones boho',
        prompt: 'earthy bohemian interior, terracotta walls, natural rattan, woven textiles, dried flowers, amber lighting, organic warmth, (professional architectural photography:1.3)',
        negativePrompt: 'cold, minimal, industrial, dark, sterile',
      },
      {
        id: 'boho-4',
        imageUrl: '/style-references/bohemian/vintage-eclectic.jpg',
        label: 'Vintage eclectic',
        prompt: 'vintage boho interior, mismatched furniture, gallery wall, layered rugs, flea market finds, warm patina, creative chaos, (professional architectural photography:1.3)',
        negativePrompt: 'minimal, new, cold, industrial, plain',
      },
      {
        id: 'boho-5',
        imageUrl: '/style-references/bohemian/global-traveler.jpg',
        label: 'Global traveler',
        prompt: 'global boho interior, world travel artifacts, kilim rugs, tribal textiles, carved wooden pieces, collected over decades, eclectic, (professional architectural photography:1.3)',
        negativePrompt: 'minimal, corporate, cold, industrial, new',
      },
    ],
  },
  {
    id: 'modern-minimalist',
    label: 'Modern Minimalist',
    labelHi: 'मॉडर्न मिनिमलिस्ट',
    category: 'modern',
    description: 'Clean geometry, neutral palette, purposeful spaces',
    defaultPrompt: 'modern minimalist interior, clean lines, neutral palette, hidden storage, statement lighting, purposeful design, (professional architectural photography:1.3)',
    defaultNegativePrompt: 'busy, colorful, ornate, dark, cluttered, traditional',
    references: [
      {
        id: 'modern-1',
        imageUrl: '/style-references/modern-minimalist/white-clean.jpg',
        label: 'Pure white clean',
        prompt: 'modern minimalist interior, all white, clean geometry, hidden storage, statement pendant light, no clutter, (professional architectural photography:1.3)',
        negativePrompt: 'busy, colorful, ornate, dark, cluttered',
      },
      {
        id: 'modern-2',
        imageUrl: '/style-references/modern-minimalist/warm-neutral.jpg',
        label: 'Warm neutral tones',
        prompt: 'modern minimalist interior, warm greige palette, clean lines, floating shelves, sculptural furniture, diffused lighting, (professional architectural photography:1.3)',
        negativePrompt: 'colorful, ornate, cluttered, busy, traditional',
      },
      {
        id: 'modern-3',
        imageUrl: '/style-references/modern-minimalist/black-white.jpg',
        label: 'Monochrome bold',
        prompt: 'minimalist monochrome interior, black and white palette, graphic contrast, minimal furniture, architectural details, statement art, (professional architectural photography:1.3)',
        negativePrompt: 'colorful, ornate, cluttered, busy, warm',
      },
      {
        id: 'modern-4',
        imageUrl: '/style-references/modern-minimalist/concrete-minimal.jpg',
        label: 'Concrete minimal',
        prompt: 'modern minimalist concrete interior, raw concrete walls, polished floor, floating furniture, indirect lighting, zen calm, (professional architectural photography:1.3)',
        negativePrompt: 'ornate, colorful, cluttered, traditional, busy',
      },
      {
        id: 'modern-5',
        imageUrl: '/style-references/modern-minimalist/japandi-modern.jpg',
        label: 'Modern japandi',
        prompt: 'modern japandi interior, warm wood accents, muted palette, floating TV unit, minimal art, clean geometry, functional design, (professional architectural photography:1.3)',
        negativePrompt: 'ornate, colorful, cluttered, busy, traditional',
      },
    ],
  },
  {
    id: 'vastu-traditional',
    label: 'Vastu Traditional',
    labelHi: 'वास्तु पारंपरिक',
    category: 'traditional',
    description: 'Vastu-compliant layout with traditional Indian warmth',
    defaultPrompt: 'vastu compliant Indian interior, warm earth tones, northeast light, wooden furniture, traditional motifs, harmonious layout, (professional architectural photography:1.3)',
    defaultNegativePrompt: 'dark, cold, metal dominant, cluttered, western modern',
    references: [
      {
        id: 'vastu-1',
        imageUrl: '/style-references/vastu-traditional/warm-earth.jpg',
        label: 'Warm earth tones',
        prompt: 'vastu interior, warm ochre walls, teak wood furniture, brass accents, natural light from northeast, harmonious calm, (professional architectural photography:1.3)',
        negativePrompt: 'dark, cold, metal dominant, cluttered',
      },
      {
        id: 'vastu-2',
        imageUrl: '/style-references/vastu-traditional/wood-temple.jpg',
        label: 'Wood and temple motifs',
        prompt: 'vastu traditional interior, sandalwood furniture, temple carved motifs, copper vessels, turmeric yellow walls, pooja corner, (professional architectural photography:1.3)',
        negativePrompt: 'cold, modern, industrial, dark, western',
      },
      {
        id: 'vastu-3',
        imageUrl: '/style-references/vastu-traditional/green-harmony.jpg',
        label: 'Green and harmony',
        prompt: 'vastu interior, sage green walls, tulsi plant in northeast, wooden furniture, natural cotton textiles, harmonious layout, (professional architectural photography:1.3)',
        negativePrompt: 'dark, cold, metal dominant, cluttered, neon',
      },
      {
        id: 'vastu-4',
        imageUrl: '/style-references/vastu-traditional/white-serene.jpg',
        label: 'White serene',
        prompt: 'vastu interior, white walls, wooden furniture, brass diyas, natural light, minimal clutter, peaceful harmonious, (professional architectural photography:1.3)',
        negativePrompt: 'dark, cluttered, cold, industrial, chaotic',
      },
    ],
  },
];

export function getPresetById(id: string): StylePreset | undefined {
  return STYLE_PRESETS.find(p => p.id === id);
}

export function getAllPresets(): StylePreset[] {
  return STYLE_PRESETS;
}

export function getPresetsByCategory(category: StylePreset['category']): StylePreset[] {
  return STYLE_PRESETS.filter(p => p.category === category);
}

export function getReferenceById(presetId: string, referenceId: string): StyleReference | undefined {
  const preset = getPresetById(presetId);
  return preset?.references.find(r => r.id === referenceId);
}

// Merge manifest URLs into preset definitions
export function getPresetsWithImages(): StylePreset[] {
  return STYLE_PRESETS.map(preset => {
    const manifestEntry = manifest.find(m => m.id === preset.id);
    if (!manifestEntry) return preset;
    
    return {
      ...preset,
      references: preset.references.map(ref => {
        const manifestRef = manifestEntry.references.find(r => r.id === ref.id);
        return {
          ...ref,
          imageUrl: manifestRef?.exists ? manifestRef.imageUrl : '/style-references/placeholder.jpg'
        };
      })
    };
  });
}
