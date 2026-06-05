// Type shim for redlock v5.0.0-beta.2 — the exports field lacks a "types" condition
// so moduleResolution: bundler can't auto-discover dist/index.d.ts.
declare module 'redlock' {
  import { EventEmitter } from 'events';
  import { Redis, Cluster } from 'ioredis';

  type Client = Redis | Cluster;

  export interface Settings {
    driftFactor?: number;
    retryCount?: number;
    retryDelay?: number;
    retryJitter?: number;
    automaticExtensionThreshold?: number;
  }

  export class Lock {
    readonly redlock: Redlock;
    readonly resources: string[];
    readonly value: string;
    readonly attempts: ReadonlyArray<Promise<any>>;
    expiration: number;
    release(): Promise<ExecutionResult>;
    extend(duration: number): Promise<Lock>;
    using<T>(routine: (signal: AbortSignal) => Promise<T>): Promise<T>;
  }

  export interface ExecutionResult {
    readonly attempts: ReadonlyArray<Promise<any>>;
  }

  export class ResourceLockedError extends Error {}
  export class ExecutionError extends Error {
    readonly attempts: ReadonlyArray<Promise<any>>;
  }

  export default class Redlock extends EventEmitter {
    constructor(clients: Client[], settings?: Settings);
    acquire(resources: string[], duration: number): Promise<Lock>;
    release(lock: Lock): Promise<ExecutionResult>;
    extend(existing: Lock, duration: number): Promise<Lock>;
    using<T>(resources: string[], duration: number, routine: (signal: AbortSignal) => Promise<T>): Promise<T>;
    using<T>(resources: string[], duration: number, settings: Settings, routine: (signal: AbortSignal) => Promise<T>): Promise<T>;
    quit(): Promise<void>;
  }
}
