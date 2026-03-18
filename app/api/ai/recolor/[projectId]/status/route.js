/**
 * API Route for Recolor Project Status
 * Handles GET /api/ai/recolor/[projectId]/status requests
 */

import { getRecolorStatus } from '../../../../../src/controllers/colorChange.js';

export async function GET(request, { params }) {
  return await getRecolorStatus({ params });
}
