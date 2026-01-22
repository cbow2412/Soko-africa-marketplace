# Milvus Vector Database Integration Guide

## Overview

This document outlines the **Milvus Vector Database Integration** for Soko Africa Marketplace, enabling scalable visual search across millions of products.

---

## Architecture

### Vector Pipeline

```
Product Image + Description
         ↓
   [Scout & Hydrate]
         ↓
   SigLIP Embeddings
   - Image: 768-dim
   - Text: 768-dim
         ↓
   [Hybrid Vectorization]
   - 0.6 * Image + 0.4 * Text = 768-dim
         ↓
   [Milvus Vector Database]
   - Collection: product_embeddings
   - Index: IVF_FLAT (L2 distance)
   - Partitions: By category
         ↓
   [Sub-second Similarity Search]
   - Query: New product image
   - Output: Top 10 similar products
```

### Milvus Collection Schema

```typescript
Collection: product_embeddings

Fields:
- product_id (Int64, Primary Key)
- embedding (FloatVector, 768-dim)
- product_name (VarChar, 256)
- category (VarChar, 64)
- price (Float)
- seller_id (Int64)
- image_url (VarChar, 2048)
- created_at (Int64, Unix timestamp)
- last_hydrated_at (Int64, Unix timestamp)

Index:
- Type: IVF_FLAT
- Metric: L2 (Euclidean distance)
- nlist: 1024 (number of clusters)
```

---

## Production Deployment

### Prerequisites

1. **Milvus Server** (v2.3+)
   - Standalone or Kubernetes deployment
   - Minimum 4GB RAM, 20GB storage
   - Network accessibility from application server

2. **Milvus Client Library**
   ```bash
   npm install @zilliz/milvus2-sdk-node
   ```

### Docker Compose Setup (Recommended)

Create a `docker-compose.yml` in your deployment environment:

```yaml
version: '3.8'

services:
  milvus:
    image: milvusdb/milvus:v2.3.0
    ports:
      - "19530:19530"
      - "9091:9091"
    environment:
      COMMON_STORAGETYPE: local
    volumes:
      - milvus_data:/var/lib/milvus
    command: milvus run standalone

volumes:
  milvus_data:
```

Start the server:
```bash
docker-compose up -d
```

### Environment Variables

```bash
MILVUS_ADDRESS=localhost:19530
MILVUS_USERNAME=root
MILVUS_PASSWORD=Milvus
MILVUS_TIMEOUT=30000
```

---

## Integration Points

### 1. SigLIP Service Integration

**File**: `server/services/siglip-milvus.ts`

```typescript
import { initializeVectorStore, insertHybridVector, searchSimilarProducts } from "./siglip-milvus";

// On app startup
await initializeVectorStore(process.env.MILVUS_ADDRESS);

// When inserting a new product
const hybridVector = {
  productId: product.id,
  imageVector: imageEmbedding,
  textVector: textEmbedding,
  hybridVector: generateHybridVector(imageEmbedding, textEmbedding),
  metadata: {
    productName: product.name,
    category: product.category,
    price: product.price,
    sellerId: product.sellerId,
    imageUrl: product.imageUrl,
  },
};

await insertHybridVector(hybridVector);

// When searching for similar products
const similarProducts = await searchSimilarProducts(queryVector, 10, 0.5);
```

### 2. Product Search API

**File**: `server/routers/products.ts`

```typescript
// GET /api/products/similar/:productId
router.get("/similar/:productId", async (req, res) => {
  const { productId } = req.params;
  const { limit = 10, threshold = 0.5 } = req.query;

  // Get product and generate query vector
  const product = await db.query.products.findFirst({
    where: eq(products.id, parseInt(productId)),
  });

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  // Search Milvus
  const similarProducts = await searchSimilarProducts(
    product.hybridVector,
    parseInt(limit as string),
    parseFloat(threshold as string)
  );

  res.json(similarProducts);
});
```

### 3. Batch Ingestion

**File**: `server/workers/vector-ingestion.ts`

```typescript
import { batchInsertHybridVectors } from "../services/siglip-milvus";

async function ingestProductVectors() {
  const products = await db.query.products.findMany({
    where: isNull(products.vectorInsertedAt),
    limit: 1000,
  });

  const hybridVectors = products.map((p) => ({
    productId: p.id,
    imageVector: p.imageEmbedding,
    textVector: p.textEmbedding,
    hybridVector: p.hybridVector,
    metadata: {
      productName: p.name,
      category: p.category,
      price: p.price,
      sellerId: p.sellerId,
      imageUrl: p.imageUrl,
    },
  }));

  await batchInsertHybridVectors(hybridVectors);

  // Mark as inserted
  await db.update(products).set({ vectorInsertedAt: new Date() });
}
```

---

## Performance Benchmarks

| Metric | Value | Notes |
| :--- | :--- | :--- |
| **Vector Dimension** | 768 | SigLIP hybrid embedding |
| **Index Type** | IVF_FLAT | Fast approximate search |
| **Query Latency** | <100ms | For 1M vectors, top-10 search |
| **Throughput** | 10K vectors/sec | Batch insertion rate |
| **Storage** | ~3GB/1M vectors | 768-dim float32 vectors |
| **Memory** | ~2GB | Index + buffer |

---

## Monitoring & Maintenance

### Health Check

```typescript
async function checkMilvusHealth() {
  const stats = await milvusDB.getStats();
  console.log(`Vector count: ${stats.rowCount}`);
  console.log(`Collection: ${stats.collectionName}`);
  console.log(`Status: ${stats.status}`);
}
```

### Backup Strategy

1. **Daily snapshots** of Milvus data
2. **WAL (Write-Ahead Logs)** for durability
3. **Replication** for high availability (Enterprise Milvus)

### Scaling Strategy

| Scale | Approach | Details |
| :--- | :--- | :--- |
| **<100K vectors** | Single Milvus instance | Standalone deployment |
| **100K - 1M vectors** | Milvus with replication | 2-3 replicas |
| **1M+ vectors** | Milvus cluster | Distributed across multiple nodes |

---

## Troubleshooting

### Connection Issues

```bash
# Test Milvus connectivity
curl http://localhost:9091/healthz

# Check logs
docker logs milvus
```

### Performance Degradation

1. **Rebuild index** if search latency increases
   ```typescript
   await milvusDB.rebuildIndex();
   ```

2. **Increase nlist** for larger datasets
   - Default: 1024
   - For 10M vectors: 4096-8192

3. **Monitor memory usage**
   - Ensure sufficient RAM for index
   - Add more nodes if needed

---

## Migration Path

### Phase 1: Development (Current)
- In-memory vector store with Milvus SDK ready
- Testing and validation

### Phase 2: Staging
- Deploy Milvus standalone
- Ingest 100K+ test vectors
- Performance validation

### Phase 3: Production
- Milvus cluster deployment
- Real-time vector ingestion
- Sub-second search latency

---

## References

- [Milvus Documentation](https://milvus.io/docs)
- [SigLIP Model](https://huggingface.co/google/siglip-base)
- [Vector Database Comparison](https://milvus.io/blog/comparison-of-vector-databases)
