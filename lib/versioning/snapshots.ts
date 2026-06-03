import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';
import Snapshot, { type SnapshotTrigger } from '@/lib/db/models/Snapshot';

const MAX_SNAPSHOTS_PER_PROJECT = 50;

export interface CreateSnapshotOptions {
  projectId:     string;
  userId:        string;
  trigger:       SnapshotTrigger;
  label?:        string;
  data:          Record<string, unknown>;
  thumbnailUrl?: string;
  isPinned?:     boolean;
}

/**
 * Create a new snapshot. Never throws — all errors are logged and null returned.
 */
export async function createSnapshot(
  opts: CreateSnapshotOptions
): Promise<string | null> {
  try {
    await connectToDatabase();

    const pid = new mongoose.Types.ObjectId(opts.projectId);
    const uid = new mongoose.Types.ObjectId(opts.userId);

    const latest = await Snapshot
      .findOne({ projectId: pid })
      .sort({ version: -1 })
      .lean();

    const version = latest ? latest.version + 1 : 1;
    const label   = opts.label || generateLabel(opts.trigger, version);

    const dataStr   = JSON.stringify(opts.data);
    const sizeBytes = Buffer.byteLength(dataStr, 'utf8');

    const snapshot = await Snapshot.create({
      projectId:    pid,
      userId:       uid,
      version,
      label,
      trigger:      opts.trigger,
      data:         opts.data,
      thumbnailUrl: opts.thumbnailUrl,
      isPinned:     opts.isPinned || false,
      sizeBytes,
      createdAt:    new Date(),
    });

    // Enforce per-project limit — delete oldest non-pinned if over limit
    const total = await Snapshot.countDocuments({ projectId: pid });
    if (total > MAX_SNAPSHOTS_PER_PROJECT) {
      const excess = await Snapshot
        .find({ projectId: pid, isPinned: false })
        .sort({ version: 1 })
        .limit(total - MAX_SNAPSHOTS_PER_PROJECT)
        .lean();

      if (excess.length > 0) {
        await Snapshot.deleteMany({ _id: { $in: excess.map(s => s._id) } });
      }
    }

    return String(snapshot._id);
  } catch (err) {
    console.error('[Snapshots] createSnapshot failed:', err);
    return null;
  }
}

/**
 * Get all snapshots for a project, newest first.
 */
export async function getProjectSnapshots(
  projectId: string,
  userId:    string,
  limit      = 50
) {
  await connectToDatabase();

  return Snapshot.find({
    projectId: new mongoose.Types.ObjectId(projectId),
    userId:    new mongoose.Types.ObjectId(userId),
  })
  .sort({ version: -1 })
  .limit(limit)
  .lean();
}

/**
 * Restore project to a snapshot.
 * Saves a "before restore" snapshot first, then returns the data to apply.
 */
export async function restoreSnapshot(
  snapshotId: string,
  projectId:  string,
  userId:     string
): Promise<Record<string, unknown> | null> {
  try {
    await connectToDatabase();

    const snapshot = await Snapshot.findOne({
      _id:       new mongoose.Types.ObjectId(snapshotId),
      projectId: new mongoose.Types.ObjectId(projectId),
      userId:    new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!snapshot) return null;

    // Take a "before restore" snapshot of the current project state
    const ProjectModel = mongoose.models['Project'];
    if (ProjectModel) {
      const current = await ProjectModel.findById(projectId).lean();
      if (current) {
        await createSnapshot({
          projectId,
          userId,
          trigger: 'restore',
          label:   `Before restore to v${snapshot.version}`,
          data:    extractProjectData(current as Record<string, unknown>),
        });
      }
    }

    return snapshot.data as Record<string, unknown>;
  } catch (err) {
    console.error('[Snapshots] restoreSnapshot failed:', err);
    return null;
  }
}

/**
 * Extract mutable project fields suitable for storing in a snapshot.
 * Excludes internal fields: _id, userId, createdAt, __v, updatedAt, lastActivity.
 */
export function extractProjectData(
  project: Record<string, unknown>
): Record<string, unknown> {
  const excluded = new Set(['_id', 'userId', 'createdAt', 'updatedAt', 'lastActivity', '__v']);
  return Object.fromEntries(
    Object.entries(project).filter(([key]) => !excluded.has(key))
  );
}

function generateLabel(trigger: SnapshotTrigger, version: number): string {
  const map: Record<SnapshotTrigger, string> = {
    manual_save:     'Manual save',
    auto_save:       'Auto-save',
    render_complete: 'After generation',
    before_generate: 'Before generation',
    restore:         'Before restore',
  };
  return `${map[trigger]} (v${version})`;
}
