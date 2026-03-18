/**
 * API Route for Performance Metrics
 * Handles GET /api/ai/status/performance requests
 */

import { getPerformanceMetrics } from '../../../../src/controllers/gpuStatus.js';

export async function GET() {
  return await getPerformanceMetrics();
}
