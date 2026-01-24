# Soko-africa-marketplace Production Setup Guide

## Overview

This guide provides step-by-step instructions for deploying Soko-africa-marketplace to production with real TiDB, Milvus, and AI services.

## Phase 1: Infrastructure Setup

### 1.1 TiDB Cloud Setup

1. Create TiDB Cluster at https://tidbcloud.com
2. Configure network access (whitelist deployment server IP)
3. Get connection string: DATABASE_URL=mysql://[user]:[password]@[host]:[port]/[database]?sslMode=REQUIRED

### 1.2 Zilliz Cloud (Milvus) Setup

1. Create Zilliz Cluster at https://cloud.zilliz.com
2. Get connection details for MILVUS_ADDRESS, MILVUS_USERNAME, MILVUS_PASSWORD

### 1.3 AI Services Setup

- HF_TOKEN: Get from https://huggingface.co/settings/tokens
- OPENAI_API_KEY: Get from https://platform.openai.com/api-keys
- REPLICATE_API_TOKEN: Get from https://replicate.com/account/api-tokens

## Phase 2: Server Setup

### Requirements
- Ubuntu 22.04 LTS or later
- 4+ CPU cores
- 8GB+ RAM (16GB recommended)
- 50GB+ SSD storage
- Node.js 22.x
- PM2 for process management

### Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Docker (optional)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

## Phase 3: Application Deployment

```bash
# Clone repository
cd /var/www
git clone https://github.com/cbow2412/Soko-africa-marketplace.git
cd Soko-africa-marketplace

# Create .env with production credentials
cp .env.example .env
# Edit .env with your credentials

# Install dependencies
npm ci --production

# Run migrations
npx drizzle-kit migrate

# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

## Phase 4: Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Configure SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d soko-africa.com

# Configure Nginx (see DEPLOYMENT.md for full config)
sudo systemctl restart nginx
```

## Phase 5: Monitoring

```bash
# View logs
pm2 logs

# Monitor in real-time
pm2 monit

# Health check
curl http://localhost:3000/health
```

## GitHub Actions Deployment

Configure these secrets in GitHub:
- DEPLOY_KEY: SSH private key
- DEPLOY_HOST: Production server hostname
- DEPLOY_USER: SSH user
- STAGING_DEPLOY_KEY: Staging SSH key
- STAGING_DEPLOY_HOST: Staging hostname
- STAGING_DEPLOY_USER: Staging SSH user

## Verification Checklist

- [ ] TiDB cluster created and accessible
- [ ] Milvus cluster created and accessible
- [ ] AI service tokens configured
- [ ] Server provisioned with Node.js 22+
- [ ] Application deployed and running
- [ ] Database migrations completed
- [ ] PM2 managing application
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed
- [ ] Health check endpoint responding
- [ ] GitHub Actions secrets configured

## Support

Refer to DEPLOYMENT.md for detailed troubleshooting and additional configuration options.

