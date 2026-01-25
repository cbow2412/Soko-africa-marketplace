# Soko-africa-marketplace Vercel Deployment Guide

## Enterprise-Ready Vercel Deployment

This guide provides step-by-step instructions for deploying Soko-africa-marketplace to **Vercel** as an enterprise-grade serverless application.

### Prerequisites

- Vercel account (https://vercel.com)
- GitHub repository connected to Vercel
- TiDB Cloud instance (production database)
- Zilliz Cloud (Milvus) instance (vector database)
- Redis instance (caching layer)

### Step 1: Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Select **"Import Git Repository"**
4. Search for `Soko-africa-marketplace` and click **"Import"**

### Step 2: Configure Environment Variables

In the Vercel project settings, add these environment variables:

```
DATABASE_URL=mysql://[user]:[password]@[host]:[port]/[database]?sslMode=REQUIRED
MILVUS_ADDRESS=https://[host]:19530
MILVUS_USERNAME=db_admin
MILVUS_PASSWORD=[password]
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
JWT_SECRET=your-super-secret-jwt-key
REDIS_HOST=[redis-host]
REDIS_PORT=6379
REDIS_PASSWORD=[redis-password]
NODE_ENV=production
```

### Step 3: Configure Build Settings

1. **Framework**: Vite
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Install Command**: `npm install --legacy-peer-deps`

### Step 4: Deploy

1. Click **"Deploy"**
2. Vercel will automatically:
   - Install dependencies with `--legacy-peer-deps` flag
   - Build the application
   - Deploy to global CDN
   - Provision serverless functions

### Step 5: Configure Custom Domain

1. Go to **Project Settings** → **Domains**
2. Add your custom domain (e.g., `soko-africa.com`)
3. Configure DNS records as instructed by Vercel
4. SSL certificate is automatically provisioned

### Step 6: Monitor & Scale

- **Vercel Analytics**: Real-time performance metrics
- **Deployment History**: Automatic rollback capability
- **Automatic Scaling**: Handles traffic spikes automatically
- **Edge Caching**: Global CDN for fast content delivery

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

- **Push to `main`**: Deploys to production
- **Push to `development`**: Deploys to preview environment
- **Pull Requests**: Creates preview deployments

### Performance Optimization

The `vercel.json` configuration includes:

- **Multi-region deployment**: iad1 (US), lhr1 (UK), cle1 (US)
- **Security headers**: HSTS, X-Frame-Options, CSP
- **API rate limiting**: Configured at edge
- **Caching strategy**: Optimized for API responses
- **Function memory**: 1GB per serverless function
- **Max duration**: 60 seconds per request

### Environment-Specific Deployments

#### Production (`main` branch)
- Full database access
- Real AI services (SigLIP, Gemini QC, ESRGAN)
- Production analytics
- Global CDN caching

#### Staging (`development` branch)
- Staging database
- Real AI services
- Staging analytics
- Preview deployments for each PR

### Rollback Strategy

If something goes wrong:

1. Go to **Deployments** tab in Vercel
2. Find the previous stable deployment
3. Click **"Promote to Production"**
4. Vercel instantly rolls back to that version

### Monitoring & Alerts

Set up monitoring:

1. **Vercel Analytics**: Built-in performance monitoring
2. **Error Tracking**: Automatic error reporting
3. **Uptime Monitoring**: Configure health checks
4. **Slack Notifications**: Get deployment alerts

### Cost Optimization

Vercel pricing for this application:

- **Hobby Plan**: Free (suitable for MVP testing)
- **Pro Plan**: $20/month (recommended for production)
  - Unlimited deployments
  - Edge Middleware
  - Advanced analytics
  - Priority support

### Troubleshooting

**Build fails with peer dependency error:**
```bash
npm install --legacy-peer-deps
```

**Environment variables not loading:**
- Verify variables are set in Vercel project settings
- Redeploy after adding/modifying variables

**Database connection timeout:**
- Check TiDB Cloud network access rules
- Verify DATABASE_URL is correct
- Test connection from local machine first

**Milvus connection failed:**
- Verify Zilliz Cloud instance is running
- Check MILVUS_ADDRESS and credentials
- Ensure network connectivity from Vercel

### Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [GitHub Integration](https://vercel.com/docs/git/vercel-for-github)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
