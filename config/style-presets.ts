/**
 * Style Preset Configuration — Room-Type-Aware
 *
 * Each preset has:
 *  - roomTypes: which room-type subfolders exist in public/style-references/{preset.id}/
 *  - variants: 2-4 design directions (used as step 3 in the guided flow)
 *  - getReferenceImage: picks a representative image for a given room type
 */

export type RoomType = 'bedroom' | 'bathroom' | 'livingroom' | 'kitchen';

export const ROOM_TYPES: { id: RoomType; label: string; emoji: string; description: string }[] = [
  { id: 'bedroom',    label: 'Bedroom',     emoji: '🛏',  description: 'Sleep & relaxation space' },
  { id: 'livingroom', label: 'Living Room',  emoji: '🛋',  description: 'Family & social area' },
  { id: 'kitchen',    label: 'Kitchen',      emoji: '🍳',  description: 'Cooking & dining space' },
  { id: 'bathroom',   label: 'Bathroom',     emoji: '🛁',  description: 'Wash & refresh zone' },
];

export interface DesignVariant {
  id: string;
  label: string;         // e.g. "Warm & Cozy"
  description: string;   // one-line shown under label
  promptSuffix: string;  // added to the positive prompt
  // thumbnail is NOT stored here — it is computed at render time from
  // the selected roomType: /style-references/{presetId}/{roomType}/ref-{n}.jpeg
}

/** Legacy interface kept for backward-compat with StyleReferenceGallery */
export interface StyleReference {
  id: string;
  imageUrl: string;
  label: string;
  prompt: string;
  negativePrompt: string;
}

export interface StylePreset {
  id: string;
  label: string;
  labelHi: string;
  icon: string;
  category: 'minimal' | 'traditional' | 'modern' | 'luxury' | 'nature' | 'industrial';
  description: string;
  roomTypes: RoomType[];
  variants: DesignVariant[];
  defaultPrompt: string;
  defaultNegativePrompt: string;
  /** @deprecated use variants instead — kept for backward compat */
  references: StyleReference[];
  /**
   * Returns a URL path to a representative image from
   * public/style-references/{preset.id}/{roomType}/
   * Falls back to the first variant thumbnail if no room folder exists.
   */
  getReferenceImage: (roomType: RoomType) => string;
}

