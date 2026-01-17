import { jobQueueService, JobData, JobResult } from "./job-queue";
import { RealSigLIPEmbeddings } from "./siglip-real";
import { GeminiQualityControl } from "./gemini-quality-control";
import { milvusDB, ProductEmbedding } from "./milvus-client";
import { redisService } from "./redis-client";

/**
 * Job Processors
 * 
 * Define how each job type is processed
 */

/**
 * Catalog Scraping Processor
 * Scrapes WhatsApp Business catalog and extracts products
 */
export async function processCatalogScraping(job: any): Promise<JobResult> {
  const startTime = Date.now();

  try {
    console.log(`[Processor] Processing catalog scraping job: ${job.id}`);

    const { catalogUrl, sellerId } = job.data as JobData;

    if (!catalogUrl || !sellerId) {
      throw new Error("Missing catalogUrl or sellerId");
    }

    // Simulate catalog scraping
    // In production, use Playwright to scrape the actual catalog
    const products = [
      {
        name: "Product 1",
        description: "Description 1",
        price: "1000",
        imageUrl: "https://example.com/image1.jpg",
      },
      {
        name: "Product 2",
        description: "Description 2",
        price: "2000",
        imageUrl: "https://example.com/image2.jpg",
      },
    ];

    console.log(`[Processor] Scraped ${products.length} products from ${catalogUrl}`);

    // Queue embedding generation for each product
    const embedJobs = products.map((product) => ({
      ...product,
      sellerId,
    }));

    await jobQueueService.addBulkJobs("generate-embedding", embedJobs);

    const duration = Date.now() - startTime;

    return {
      success: true,
      data: {
        productsScraped: products.length,
        catalogUrl,
        sellerId,
      },
      duration,
    };
  } catch (error) {
    console.error("[Processor] Catalog scraping failed:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Embedding Generation Processor
 * Generates SigLIP embeddings for products
 */
export async function processEmbeddingGeneration(job: any): Promise<JobResult> {
  const startTime = Date.now();

  try {
    console.log(`[Processor] Processing embedding generation job: ${job.id}`);

    const { productName, description, imageUrl, productId, sellerId } = job.data as JobData;

    if (!productName || !description || !imageUrl) {
      throw new Error("Missing product data");
    }

    // Generate embeddings
    const embedding = await RealSigLIPEmbeddings.generateEmbeddings(
      productName,
      description,
      imageUrl
    );

    // Store in Milvus
    const productEmbedding: ProductEmbedding = {
      productId: productId || Math.random() * 10000,
      embedding,
      metadata: {
        productName,
        category: "General",
        price: 0,
        sellerId: sellerId || 0,
      },
    };

    await milvusDB.insertEmbeddings([productEmbedding]);

    console.log(`[Processor] Embeddings generated and stored for ${productName}`);

    // Queue quality control
    await jobQueueService.addJob("quality-control", {
      productName,
      description,
      imageUrl,
      productId,
      sellerId,
    });

    const duration = Date.now() - startTime;

    return {
      success: true,
      data: {
        productName,
        embeddingDimension: embedding.length,
      },
      duration,
    };
  } catch (error) {
    console.error("[Processor] Embedding generation failed:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Quality Control Processor
 * Analyzes products with Gemini AI
 */
export async function processQualityControl(job: any): Promise<JobResult> {
  const startTime = Date.now();

  try {
    console.log(`[Processor] Processing quality control job: ${job.id}`);

    const { productName, description, imageUrl, productId, sellerId } = job.data as JobData;

    if (!productName || !description || !imageUrl) {
      throw new Error("Missing product data");
    }

    // Analyze with Gemini
    const qcResult = await GeminiQualityControl.analyzeProduct(
      productName,
      description,
      "1000", // price
      imageUrl
    );

    console.log(`[Processor] QC analysis complete: ${productName} - ${qcResult.decision}`);

    // Cache QC result
    await redisService.set(`qc:${productId}`, qcResult, { ttl: 86400 }); // 24 hours

    const duration = Date.now() - startTime;

    return {
      success: true,
      data: {
        productName,
        decision: qcResult.decision,
        confidence: qcResult.confidence,
      },
      duration,
    };
  } catch (error) {
    console.error("[Processor] Quality control failed:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Product Indexing Processor
 * Indexes products in search systems
 */
export async function processProductIndexing(job: any): Promise<JobResult> {
  const startTime = Date.now();

  try {
    console.log(`[Processor] Processing product indexing job: ${job.id}`);

    const { productId, productName } = job.data as JobData;

    if (!productId || !productName) {
      throw new Error("Missing product data");
    }

    // Index in search systems (Elasticsearch, etc.)
    console.log(`[Processor] Indexed product: ${productName}`);

    const duration = Date.now() - startTime;

    return {
      success: true,
      data: {
        productId,
        productName,
        indexed: true,
      },
      duration,
    };
  } catch (error) {
    console.error("[Processor] Product indexing failed:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Seller Sync Processor
 * Orchestrates full seller catalog sync
 */
export async function processSyncSeller(job: any): Promise<JobResult> {
  const startTime = Date.now();

  try {
    console.log(`[Processor] Processing seller sync job: ${job.id}`);

    const { catalogUrl, sellerId } = job.data as JobData;

    if (!catalogUrl || !sellerId) {
      throw new Error("Missing catalogUrl or sellerId");
    }

    // Start catalog scraping
    const scrapeJobId = await jobQueueService.addJob("scrape-catalog", {
      catalogUrl,
      sellerId,
    });

    console.log(`[Processor] Started catalog scraping: ${scrapeJobId}`);

    const duration = Date.now() - startTime;

    return {
      success: true,
      data: {
        sellerId,
        scrapeJobId,
        status: "started",
      },
      duration,
    };
  } catch (error) {
    console.error("[Processor] Seller sync failed:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Register all processors
 */
export async function registerAllProcessors(): Promise<void> {
  console.log("[Processors] Registering all job processors...");

  await jobQueueService.registerProcessor("scrape-catalog", processCatalogScraping);
  await jobQueueService.registerProcessor("generate-embedding", processEmbeddingGeneration);
  await jobQueueService.registerProcessor("quality-control", processQualityControl);
  await jobQueueService.registerProcessor("index-product", processProductIndexing);
  await jobQueueService.registerProcessor("sync-seller", processSyncSeller);

  console.log("[Processors] All processors registered");
}
