# 🚀 Operation Vector Sync: Soko Discovery Hub

> **MASTER BLUEPRINT FOR ALL AGENTS**
> This document is the absolute source of truth for the Soko Discovery Hub project. Any agent taking over this project MUST read this document first to maintain continuity and adhere to the established architecture.

---

## 📌 Project Vision
**Soko Discovery Hub** is the "Pinterest of Nairobi" — a high-fidelity visual discovery marketplace. It bridges the gap between social commerce (WhatsApp/Instagram) and structured discovery.

## 🏗️ Core Architecture: "Zero-Copy Meta-Sync"
Unlike traditional marketplaces, Soko does **not** store images on S3 or local disks.

### 1. The Meta CDN Handshake
*   **Source of Truth:** WhatsApp Business / Meta CDN links (`wa.me`, `fbcdn`, `scontent`).
*   **Unique Identification:** Each product is uniquely identified by its Meta CDN link which contains a specific product ID.
*   **Hot-Swapping:** Catalog updates are performed by "hot-swapping" URLs in the data layer (`server/db-real-data.ts`).

### 2. Real-Time SigLIP Vectorization
*   **Zero-Copy Processing:** Workers scrape Meta CDN links on-the-fly.
*   **Hybrid Embeddings:** 768-dimension vectors (0.6 Image weight / 0.4 Text weight).
*   **Vector DB:** Milvus stores the high-fidelity vectors for semantic search.
*   **Infrastructure:** Leveraging Meta's billion-dollar CDN infrastructure for image delivery, bypassing the need for local storage.

---

## 🛠️ Tech Stack
*   **Frontend:** React (Vite) - Pinterest-style masonry layout.
*   **Backend:** Node.js (TypeScript) with PM2 process management.
*   **Database:** Drizzle ORM (MySQL/TiDB) + Milvus (Vector Search).
*   **AI/ML:** SigLIP (google/siglip-base-patch16-224) via Hugging Face Inference API or local fallback.
*   **Deployment:** AWS EC2 (3.121.29.56) + Nginx Reverse Proxy.

---

## 📍 Deployment Details
*   **Server IP:** `3.121.29.56`
*   **Project Root:** `~/soko`
*   **Backend Port:** `3000`
*   **Health Check:** `http://3.121.29.56/health`
*   **Process Manager:** PM2 (`soko-backend`)

---

## 📈 Roadmap & Current Status

### Phase 1: Scorched Earth Reset (COMPLETED)
- [x] Wiped stale builds and reset repository.
- [x] Fixed Nginx routing and symlink errors.
- [x] Verified initial SigLIP-Milvus handshake.

### Phase 2: Meta CDN Hot-Swap (ACTIVE)
- [x] Extracted 100 unique WhatsApp Meta CDN links.
- [x] Injected 100 links into `server/db-real-data.ts`.
- [x] Pushed changes to GitHub and pulled to AWS server.
- [ ] **NEXT:** Verify real-time vectorization of the new 100-artifact catalog.

### Phase 3: Scaling & Optimization (PENDING)
- [ ] Implement real-time WhatsApp scraper for automated link ingestion.
- [ ] Optimize Milvus indexing for 10k+ artifacts.
- [ ] Enhance "Pinterest-style" discovery UI with vector-based recommendations.

---

## ⚠️ Instructions for Future Agents
1.  **NEVER** suggest moving images to S3. We use the Meta CDN directly.
2.  **NEVER** perform a hard reset unless explicitly requested ("Scorched Earth").
3.  **ALWAYS** verify the `/health` endpoint after a backend restart.
4.  **ALWAYS** monitor PM2 logs (`pm2 logs soko-backend`) to ensure SigLIP workers are successfully scraping the Meta links.
5.  **HOT-SWAP ONLY:** When updating the catalog, update the `db-real-data.ts` file and restart the process.

---
*Last Updated: Feb 03, 2026*
