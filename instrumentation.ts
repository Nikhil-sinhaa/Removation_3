/**
 * Next.js Instrumentation Hook
 * Runs once on server startup (Node.js runtime only).
 * Starts the memory watchdog that prevents OOM crashes.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only run on the Node.js runtime, not Edge
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startMemoryWatchdog } = await import('./lib/server/memoryWatchdog');
    startMemoryWatchdog();
  }
}
