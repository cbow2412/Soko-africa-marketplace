# 🚀 Operation Vector Sync: Soko Discovery Hub (Enterprise Pivot)

> **MASTER BLUEPRINT FOR ALL AGENTS**
> **Vision:** A "Jumia-killer" that democratizes Kenyan commerce. We bridge the gap between WhatsApp Business inventory and high-end visual discovery.
> **Core Principle:** Taste-driven discovery powered by modern vector search, sourced directly from the Meta CDN.

---

## 🏗️ Enterprise Architecture: "Zero-Copy Meta-Sync"

### 1. The Ingestor (The "Jumia-Killer" Engine)
*   **Mechanism:** Businesses paste a WhatsApp link -> Our platform scrapes, vectorizes, and globalizes the product.
*   **Zero-Copy:** No S3, no local storage. We leverage Meta's billion-dollar CDN infrastructure for image delivery.
*   **Unique ID:** Product identification is tied to the Meta CDN/WhatsApp product ID.

### 2. The Intelligence Layer (SigLIP + Milvus)
*   **Vectorization:** 768-dimension hybrid embeddings (0.6 Image / 0.4 Text).
*   **Search:** Semantic similarity search to "bridge taste" with available inventory.
*   **Handshake:** Real-time synchronization between the scraped catalog and the Milvus vector database.

---

## 🛠️ Technical Stack & File Logic

### Backend (`/server`)
*   `index.ts`: Entry point, Express server, and API routing.
*   `db-real-data.ts`: **Source of Truth for Catalog.** Contains the hot-swapped Meta CDN links.
*   `services/siglip-real.ts`: The vectorization engine. Handles zero-copy image processing.
*   `workers/`: Background tasks for scraping and vectorization.
*   `db-init.ts`: Database initialization and seeding logic.

### Frontend (`/client` or `/src`)
*   *Pending Purge:* Removing mock elements (Watchlist, Profile, My Orders).
*   *Core UI:* High-fidelity Pinterest-style masonry grid focused on discovery.

---

## 📍 Infrastructure
*   **AWS EC2:** `3.121.29.56`
*   **Status:** Industrial Build Active.
*   **Health:** `http://3.121.29.56/health`

---

## 📈 Roadmap (Enterprise Phase)

### Phase 1: The Great Purge (ACTIVE)
- [ ] Remove all non-functional mock buttons (Profile, Watchlist, Orders).
- [ ] Eliminate unrealistic mock pricing.
- [ ] Clean up UI to focus purely on the Discovery Hub.

### Phase 2: Real-Time Integration
- [ ] Connect the 100-artifact Meta CDN catalog directly to the Frontend.
- [ ] Ensure SigLIP vector search is the primary driver for the "Discovery" feed.
- [ ] Implement the "Paste Link" Ingestor UI for businesses.

### Phase 3: Globalization & Scaling
- [ ] Automate the WhatsApp scraper for 10k+ items.
- [ ] Refine the "Kenyan Market Taste" algorithm.

---

## ⚠️ Instructions for Future Agents
1.  **NO MOCK DATA:** If it doesn't work or isn't real, remove it. We are building an enterprise platform.
2.  **ZERO-COPY ONLY:** Never store images locally. Use the Meta CDN.
3.  **SOURCE OF TRUTH:** This document (`MISSION_CONTROL.md`) must be updated after every major change.
4.  **INTEGRITY:** Ensure the vectorization handshake is verified in logs (`pm2 logs`) after every catalog update.

---
*Last Updated: Feb 03, 2026*
