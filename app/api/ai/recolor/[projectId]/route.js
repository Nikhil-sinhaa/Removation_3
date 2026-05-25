/**
 * API Route for Individual Recolor Project
 * Handles GET /api/ai/recolor/[projectId] requests
 */

import { getRecolorProject, getRecolorStatus, deleteRecolorProject } from '@/src/controllers/colorChange.js';

export async function GET(request, { params }) {
  return await getRecolorProject({ params });
}

export async function DELETE(request, { params }) {
  return await deleteRecolorProject({ params });
}
