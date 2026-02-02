/**
 * SOKO AFRICA - NEURAL ENGINE v2.0
 * Classification: Core Intelligence Systems
 * Scientist: Dr. Joe Galo
 * Standards: CUDA Optimization, Memory Safety, Saga Transactions
 */

import { Worker, Job, Queue } from 'bullmq';
import { pipeline, Pipeline } from '@xenova/transformers';
import IORedis from 'ioredis';
import { db } from '../db';
import { productsUpdated as products, ingestionFailures, productEvents, vendors } from '../../drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';
import os from 'os';
import axios from 'axios';

// ==========================================
// CONFIGURATION: Hyperparameters (Tuned for RTX 4090/A100)
// ==========================================
const CONFIG = {
  SIGLIP: {
    MODEL: 'google/siglip-base-patch16-224',
    DIMENSIONS: 768,
    BATCH_SIZE: 8,
    MAX_CONCURRENCY: 5,
  },
  MEMORY: {
    CLEANUP_INTERVAL: 50,
    MAX_HEAP_MB: 6144,
    EMERGENCY_GC_THRESHOLD: 0.85,
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    BACKOFF_MS: 2000,
    EXPONENTIAL_FACTOR: 2,
  },
  ZILLIZ: {
    COLLECTION: 'soko_africa_siglip_v1',
    CONSISTENCY_LEVEL: 'Bounded',
  }
} as const;

// ==========================================
// INFRASTRUCTURE: Redis Connection Pool
// ==========================================
const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

const dlqMonitor = new Queue('soko:dlq:monitoring', { connection: redis });

// ==========================================
// AI CORE: SigLIP Singleton with CUDA Graphs
// ==========================================
class SigLIPEngine {
  private static instance: SigLIPEngine;
  private embedder: Pipeline | null = null;
  private inferenceCount = 0;
  private lastGCTime = Date.now();
  
  private constructor() {}
  
  static async getInstance(): Promise<SigLIPEngine> {
    if (!SigLIPEngine.instance) {
      SigLIPEngine.instance = new SigLIPEngine();
      await SigLIPEngine.instance.initialize();
    }
    return SigLIPEngine.instance;
  }
  
  private async initialize(): Promise<void> {
    console.log('[SigLIP] Initializing ONNX Runtime with CUDA...');
    
    // CUDA optimization flags
    process.env.ORT_CUDA_USE_CUDA_GRAPH = '1';
    process.env.ORT_CUDA_JITIFY = '1';
    
    try {
      this.embedder = await pipeline('feature-extraction', CONFIG.SIGLIP.MODEL, {
        revision: 'main',
        quantized: false,
        // In sandbox environment, we might not have CUDA, fallback to CPU if needed
        device: (process.env.NODE_ENV === 'production') ? 'cuda' : 'cpu',
      });
      
      // Warm-up inference
      const dummy = new Float32Array(224 * 224 * 3);
      await this.embedder(dummy, { pooling: 'mean', normalize: true });
      console.log('[SigLIP] Engine warmed. Ready.');
    } catch (error) {
      console.error('[SigLIP] Initialization failed:', error);
      throw error;
    }
  }
  
  async vectorize(imageBuffer: Buffer): Promise<Float32Array> {
    if (!this.embedder) throw new Error('SigLIP not initialized');
    
    try {
      const output = await this.embedder(imageBuffer, {
        pooling: 'mean',
        normalize: true,
      });
      
      // The output from transformers.js might be a Tensor object
      const data = output.data instanceof Float32Array ? output.data : new Float32Array(Object.values(output.data));

      if (data.length !== CONFIG.SIGLIP.DIMENSIONS) {
        throw new Error(`Dimension mismatch: ${data.length} ≠ 768`);
      }
      
      // CRITICAL: Dispose tensor to prevent OOM if the environment supports it
      if ((output as any).dispose) (output as any).dispose();
      
      this.inferenceCount++;
      await this.maybeCleanup();
      
      return data;
      
    } catch (error: any) {
      // Emergency reset on CUDA error
      if (error.message?.includes('CUDA')) {
        console.error('[SigLIP] CUDA error, reinitializing...');
        this.embedder = null;
        await this.initialize();
      }
      throw error;
    }
  }
  
  private async maybeCleanup(): Promise<void> {
    if (this.inferenceCount % CONFIG.MEMORY.CLEANUP_INTERVAL === 0) {
      const usage = process.memoryUsage();
      const heapUsedMB = usage.heapUsed / 1024 / 1024;
      const heapTotalMB = usage.heapTotal / 1024 / 1024;
      const ratio = heapUsedMB / heapTotalMB;
      
      console.log(`[Memory] Heap: ${heapUsedMB.toFixed(0)}MB / ${heapTotalMB.toFixed(0)}MB (${(ratio*100).toFixed(1)}%)`);
      
      if (ratio > CONFIG.MEMORY.EMERGENCY_GC_THRESHOLD || heapUsedMB > CONFIG.MEMORY.MAX_HEAP_MB) {
        console.log('[Memory] Emergency GC triggered');
        if (global.gc) {
          global.gc();
        } else {
          console.warn('[Memory] global.gc is not available. Run with --expose-gc');
        }
        this.lastGCTime = Date.now();
      }
    }
  }
  
