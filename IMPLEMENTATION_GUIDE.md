# Phase 3 Implementation Guide: Scout & Hydrate Pipeline

**For**: Developers integrating the new ingestion engine  
**Status**: Ready for Production  
**Last Updated**: January 22, 2026

---

## Quick Start: Integrating Scout & Hydrate

### 1. Import the Services

```typescript
import { WhatsAppScraperV3, ScrapedProduct } from "@/server/services/whatsapp-scraper-v2";
import { RealSigLIPEmbeddings } from "@/server/services/siglip-real";
import { GeminiQualityControl } from "@/server/services/gemini-quality-control";
```

### 2. Run the Full Pipeline

```typescript
// Step 1: Scrape catalog (Scout + Hydrate)
const catalogUrl = "wa.me/c/254712345678";
const products = await WhatsAppScraperV3.scrapeCatalog(catalogUrl);
// Returns: Array of ScrapedProduct with og:image URLs (Meta CDN)

// Step 2: Generate hybrid embeddings
const embeddings = await RealSigLIPEmbeddings.generateBatchEmbeddings(
  products.map(p => ({
    name: p.name,
    description: p.description,
    imageUrl: p.imageUrl // Meta CDN link
  })),
  10 // concurrency
);
// Returns: Array of 768-dimensional vectors (0.6 image / 0.4 text)

// Step 3: Quality control
const qcResults = await GeminiQualityControl.analyzeProducts(products);
// Returns: Array of QCResult with approval/rejection decisions

// Step 4: Store in database
for (let i = 0; i < products.length; i++) {
  const product = products[i];
  const embedding = embeddings[i];
  const qc = qcResults[i];

  if (qc.decision === "approved") {
    // Store product with Meta CDN link
    await db.products.create({
      productId: product.productId,
      sellerPhone: product.sellerPhone,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl, // Meta CDN
      embedding: embedding,
      lastHydratedAt: product.lastHydratedAt,
      qcDecision: qc.decision,
      qcConfidence: qc.confidence
    });

    // Queue for Lazy Persistence (S3 upload)
    await jobQueue.add("lazy-persistence", {
      productId: product.productId,
      imageUrl: product.imageUrl
    });
  } else {
    // Log rejection
    console.log(`Product ${product.productId} rejected: ${qc.reason}`);
  }
}
```

---

## Advanced: Custom Configuration

### Scout Configuration

```typescript
// Default: Uses domcontentloaded
const results = await WhatsAppScraperV3.scout("wa.me/c/254712345678");

// All products are extracted with minimal browser interaction
// No image loading, no JavaScript execution
```

### Hydrator Configuration

```typescript
// Default: 20 concurrent fetches
const hydrated = await WhatsAppScraperV3.hydrate(scoutResults, 20);

// For rate-limited scenarios, reduce concurrency:
const hydrated = await WhatsAppScraperV3.hydrate(scoutResults, 5);

// Each fetch:
// - Rotates User-Agent randomly
// - Implements exponential backoff on 429/5xx
// - Logs errors to catalogSyncLogs
// - Returns null on 404 (product deleted)
```

### Embedding Configuration

```typescript
// Default: 0.6 image / 0.4 text
const embedding = await RealSigLIPEmbeddings.generateEmbeddings(
  "Mahogany Sofa",
  "Beautiful handcrafted mahogany sofa with leather cushions",
  "https://scontent.cdninstagram.com/...",
  {
    imageWeight: 0.6,
    textWeight: 0.4,
    normalize: true
  }
);

// For text-heavy products (e.g., electronics with detailed specs):
// You can adjust weights, but NOT recommended for Kenyan marketplace
// (images are more important than descriptions)
```

---

## Database Integration

### Schema Migration

