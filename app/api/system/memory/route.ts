import { NextResponse } from 'next/server';
import fs from 'fs';

export const dynamic = 'force-dynamic';

/**
 * GET /api/system/memory
 * Returns current system RAM and process memory stats.
 * Used for health monitoring and debugging OOM conditions.
 */
export async function GET() {
  const mem = process.memoryUsage();
  try {
    const raw = fs.readFileSync('/proc/meminfo', 'utf8');
    const get = (key: string) => {
      const m = raw.match(new RegExp(`${key}:\\s+(\\d+)`));
      return m ? Math.round(parseInt(m[1]) / 1024) : 0;
    };
    const total = get('MemTotal');
    const available = get('MemAvailable');
    const swapTotal = get('SwapTotal');
    const swapFree = get('SwapFree');
    const used = total - available;
    const swapUsed = swapTotal - swapFree;

    return NextResponse.json({
      totalMB: total,
      usedMB: used,
      freeMB: available,
      usedPercent: Math.round((used / total) * 100),
      swapTotalMB: swapTotal,
      swapUsedMB: swapUsed,
      swapPercent: swapTotal > 0 ? Math.round((swapUsed / swapTotal) * 100) : 0,
      processRSS_MB: Math.round(mem.rss / 1024 / 1024),
      processHeap_MB: Math.round(mem.heapUsed / 1024 / 1024),
      processHeapTotal_MB: Math.round(mem.heapTotal / 1024 / 1024),
      status: 'ok',
    });
  } catch {
    return NextResponse.json({ error: 'Cannot read /proc/meminfo' }, { status: 500 });
  }
}