// ─── Runtime image picker (client-side: returns a deterministic path) ──────
function makeGetReferenceImage(presetId: string) {
  return (roomType: RoomType): string => {
    return `/style-references/${presetId}/${roomType}/ref-1.jpeg`;
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// PRESET DEFINITIONS
// ══════════════════════════════════════════════════════════════════════════════

export const STYLE_PRESETS: StylePreset[] = [
  // ── Modern ─────────────────────────────────────────────────────────────────
  {
    id: 'modern',
    label: 'Modern',
    labelHi: 'मॉडर्न',
    icon: '🏙',
    category: 'modern',
    description: 'Contemporary lines, balanced spaces, sophisticated materials',
    roomTypes: ['bedroom', 'bathroom', 'livingroom', 'kitchen'],
    defaultPrompt: 'modern interior design, contemporary style, clean lines, neutral palette, professional architectural photography',
    defaultNegativePrompt: 'old fashioned, ornate, cluttered, dark, cartoon, blurry',
    variants: [
      {
        id: 'clean-minimal',
        label: 'Clean & Minimal',
        description: 'Pure whites, hidden storage, statement lighting',
        promptSuffix: ', modern minimalist, all white, clean geometry, hidden storage, statement pendant light',
      },
      {
        id: 'warm-neutral',
        label: 'Warm & Inviting',
        description: 'Greige tones, natural textures, soft lighting',
        promptSuffix: ', warm greige palette, clean lines, sculptural furniture, diffused lighting, natural textures',
      },
      {
        id: 'bold-dramatic',
        label: 'Bold & Dramatic',
        description: 'Dark accents, high contrast, statement pieces',
        promptSuffix: ', bold modern interior, dark accents, high contrast, monochrome, architectural statement',
      },
      {
        id: 'nature-infused',
        label: 'Nature Infused',
        description: 'Biophilic elements, wood, indoor plants',
        promptSuffix: ', biophilic modern design, natural wood accents, indoor plants, organic materials, warm natural light',
      },
    ],
    references: [
      { id: 'modern-ref-1', imageUrl: '/style-references/modern/livingroom/ref-1.jpeg', label: 'Modern Living', prompt: 'modern interior design, contemporary style, clean lines', negativePrompt: 'cluttered, dark, ornate' },
    ],
    getReferenceImage: makeGetReferenceImage('modern'),
  },

  // ── Japandi ─────────────────────────────────────────────────────────────────
  {
    id: 'japandi',
    label: 'Japandi',
    labelHi: 'जापांडी',
    icon: '🌸',
    category: 'minimal',
    description: 'Japanese minimalism meets Scandinavian warmth',
    roomTypes: ['bedroom', 'bathroom', 'livingroom', 'kitchen'],
    defaultPrompt: 'japandi interior design, wabi-sabi aesthetic, natural wood, neutral palette, zen atmosphere, minimalist furniture, warm lighting, professional architectural photography',
    defaultNegativePrompt: 'colorful, busy, ornate, dark, cold, cluttered, cartoon, blurry',
    variants: [
      {
        id: 'warm-wood',
        label: 'Warm Wood',
        description: 'Oak tones, cream walls, natural linen',
        promptSuffix: ', japandi style, warm oak wood furniture, cream walls, natural linen, bamboo accents, serene minimal',
      },
      {
        id: 'dark-zen',
        label: 'Dark Zen',
        description: 'Charcoal walls, black accents, moody atmosphere',
        promptSuffix: ', japandi dark interior, charcoal walls, black accents, warm wood floor, minimal decor, moody zen',
      },
      {
        id: 'natural-light',
        label: 'Natural Light',
        description: 'Floor-to-ceiling windows, airy and bright',
        promptSuffix: ', japandi bright interior, floor to ceiling windows, white walls, light oak, indoor plants, airy minimal',
      },
      {
        id: 'wabi-sabi',
        label: 'Wabi-Sabi',
        description: 'Raw textures, imperfection as beauty',
        promptSuffix: ', japandi interior, raw stone wall, natural linen textiles, organic shapes, wabi-sabi, neutral earthy palette',
      },
    ],
    references: [
      { id: 'japandi-ref-1', imageUrl: '/style-references/japandi/bedroom/ref-1.jpeg', label: 'Warm Wood', prompt: 'japandi style, warm oak wood furniture, cream walls, natural linen', negativePrompt: 'colorful, busy, ornate' },
      { id: 'japandi-ref-2', imageUrl: '/style-references/japandi/livingroom/ref-1.jpeg', label: 'Dark Zen', prompt: 'japandi dark interior, charcoal walls, black accents', negativePrompt: 'colorful, busy, bright' },
    ],
    getReferenceImage: makeGetReferenceImage('japandi'),
  },

  // ── Minimalistic ─────────────────────────────────────────────────────────────
  {
    id: 'minimalistic',
    label: 'Minimalistic',
    labelHi: 'मिनिमलिस्टिक',
    icon: '◻',
    category: 'minimal',
    description: 'Clean geometry, neutral palette, purposeful spaces',
    roomTypes: ['bedroom', 'bathroom', 'livingroom', 'kitchen'],
    defaultPrompt: 'minimalistic interior design, clean lines, neutral palette, hidden storage, purposeful design, uncluttered space, professional architectural photography',
    defaultNegativePrompt: 'busy, colorful, ornate, dark, cluttered, traditional',
    variants: [
      {
        id: 'pure-white',
        label: 'Pure White',
        description: 'All white, ultra-clean, gallery-like calm',
        promptSuffix: ', minimalistic all white, pure geometry, hidden storage, no clutter, gallery aesthetic',
      },
      {
        id: 'warm-greige',
        label: 'Warm Greige',
        description: 'Greige palette, wood flooring, cozy neutral',
        promptSuffix: ', warm greige minimalist, wood floors, neutral tones, sculptural furniture, diffused lighting',
      },
      {
        id: 'soft-curves',
        label: 'Soft Curves',
        description: 'Organic shapes, muted tones, tactile materials',
        promptSuffix: ', minimalistic organic, soft curved furniture, muted warm tones, tactile textiles, gentle lighting',
      },
      {
        id: 'concrete-raw',
        label: 'Concrete Raw',
        description: 'Raw concrete walls, zen industrial calm',
        promptSuffix: ', minimalistic concrete, raw concrete walls, polished floor, floating furniture, indirect lighting',
      },
    ],
    references: [
      { id: 'minmin-ref-1', imageUrl: '/style-references/minimalistic/livingroom/ref-1.jpeg', label: 'Pure White', prompt: 'minimalistic, all white, clean geometry', negativePrompt: 'busy, colorful, ornate' },
    ],
    getReferenceImage: makeGetReferenceImage('minimalistic'),
  },

  // ── Luxury ───────────────────────────────────────────────────────────────────
  {
    id: 'luxury',
    label: 'Luxury',
    labelHi: 'लग्जरी',
    icon: '💎',
    category: 'luxury',
    description: 'Premium materials, statement pieces, opulent finishes',
    roomTypes: ['bedroom', 'bathroom', 'livingroom', 'kitchen'],
    defaultPrompt: 'luxury interior design, marble floors, velvet furniture, gold accents, crystal chandelier, high-end finishes, opulent, professional architectural photography',
    defaultNegativePrompt: 'plain, minimal, cheap, dull, industrial, rustic',
    variants: [
      {
        id: 'gold-marble',
        label: 'Gold & Marble',
        description: 'White marble, gold hardware, crystal chandeliers',
        promptSuffix: ', luxury interior, white marble floor, gold hardware, velvet sofa, crystal chandelier, opulent',
      },
      {
        id: 'dark-opulence',
        label: 'Dark Opulence',
        description: 'Deep navy, gold accents, dramatic lighting',
        promptSuffix: ', dark luxury interior, deep navy walls, gold accents, velvet furniture, art deco details, dramatic',
      },
      {
        id: 'contemporary-luxury',
        label: 'Contemporary Luxury',
        description: 'Travertine, warm beige, sculptural furniture',
        promptSuffix: ', contemporary luxury interior, travertine stone, warm beige palette, sculptural furniture, statement art',
      },
      {
        id: 'minimalist-luxury',
        label: 'Minimalist Luxury',
        description: 'Italian marble, bespoke furniture, designer pieces',
        promptSuffix: ', penthouse luxury interior, bespoke furniture, Italian marble, designer lighting, premium materials',
      },
    ],
    references: [
      { id: 'luxury-ref-1', imageUrl: '/style-references/luxury/livingroom/ref-1.jpeg', label: 'Gold & Marble', prompt: 'luxury interior, white marble, gold hardware, crystal chandelier', negativePrompt: 'plain, minimal, cheap' },
    ],
    getReferenceImage: makeGetReferenceImage('luxury'),
  },

  // ── Traditional Indian ───────────────────────────────────────────────────────
  {
    id: 'traditional-indian',
    label: 'Traditional Indian',
    labelHi: 'पारंपरिक भारतीय',
    icon: '🏮',
    category: 'traditional',
    description: 'Rich colors, carved wood, and timeless Indian craftsmanship',
    roomTypes: ['bedroom', 'bathroom', 'livingroom', 'kitchen'],
    defaultPrompt: 'traditional Indian interior, rich jewel tones, carved wooden furniture, brass accents, block print textiles, warm lighting, heritage aesthetic, professional architectural photography',
    defaultNegativePrompt: 'modern, minimal, plain, cold, industrial, cluttered mess',
    variants: [
      {
        id: 'rajasthani-royal',
        label: 'Rajasthani Royal',
        description: 'Deep blue & gold, carved jharokha, royal heritage',
        promptSuffix: ', Rajasthani interior design, deep blue and gold, carved jharokha, colorful cushions, brass diyas, royal heritage',
      },
      {
        id: 'kerala-teak',
        label: 'Kerala Teak',
        description: 'Teak wood, terracotta tiles, natural materials',
        promptSuffix: ', Kerala traditional interior, teak wood furniture, terracotta floor tiles, coir mat, brass lamps, natural materials',
      },
      {
        id: 'mughal-inspired',
        label: 'Mughal Inspired',
        description: 'Lattice screens, jewel-toned velvet, arched doorways',
        promptSuffix: ', Mughal-inspired interior, intricate lattice screens, jewel-toned velvet, gold accents, arched doorways, ornate patterns',
      },
      {
        id: 'contemporary-indian',
        label: 'Contemporary Indian',
        description: 'Modern layout with Indian art and craft accents',
        promptSuffix: ', contemporary Indian interior, modern layout, traditional crafts, block prints, brass accents, warm wood',
      },
    ],
    references: [
      { id: 'indian-ref-1', imageUrl: '/style-references/traditional-indian/bedroom/ref-1.jpeg', label: 'Rajasthani Royal', prompt: 'Rajasthani interior, deep blue gold, carved jharokha', negativePrompt: 'modern, minimal, cold' },
    ],
    getReferenceImage: makeGetReferenceImage('traditional-indian'),
  },
];

// ── Utility functions ──────────────────────────────────────────────────────────

export function getPresetById(id: string): StylePreset | undefined {
  return STYLE_PRESETS.find(p => p.id === id);
}

export function getAllPresets(): StylePreset[] {
  return STYLE_PRESETS;
}

export function getPresetsByCategory(category: StylePreset['category']): StylePreset[] {
  return STYLE_PRESETS.filter(p => p.category === category);
}

export function getPresetsByRoomType(roomType: RoomType): StylePreset[] {
  return STYLE_PRESETS.filter(p => p.roomTypes.includes(roomType));
}

export function getVariantById(presetId: string, variantId: string): DesignVariant | undefined {
  return getPresetById(presetId)?.variants.find(v => v.id === variantId);
}

/** @deprecated Use variants instead */
export function getReferenceById(presetId: string, referenceId: string): StyleReference | undefined {
  const preset = getPresetById(presetId);
  return preset?.references.find(r => r.id === referenceId);
}
