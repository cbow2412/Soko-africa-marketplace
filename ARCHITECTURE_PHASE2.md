# Architecture Update: Phase 2 - Job Queue System

## Overview

Phase 2 introduces a distributed job queue system using Redis and Bull for handling background tasks at scale. This enables parallel processing of catalog scraping, embedding generation, quality control, and product indexing.

## System Components

### Redis Layer
- **Purpose**: In-memory data store for caching and job queue
- **Services**: `redis-client.ts`
- **Capabilities**:
  - Search result caching (1-hour TTL)
  - Session management
  - Rate limiting (token bucket algorithm)
  - Job queue persistence

### Bull Job Queue
- **Purpose**: Distributed job processing with retry logic
- **Services**: `job-queue.ts`
- **Features**:
  - 5 concurrent workers per job type
  - Exponential backoff retry (3 attempts)
  - Dead letter queue for failed jobs
  - Job progress tracking
  - Queue statistics and monitoring

### Job Types

#### 1. Scrape Catalog
- **Input**: `catalogUrl`, `sellerId`
- **Process**: Playwright extracts products from WhatsApp catalog
- **Output**: Product list queued for embedding generation
- **Retry**: 3 attempts with exponential backoff

#### 2. Generate Embedding
- **Input**: `productName`, `description`, `imageUrl`, `productId`, `sellerId`
- **Process**: SigLIP generates 768-dimensional embeddings
- **Output**: Embeddings stored in Milvus
- **Next**: Queues quality control job

#### 3. Quality Control
- **Input**: `productName`, `description`, `imageUrl`, `productId`
- **Process**: Gemini AI analyzes product
- **Output**: Approval/rejection/flagged decision cached in Redis
- **Decision**: Determines if product goes live

#### 4. Index Product
- **Input**: `productId`, `productName`
- **Process**: Index in search systems (Elasticsearch)
- **Output**: Product searchable

#### 5. Sync Seller
- **Input**: `catalogUrl`, `sellerId`
- **Process**: Orchestrates full catalog sync pipeline
- **Output**: All seller products processed and live

## Data Flow

```
Seller Registration
        ↓
Catalog URL Input
        ↓
Queue: sync-seller
        ↓
Process: Scrape Catalog (Playwright)
        ↓
Extract Products
        ↓
Queue: generate-embedding (Bulk)
        ↓
Process: SigLIP Embeddings
        ↓
Store in Milvus
        ↓
Queue: quality-control
        ↓
Process: Gemini AI Analysis
        ↓
Cache QC Result (Redis)
        ↓
Queue: index-product
        ↓
Process: Index in Search
        ↓
Product Live on Marketplace
```

## Performance Characteristics

| Metric | Value |
|--------|-------|
| **Concurrent Jobs** | 25 (5 per job type) |
| **Scraping Speed** | 10-20 products/minute |
| **Embedding Generation** | 100-200 products/minute |
| **QC Analysis** | 50-100 products/minute |
| **Total Sync Time** | 5-10 minutes per 100 products |
| **Search Latency** | <200ms (with Redis cache) |
| **Cache Hit Rate** | 70-80% for popular searches |

## Scaling Strategy

### Horizontal Scaling
- Deploy multiple worker instances
- Each instance processes 5 concurrent jobs
- Redis coordinates job distribution
- No single point of failure

### Vertical Scaling
- Increase `concurrency` setting per worker
- Increase Redis memory allocation
- Optimize job processor code

### Load Balancing
- Round-robin job distribution
- Priority queues for urgent jobs
- Rate limiting per seller

## Monitoring & Observability

### Metrics Tracked
- Jobs completed per minute
- Average job duration
- Failure rate per job type
- Queue depth (pending jobs)
- Worker utilization

### Logging
- Job start/completion events
- Error tracking with stack traces
- Performance metrics per job
- Seller sync status updates

### Alerts
- Job failure threshold (>5% failure rate)
- Queue depth threshold (>1000 pending)
- Worker health checks
- Redis connection issues

## Error Handling

### Retry Strategy
- **Exponential Backoff**: 2s → 4s → 8s
- **Max Attempts**: 3 per job
- **Dead Letter Queue**: Failed jobs after 3 attempts

### Failure Scenarios
- **Network Error**: Retry automatically
- **Invalid Data**: Move to DLQ, notify seller
- **Service Unavailable**: Exponential backoff
- **Rate Limited**: Queue for later retry

## Integration Points

### With Milvus
- Embeddings stored immediately after generation
- Enables real-time search updates
- Automatic indexing for new embeddings

### With Gemini AI
- Async QC analysis
- Results cached for 24 hours
- Reduces API calls for repeated products

### With Seller Dashboard
- Real-time sync status updates
- Job progress tracking
- Notification on completion

## Future Enhancements

1. **Priority Queues**: Rush sync for premium sellers
2. **Scheduled Jobs**: Periodic catalog re-sync (24-hour intervals)
3. **Webhook Notifications**: Real-time seller updates
4. **Analytics Dashboard**: Job performance metrics
5. **Auto-scaling**: Dynamic worker scaling based on queue depth

## Deployment

### Docker Compose Services
```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"

job-worker:
  build: .
  environment:
    - REDIS_URL=redis://redis:6379
  depends_on:
    - redis
  replicas: 3
```

### Environment Variables
- `REDIS_HOST`: Redis server address
- `REDIS_PORT`: Redis port (default: 6379)
- `REDIS_PASSWORD`: Redis authentication
- `JOB_CONCURRENCY`: Jobs per worker (default: 5)
- `JOB_TIMEOUT`: Job timeout in seconds (default: 300)

## Testing

### Unit Tests
- Job processor logic
- Redis operations
- Error handling

### Integration Tests
- End-to-end job pipeline
- Queue operations
- Retry logic

### Load Tests
- 1000+ concurrent jobs
- Queue performance under load
- Worker scaling behavior