```sql
-- Add new fields to products table
ALTER TABLE products ADD COLUMN productId VARCHAR(16) UNIQUE;
ALTER TABLE products ADD COLUMN sellerPhone VARCHAR(15);
ALTER TABLE products ADD COLUMN s3ImageUrl TEXT;
ALTER TABLE products ADD COLUMN lastHydratedAt TIMESTAMP;
ALTER TABLE products ADD COLUMN catalogSyncId VARCHAR(255);

-- Create catalogSyncLogs table
CREATE TABLE catalogSyncLogs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sellerId VARCHAR(255),
  productId VARCHAR(16),
  eventType ENUM(
    'scout_start', 'scout_success', 'scout_error',
    'hydrate_start', 'hydrate_success', 'hydrate_404', 'hydrate_429', 'hydrate_error',
    'qc_approved', 'qc_rejected', 'qc_flagged',
    'lazy_persist_start', 'lazy_persist_success', 'lazy_persist_failed'
  ),
  statusCode INT,
  errorMessage TEXT,
  details JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product (productId),
  INDEX idx_seller (sellerId),
  INDEX idx_event (eventType),
  INDEX idx_created (createdAt)
);

-- Create productEmbeddings table
CREATE TABLE productEmbeddings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  productId VARCHAR(16) UNIQUE,
  embedding LONGBLOB, -- Store 768-dimensional vector as binary
  imageWeight FLOAT DEFAULT 0.6,
  textWeight FLOAT DEFAULT 0.4,
  generatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product (productId)
);
```

### Drizzle ORM Schema

```typescript
// In server/db.ts
import { sql } from "drizzle-orm";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  productId: varchar("product_id", { length: 16 }).unique(),
  sellerPhone: varchar("seller_phone", { length: 15 }),
  name: varchar("name", { length: 255 }),
  description: text("description"),
  imageUrl: text("image_url"), // Meta CDN link
  s3ImageUrl: text("s3_image_url"), // S3 backup
  lastHydratedAt: timestamp("last_hydrated_at"),
  catalogSyncId: varchar("catalog_sync_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const catalogSyncLogs = pgTable("catalog_sync_logs", {
  id: serial("id").primaryKey(),
  sellerId: varchar("seller_id", { length: 255 }),
  productId: varchar("product_id", { length: 16 }),
  eventType: varchar("event_type", { length: 50 }),
  statusCode: integer("status_code"),
  errorMessage: text("error_message"),
  details: json("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productEmbeddings = pgTable("product_embeddings", {
  id: serial("id").primaryKey(),
  productId: varchar("product_id", { length: 16 }).unique(),
  embedding: bytea("embedding"), // 768 floats = 3072 bytes
  imageWeight: real("image_weight").default(0.6),
  textWeight: real("text_weight").default(0.4),
  generatedAt: timestamp("generated_at").defaultNow(),
});
```

---

## Job Queue Integration

### Queue Jobs

```typescript
// In server/services/job-queue.ts

// Job 1: Sync Seller Catalog
jobQueue.process("sync-seller", async (job) => {
  const { catalogUrl, sellerId } = job.data;
  
  // Scout
  const scoutResults = await WhatsAppScraperV3.scout(catalogUrl);
  
  // Hydrate
  const hydrationResults = await WhatsAppScraperV3.hydrate(scoutResults, 20);
  
  // Queue embedding jobs
  for (const result of hydrationResults) {
    await jobQueue.add("generate-embedding", {
      productId: result.productId,
      sellerPhone: result.sellerPhone,
      name: result.title,
      description: result.description,
      imageUrl: result.ogImageUrl
    });
  }
  
  // Log sync completion
  await db.catalogSyncLogs.create({
    sellerId,
    eventType: "scout_success",
    details: { productsFound: hydrationResults.length }
  });
});

// Job 2: Generate Embedding
jobQueue.process("generate-embedding", async (job) => {
  const { productId, name, description, imageUrl } = job.data;
  
  const embedding = await RealSigLIPEmbeddings.generateEmbeddings(
    name,
    description,
    imageUrl
  );
  
  // Store embedding
  await db.productEmbeddings.create({
    productId,
    embedding: Buffer.from(new Float32Array(embedding).buffer)
  });
  
  // Queue QC job
  await jobQueue.add("quality-control", {
    productId,
    name,
    description,
    imageUrl
  });
});

// Job 3: Quality Control
jobQueue.process("quality-control", async (job) => {
  const { productId, name, description, imageUrl } = job.data;
  
  const qcResult = await GeminiQualityControl.analyzeProduct(
    name,
    description,
    "KES 0.00", // Extract from description if available
    imageUrl
  );
  
  if (qcResult.decision === "approved") {
    // Queue Lazy Persistence
    await jobQueue.add("lazy-persistence", {
      productId,
      imageUrl
    });
  }
  
  // Log QC result
  await db.catalogSyncLogs.create({
    productId,
    eventType: `qc_${qcResult.decision}`,
    details: qcResult
  });
});

// Job 4: Lazy Persistence (S3 Upload)
jobQueue.process("lazy-persistence", async (job) => {
  const { productId, imageUrl } = job.data;
  
  try {
    // Download from Meta CDN
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    
    // Upload to S3
    const s3Key = `products/${productId}.jpg`;
    await s3Client.putObject({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      Body: response.data,
      ContentType: "image/jpeg"
    });
    
    // Update product with S3 URL
    const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;
    await db.products.update(
      { productId },
      { s3ImageUrl: s3Url }
    );
    
    // Log success
    await db.catalogSyncLogs.create({
      productId,
      eventType: "lazy_persist_success",
      details: { s3Url }
    });
  } catch (error) {
    // Log failure
    await db.catalogSyncLogs.create({
      productId,
      eventType: "lazy_persist_failed",
      errorMessage: error.message
    });
  }
});
```

