/**
 * API Route for Individual Object Removal Project
 * Handles GET /api/ai/remove-object/[projectId] requests
 */

import { getRemovalProject, getRemovalStatus, deleteRemovalProject } from '../../../../../src/controllers/removal.js';

export async function GET(request, { params }) {
  return await getRemovalProject({ params });
}

export async function DELETE(request, { params }) {
  return await deleteRemovalProject({ params });
}
