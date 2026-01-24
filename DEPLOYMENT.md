# Soko-africa-marketplace Deployment Guide

## Production Deployment

### Prerequisites

- TiDB Cloud instance (credentials in `.env`)
- Zilliz Cloud (Milvus) instance (credentials in `.env`)
- Node.js 22+
- PM2 for process management
- GitHub Actions secrets configured

### Environment Setup

1. **Create `.env` file with production credentials:**

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:password@host:port/database?sslMode=REQUIRED
MILVUS_ADDRESS=https://host:19530
MILVUS_USERNAME=admin
MILVUS_PASSWORD=password
HF_TOKEN=your_hugging_face_token
OPENAI_API_KEY=your_openai_key
```

2. **Install dependencies:**

```bash
npm ci --production
```

3. **Run database migrations:**

```bash
npx drizzle-kit migrate
```

### Local Development

#### Using Docker Compose

```bash
docker-compose up -d
```

This starts:
- MySQL (TiDB compatible)
- Milvus (Vector DB)
- Redis (Cache)
- Application

#### Manual Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### GitHub Actions Deployment

The CI/CD pipeline automatically:

1. **Lints code** on every push
2. **Runs tests** on pull requests
3. **Builds application** on main/production/development branches
4. **Scans for security vulnerabilities** using Trivy
5. **Deploys to production** when pushing to main branch
6. **Deploys to staging** when pushing to development branch

#### Required GitHub Secrets

For production deployment:
- `DEPLOY_KEY`: SSH private key
- `DEPLOY_HOST`: Production server hostname
- `DEPLOY_USER`: SSH user
- `SLACK_WEBHOOK`: Slack notification webhook (optional)

For staging deployment:
- `STAGING_DEPLOY_KEY`: SSH private key
- `STAGING_DEPLOY_HOST`: Staging server hostname
- `STAGING_DEPLOY_USER`: SSH user

### Docker Deployment

Build and run Docker image:

```bash
# Build
docker build -t soko-africa:latest .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://..." \
  -e MILVUS_ADDRESS="..." \
  soko-africa:latest
```

### Kubernetes Deployment

Deploy using Kubernetes manifests:

```bash
kubectl apply -f k8s/
```

### Monitoring

- **Application Logs**: `pm2 logs soko`
- **Health Check**: `curl http://localhost:3000/health`
- **Metrics**: Integrated with New Relic (if configured)

### Rollback

```bash
# Rollback to previous version
pm2 restart soko --update-env
git revert HEAD
npm run build
pm2 restart soko
```

### Troubleshooting

**Database connection failed:**
- Verify DATABASE_URL is correct
- Check TiDB Cloud network access rules
- Ensure SSL certificate is valid

**Milvus connection failed:**
- Verify MILVUS_ADDRESS and credentials
- Check Zilliz Cloud instance status
- Ensure network connectivity

**Out of memory:**
- Increase Node.js heap size: `NODE_OPTIONS="--max-old-space-size=4096"`
- Check for memory leaks in logs
- Scale horizontally with multiple instances

