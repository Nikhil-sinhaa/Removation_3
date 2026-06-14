// lib/db/models/GpuJob.ts
//
// GpuJob — Phase B pilot schema (Vastu-only for now, designed for future extension).
//
// Status lifecycle:
//   pending → leased → processing → completed
//                                  └→ failed  (retries exhausted)
//   failed (retries remain) → pending
//
import mongoose, { Schema, Model, Types } from 'mongoose';

// ── Types ─────────────────────────────────────────────────────────────────────

export type GpuJobStatus = 'pending' | 'leased' | 'processing' | 'completed' | 'failed';

export interface IDriveFile {
  driveFileId: string;
  fileName: string;
}

export interface IGpuJobLease {
  workerId: string;
  leasedAt: Date;
  expiresAt: Date;
}

export interface IGpuJob {
  // Workflow type — deliberately a string, not an enum, so adding types later
  // requires no schema migration. Current valid value: 'vastu-analysis'.
  workflowType: string;

  status: GpuJobStatus;

  // Input image uploaded to Drive queue folder before job creation
  inputs: {
    originalImage: IDriveFile;
  };

  // 8 mask outputs uploaded by the worker after ComfyUI completes
  outputs: Map<string, IDriveFile>;

  // Runtime parameters passed to the orchestrator
  params: {
    roomType: string;
    direction?: string;
    language?: string;
    [key: string]: unknown;
  };

  // Worker lease — used by findOneAndUpdate atomic claim query
  lease?: IGpuJobLease;

  // Retry tracking
  retryCount: number;
  maxRetries: number;
  errorLogs: string[];

  // Cached analysis result (populated by status route on first poll after completion)
  result?: Record<string, unknown>;

  // User who created the job (for future ownership queries)
  userId: string;

  // Timestamps
  queuedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const DriveFileSchema = new Schema<IDriveFile>(
  {
    driveFileId: { type: String, required: true },
    fileName: { type: String, required: true },
  },
  { _id: false },
);

const LeaseSchema = new Schema<IGpuJobLease>(
  {
    workerId: { type: String, required: true },
    leasedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false },
);

const GpuJobSchema = new Schema<IGpuJob>(
  {
    workflowType: { type: String, required: true, default: 'vastu-analysis' },

    status: {
      type: String,
      enum: ['pending', 'leased', 'processing', 'completed', 'failed'],
      default: 'pending',
      required: true,
    },

    inputs: {
      originalImage: { type: DriveFileSchema, required: true },
    },

    // outputs is a free-form map: passName → { driveFileId, fileName }
    // Using Schema.Types.Map with Mixed values so any key can be stored.
    outputs: {
      type: Map,
      of: DriveFileSchema,
      default: () => new Map(),
    },

    params: {
      type: Schema.Types.Mixed,
      required: true,
    },

    lease: {
      type: LeaseSchema,
      default: undefined,
    },

    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 2 },
    errorLogs: [{ type: String }],

    // Cached scored analysis — set by the status route on first successful poll
    result: { type: Schema.Types.Mixed },

    userId: { type: String, required: true },

    queuedAt: { type: Date, default: Date.now },
    completedAt: Date,
    failedAt: Date,
  },
  {
    timestamps: true, // adds createdAt, updatedAt automatically
  },
);

// ── Indexes ───────────────────────────────────────────────────────────────────

// Primary poll query: find pending jobs or jobs with expired leases, ordered by queue time
GpuJobSchema.index({ status: 1, queuedAt: 1 });

// Lease expiry sweep (for finding stalled workers)
GpuJobSchema.index({ 'lease.expiresAt': 1 }, { sparse: true });

// Owner lookup (future dashboard)
GpuJobSchema.index({ userId: 1, createdAt: -1 });

// ── Model ─────────────────────────────────────────────────────────────────────

export const GpuJob: Model<IGpuJob> =
  mongoose.models.GpuJob || mongoose.model<IGpuJob>('GpuJob', GpuJobSchema);

export default GpuJob;
