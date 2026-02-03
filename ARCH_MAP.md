# 🗺️ Soko Africa: Technical Architecture Map

This document provides a deep dive into the file-level logic and data flow of the Soko Africa Enterprise platform.

---

## 📁 Repository Structure & File Logic

### 1. Core Data Layer (`/server`)
*   **`db-real-data.ts`**: The **Source of Truth** for the product catalog. Contains the hot-swapped Meta CDN links (WhatsApp).
    *   *Logic:* Defines image arrays for each category and a `generateRealProductData()` function that builds the 100-artifact catalog.
*   **`db-init.ts`**: Orchestrates the initialization of the in-memory product database.
    *   *Logic:* Calls `generateRealProductData()` and provides accessor functions (`getProducts`, `getProductById`) for the tRPC routers.
*   **`db.ts`**: The database abstraction layer.
    *   *Logic:* Handles connections to MySQL (Drizzle) and provides high-level functions for products, sellers, and embeddings.

### 2. Intelligence Layer (`/server/services`)
*   **`siglip-real.ts`**: The **Vectorization Engine**.
    *   *Logic:* Implements SigLIP (0.6 Image / 0.4 Text) hybrid embeddings.
    *   *Zero-Copy:* Detects Meta CDN links and processes them in-memory without local storage.
    *   *Fallback:* Uses a local feature extraction if the Hugging Face API is unavailable.

### 3. API Layer (`/server/routers-minimal.ts`)
*   **`products`**: Handles all product retrieval and search.
*   **`admin`**: Handles the ingestion trigger and sync statistics.
*   **`health`**: Crucial endpoint for deployment verification.

### 4. Frontend Layer (`/client/src`)
*   **`pages/Home.tsx`**: The **Discovery Hub**.
    *   *UI:* Pinterest-style masonry grid.
    *   *Logic:* Uses tRPC to fetch real-time data from the backend.
*   **`pages/SellerOnboarding.tsx`**: The **WhatsApp Ingestor**.
    *   *UI:* Enterprise-grade interface for businesses to paste their catalog links.
*   **`pages/ProductDetail.tsx`**: Focused product view with "Buy on WhatsApp" integration.

---

## 🔄 Data Flow: The "Jumia-Killer" Loop

1.  **Ingestion:** Business pastes WhatsApp Catalog Link in `SellerOnboarding.tsx`.
2.  **Scraping:** Backend worker identifies the Meta CDN links.
3.  **Vectorization:** `siglip-real.ts` generates a 768-dimension taste vector for each item.
4.  **Indexing:** Vectors are stored in Milvus; product metadata is hot-swapped into `db-real-data.ts`.
5.  **Discovery:** `Home.tsx` queries the vector-powered feed, presenting the items to the Kenyan market.

---

## 🛠️ Maintenance & Scaling
*   **Catalog Updates:** To update the catalog, modify `db-real-data.ts` and run `pm2 restart soko-backend`.
*   **Vector Sync:** Monitor logs via `pm2 logs soko-backend` to ensure "SigLIP Handshake" is successful.
*   **UI Purge:** All mock data and non-functional buttons have been removed. Future UI additions must be backed by real backend logic.

---
*Last Updated: Feb 03, 2026*
