/**
 * API Route for Queue Status
 * Handles GET /api/ai/status/queue requests
 */

import { getQueueStatus } from '../../../../../src/controllers/gpuStatus.js';

export async function GET() {
  return await getQueueStatus();
}
