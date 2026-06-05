/**
 * API Route for Object Removal Project Status
 * Handles GET /api/ai/remove-object/[projectId]/status requests
 */

import { getRemovalStatus } from '../../../../../../src/controllers/removal.js';

export async function GET(request, { params }) {
  return await getRemovalStatus({ params });
}