---

## Error Handling Best Practices

### Logging to catalogSyncLogs

```typescript
// Always log important events
async function logSyncEvent(
  productId: string,
  eventType: string,
  statusCode?: number,
  errorMessage?: string,
  details?: any
) {
  await db.catalogSyncLogs.create({
    productId,
    eventType,
    statusCode,
    errorMessage,
    details: details ? JSON.stringify(details) : null,
    createdAt: new Date()
  });
}

// Usage
await logSyncEvent("1234567890123456", "hydrate_404", 404, "Product not found");
await logSyncEvent("1234567890123456", "hydrate_429", 429, "Rate limited", { retryAfter: 60 });
await logSyncEvent("1234567890123456", "qc_rejected", null, null, { reason: "Blurry image" });
```

### Handling Rate Limits

```typescript
// The Hydrator already implements exponential backoff
// But you can monitor and adjust:

async function monitorRateLimiting() {
  const last24h = await db.catalogSyncLogs.findMany({
    where: {
      eventType: "hydrate_429",
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  });
  
  if (last24h.length > 100) {
    console.warn("High rate limiting detected. Consider reducing concurrency.");
    // Reduce HYDRATOR_CONCURRENCY from 20 to 10
  }
}
```

---

## Testing the Pipeline

### Unit Tests

```typescript
// test/scout.test.ts
import { WhatsAppScraperV3 } from "@/server/services/whatsapp-scraper-v2";

describe("Scout", () => {
  it("should extract product IDs from catalog URL", async () => {
    const results = await WhatsAppScraperV3.scout("wa.me/c/254712345678");
    expect(results).toHaveLength(10); // Adjust based on test catalog
    expect(results[0]).toHaveProperty("productId");
    expect(results[0]).toHaveProperty("sellerPhone");
  });
});

// test/hydrator.test.ts
describe("Hydrator", () => {
  it("should extract OG metadata from product link", async () => {
    const scoutResults = [{ productId: "1234567890123456", sellerPhone: "254712345678" }];
    const hydrated = await WhatsAppScraperV3.hydrate(scoutResults, 1);
    
    expect(hydrated).toHaveLength(1);
    expect(hydrated[0]).toHaveProperty("title");
    expect(hydrated[0]).toHaveProperty("ogImageUrl");
  });
});

// test/embeddings.test.ts
describe("SigLIP Embeddings", () => {
  it("should generate 768-dimensional hybrid vector", async () => {
    const embedding = await RealSigLIPEmbeddings.generateEmbeddings(
      "Mahogany Sofa",
      "Beautiful handcrafted sofa",
      "https://example.com/image.jpg"
    );
    
    expect(embedding).toHaveLength(768);
    expect(embedding.every(v => typeof v === "number")).toBe(true);
  });
});
```

### Integration Tests

```typescript
// test/pipeline.integration.test.ts
describe("Full Scout & Hydrate Pipeline", () => {
  it("should process a real catalog end-to-end", async () => {
    const catalogUrl = "wa.me/c/254712345678";
    
    // Run full pipeline
    const products = await WhatsAppScraperV3.scrapeCatalog(catalogUrl);
    
    expect(products.length).toBeGreaterThan(0);
    expect(products[0]).toHaveProperty("productId");
    expect(products[0]).toHaveProperty("imageUrl");
    expect(products[0].imageUrl).toMatch(/scontent|fbcdn/); // Meta CDN
  });
});
```

