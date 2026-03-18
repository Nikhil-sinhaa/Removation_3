/**
 * API Route for Recolor Presets
 * Handles GET /api/ai/recolor/presets requests
 */

import { getRecolorPresets } from '../../../../../src/controllers/colorChange.js';

export async function GET() {
  return await getRecolorPresets();
}
