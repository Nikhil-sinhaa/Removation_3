// lib/ai/professional-presets.ts
// Hardware-optimisation display constants for ProfessionalSelector UI.
// Extracted from the deprecated comfyui-workflows-professional.ts.

export const PROFESSIONAL_PRESETS = {
  // Structural Lock Settings
  structuralLock: {
    conservative: { strength: 1.5, preprocessor: 'canny' as const, cannyThreshold: [50, 100] },
    standard: { strength: 1.8, preprocessor: 'canny' as const, cannyThreshold: [100, 200] },
    aggressive: { strength: 2.0, preprocessor: 'canny' as const, cannyThreshold: [150, 250] },
  },

  // Encoder V2 Settings
  encoderV2: {
    realityFocused: { contextStrength: 0.95, userTextStrength: 0.6, twoStageInterpolation: true },
    balanced: { contextStrength: 0.85, userTextStrength: 0.7, twoStageInterpolation: true },
    creative: { contextStrength: 0.75, userTextStrength: 0.8, twoStageInterpolation: false },
  },

  // Hardware Optimization presets for 8 GB VRAM (display / info only)
  hardwareOptimization: {
    conservative: { useTiledVAE: true,  useFP8: true,  useHighVRAM: false, sampler: 'uni_pc',     steps: 15 },
    standard:     { useTiledVAE: true,  useFP8: true,  useHighVRAM: true,  sampler: 'uni_pc',     steps: 20 },
    quality:      { useTiledVAE: false, useFP8: false, useHighVRAM: true,  sampler: 'dpmpp_2m',   steps: 25 },
  },

  // Material Presets (ArchAi3d compatible — display / selector only)
  materials: {
    walls:     ['keep_original', 'Navy Blue', 'Terracotta', 'Olive Green', 'White', 'Charcoal Gray'],
    ceilings:  ['keep_original', 'Wooden Beams', 'Plain White', 'Modern Tray with LED', 'Industrial Exposed'],
    furniture: ['keep_original', 'Minimalist Oak', 'Industrial Metal', 'Bohemian Rattan', 'Luxury Velvet'],
    floors:    ['keep_original', 'Hardwood Oak', 'Marble', 'Polished Concrete', 'Terracotta Tiles'],
    lighting:  ['keep_original', 'Natural Light', 'Warm LED', 'Cool White', 'Industrial Pendant'],
  },
} as const;
