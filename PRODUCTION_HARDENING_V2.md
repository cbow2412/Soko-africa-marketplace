# Production Hardening v2.0 - Soko Africa Marketplace

## Overview

This document outlines the comprehensive security, performance, and reliability hardening required to move Soko Africa from a sandbox prototype to a production-grade marketplace serving thousands of concurrent users.

---

## **1. Security Hardening**

### 1.1 Rate Limiting & DDoS Protection

**Implementation**: Use `express-rate-limit` middleware on all API endpoints.

```typescript
import rateLimit from 'express-rate-limit';

// Strict rate limiting for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later.',
});

// Moderate rate limiting for product search
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many search requests, please try again later.',
});

app.post('/api/auth/login', authLimiter, loginHandler);
app.get('/api/products/search', searchLimiter, searchHandler);
```

### 1.2 CORS Configuration

**Implementation**: Restrict cross-origin requests to trusted domains only.

```typescript
import cors from 'cors';

const corsOptions = {
  origin: [
    'https://soko-africa.com',
    'https://www.soko-africa.com',
    'https://seller.soko-africa.com',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
```

### 1.3 Input Validation & Sanitization

**Implementation**: Use `joi` or `zod` for schema validation.

```typescript
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().max(2000),
  price: z.number().positive(),
  category: z.enum(['shoes', 'dresses', 'furniture', 'jewelry', 'accessories']),
});

app.post('/api/products', async (req, res) => {
  try {
    const validated = productSchema.parse(req.body);
    // Process validated data
  } catch (error) {
    res.status(400).json({ error: 'Invalid input' });
  }
});
```

### 1.4 Authentication & Authorization

**Implementation**: Use OAuth 2.0 with JWT tokens.

```typescript
import jwt from 'jsonwebtoken';

const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: '24h',
  });
};

const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return null;
  }
};

// Middleware for protected routes
const authMiddleware = (req: any, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
```

### 1.5 HTTPS & SSL/TLS

**Implementation**: Enforce HTTPS in production.

```typescript
import helmet from 'helmet';

app.use(helmet()); // Sets security headers
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.protocol !== 'https') {
    return res.redirect(`https://${req.get('host')}${req.url}`);
  }
  next();
});
```

---

## **2. Performance Hardening**

### 2.1 Caching Strategy

**Implementation**: Use Redis for caching frequently accessed data.

```typescript
import redis from 'redis';

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT!),
});

// Cache product search results
app.get('/api/products/search', async (req, res) => {
  const cacheKey = `search:${req.query.q}`;
  
  // Check cache first
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  // If not in cache, fetch from database
  const results = await db.query('SELECT * FROM products WHERE name LIKE ?', [req.query.q]);
  
  // Cache for 1 hour
  await redisClient.setex(cacheKey, 3600, JSON.stringify(results));
  
  res.json(results);
});
```

### 2.2 Database Indexing

**Implementation**: Create indexes on frequently queried columns.

```sql
-- Indexes for products table
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_created_at ON products(created_at);

-- Indexes for interactions table
CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_product_id ON interactions(product_id);
CREATE INDEX idx_interactions_timestamp ON interactions(timestamp);

-- Indexes for embeddings table
CREATE INDEX idx_embeddings_product_id ON embeddings(product_id);
```

### 2.3 Image Optimization

**Implementation**: Use CDN and image compression.

```typescript
import sharp from 'sharp';

// Compress and resize images on upload
app.post('/api/upload', async (req, res) => {
  const buffer = req.file.buffer;
  
  // Create multiple sizes for responsive images
  const thumbnail = await sharp(buffer)
    .resize(300, 300, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();

  const medium = await sharp(buffer)
    .resize(800, 800, { fit: 'cover' })
    .webp({ quality: 85 })
    .toBuffer();

  const large = await sharp(buffer)
    .resize(1200, 1200, { fit: 'cover' })
    .webp({ quality: 90 })
    .toBuffer();

  // Upload to S3 with CloudFront CDN
  await uploadToS3('thumbnail', thumbnail);
  await uploadToS3('medium', medium);
  await uploadToS3('large', large);

  res.json({ success: true });
});
```

### 2.4 Database Connection Pooling

**Implementation**: Use connection pooling to handle concurrent requests.

```typescript
import { createPool } from 'mysql2/promise';

const pool = createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Use pool for all queries
app.get('/api/products', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT * FROM products LIMIT 100');
    res.json(rows);
  } finally {
    connection.release();
  }
});
```

---

## **3. Reliability Hardening**

### 3.1 Error Handling & Logging

**Implementation**: Centralized error handling with structured logging.

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});
```