---

## Monitoring & Observability

### Key Metrics to Track

```typescript
// Prometheus metrics
const scoutSuccessRate = new Gauge({
  name: "scout_success_rate",
  help: "Percentage of successful scout operations"
});

const hydratorLatency = new Histogram({
  name: "hydrator_latency_ms",
  help: "Latency of hydrator requests",
  buckets: [100, 500, 1000, 5000, 10000]
});

const embeddingGenerationTime = new Histogram({
  name: "embedding_generation_ms",
  help: "Time to generate embeddings",
  buckets: [100, 500, 1000, 5000]
});

const s3UploadSuccess = new Gauge({
  name: "s3_upload_success_rate",
  help: "Percentage of successful S3 uploads"
});
```

### Alerting Rules

```yaml
# Prometheus alerts
- alert: HighScoutErrorRate
  expr: (1 - scout_success_rate) > 0.1
  for: 5m
  annotations:
    summary: "Scout error rate >10%"

- alert: HighHydratorLatency
  expr: histogram_quantile(0.95, hydrator_latency_ms) > 5000
  for: 5m
  annotations:
    summary: "Hydrator p95 latency >5s"

- alert: HighRateLimitingEvents
  expr: increase(hydrate_429_total[1h]) > 100
  for: 5m
  annotations:
    summary: "Rate limiting detected, consider reducing concurrency"
```

---

## Troubleshooting Checklist

### Scout Issues
- [ ] Verify catalog URL format: `wa.me/c/[PHONE]`
- [ ] Check if catalog is public (not private)
- [ ] Verify Playwright is installed: `npm list playwright`
- [ ] Check browser logs for DOM changes
- [ ] Verify regex pattern: `/\/p\/(\d{16})\//`

### Hydrator Issues
- [ ] Check `catalogSyncLogs` for `hydrate_429` events
- [ ] Verify User-Agent rotation is working
- [ ] Test single product fetch: `curl -H "User-Agent: ..." wa.me/p/[ID]/[PHONE]`
- [ ] Verify OG metadata exists: `curl ... | grep og:image`
- [ ] Check network connectivity to Meta CDN

### Embedding Issues
- [ ] Verify Hugging Face API token: `echo $HF_TOKEN`
- [ ] Test HF API: `curl -H "Authorization: Bearer $HF_TOKEN" https://api-inference.huggingface.co/models/google/siglip-base-patch16-224`
- [ ] Check image URLs are accessible
- [ ] Verify text cleaning doesn't remove all content
- [ ] Check embedding dimension: `embedding.length === 768`

### Database Issues
- [ ] Verify schema migrations ran: `SELECT * FROM catalogSyncLogs LIMIT 1`
- [ ] Check productId uniqueness constraint
- [ ] Verify embedding storage format (binary vs. JSON)
- [ ] Monitor database connection pool

---

## Performance Optimization Tips

1. **Increase Hydrator Concurrency** (if rate limiting is not an issue):
   ```typescript
   const hydrated = await WhatsAppScraperV3.hydrate(scoutResults, 30);
   ```

2. **Batch Embedding Generation**:
   ```typescript
   const embeddings = await RealSigLIPEmbeddings.generateBatchEmbeddings(
     products,
     20 // concurrency
   );
   ```

3. **Use Redis Caching** for frequently accessed products:
   ```typescript
   const cached = await redis.get(`product:${productId}`);
   if (cached) return JSON.parse(cached);
   ```

4. **Lazy Load Images** in frontend:
   ```html
   <img src={product.s3ImageUrl || product.imageUrl} loading="lazy" />
   ```

---

## References

- **Architecture**: `/ARCHITECTURE_PHASE3.md`
- **Scout & Hydrator**: `/server/services/whatsapp-scraper-v2.ts`
- **Embeddings**: `/server/services/siglip-real.ts`
- **Quality Control**: `/server/services/gemini-quality-control.ts`
- **Database**: `/server/db.ts`
- **Job Queue**: `/server/services/job-queue.ts`

---

**Last Updated**: January 22, 2026  
**Maintained By**: Manus AI
