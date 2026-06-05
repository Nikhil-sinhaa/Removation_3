/**
 * TypeScript-typed re-exports from the shared JS presets file.
 * JS files (orchestrators) import transferPresets.js directly.
 * TS files (pages, routes) import this file for typed access.
 */

import { TRANSFER_PRESETS as rawPresets, DEFAULT_NEGATIVE_PROMPT as rawNeg } from './transferPresetsData.js';

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  prompt: string;
  negativePrompt?: string;
}

export const TRANSFER_PRESETS = rawPresets as StylePreset[];
export const DEFAULT_NEGATIVE_PROMPT = rawNeg as string;
