/**
 * API Route for Redesign Project Status
 * Handles GET /api/ai/redesign/[projectId]/status requests
 */

import { getRedesignStatus } from '@/src/controllers/redesign.js';

export async function GET(request, { params }) {
  return await getRedesignStatus({ params });
}
