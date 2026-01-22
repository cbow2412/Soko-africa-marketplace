# 🌍 Soko Africa Marketplace (Enterprise Edition)

[![Deployed to Vercel](https://img.shields.io/badge/Vercel-Live-brightgreen)](https://soko-africa-marketplace.vercel.app)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![AI](https://img.shields.io/badge/AI-SigLIP%20%2B%20ESRGAN-orange)

Soko Africa is an enterprise-grade, Pinterest-style e-commerce ecosystem designed to be the "Alibaba of Africa." It features a high-performance "Scout & Hydrate" ingestion engine, AI-powered image enhancement, and hybrid vector search.

## 🚀 Live Platform
- **Marketplace**: [https://soko-africa-marketplace.vercel.app](https://soko-africa-marketplace.vercel.app)
- **Admin Command Center**: [https://soko-africa-marketplace.vercel.app/admin](https://soko-africa-marketplace.vercel.app/admin)

## 📖 Documentation
- **[Master Production Handoff](./PRODUCTION_MASTER_HANDOFF.md)**: The single source of truth for architecture, credentials, and production maintenance.

## 🎯 Core Features
- **Pinterest-Style Discovery**: Infinite masonry grid optimized for visual exploration.
- **Scout & Hydrate Engine**: Automated real-time ingestion of WhatsApp Business catalogs.
- **SigLIP Hybrid Search**: 768-dimensional vector search combining visual and semantic features.
- **Real-ESRGAN Enhancement**: Automated AI upscaling for low-quality product images.
- **Admin Command Center**: Centralized monitoring of ingestion, AI health, and system metrics.

## 🛠️ Technology Stack
- **Frontend**: React 19, Tailwind CSS 4, tRPC, Wouter.
- **Backend**: Node.js, Express, tRPC.
- **Database**: TiDB Cloud (MySQL), Zilliz (Milvus Vector DB).
- **AI/ML**: Google SigLIP, Real-ESRGAN, Google Gemini Pro.

## 📦 Quick Start
```bash
pnpm install
pnpm dev
```

## 🚢 Deployment
The project is configured for seamless deployment to **Vercel**. 
```bash
vercel --prod
```

---
**Made with ❤️ for the future of African Commerce.**
