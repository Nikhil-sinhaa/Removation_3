// constants/transformation-modes.ts
// All transformation modes with their configurations

// Use local type definitions to avoid import issues
export type LocalTransformationMode =
  | 'redesign'
  | 'fill-room'
  | 'outdoor'
  | 'sketch-to-render'
  | 'enhance'
  | 'inpaint'
  | 'remove-object'
  | 'replace-object'
  | 'change-material'
  | 'change-color'
  | 'declutter'
  | 'staging'
  | 'lighting'
  | 'seasonal'
  | 'style-transfer'
  | 'floor-plan-3d';

export interface LocalTransformationModeConfig {
  id: LocalTransformationMode;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  icon: string;
  credits: number;
  isPro: boolean;
  requiresMask: boolean;
  requiresPrompt: boolean;
  estimatedTime: number;
  category: 'design' | 'edit' | 'enhance' | 'special';
}

export const TRANSFORMATION_MODES: LocalTransformationModeConfig[] = [
  {
    id: 'redesign',
    name: 'Interior AI Redesign',
    nameHi: 'इंटीरियर एआई रीडिज़ाइन',
    description: 'Transform your room with AI-powered interior design',
    descriptionHi: 'एआई-संचालित इंटीरियर डिज़ाइन से अपने कमरे को बदलें',
    icon: '🏠',
    credits: 2,
    isPro: false,
    requiresMask: false,
    requiresPrompt: true,
    estimatedTime: 15,
    category: 'design',
  },
  {
    id: 'fill-room',
    name: 'Fill Empty Room',
    nameHi: 'खाली कमरा भरें',
    description: 'Furnish an empty room with AI-generated furniture',
    descriptionHi: 'एआई-जनित फर्नीचर से खाली कमरा सजाएं',
    icon: '🛋️',
    credits: 3,
    isPro: false,
    requiresMask: false,
    requiresPrompt: true,
    estimatedTime: 20,
    category: 'design',
  },
  {
    id: 'outdoor',
    name: 'Outdoor Spaces',
    nameHi: 'आउटडोर स्पेस',
    description: 'Transform gardens, patios, and outdoor areas',
    descriptionHi: 'बगीचे, पैटियो और आउटडोर क्षेत्रों को बदलें',
    icon: '🌳',
    credits: 3,
    isPro: false,
    requiresMask: false,
    requiresPrompt: true,
    estimatedTime: 18,
    category: 'design',
  },
  {
    id: 'sketch-to-render',
    name: 'Sketch to Render',
    nameHi: 'स्केच से रेंडर',
    description: 'Convert sketches and floor plans to realistic renders',
    descriptionHi: 'स्केच और फ्लोर प्लान को यथार्थवादी रेंडर में बदलें',
    icon: '📐',
    credits: 4,
    isPro: true,
    requiresMask: false,
    requiresPrompt: true,
    estimatedTime: 25,
    category: 'design',
  },
  {
    id: 'enhance',
    name: 'AI Enhance (4K Upscale)',
    nameHi: 'एआई एन्हांस (4K अपस्केल)',
    description: 'Upscale and enhance image quality to 4K',
    descriptionHi: 'छवि गुणवत्ता को 4K तक अपस्केल और बेहतर करें',
    icon: '🔍',
    credits: 1,
    isPro: false,
    requiresMask: false,
    requiresPrompt: false,
    estimatedTime: 10,
    category: 'enhance',
  },
  {
    id: 'inpaint',
    name: 'Smart Inpainting',
    nameHi: 'स्मार्ट इनपेंटिंग',
    description: 'Edit specific areas by painting over them',
    descriptionHi: 'उन पर पेंट करके विशिष्ट क्षेत्रों को संपादित करें',
    icon: '🎨',
    credits: 2,
    isPro: false,
    requiresMask: true,
    requiresPrompt: true,
    estimatedTime: 15,
    category: 'edit',
  },
  {
    id: 'remove-object',
    name: 'Object Removal',
    nameHi: 'वस्तु हटाना',
    description: 'Remove unwanted objects from your image',
    descriptionHi: 'अवांछित वस्तुओं को अपनी छवि से हटाएं',
    icon: '🗑️',
    credits: 1,
    isPro: false,
    requiresMask: true,
    requiresPrompt: false,
    estimatedTime: 12,
    category: 'edit',
  },
  {
    id: 'replace-object',
    name: 'Object Replacement',
    nameHi: 'वस्तु प्रतिस्थापन',
    description: 'Replace objects with something else',
    descriptionHi: 'वस्तुओं को किसी और चीज़ से बदलें',
    icon: '🔄',
    credits: 2,
    isPro: true,
    requiresMask: true,
    requiresPrompt: true,
    estimatedTime: 18,
    category: 'edit',
  },
  {
    id: 'change-material',
    name: 'Material Change',
    nameHi: 'सामग्री परिवर्तन',
    description: 'Change materials (flooring, walls, fabrics)',
    descriptionHi: 'सामग्री बदलें (फर्श, दीवारें, कपड़े)',
    icon: '🧱',
    credits: 2,
    isPro: true,
    requiresMask: true,
    requiresPrompt: false,
    estimatedTime: 15,
    category: 'edit',
  },
  {
    id: 'change-color',
    name: 'Color Change',
    nameHi: 'रंग परिवर्तन',
    description: 'Change colors of objects, walls, or fabrics',
    descriptionHi: 'वस्तुओं, दीवारों या कपड़ों के रंग बदलें',
    icon: '🎨',
    credits: 1,
    isPro: false,
    requiresMask: true,
    requiresPrompt: false,
    estimatedTime: 12,
    category: 'edit',
  },
  {
    id: 'declutter',
    name: 'Declutter Room',
    nameHi: 'कमरा साफ करें',
    description: 'Remove clutter and organize the space',
    descriptionHi: 'अव्यवस्था हटाएं और स्थान को व्यवस्थित करें',
    icon: '🧹',
    credits: 2,
    isPro: false,
    requiresMask: false,
    requiresPrompt: false,
    estimatedTime: 15,
    category: 'enhance',
  },
  {
    id: 'staging',
    name: 'Virtual Staging',
    nameHi: 'वर्चुअल स्टेजिंग',
    description: 'Stage empty rooms with furniture',
    descriptionHi: 'खाली कमरों को फर्नीचर से सजाएं',
    icon: '🛋️',
    credits: 3,
    isPro: true,
    requiresMask: false,
    requiresPrompt: true,
    estimatedTime: 20,
    category: 'design',
  },
  {
    id: 'lighting',
    name: 'Lighting Adjustment',
    nameHi: 'लाइटिंग समायोजन',
    description: 'Adjust lighting conditions and time of day',
    descriptionHi: 'लाइटिंग स्थितियों और दिन के समय को समायोजित करें',
    icon: '💡',
    credits: 1,
    isPro: false,
    requiresMask: false,
    requiresPrompt: false,
    estimatedTime: 12,
    category: 'enhance',
  },
  {
    id: 'seasonal',
    name: 'Seasonal Decoration',
    nameHi: 'मौसमी सजावट',
    description: 'Add seasonal decorations and themes',
    descriptionHi: 'मौसमी सजावट और थीम जोड़ें',
    icon: '🎄',
    credits: 2,
    isPro: true,
    requiresMask: false,
    requiresPrompt: false,
    estimatedTime: 15,
    category: 'special',
  },
  {
    id: 'style-transfer',
    name: 'Style Transfer',
    nameHi: 'शैली स्थानांतरण',
    description: 'Apply artistic styles to your room',
    descriptionHi: 'अपने कमरे में कलात्मक शैलियाँ लागू करें',
    icon: '🖼️',
    credits: 3,
    isPro: true,
    requiresMask: false,
    requiresPrompt: false,
    estimatedTime: 18,
    category: 'special',
  },
  {
    id: 'floor-plan-3d',
    name: 'Floor Plan to 3D',
    nameHi: 'फ्लोर प्लान से 3डी',
    description: 'Convert 2D floor plans to 3D renders',
    descriptionHi: '2डी फ्लोर प्लान को 3डी रेंडर में बदलें',
    icon: '📊',
    credits: 5,
    isPro: true,
    requiresMask: false,
    requiresPrompt: true,
    estimatedTime: 30,
    category: 'special',
  },
];