  getStats() {
    return { inferences: this.inferenceCount, lastGC: this.lastGCTime };
  }
}

// ==========================================
// NETWORK: Stealth Meta CDN Client
// ==========================================
class MetaCDNClient {
  private userAgents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15',
    'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36',
    'Mozilla/5.0 (Linux; Android 14; CPH2583) AppleWebKit/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_2 like Mac OS X) AppleWebKit/605.1.15',
  ];
  
  async fetchImage(url: string, attempt = 1): Promise<Buffer> {
    const jitter = Math.floor(Math.random() * 2000) + 1000;
    await new Promise(r => setTimeout(r, jitter));
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgents[Math.floor(Math.random() * this.userAgents.length)],
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-KE,en-US;q=0.9,sw-KE;q=0.8',
          'Referer': 'https://wa.me/',
          'DNT': '1',
        },
        responseType: 'arraybuffer',
        timeout: 15000,
      });
      
      return Buffer.from(response.data);
      
    } catch (error: any) {
      if (error.response?.status === 429) {
        const backoff = Math.pow(CONFIG.RETRY.EXPONENTIAL_FACTOR, attempt) * CONFIG.RETRY.BACKOFF_MS;
        console.warn(`[MetaCDN] Rate limited. Backing off ${backoff}ms`);
        await new Promise(r => setTimeout(r, backoff));
        if (attempt < CONFIG.RETRY.MAX_ATTEMPTS) {
          return this.fetchImage(url, attempt + 1);
        }
      }
      
      if (attempt < CONFIG.RETRY.MAX_ATTEMPTS) return this.fetchImage(url, attempt + 1);
      throw error;
    }
  }
}