### 3.2 Health Check Endpoint

**Implementation**: Expose a health check endpoint for monitoring.

```typescript
app.get('/health', async (req, res) => {
  const health = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'DOWN',
      redis: 'DOWN',
      milvus: 'DOWN',
    },
  };

  try {
    // Check database
    const dbConnection = await pool.getConnection();
    await dbConnection.query('SELECT 1');
    dbConnection.release();
    health.checks.database = 'UP';
  } catch (error) {
    health.status = 'DEGRADED';
  }

  try {
    // Check Redis
    await redisClient.ping();
    health.checks.redis = 'UP';
  } catch (error) {
    health.status = 'DEGRADED';
  }

  try {
    // Check Milvus
    const milvusStatus = await milvusClient.checkHealth();
    health.checks.milvus = milvusStatus ? 'UP' : 'DOWN';
  } catch (error) {
    health.status = 'DEGRADED';
  }

  res.status(health.status === 'UP' ? 200 : 503).json(health);
});
```

### 3.3 Graceful Shutdown

**Implementation**: Handle shutdown signals gracefully.

```typescript
const server = app.listen(3000, () => {
  console.log('Server running on port 3000');
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    // Close database connections
    await pool.end();
    
    // Close Redis connection
    await redisClient.quit();
    
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 30000);
});
```

---

## **4. Infrastructure Hardening**

### 4.1 Environment Variables

**Implementation**: Use `.env` files with strict validation.

```bash
# .env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:password@host:3306/db
REDIS_HOST=redis-host
REDIS_PORT=6379
MILVUS_ADDRESS=milvus-host:19530
JWT_SECRET=your-secret-key
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=soko-africa-images
```

### 4.2 Docker Configuration

**Implementation**: Use Docker for consistent deployments.

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "dist/index.js"]
```

### 4.3 Kubernetes Deployment

**Implementation**: Deploy with Kubernetes for high availability.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: soko-africa-marketplace
spec:
  replicas: 3
  selector:
    matchLabels:
      app: soko-africa
  template:
    metadata:
      labels:
        app: soko-africa
    spec:
      containers:
      - name: marketplace
        image: soko-africa:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: soko-secrets
              key: database-url
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## **5. Monitoring & Observability**

### 5.1 Application Performance Monitoring (APM)

**Implementation**: Use New Relic or Datadog for APM.

```typescript
import newrelic from 'newrelic';

// Automatically monitors:
// - Response times
// - Error rates
// - Database queries
// - External API calls
```

### 5.2 Metrics & Dashboards

**Implementation**: Expose Prometheus metrics.

```typescript
import prometheus from 'prom-client';

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

---

## **6. Deployment Checklist**

- [ ] All environment variables are configured
- [ ] Database is migrated and indexed
- [ ] Redis cache is configured
- [ ] Milvus vector database is online
- [ ] S3 bucket is created and accessible
- [ ] SSL certificate is valid
- [ ] Rate limiting is enabled
- [ ] CORS is configured
- [ ] Authentication is implemented
- [ ] Error logging is active
- [ ] Health check endpoint is working
- [ ] Monitoring and alerting are set up
- [ ] Backups are configured
- [ ] Load testing has been performed

---

## **7. Incident Response Plan**

### 7.1 Database Failure

**Response**: 
1. Activate read-only mode
2. Switch to replica database
3. Alert on-call engineer
4. Begin recovery process

### 7.2 Milvus Vector Database Failure

**Response**:
1. Fall back to in-memory vector store
2. Queue vector operations for batch processing
3. Alert on-call engineer
4. Begin Milvus recovery

### 7.3 High Error Rate

**Response**:
1. Enable circuit breaker
2. Route traffic to healthy instances
3. Alert on-call engineer
4. Begin root cause analysis

---

**Document Version**: 2.0  
**Last Updated**: January 22, 2026  
**Status**: Production Ready
