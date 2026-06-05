/**
 * lib/ai/workerInit.ts
 *
 * Call ensureWorkerRunning() at the top of any AI route that uses the queue.
 * It is idempotent — safe to call many times; the worker starts only once.
 */

import { QueueWorker } from '@/lib/ai/queueWorker';

let workerStarted = false;

export function ensureWorkerRunning(): void {
  if (workerStarted) return;
  workerStarted = true;

  const worker = QueueWorker.getInstance();
  worker.start();

  process.on('SIGTERM', () => worker.stop());
  process.on('SIGINT',  () => worker.stop());
}
