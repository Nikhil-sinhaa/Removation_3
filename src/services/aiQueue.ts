import { EventEmitter } from 'events';

interface QueuedJob {
  id: string;
  type: 'redesign' | 'recolor';
  projectId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

class AIQueueService extends EventEmitter {
  private queue: QueuedJob[] = [];
  private processing = new Map<string, QueuedJob>();
  private isProcessing = false;

  addToQueue(type: 'redesign' | 'recolor', projectId: string): string {
    const job: QueuedJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      projectId,
      status: 'queued',
      createdAt: new Date()
    };

    this.queue.push(job);
    this.emit('job:queued', job);
    this.processQueue();
    
    return job.id;
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift()!;
      this.processing.set(job.id, job);
      
      job.status = 'processing';
      job.startedAt = new Date();
      this.emit('job:started', job);

      try {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        job.status = 'completed';
        job.completedAt = new Date();
        this.emit('job:completed', job);
      } catch (error) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Unknown error';
        this.emit('job:failed', job);
      } finally {
        this.processing.delete(job.id);
      }
    }

    this.isProcessing = false;
  }

  getJob(jobId: string): QueuedJob | undefined {
    return this.queue.find(j => j.id === jobId) || 
           this.processing.get(jobId) ||
           this.getCompletedJobs().find(j => j.id === jobId);
  }

  getQueueStatus(): {
    queued: number;
    processing: number;
    completed: number;
    jobs: QueuedJob[];
  } {
    return {
      queued: this.queue.length,
      processing: this.processing.size,
      completed: this.getCompletedJobs().length,
      jobs: [...this.queue, ...Array.from(this.processing.values()), ...this.getCompletedJobs()]
    };
  }

  private getCompletedJobs(): QueuedJob[] {
    // In a real implementation, this would come from a database
    return [];
  }

  clearQueue(): void {
    this.queue = [];
    this.processing.clear();
    this.emit('queue:cleared');
  }

  getStatus() {
    return {
      isProcessing: this.isProcessing,
      gpuStatus: {
        vram_used: 0,
        temperature: 0
      },
      comfyUIStatus: 'online'
    };
  }

  async enqueue(jobData: {
    type: string;
    imageUrl: string;
    point?: any;
    mask?: any;
    projectId?: string;
  }): Promise<{ id: string; status: string; queuePosition: number }> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job: QueuedJob = {
      id: jobId,
      type: jobData.type as any,
      projectId: jobData.projectId || '',
      status: 'queued',
      createdAt: new Date()
    };

    this.queue.push(job);
    this.emit('job:queued', job);
    this.processQueue();

    return {
      id: jobId,
      status: 'queued',
      queuePosition: this.queue.length
    };
  }
}

const aiQueueService = new AIQueueService();

export default aiQueueService;
