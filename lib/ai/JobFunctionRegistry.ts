/**
 * lib/ai/JobFunctionRegistry.ts
 *
 * In-memory registry that maps a jobId → the async function that actually
 * runs ComfyUI for that job.
 *
 * Functions are closures created inside the API route handler and contain
 * all the parsed form-data they need. They cannot be serialised to Redis,
 * so we store them here — in the same Next.js server process.
 *
 * TODO: This design means the queue worker MUST run in the same process as
 * the API routes. For a single-instance RTX 4060 deployment this is fine.
 * For horizontal scaling, replace this with a message queue (e.g. BullMQ
 * with a separate worker process) and pass job parameters through Redis.
 */

type GenerateFn = () => Promise<void>;

// Pin to `global` so Turbopack/HMR module re-instantiation doesn't create
// a separate Map per compilation context.  The API route handler and the
// QueueWorker import this module independently; without globalThis pinning
// each gets its own Map instance and the worker can never find the function
// that the route just registered.  (Same pattern used in comfyBridge.js.)
declare global {
  // eslint-disable-next-line no-var
  var __jobFunctionRegistry: Map<string, { fn: GenerateFn; timer: ReturnType<typeof setTimeout> }> | undefined;
}

const registry: Map<string, { fn: GenerateFn; timer: ReturnType<typeof setTimeout> }> =
  global.__jobFunctionRegistry ??
  (global.__jobFunctionRegistry = new Map());

export const JobFunctionRegistry = {
  register(jobId: string, fn: GenerateFn): void {
    // Cancel any previous timer for this id (re-registration)
    const existing = registry.get(jobId);
    if (existing) clearTimeout(existing.timer);

    // Auto-expire after 30 minutes to prevent memory leaks
    const timer = setTimeout(() => {
      registry.delete(jobId);
    }, 30 * 60 * 1000);

    registry.set(jobId, { fn, timer });
  },

  get(jobId: string): GenerateFn | undefined {
    return registry.get(jobId)?.fn;
  },

  delete(jobId: string): void {
    const entry = registry.get(jobId);
    if (entry) {
      clearTimeout(entry.timer);
      registry.delete(jobId);
    }
  },

  size(): number {
    return registry.size;
  },
};
