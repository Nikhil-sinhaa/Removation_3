import { getRedisClient } from './client';

export interface AIJob {
  id: string;
  userId: string;
  toolName: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  projectId?: string;
  resultUrl?: string;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  metadata?: Record<string, unknown>;
}

const JOB_TTL = 24 * 60 * 60; // 24 hours — volatile data, no persistence needed

export const aiQueue = {
  async enqueue(job: Omit<AIJob, 'status' | 'createdAt'>): Promise<string> {
    const client = getRedisClient();
    const fullJob: AIJob = {
      ...job,
      status: 'queued',
      createdAt: Date.now(),
    };
    await client.setex(`job:${job.id}`, JOB_TTL, JSON.stringify(fullJob));
    return job.id;
  },

  async getJob(jobId: string): Promise<AIJob | null> {
    const client = getRedisClient();
    const data = await client.get(`job:${jobId}`);
    return data ? (JSON.parse(data) as AIJob) : null;
  },

  async updateJob(jobId: string, updates: Partial<AIJob>): Promise<void> {
    const existing = await this.getJob(jobId);
    if (!existing) return;
    const client = getRedisClient();
    const updated: AIJob = { ...existing, ...updates };
    await client.setex(`job:${jobId}`, JOB_TTL, JSON.stringify(updated));
  },

  async startJob(jobId: string): Promise<void> {
    await this.updateJob(jobId, { status: 'processing', startedAt: Date.now() });
  },

  async completeJob(jobId: string, resultUrl: string, projectId?: string): Promise<void> {
    await this.updateJob(jobId, {
      status: 'completed',
      resultUrl,
      projectId,
      completedAt: Date.now(),
    });
  },

  async failJob(jobId: string, error: string): Promise<void> {
    await this.updateJob(jobId, {
      status: 'failed',
      error,
      completedAt: Date.now(),
    });
  },
};
