#!/usr/bin/env node
/**
 * scripts/predev.js
 * Runs automatically before "npm run dev" via the "predev" npm hook.
 * Prevents the most common causes of OOM before the server even starts.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Pre-dev cleanup...');

// ── 1. Kill duplicate MCP servers ─────────────────────────────────────────────
try {
  execSync('pkill -f mongodb-mcp-server', { stdio: 'ignore' });
  console.log('✅ Killed duplicate MCP servers');
} catch {
  // None running — that's fine
}

// ── 2. Check .next cache size — clear if over 3GB ────────────────────────────
try {
  const nextDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextDir)) {
    const size = parseInt(
      execSync(`du -sm "${nextDir}"`, { stdio: ['pipe', 'pipe', 'ignore'] })
        .toString()
        .split('\t')[0]
    );
    if (size > 3000) {
      execSync(`rm -rf "${nextDir}"`, { stdio: 'ignore' });
      console.log(`✅ Cleared .next cache (was ${size}MB — exceeded 3GB threshold)`);
    } else {
      console.log(`✅ .next cache OK (${size}MB)`);
    }
  } else {
    console.log('✅ .next cache: clean start');
  }
} catch {
  // Non-fatal — proceed
}

// ── 3. Check available RAM ───────────────────────────────────────────────────
try {
  const meminfo = fs.readFileSync('/proc/meminfo', 'utf8');
  const available = parseInt(meminfo.match(/MemAvailable:\s+(\d+)/)[1]) / 1024;
  const total = parseInt(meminfo.match(/MemTotal:\s+(\d+)/)[1]) / 1024;
  const usedPct = Math.round(((total - available) / total) * 100);

  if (available < 2000) {
    console.error(`\n❌ LOW MEMORY: Only ${Math.round(available)}MB RAM free (${usedPct}% used).`);
    console.error('   Free up memory before starting the dev server:');
    console.error('   • Close unused Chrome tabs');
    console.error('   • Restart ComfyUI with --lowvram flag');
    console.error('   • Kill unused processes with: htop');
    process.exit(1);
  } else {
    console.log(`✅ RAM: ${Math.round(available)}MB free (${100 - usedPct}% available)`);
  }
} catch {
  // /proc/meminfo not available (non-Linux) — skip
  console.log('ℹ️  RAM check skipped (non-Linux environment)');
}

// ── 4. Warn if ComfyUI is running with --highvram ────────────────────────────
try {
  const comfyProc = execSync('ps aux', { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
  if (comfyProc.includes('python') && comfyProc.includes('main.py') && comfyProc.includes('--highvram')) {
    console.warn('\n⚠️  WARNING: ComfyUI is running with --highvram.');
    console.warn('   This keeps models in VRAM/RAM permanently and causes OOM.');
    console.warn('   Restart ComfyUI: python main.py --lowvram --fp8_e4m3fn-unet\n');
  }
} catch {
  // ps failed — non-fatal
}


// ── 5. Check ComfyUI RAM status (async, non-blocking) ────────────────────────
;(async () => {
  try {
    const res = await fetch('http://127.0.0.1:8188/system_stats');
    const stats = await res.json();
    if (stats?.system?.ram_free_mb) {
      console.log(`📊 ComfyUI RAM: ${stats.system.ram_free_mb}MB free`);
    }
  } catch {
    // ComfyUI not running yet — skip
  }
})();

console.log('🚀 Starting dev server with memory watchdog...\n');