// ==========================================
// DATABASE: Distributed Transaction Coordinator (SAGA PATTERN)
// ==========================================
class TransactionCoordinator {
  async executeSaga(jobData: any, vector: Float32Array) {
    const { url, vendorId, imageHash, title, price, metadata } = jobData;
    let zillizId: string | null = null;
    const correlationId = crypto.randomUUID();
    const productUuid = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      // IDEMPOTENCY: Check for existing product
      const existing = await db
        .select({ id: products.id, status: products.status, vectorId: products.vectorId })
        .from(products)
        .where(eq(products.imageHash, imageHash))
        .limit(1);
      
      if (existing.length > 0) {
        console.log(`[Saga] Duplicate: ${imageHash} -> Product ${existing[0].id}`);
        await this.logEvent(existing[0].id, 'duplicate_detected', { correlationId, productUuid: 'existing' }, jobData);
        return { skipped: true, productId: existing[0].id };
      }
      
      // PHASE 1: Zilliz Insert (External - highest failure risk)
      const zillizUrl = process.env.ZILLIZ_URL || process.env.MILVUS_ADDRESS;
      const zillizToken = process.env.ZILLIZ_TOKEN || process.env.MILVUS_PASSWORD;

      const zillizRes = await axios.post(`${zillizUrl}/v1/vector/insert`, {
        collection: CONFIG.ZILLIZ.COLLECTION,
        data: [{
          vector: Array.from(vector),
          image_hash: imageHash,
          vendor_id: vendorId,
          source_url: url,
          status: 'pending',
          created_at: new Date().toISOString(),
        }],
      }, {
        headers: {
          'Authorization': `Bearer ${zillizToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      const zillizData = zillizRes.data;
      zillizId = zillizData.data?.insertIds?.[0] || zillizData.ids?.[0];
      if (!zillizId) throw new Error('Zilliz returned empty ID');
      
      // PHASE 2: TiDB Insert (Source of truth)
      const [insertedProduct] = await db.insert(products).values({
        uuid: productUuid,
        vendorId,
        title: title || 'Untitled Product',
        slug: `${title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50)}-${Date.now()}`,
        priceKes: price?.toString() || '0',
        sourceUrl: url,
        imageUrl: url,
        imageHash,
        vectorId: zillizId,
        vectorStatus: 'ready',
        status: 'active',
        ingestionCompletedAt: new Date(),
        ingestionDurationMs: Date.now() - startTime,
        aiTags: JSON.stringify(metadata?.aiTags || []),
      });
      
      const productId = (insertedProduct as any).insertId;

      // PHASE 3: Zilliz Enrichment (Non-critical)
      try {
        await axios.post(`${zillizUrl}/v1/vector/upsert`, {
          collection: CONFIG.ZILLIZ.COLLECTION,
          data: [{
            id: zillizId,
            product_id: productId,
            product_uuid: productUuid,
            status: 'active',
            activated_at: new Date().toISOString(),
          }],
        }, {
          headers: {
            'Authorization': `Bearer ${zillizToken}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (err: any) {
        console.warn(`[Saga] Zilliz enrichment failed (non-critical): ${err.message}`);
      }
      
      // Audit trail
      await this.logEvent(productId, 'vectorized', { 
        correlationId, zillizId, dimensions: CONFIG.SIGLIP.DIMENSIONS, productUuid 
      }, jobData);
      
      return { success: true, productId, zillizId, productUuid };
      
    } catch (error: any) {
      // COMPENSATING TRANSACTION: Rollback Zilliz
      if (zillizId) {
        try {
          const zillizUrl = process.env.ZILLIZ_URL || process.env.MILVUS_ADDRESS;
          const zillizToken = process.env.ZILLIZ_TOKEN || process.env.MILVUS_PASSWORD;
          
          await axios.post(`${zillizUrl}/v1/vector/delete`, {
            collection: CONFIG.ZILLIZ.COLLECTION,
            ids: [zillizId],
          }, {
            headers: {
              'Authorization': `Bearer ${zillizToken}`,
              'Content-Type': 'application/json',
            },
          });
          console.log(`[Saga] Compensated Zilliz deletion: ${zillizId}`);
        } catch (rollbackError: any) {
          console.error(`[Saga] CRITICAL: Rollback failed: ${rollbackError.message}`);
          await dlqMonitor.add('rollback-failure', {
            zillizId, originalError: error.message, rollbackError: rollbackError.message,
          });
        }
      }
      throw error;
    }
  }
  
  private async logEvent(productId: number, eventType: string, data: any, jobData: any) {
    await db.insert(productEvents).values({
      uuid: crypto.randomUUID(),
      productId,
      productUuid: data.productUuid || 'unknown',
      eventType,
      eventData: JSON.stringify(data),
      actor: 'neural-engine-v2',
      correlationId: data.correlationId || crypto.randomUUID(),
    });
  }
}

// ==========================================
// WORKER: BullMQ Production Processor
// ==========================================
async function bootstrap() {
  // Initialize database
  const { getDb } = await import('../db');
  await getDb();

  const engine = await SigLIPEngine.getInstance();
  const cdn = new MetaCDNClient();
  const coordinator = new TransactionCoordinator();
  
  console.log(`[Worker] Neural Engine v2.0 on ${os.hostname()}`);
  console.log(`[Worker] CUDA: ${process.env.CUDA_VISIBLE_DEVICES || 'default'}`);
  
  const worker = new Worker('ingestion-queue', async (job: Job) => {
    const startTime = Date.now();
    const { url, vendorId, imageHash, title, price, metadata } = job.data;
    
    console.log(`[Job ${job.id}] ${url.substring(0, 60)}...`);
    
    try {
      // Step 1: Fetch with stealth
      const imageBuffer = await cdn.fetchImage(url);
      console.log(`[Job ${job.id}] Image: ${imageBuffer.length} bytes`);
      
      // Step 2: Vectorize (SigLIP-768)
      const vector = await engine.vectorize(imageBuffer);
      console.log(`[Job ${job.id}] Vector: ${vector.length}D`);
      
      // Step 3: Distributed transaction
      const result = await coordinator.executeSaga(job.data, vector);
      
      if (result.skipped) {
        return { status: 'skipped', reason: 'duplicate', duration: Date.now() - startTime };
      }
      
      console.log(`[Job ${job.id}] Success: Product ${result.productId}`);
      return { status: 'success', productId: result.productId, duration: Date.now() - startTime };
      
    } catch (error: any) {
      console.error(`[Job ${job.id}] Failed: ${error.message}`);
      throw new Error(JSON.stringify({
        category: error.message.includes('CUDA') ? 'ai' : 
                  error.message.includes('429') ? 'rate_limit' : 
                  error.message.includes('Zilliz') ? 'database' : 'unknown',
        message: error.message,
        timestamp: Date.now(),
      }));
    }
  }, {
    connection: redis,
    concurrency: CONFIG.SIGLIP.MAX_CONCURRENCY,
    limiter: { max: 10, duration: 5000 },
  });
  
  // DLQ Handler
  worker.on('failed', async (job, err) => {
    if (!job) return;
    const parsed = JSON.parse(err.message);
    const attempts = job.attemptsMade;
    
    if (attempts >= CONFIG.RETRY.MAX_ATTEMPTS) {
      await db.insert(ingestionFailures).values({
        uuid: crypto.randomUUID(),
        sourceUrl: job.data.url,
        vendorId: job.data.vendorId,
        errorCategory: parsed.category,
        errorMessage: parsed.message,
        errorStack: JSON.stringify(parsed),
        workerNode: os.hostname(),
        retryAttempts: attempts,
        permanentFailure: true,
        originalPayload: JSON.stringify(job.data),
      });
      
      await dlqMonitor.add('permanent-failure', {
        jobId: job.id, url: job.data.url, category: parsed.category,
      });
      
      await db.update(products)
        .set({ status: 'failed_vectorization', lastError: JSON.stringify(parsed) })
        .where(eq(products.imageHash, job.data.imageHash));
    }
  });
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('[Worker] SIGTERM, closing...');
    await worker.close();
    await redis.quit();
    process.exit(0);
  });
}

bootstrap().catch(console.error);
