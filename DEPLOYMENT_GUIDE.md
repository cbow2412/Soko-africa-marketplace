# Soko Africa Marketplace - Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Soko Africa Marketplace to production environments using **Vercel** or **Railway**.

---

## **Option 1: Deploy to Vercel (Recommended for Frontend-Heavy Apps)**

### Prerequisites

- Vercel account (free tier available)
- GitHub account with access to `cbow2412/Soko-africa-marketplace`
- Node.js 18+ installed locally

### Step 1: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Import Project"**
3. Select **"Import Git Repository"**
4. Paste: `https://github.com/cbow2412/Soko-africa-marketplace`
5. Click **"Import"**

### Step 2: Configure Environment Variables

In the Vercel dashboard, go to **Settings → Environment Variables** and add:

```
VITE_API_URL=https://your-vercel-domain.vercel.app
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id
OAUTH_SERVER_URL=https://oauth.example.com
DATABASE_URL=mysql://user:password@host:port/database
MILVUS_ADDRESS=https://milvus-cloud.example.com:19530
HF_TOKEN=your-hugging-face-token
GEMINI_API_KEY=your-gemini-api-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-s3-bucket
```

### Step 3: Deploy

1. Click **"Deploy"**
2. Vercel will automatically build and deploy your app
3. Your marketplace will be live at `https://your-project.vercel.app`

### Step 4: Custom Domain (Optional)

1. Go to **Settings → Domains**
2. Add your custom domain (e.g., `soko-africa.com`)
3. Update DNS records according to Vercel's instructions

---

## **Option 2: Deploy to Railway (Recommended for Full-Stack Apps)**

### Prerequisites

- Railway account (free tier available)
- GitHub account with access to the repository
- Credit card for production usage (optional for free tier)

### Step 1: Connect GitHub to Railway

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub"**
4. Authorize Railway to access your GitHub account
5. Select the `Soko-africa-marketplace` repository
6. Click **"Deploy"**

### Step 2: Configure Environment Variables

In the Railway dashboard:

1. Go to your project
2. Click on the **"Variables"** tab
3. Add all environment variables (see list above)

### Step 3: Configure Build & Start Commands

In the Railway dashboard, go to **Settings** and set:

- **Build Command**: `npm install --legacy-peer-deps && npm run build`
- **Start Command**: `node dist/index.js`
- **Port**: `3000`

### Step 4: Deploy

1. Railway will automatically build and deploy your app
2. Your marketplace will be live at `https://your-railway-domain.railway.app`

### Step 5: Custom Domain (Optional)

1. Go to **Settings → Custom Domain**
2. Add your custom domain
3. Update DNS records according to Railway's instructions

---

## **Environment Variables Reference**

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Frontend API endpoint | `https://soko-africa.com` |
| `DATABASE_URL` | MySQL/TiDB connection string | `mysql://user:pass@host:3306/db` |
| `MILVUS_ADDRESS` | Milvus vector database address | `https://milvus.example.com:19530` |
| `HF_TOKEN` | Hugging Face API token for SigLIP | `hf_xxxxx` |
| `GEMINI_API_KEY` | Google Gemini API key for QC | `AIzaSyxxxxx` |
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for S3 | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_S3_BUCKET` | S3 bucket for image storage | `soko-africa-images` |
| `OAUTH_SERVER_URL` | OAuth provider URL | `https://auth.example.com` |

---

## **Database Setup**

### Option A: TiDB Cloud (Recommended)

1. Go to [tidbcloud.com](https://tidbcloud.com)
2. Create a new cluster
3. Get the connection string
4. Add to `DATABASE_URL` environment variable

### Option B: Self-Hosted MySQL

```bash
docker run -d \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=soko_africa \
  -p 3306:3306 \
  mysql:8.0
```

---

## **Milvus Vector Database Setup**

### Option A: Milvus Cloud (Recommended)

1. Go to [milvus.io/cloud](https://milvus.io/cloud)
2. Create a new cluster
3. Get the connection address
4. Add to `MILVUS_ADDRESS` environment variable

### Option B: Self-Hosted Milvus

```bash
docker-compose up -d
```

(Use the provided `docker-compose.yml` in the project root)

---

## **Post-Deployment Checklist**

- [ ] Environment variables are configured
- [ ] Database is connected and migrated
- [ ] Milvus vector database is online
- [ ] S3 bucket is created and accessible
- [ ] OAuth provider is configured
- [ ] SSL certificate is valid
- [ ] Custom domain is pointing to the app
- [ ] Monitoring and error tracking are set up
- [ ] Backups are configured

---

## **Monitoring & Logging**

### Vercel

- Go to **Deployments → Logs** to view real-time logs
- Go to **Monitoring** to view performance metrics

### Railway

- Go to **Logs** to view real-time logs
- Go to **Metrics** to view performance metrics

---

## **Troubleshooting**

### Build Fails

**Error**: `npm ERR! peer dep missing`

**Solution**: Use `npm install --legacy-peer-deps` in the build command

### Database Connection Error

**Error**: `Error: connect ECONNREFUSED`

**Solution**: Verify `DATABASE_URL` is correct and the database is accessible from the deployment environment

### Milvus Connection Error

**Error**: `Error: Failed to connect to Milvus`

**Solution**: Verify `MILVUS_ADDRESS` is correct and the Milvus instance is online

---

## **Performance Optimization**

1. **Enable CDN**: Use Cloudflare or similar for image caching
2. **Database Indexing**: Ensure indexes are created on `products`, `embeddings`, and `interactions` tables
3. **Milvus Optimization**: Configure appropriate index types (IVF_FLAT, HNSW, etc.)
4. **Image Optimization**: Use WebP format and lazy loading

---

## **Security Best Practices**

1. **Environment Variables**: Never commit secrets to Git
2. **HTTPS**: Always use HTTPS in production
3. **Rate Limiting**: Implement rate limiting on API endpoints
4. **CORS**: Configure CORS to allow only trusted origins
5. **Authentication**: Use OAuth 2.0 or similar for user authentication
6. **Database**: Use strong passwords and enable SSL connections

---

## **Support**

For issues or questions, refer to:

- **Project Documentation**: `ARCHITECTURE_PHASE3.md`, `MILVUS_INTEGRATION.md`
- **GitHub Issues**: [github.com/cbow2412/Soko-africa-marketplace/issues](https://github.com/cbow2412/Soko-africa-marketplace/issues)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)

---

**Deployment Date**: January 22, 2026  
**Version**: 1.0.0 (Production Ready)
