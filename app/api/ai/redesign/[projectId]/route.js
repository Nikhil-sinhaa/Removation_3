/**
 * API Route for Individual Redesign Project
 * Handles GET /api/ai/redesign/[projectId] requests
 */

import { getRedesignProject, getRedesignStatus, deleteRedesignProject } from '../../../../src/controllers/redesign.js';

export async function GET(request, { params }) {
  return await getRedesignProject({ params });
}

export async function DELETE(request, { params }) {
  return await deleteRedesignProject({ params });
}
