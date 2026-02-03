# 🏗️ SOKO AFRICA - ARCHITECTURE OVERVIEW

**Last Updated:** February 3, 2026

---

## 📋 EXECUTIVE SUMMARY

Soko Africa is an **AI-powered visual discovery platform** that bridges WhatsApp Business inventory with a Pinterest-style frontend. The platform uses **SigLIP embeddings** for real-time visual similarity discovery, eliminating traditional search and replacing it with taste-based exploration.

**Vision:** Democratize Kenyan commerce by allowing any business to paste a WhatsApp link and have their products instantly discoverable through AI-powered visual taste profiling.

---

## 🚀 KEY INNOVATION: ZERO-COPY META-SYNC

Instead of storing images on S3, Soko uses **Meta CDN links** (from WhatsApp/Facebook/Instagram) with unique product IDs. The backend scrapes these links in real-time, generates SigLIP embeddings, and stores only the vectors in Milvus (or in-memory fallback). This approach:

- **Eliminates storage costs** (no S3 needed)
- **Ensures real-time freshness** (images always current)
- **Leverages Meta's infrastructure** (CDN reliability)
- **Scales infinitely** (no storage limits)

---

## 🌐 THREE-TIER SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│  - Premium UI with 3D perspective, glassmorphism, animations │
│  - Advanced masonry grid with dynamic height balancing       │
│  - Visual Discovery Chain (AI-powered product chaining)      │
│  - Real-time backend integration via tRPC                    │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js + tRPC)                   │
│  - Product catalog management (100 Meta CDN links)           │
│  - Vector similarity search (cosine similarity)              │
│  - WhatsApp Business integration                             │
│  - Real-time sync with Milvus vector DB                      │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│              INFRASTRUCTURE (AWS + Meta CDN)                 │
│  - EC2 Instance: 3.121.29.56 (Ubuntu 22.04)                 │
│  - Meta CDN Links: Zero-copy image serving (no S3 needed)    │
│  - Milvus Vector DB: Product embeddings & similarity search  │
│  - SigLIP Workers: Real-time vectorization                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 PROJECT STRUCTURE & FILE LOGIC

```
soko/
├── ARCHITECTURE.md             # THIS FILE - Consolidated architecture details
├── PROJECT_STATUS.md           # Current status, completed tasks, and next steps
│
├── server/
│   ├── routers-minimal.ts      # tRPC endpoints (products, discovery, categories)
│   ├── db.ts                   # Database functions & similarity search
│   ├── db-real-data.ts         # 100 Meta CDN links (hot-swapped catalog)
│   ├── db-init.ts              # Initialization logic
│   ├── services/
│   │   ├── siglip-real.ts      # SigLIP embedding generation
│   │   └── siglip-milvus.ts    # Milvus vector DB integration
│   ├── workers/
│   │   └── heartbeat-sync.ts   # Real-time sync worker
│   └── routes/
│       ├── ingestion.ts        # WhatsApp link ingestion
│       └── admin.ts            # Admin controls
│
├── client/src/
│   ├── pages/
│   │   ├── Home.tsx            # Elite Discovery (masonry grid)
│   │   ├── ProductDetail.tsx   # Immersive Canvas + Discovery Chain
│   │   └── SellerOnboarding.tsx # WhatsApp Ingestor UI
│   │
│   ├── components/
│   │   ├── layouts/
│   │   │   └── PremiumLayout.tsx       # Global header + navigation
│   │   ├── AdvancedMasonryGrid.tsx     # AI-optimized masonry
│   │   ├── PremiumProductCard.tsx      # 3D perspective + magnetic buttons
│   │   ├── VisualDiscoveryChain.tsx    # AI similarity chaining
│   │   └── ProductCard.tsx             # Basic product card
│   │
│   ├── hooks/
│   │   └── useTasteProfile.ts        # Static product data
│   │
│   └── lib/
│       └── trpc.ts             # tRPC client setup
│
└── drizzle/
    └── schema.ts               # Database schema (MySQL)
```

---

## 🔄 DATA FLOW: THE "JUMIA-KILLER" LOOP

