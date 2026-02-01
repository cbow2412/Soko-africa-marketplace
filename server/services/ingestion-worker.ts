import { Worker, Job } from "bullmq";
import { Redis } from "ioredis";
import { ENV } from "../_core/env";
import { ScoutHydrateService } from "./scout-hydrate";

/**
 * Ingestion Worker
 * 
 * This worker processes background jobs for WhatsApp catalog ingestion.
 * It is decoupled from the main API to ensure high availability and scalability.
 */

const connection = new Redis(ENV.redisUrl || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const ingestionWorker = new Worker(
  "scrape-catalog", // Using the existing queue name from job-queue.ts
  async (job: Job) => {
    const { catalogUrl, sellerId } = job.data;
    console.log(`[Worker] Processing ingestion for: ${catalogUrl} (Seller: ${sellerId})`);

    try {
      // Perform the heavy lifting: Scraping and Hydration
      const product = await ScoutHydrateService.hydrateFromUrl(catalogUrl);
      
      await job.updateProgress(50);

      // In a real scenario, we would save to the database here
      // For now, we simulate the completion
      console.log(`[Worker] Successfully hydrated product: ${product.name}`);
      
      await job.updateProgress(100);
      return { 
        success: true, 
        productName: product.name,
        sellerId 
      };
    } catch (error: any) {
      console.error(`[Worker] Failed to process job ${job.id}:`, error);
      throw error; // BullMQ will handle retries based on job options
    }
  },
  { 
    connection, 
    concurrency: 5 // Process 5 ingestions in parallel per worker instance
  }
);

ingestionWorker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

ingestionWorker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error:`, err.message);
});

console.log("[Worker] Ingestion worker initialized and listening for jobs...");
