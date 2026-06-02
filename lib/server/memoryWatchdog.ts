import fs from 'fs';
import os from 'os';

interface MemStats {
  totalMB: number;
  usedMB: number;
  freeMB: number;
  usedPercent: number;
  swapTotalMB: number;
  swapUsedMB: number;
  swapPercent: number;
  processRSS_MB: number;
  processHeap_MB: number;
}

function getMemStats(): MemStats {
  const mem = process.memoryUsage();

  try {
    const raw = fs.readFileSync('/proc/meminfo', 'utf8');
    const get = (key: string) => {
      const m = raw.match(new RegExp(`${key}:\\s+(\\d+)`));
      return m ? parseInt(m[1]) / 1024 : 0;
    };

    const total = get('MemTotal');
    const available = get('MemAvailable');
    const used = total - available;
    const swapTotal = get('SwapTotal');
    const swapFree = get('SwapFree');
    const swapUsed = swapTotal - swapFree;

    return {
      totalMB: Math.round(total),
      usedMB: Math.round(used),
      freeMB: Math.round(available),
      usedPercent: Math.round((used / total) * 100),
      swapTotalMB: Math.round(swapTotal),
      swapUsedMB: Math.round(swapUsed),
      swapPercent: swapTotal > 0 ? Math.round((swapUsed / swapTotal) * 100) : 0,
      processRSS_MB: Math.round(mem.rss / 1024 / 1024),
      processHeap_MB: Math.round(mem.heapUsed / 1024 / 1024),
    };
  } catch {
    return {
      totalMB: Math.round(os.totalmem() / 1024 / 1024),
      usedMB: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024),
      freeMB: Math.round(os.freemem() / 1024 / 1024),
      usedPercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
      swapTotalMB: 0,
      swapUsedMB: 0,
      swapPercent: 0,
      processRSS_MB: Math.round(mem.rss / 1024 / 1024),
      processHeap_MB: Math.round(mem.heapUsed / 1024 / 1024),
    };
  }
}

export function startMemoryWatchdog() {
  if (process.env.DISABLE_WATCHDOG === 'true') {
    console.log('🛡️  REMOVATION MEMORY WATCHDOG IS DISABLED (via DISABLE_WATCHDOG=true)');
    return;
  }
  // Thresholds tuned for 16GB RAM system
  const WARN_PERCENT = 75;       // log warning
  const CRITICAL_PERCENT = 85;   // force GC + log critical
  const KILL_PERCENT = 90;       // graceful server exit
  const SWAP_KILL_PERCENT = 80;  // kill if swap also high
  const MAX_HEAP_MB = 3500;      // process heap hard limit
  const CHECK_MS = 8000;         // check every 8 seconds

  let warnCount = 0;
  let criticalCount = 0;

  function shutdown(reason: string) {
    const stats = getMemStats();
    console.error('\n' + '='.repeat(60));
    console.error('🔴 REMOVATION MEMORY WATCHDOG — GRACEFUL SHUTDOWN');
    console.error('='.repeat(60));
    console.error(`Reason: ${reason}`);
    console.error(`System RAM: ${stats.usedMB}MB / ${stats.totalMB}MB (${stats.usedPercent}%)`);
    console.error(`Swap: ${stats.swapUsedMB}MB / ${stats.swapTotalMB}MB (${stats.swapPercent}%)`);
    console.error(`Process RSS: ${stats.processRSS_MB}MB`);
    console.error(`Process Heap: ${stats.processHeap_MB}MB`);
    console.error('='.repeat(60));
    console.error('✅ Server shut down cleanly. Run: npm run dev');
    console.error('='.repeat(60) + '\n');
    process.exit(1);
  }

  const interval = setInterval(() => {
    const stats = getMemStats();

    // Only log RAM bar in dev mode (CLAUDE.md: no diagnostic console.log in production)
    if (process.env.NODE_ENV === 'development') {
      const filled = Math.min(20, Math.floor(stats.usedPercent / 5));
      const ramBar = '█'.repeat(filled) + '░'.repeat(20 - filled);
      const emoji = stats.usedPercent < 75 ? '🟢' : stats.usedPercent < 85 ? '🟡' : '🔴';
      console.log(
        `${emoji} [MEM] RAM: ${ramBar} ${stats.usedPercent}% (${stats.freeMB}MB free) | Heap: ${stats.processHeap_MB}MB | RSS: ${stats.processRSS_MB}MB`
      );
    }

    // Force garbage collection if available (requires --expose-gc flag)
    if (stats.usedPercent >= WARN_PERCENT) {
      warnCount++;
      if (global.gc) {
        (global as typeof globalThis & { gc: () => void }).gc();
        if (process.env.NODE_ENV === 'development') {
          console.log('🗑️  [MEM] Forced GC');
        }
      }
    } else {
      warnCount = 0;
    }

    // Critical warning
    if (stats.usedPercent >= CRITICAL_PERCENT) {
      criticalCount++;
      console.warn(`⚠️  [MEM] CRITICAL: ${stats.usedPercent}% RAM used. ${stats.freeMB}MB free. Shutdown imminent.`);
    } else {
      criticalCount = 0;
    }

    // ── KILL CONDITIONS — any one triggers graceful shutdown ──

    // 1. RAM over kill threshold
    if (stats.usedPercent >= KILL_PERCENT) {
      shutdown(`RAM at ${stats.usedPercent}% — only ${stats.freeMB}MB free`);
    }

    // 2. RAM critical AND swap also high (double pressure)
    if (stats.usedPercent >= CRITICAL_PERCENT && stats.swapPercent >= SWAP_KILL_PERCENT) {
      shutdown(`RAM ${stats.usedPercent}% AND swap ${stats.swapPercent}% — system about to freeze`);
    }

    // 3. Process heap over limit
    if (stats.processHeap_MB > MAX_HEAP_MB) {
      shutdown(`Process heap ${stats.processHeap_MB}MB exceeds ${MAX_HEAP_MB}MB limit`);
    }

    // 4. Less than 500MB free (absolute floor, on systems with >8GB)
    if (stats.freeMB < 500 && stats.totalMB > 8000) {
      shutdown(`Only ${stats.freeMB}MB RAM free — dangerously low`);
    }
  }, CHECK_MS);

  // Unref so the interval doesn't block process.exit() from other signals
  interval.unref();

  // Startup banner
  const stats = getMemStats();
  console.log('\n' + '='.repeat(60));
  console.log('🛡️  REMOVATION MEMORY WATCHDOG ACTIVE');
  console.log('='.repeat(60));
  console.log(`System RAM: ${stats.usedMB}MB used / ${stats.totalMB}MB total`);
  console.log(`Swap: ${stats.swapUsedMB}MB / ${stats.swapTotalMB}MB`);
  console.log(`Thresholds: warn=${WARN_PERCENT}% | critical=${CRITICAL_PERCENT}% | kill=${KILL_PERCENT}%`);
  console.log(`Process heap limit: ${MAX_HEAP_MB}MB`);
  console.log(`Check interval: ${CHECK_MS / 1000}s`);
  console.log('='.repeat(60) + '\n');

  return interval;
}