1.  **Ingestion:** Business pastes WhatsApp Catalog Link in `SellerOnboarding.tsx`.
2.  **Scraping:** `heartbeat-sync.ts` triggers the `WhatsAppScraperV3`.
3.  **Vectorization:** `siglip-real.ts` generates a 768-dimension taste vector for each item.
4.  **Indexing:** Vectors are stored in Milvus via `siglip-milvus.ts` (or in-memory fallback).
5.  **Discovery:** `Home.tsx` queries the vector-powered feed, presenting the items to the Kenyan market.

---

## 🔑 CRITICAL COMPONENTS & THEIR ROLES

### 1. Frontend Discovery Experience

#### `PremiumLayout.tsx`
- **Purpose:** Global header with premium glassmorphic design
- **Features:** Sticky navigation, search bar, "Ingest" CTA, mobile bottom nav
- **Status:** ✅ COMPLETE

#### `AdvancedMasonryGrid.tsx`
- **Purpose:** AI-optimized masonry grid that surpasses Pinterest
- **Algorithm:** 
  - Calculates actual aspect ratios
  - Distributes items across columns to balance heights
  - Responsive breakpoints (1-8 columns)
  - Lazy loading with Intersection Observer
- **Status:** ✅ COMPLETE (Mobile optimization pending)

#### `PremiumProductCard.tsx`
- **Purpose:** Individual product card with advanced interactions
- **Features:**
  - 3D perspective hover effect (rotateX/Y)
  - Glassmorphic overlay
  - Magnetic button (follows cursor)
  - Heart favorite toggle
  - Skeleton loading state
- **Status:** ✅ COMPLETE

#### `VisualDiscoveryChain.tsx`
- **Purpose:** AI-powered product chaining based on visual similarity
- **Logic:**
  - Fetches similar products using `trpc.products.getSimilar`
  - Displays products in order of cosine similarity
  - Shows similarity score (0-100%)
  - Navigation buttons to move through chain
- **Status:** ✅ COMPLETE (Integrated into `ProductDetail.tsx`)

### 2. Backend Discovery Engine

#### `routers-minimal.ts` - tRPC Endpoints

- **Existing endpoints:** `products.getAll`, `products.getById`, `products.getByCategory`, `products.search`
- **NEW: Visual Similarity Search:** `products.getSimilar(productId, limit, threshold)`
  → Returns products mathematically closest to clicked product
  → Uses cosine similarity on SigLIP embeddings
  → Fallback: same category if no embeddings
- **NEW: Discovery Chain:** `discovery.getNext(currentProductId, userTasteVector)`
  → Returns next product in discovery sequence
  → Optional: incorporates user taste vector for personalization

#### `db.ts` - Core Functions

- **Existing:** `getProducts`, `getProductById`, `getProductsByCategory`, `getCategories`
- **NEW: Visual Similarity:** `getVisualSimilarity(productId, limit)`
  → Fetches product embedding from `productEmbeddings` map
  → Calculates cosine similarity with all other products
  → Returns top N products sorted by similarity
  → Fallback: same category if no embeddings available
- **Helper:** `cosineSimilarity(a[], b[])`
  → Calculates dot product / (magnitude_a * magnitude_b)
  → Returns 0-1 score (1 = identical, 0 = orthogonal)

#### `db-real-data.ts` - The Catalog

- **Contains:** 100 Meta CDN links (WhatsApp Business images)
- **Format:** Array of products with Meta CDN URLs
- **How to Update:** Replace Unsplash URLs with new Meta CDN links
- **Current Status:** ✅ Hot-swapped with 100 real links

#### `siglip-real.ts` - Vector Generation

- **Purpose:** Generates SigLIP embeddings for images
- **Detects Meta CDN:** Checks for "scontent", "fbcdn", "instagram" in URL
- **Stores:** Embeddings in `productEmbeddings` map (in-memory)
- **Trigger:** On app startup (`db-init.ts`) and periodic sync

---

## 🛠️ MAINTENANCE & SCALING

- **Catalog Updates:** To update the catalog, modify `db-real-data.ts` and run `pm2 restart soko-backend`.
- **Vector Sync:** Monitor logs via `pm2 logs soko-backend` to ensure "SigLIP Handshake" is successful.
- **UI Purge:** All mock data and non-functional buttons have been removed. Future UI additions must be backed by real backend logic.
