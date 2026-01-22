# Production Hardening: Deployment & Security Guide

**Author**: Manus AI  
**Status**: Ready for Production  
**Last Updated**: January 22, 2026

---

## Overview

This guide covers the final steps to harden the Soko Africa Marketplace for production deployment. The platform is currently running in a sandbox environment with in-memory fallbacks. This document outlines the steps to migrate to a production-grade infrastructure with real databases, security controls, and monitoring.

---

## Phase 1: Database Migration

### Current State
- **In-Memory Fallback**: Products, sellers, and analytics are stored in memory.
- **Risk**: Data is lost on server restart.

### Production Setup: TiDB/MySQL

#### 1. Provision a TiDB Cluster
```bash
# Option A: TiDB Cloud (Recommended)
# Visit: https://tidbcloud.com
# Create a new cluster with:
# - Region: Africa (if available) or Asia-Pacific
# - Tier: Development (for testing) or Production (for live)

# Option B: Self-Hosted MySQL
# Install MySQL 8.0+
# Create database: soko_africa
# Create user: soko_user with strong password
```

#### 2. Update Environment Variables
```bash
# .env.production
DATABASE_URL=mysql://soko_user:PASSWORD@tidb-host:4000/soko_africa
MYSQL_HOST=tidb-host
MYSQL_PORT=4000
MYSQL_USER=soko_user
MYSQL_PASSWORD=PASSWORD
MYSQL_DATABASE=soko_africa
```

#### 3. Run Migrations
```bash
npm run db:migrate:prod
```

---

## Phase 2: Vector Database (Milvus) Migration

### Current State
- **In-Memory Fallback**: Vectors are stored in memory.
- **Risk**: Visual search doesn't scale beyond ~100K products.

### Production Setup: Milvus Cloud or Self-Hosted

#### 1. Deploy Milvus
```bash
# Option A: Milvus Cloud (Recommended)
# Visit: https://cloud.zilliz.com
# Create a new cluster with:
# - Dimension: 768 (for SigLIP embeddings)
# - Index: IVF_FLAT
# - Metric: L2

# Option B: Self-Hosted (Docker Compose)
# See MILVUS_INTEGRATION.md for setup
```

#### 2. Update Environment Variables
```bash
# .env.production
MILVUS_ADDRESS=milvus-cloud-host:19530
MILVUS_USERNAME=root
MILVUS_PASSWORD=PASSWORD
MILVUS_TIMEOUT=30000
```

#### 3. Initialize Milvus Collections
```bash
npm run milvus:init
```

---

## Phase 3: Security Hardening

### 1. API Rate Limiting

Implement rate limiting to prevent abuse and competitive scraping:

```typescript
// server/_core/index.ts
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

app.use("/api/", limiter);
```

### 2. CORS Configuration

Restrict cross-origin requests to trusted domains:

```typescript
import cors from "cors";

app.use(
  cors({
    origin: [
      "https://soko-africa.com",
      "https://www.soko-africa.com",
      "https://admin.soko-africa.com",
    ],
    credentials: true,
  })
);
```

### 3. Environment Secrets Management

Never commit secrets to Git. Use environment variables:

```bash
# .env.production (never commit this file)
GEMINI_API_KEY=your_key_here
HF_TOKEN=your_token_here
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
JWT_SECRET=your_secret_here
```

### 4. HTTPS/TLS

Ensure all traffic is encrypted:

```bash
# Vercel: Automatic HTTPS
# Railway: Automatic HTTPS
# Self-Hosted: Use Let's Encrypt with Certbot
```

### 5. Authentication & Authorization

Implement JWT-based authentication:

```typescript
// Middleware to verify JWT tokens
import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};
```

---

## Phase 4: Monitoring & Observability

### 1. Error Tracking (Sentry)

```bash
npm install @sentry/node
```

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

app.use(Sentry.Handlers.errorHandler());
```

### 2. Logging (Winston)

```bash
npm install winston
```

```typescript
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});
```

### 3. Performance Monitoring

Monitor key metrics:
- API response times
- Database query latency
- Vector search latency
- Recommendation engine performance

---

## Phase 5: Deployment

### Option A: Vercel (Recommended for Frontend)

```bash
npm install -g vercel
vercel --prod
```

### Option B: Railway (Full-Stack)

```bash
# Connect GitHub repository
# Railway will auto-deploy on push
# Set environment variables in Railway dashboard
```

### Option C: AWS (Enterprise)

```bash
# Use AWS Elastic Beanstalk or ECS
# Configure RDS for MySQL
# Configure ElastiCache for Redis (optional)
```

---

## Phase 6: Post-Deployment Checklist

- [ ] Database is connected and migrated
- [ ] Milvus is connected and initialized
- [ ] Environment variables are set
- [ ] Rate limiting is active
- [ ] CORS is configured
- [ ] HTTPS is enabled
- [ ] Error tracking is active
- [ ] Logging is configured
- [ ] Heartbeat Sync Worker is running
- [ ] Backups are scheduled
- [ ] Monitoring alerts are configured

---

## Scaling Strategy

### Horizontal Scaling

As traffic grows, scale horizontally:

1. **Load Balancing**: Use Nginx or AWS ALB to distribute traffic
2. **Database Replication**: Set up MySQL replicas for read scaling
3. **Milvus Clustering**: Deploy Milvus in a cluster for vector search scaling
4. **CDN**: Use Cloudflare or AWS CloudFront for static asset caching

### Vertical Scaling

If horizontal scaling isn't sufficient:

1. Increase server resources (CPU, RAM)
2. Optimize database queries (add indexes)
3. Implement caching (Redis)

---

## Disaster Recovery

### Backup Strategy

1. **Database Backups**: Daily automated backups to S3
2. **Milvus Snapshots**: Weekly snapshots of vector collections
3. **Configuration Backups**: Version control all configs

### Recovery Procedures

1. **Database Failure**: Restore from latest backup
2. **Data Corruption**: Use point-in-time recovery
3. **Complete Outage**: Failover to standby infrastructure

---

## Security Audit Checklist

- [ ] All secrets are in environment variables
- [ ] No hardcoded API keys in code
- [ ] HTTPS is enforced
- [ ] Rate limiting is active
- [ ] CORS is properly configured
- [ ] Input validation is implemented
- [ ] SQL injection prevention (ORM usage)
- [ ] XSS prevention (sanitize outputs)
- [ ] CSRF tokens are used
- [ ] Authentication is required for sensitive endpoints
- [ ] Audit logs are maintained
- [ ] Regular security updates are applied

---

## Final Notes

The Soko Africa Marketplace is now ready for production deployment. Follow this guide carefully to ensure a smooth transition from development to production. Once deployed, monitor the platform closely for the first few weeks and be prepared to scale as traffic grows.

For support, refer to the architecture documentation and implementation guides in the repository.
