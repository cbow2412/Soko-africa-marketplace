import { Queue, Worker, QueueEvents } from "bullmq";
import { redisService } from "./redis-client";

/**
 * Bull Job Queue Service
 * 
 * Manages background jobs for:
 * - Catalog scraping
 * - Embedding generation
 * - Quality control
 * - Product indexing
 */

export interface JobData {
  catalogUrl?: string;
  productId?: number;
  sellerId?: number;
  productName?: string;
  description?: string;
  imageUrl?: string;
  [key: string]: any;
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

export type JobType =
  | "scrape-catalog"
  | "generate-embedding"
  | "quality-control"
  | "index-product"
  | "sync-seller";

class JobQueueService {
  private queues: Map<JobType, Queue> = new Map();
  private workers: Map<JobType, Worker> = new Map();
  private queueEvents: Map<JobType, QueueEvents> = new Map();

  /**
   * Initialize job queues
   */
  async initialize(): Promise<void> {
    try {
      console.log("[JobQueue] Initializing job queues...");

      // Get Redis client
      const redisClient = redisService.getClient();
      if (!redisClient) {
        throw new Error("Redis not connected");
      }

      // Create queues for each job type
      const jobTypes: JobType[] = [
        "scrape-catalog",
        "generate-embedding",
        "quality-control",
        "index-product",
        "sync-seller",
      ];

      for (const jobType of jobTypes) {
        const queue = new Queue(jobType, { connection: redisClient });
        this.queues.set(jobType, queue);

        // Create queue events listener
        const queueEvents = new QueueEvents(jobType, { connection: redisClient });
        this.queueEvents.set(jobType, queueEvents);

        console.log(`[JobQueue] Created queue: ${jobType}`);
      }

      console.log("[JobQueue] Job queues initialized");
    } catch (error) {
      console.error("[JobQueue] Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Register job processor
   */
  async registerProcessor(
    jobType: JobType,
    processor: (job: any) => Promise<JobResult>
  ): Promise<void> {
    try {
      const redisClient = redisService.getClient();
      if (!redisClient) {
        throw new Error("Redis not connected");
      }

      const worker = new Worker(jobType, processor, {
        connection: redisClient,
        concurrency: 5, // Process 5 jobs in parallel
      });

      // Handle worker events
      worker.on("completed", (job) => {
        console.log(`[JobQueue] Job completed: ${jobType} - ${job.id}`);
      });

      worker.on("failed", (job, err) => {
        console.error(`[JobQueue] Job failed: ${jobType} - ${job?.id}:`, err);
      });

      worker.on("error", (err) => {
        console.error(`[JobQueue] Worker error: ${jobType}:`, err);
      });

      this.workers.set(jobType, worker);
      console.log(`[JobQueue] Registered processor: ${jobType}`);
    } catch (error) {
      console.error("[JobQueue] Processor registration failed:", error);
      throw error;
    }
  }

  /**
   * Add job to queue
   */
  async addJob(
    jobType: JobType,
    data: JobData,
    options: any = {}
  ): Promise<string> {
    try {
      const queue = this.queues.get(jobType);
      if (!queue) {
        throw new Error(`Queue not found: ${jobType}`);
      }

      const job = await queue.add(jobType, data, {
        attempts: 3, // Retry 3 times
        backoff: {
          type: "exponential",
          delay: 2000, // Start with 2 second delay
        },
        removeOnComplete: true,
        ...options,
      });

      console.log(`[JobQueue] Job added: ${jobType} - ${job.id}`);
      return job.id!;
    } catch (error) {
      console.error("[JobQueue] Add job failed:", error);
      throw error;
    }
  }

  /**
   * Add multiple jobs
   */
  async addBulkJobs(
    jobType: JobType,
    dataArray: JobData[],
    options: any = {}
  ): Promise<string[]> {
    try {
      const queue = this.queues.get(jobType);
      if (!queue) {
        throw new Error(`Queue not found: ${jobType}`);
      }

      const jobs = await queue.addBulk(
        dataArray.map((data) => ({
          name: jobType,
          data,
          opts: {
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 2000,
            },
            removeOnComplete: true,
            ...options,
          },
        }))
      );

      const jobIds = jobs.map((job) => job.id!);
      console.log(`[JobQueue] Added ${jobIds.length} bulk jobs: ${jobType}`);
      return jobIds;
    } catch (error) {
      console.error("[JobQueue] Add bulk jobs failed:", error);
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobType: JobType, jobId: string): Promise<any> {
    try {
      const queue = this.queues.get(jobType);
      if (!queue) {
        throw new Error(`Queue not found: ${jobType}`);
      }

      const job = await queue.getJob(jobId);
      if (!job) {
        return { status: "not-found" };
      }

      const state = await job.getState();
      const progress = job.progress();

      return {
        id: job.id,
        status: state,
        progress,
        data: job.data,
        result: job.returnvalue,
        failedReason: job.failedReason,
      };
    } catch (error) {
      console.error("[JobQueue] Get job status failed:", error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(jobType: JobType): Promise<any> {
    try {
      const queue = this.queues.get(jobType);
      if (!queue) {
        throw new Error(`Queue not found: ${jobType}`);
      }

      const counts = await queue.getJobCounts();
      const workers = await queue.getWorkers();

      return {
        jobType,
        ...counts,
        activeWorkers: workers.length,
      };
    } catch (error) {
      console.error("[JobQueue] Get queue stats failed:", error);
      throw error;
    }
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats(): Promise<any> {
    try {
      const stats: any = {};

      for (const [jobType] of this.queues) {
        stats[jobType] = await this.getQueueStats(jobType);
      }

      return stats;
    } catch (error) {
      console.error("[JobQueue] Get all queue stats failed:", error);
      throw error;
    }
  }

  /**
   * Pause queue
   */
  async pauseQueue(jobType: JobType): Promise<void> {
    try {
      const queue = this.queues.get(jobType);
      if (!queue) {
        throw new Error(`Queue not found: ${jobType}`);
      }

      await queue.pause();
      console.log(`[JobQueue] Queue paused: ${jobType}`);
    } catch (error) {
      console.error("[JobQueue] Pause queue failed:", error);
      throw error;
    }
  }

  /**
   * Resume queue
   */
  async resumeQueue(jobType: JobType): Promise<void> {
    try {
      const queue = this.queues.get(jobType);
      if (!queue) {
        throw new Error(`Queue not found: ${jobType}`);
      }

      await queue.resume();
      console.log(`[JobQueue] Queue resumed: ${jobType}`);
    } catch (error) {
      console.error("[JobQueue] Resume queue failed:", error);
      throw error;
    }
  }

  /**
   * Clear queue
   */
  async clearQueue(jobType: JobType): Promise<void> {
    try {
      const queue = this.queues.get(jobType);
      if (!queue) {
        throw new Error(`Queue not found: ${jobType}`);
      }

      await queue.clean(0, 1000);
      console.log(`[JobQueue] Queue cleared: ${jobType}`);
    } catch (error) {
      console.error("[JobQueue] Clear queue failed:", error);
      throw error;
    }
  }

  /**
   * Shutdown all workers and queues
   */
  async shutdown(): Promise<void> {
    try {
      console.log("[JobQueue] Shutting down...");

      // Close all workers
      for (const [jobType, worker] of this.workers) {
        await worker.close();
        console.log(`[JobQueue] Closed worker: ${jobType}`);
      }

      // Close all queue events
      for (const [jobType, queueEvents] of this.queueEvents) {
        await queueEvents.close();
        console.log(`[JobQueue] Closed queue events: ${jobType}`);
      }

      // Close all queues
      for (const [jobType, queue] of this.queues) {
        await queue.close();
        console.log(`[JobQueue] Closed queue: ${jobType}`);
      }

      console.log("[JobQueue] Shutdown complete");
    } catch (error) {
      console.error("[JobQueue] Shutdown failed:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const jobQueueService = new JobQueueService();
