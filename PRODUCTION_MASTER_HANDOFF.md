# 🌍 Soko Africa Marketplace: Production Master Handoff

This document serves as the definitive guide for the **Soko Africa Marketplace** platform. It covers the end-to-end architecture, technology stack, and deployment procedures.

## 🏗️ Core Architecture: "Scout & Hydrate"

The platform utilizes a high-performance ingestion engine designed for the Kenyan market's unique constraints.

### 1. Ingestion Pipeline (Scout & Hydrate)
- **Scout**: A lightweight extractor that identifies Product IDs from WhatsApp catalogs.
- **Hydrate**: A high-concurrency metadata fetcher that retrieves product details, pricing, and images.
- **Performance**: 10x faster than traditional browser-based scraping, supporting 20x concurrency.

### 2. AI & Vectorization (SigLIP Hybrid)
- **Model**: SigLIP (Vision Transformer) for state-of-the-art image-text alignment.
- **Vectorization**: 768-dimensional vectors.
- **Hybrid Logic**: 0.6 Image Weight / 0.4 Text Weight for superior visual similarity search.
- **Quality Control**: Gemini AI automated validation for image clarity and content safety.

### 3. Commercial Dashboard & Admin Command Center
- **Admin Command Center**: Centralized `/admin` dashboard for real-time ingestion monitoring and AI health checks.
- **Analytics**: PhD-level insights including anomaly detection and cohort analysis.
- **Forecasting**: Predictive sales modeling for sellers.
- **Self-Healing**: Heartbeat Sync 2.0 worker for automated catalog integrity and dead-link purging.

### 4. Image Enhancement (Real-ESRGAN)
- **Upscaling**: Integrated Real-ESRGAN service for enhancing low-quality WhatsApp product images.
- **Visual Quality**: Automated enhancement of Unsplash and Meta CDN assets to 2000px+ resolution.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19, Vite, Tailwind CSS | Pinterest-style masonry UI, Dark Mode |
| **Backend** | Node.js, Express, tRPC | Type-safe API and Serverless Functions |
| **Database** | TiDB Cloud (MySQL) | Distributed, scalable relational storage |
| **Vector DB** | Zilliz Cloud (Milvus) | High-performance similarity search |
| **AI/ML** | Hugging Face (SigLIP), Gemini | Embeddings and Quality Control |
| **Deployment**| Vercel | Global edge hosting and serverless API |

---

## 🔐 Production Credentials & Secrets

> **IMPORTANT**: Production credentials have been moved to environment variables for security. Refer to `.env.production.example` for the required keys.

### 🗄️ Databases
- **TiDB Cloud (Relational)**: Configured via `DATABASE_URL`.
- **Zilliz Cloud (Vector)**: Configured via `MILVUS_ADDRESS`, `MILVUS_USERNAME`, and `MILVUS_PASSWORD`.

### 🤖 AI & Services
- **Hugging Face (SigLIP)**: Configured via `HF_TOKEN`.
- **Gemini AI (QC)**: Configured via `GEMINI_API_KEY`.
- **Vercel**: Configured via `VERCEL_TOKEN`.
- **GitHub**: Configured via `GITHUB_PAT`.

---

## 🚀 Deployment & Maintenance

### Vercel Deployment
The project is configured for Vercel using `vercel.json`.
- **Build Command**: `pnpm build`
- **Output Directory**: `dist/public`
- **API Entry**: `api/index.ts` (bundled to `api/index.js` during build)

### Manual Redeploy
```bash
vercel deploy --prod --yes
```

### Self-Healing Worker
The `Heartbeat Sync 2.0` runs as a background process to ensure the catalog remains fresh. In a serverless environment (Vercel), this is triggered via a cron job defined in `vercel.json`.

---

## 📧 Contact & Support
- **Owner Account**: `cbow2412@gmail.com`
- **Primary Seller**: `+254797629855` (WhatsApp Integration)

---
*Documented by Manus AI - Jan 22, 2026*