// Helper functions
export const getTransformationMode = (id: LocalTransformationMode): LocalTransformationModeConfig | undefined => {
  return TRANSFORMATION_MODES.find(mode => mode.id === id);
};

export const getModeCategory = (id: LocalTransformationMode): string => {
  return TRANSFORMATION_MODES.find(mode => mode.id === id)?.category || 'design';
};

export const isProMode = (id: LocalTransformationMode): boolean => {
  return TRANSFORMATION_MODES.find(mode => mode.id === id)?.isPro || false;
};

export const requiresMask = (id: LocalTransformationMode): boolean => {
  return TRANSFORMATION_MODES.find(mode => mode.id === id)?.requiresMask || false;
};

export const getModeCredits = (id: LocalTransformationMode): number => {
  return TRANSFORMATION_MODES.find(mode => mode.id === id)?.credits || 1;
};

export const getModeEstimatedTime = (id: LocalTransformationMode): number => {
  return TRANSFORMATION_MODES.find(mode => mode.id === id)?.estimatedTime || 15;
};

// Group modes by category for UI display
export const MODES_BY_CATEGORY = {
  design: TRANSFORMATION_MODES.filter(mode => mode.category === 'design'),
  edit: TRANSFORMATION_MODES.filter(mode => mode.category === 'edit'),
  enhance: TRANSFORMATION_MODES.filter(mode => mode.category === 'enhance'),
  special: TRANSFORMATION_MODES.filter(mode => mode.category === 'special'),
};

// Popular modes (for quick access)
export const POPULAR_MODES: LocalTransformationMode[] = [
  'redesign',
  'enhance',
  'inpaint',
  'remove-object',
  'change-color',
  'declutter',
];

// Modes that don't require a mask
export const NO_MASK_MODES: LocalTransformationMode[] = 
  TRANSFORMATION_MODES.filter(mode => !mode.requiresMask).map(mode => mode.id);

// Modes that don't require a prompt
export const NO_PROMPT_MODES: LocalTransformationMode[] = 
  TRANSFORMATION_MODES.filter(mode => !mode.requiresPrompt).map(mode => mode.id);

// Free vs Pro modes
export const FREE_MODES: LocalTransformationMode[] = 
  TRANSFORMATION_MODES.filter(mode => !mode.isPro).map(mode => mode.id);

export const PRO_MODES: LocalTransformationMode[] = 
  TRANSFORMATION_MODES.filter(mode => mode.isPro).map(mode => mode.id);

// Type exports for compatibility
export type TransformationMode = LocalTransformationMode;
export type TransformationModeConfig = LocalTransformationModeConfig;