# 🎯 SOKO AFRICA - AGENT HANDOFF DOCUMENT
## The Complete Blueprint for Continuity

**Last Updated:** February 3, 2026  
**Current Agent:** Manus (PhD-Level Frontend Engineer)  
**Next Agent:** [Your Name Here]  
**Status:** 🟢 ACTIVE DEVELOPMENT - Premium UI + AI Discovery Engine

---

## 📋 EXECUTIVE SUMMARY

Soko Africa is an **AI-powered visual discovery platform** (the "Jumia-killer") that bridges WhatsApp Business inventory with a Pinterest-style frontend. The platform uses **SigLIP embeddings** for real-time visual similarity discovery, eliminating traditional search and replacing it with taste-based exploration.

**Vision:** Democratize Kenyan commerce by allowing any business to paste a WhatsApp link and have their products instantly discoverable through AI-powered visual taste profiling.

---

## 🏗️ ARCHITECTURE OVERVIEW

### Three-Tier System

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

### Key Innovation: Zero-Copy Meta-Sync

Instead of storing images on S3, Soko uses **Meta CDN links** (from WhatsApp/Facebook/Instagram) with unique product IDs. The backend scrapes these links in real-time, generates SigLIP embeddings, and stores only the vectors in Milvus. This approach:

- **Eliminates storage costs** (no S3 needed)
- **Ensures real-time freshness** (images always current)
- **Leverages Meta's infrastructure** (CDN reliability)
- **Scales infinitely** (no storage limits)

---

## 📁 PROJECT STRUCTURE

```
soko/
├── MISSION_CONTROL.md          # Strategic roadmap & vision
├── ARCH_MAP.md                 # Technical architecture details
├── AGENT_HANDOFF.md            # THIS FILE - Complete agent instructions
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
│   │   └── useStaticProducts.ts        # Static product data
│   │
│   └── lib/
│       └── trpc.ts             # tRPC client setup
│
└── drizzle/
    └── schema.ts               # Database schema (MySQL)
```

---

## 🔑 CRITICAL COMPONENTS & THEIR ROLES

### 1. **Frontend Discovery Experience**

#### `PremiumLayout.tsx`
- **Purpose:** Global header with premium glassmorphic design
- **Features:** Sticky navigation, search bar, "Ingest" CTA, mobile bottom nav
- **Key Props:** None (wraps entire app)
- **Status:** ✅ COMPLETE

#### `AdvancedMasonryGrid.tsx`
- **Purpose:** AI-optimized masonry grid that surpasses Pinterest
- **Algorithm:** 
  - Calculates actual aspect ratios
  - Distributes items across columns to balance heights
  - Responsive breakpoints (1-8 columns)
  - Lazy loading with Intersection Observer
- **Key Props:** `items`, `columns`, `gap`
- **Status:** ✅ COMPLETE

#### `PremiumProductCard.tsx`
- **Purpose:** Individual product card with advanced interactions
- **Features:**
  - 3D perspective hover effect (rotateX/Y)
  - Glassmorphic overlay
  - Magnetic button (follows cursor)
  - Heart favorite toggle
  - Skeleton loading state
- **Key Props:** `id`, `name`, `price`, `imageUrl`, `onFavorite`, `onAddToCart`
- **Status:** ✅ COMPLETE

#### `VisualDiscoveryChain.tsx`
- **Purpose:** AI-powered product chaining based on visual similarity
- **Logic:**
  - Fetches similar products using `trpc.products.getSimilar`
  - Displays products in order of cosine similarity
  - Shows similarity score (0-100%)
  - Navigation buttons to move through chain
- **Key Props:** `initialProductId`, `onProductClick`, `maxChainLength`
- **Status:** ✅ COMPLETE (needs integration into ProductDetail)

### 2. **Backend Discovery Engine**

#### `routers-minimal.ts` - tRPC Endpoints

```typescript
// Existing endpoints
products.getAll(limit, offset)
products.getById(id)
products.getByCategory(categoryId, limit, offset)
products.search(query, limit)

// NEW: Visual Similarity Search
products.getSimilar(productId, limit, threshold)
  → Returns products mathematically closest to clicked product
  → Uses cosine similarity on SigLIP embeddings
  → Fallback: same category if no embeddings

// NEW: Discovery Chain
discovery.getNext(currentProductId, userTasteVector)
  → Returns next product in discovery sequence
  → Optional: incorporates user taste vector for personalization
```

#### `db.ts` - Core Functions

```typescript
// Existing
getProducts(limit, offset)
getProductById(id)
getProductsByCategory(categoryId, limit, offset)
getCategories()

// NEW: Visual Similarity
getVisualSimilarity(productId, limit)
  → Fetches product embedding from productEmbeddings map
  → Calculates cosine similarity with all other products
  → Returns top N products sorted by similarity
  → Fallback: same category if no embeddings available

// Helper
cosineSimilarity(a[], b[])
  → Calculates dot product / (magnitude_a * magnitude_b)
  → Returns 0-1 score (1 = identical, 0 = orthogonal)
```

#### `db-real-data.ts` - The Catalog

- **Contains:** 100 Meta CDN links (WhatsApp Business images)
- **Format:** Array of products with Meta CDN URLs
- **How to Update:** Replace Unsplash URLs with new Meta CDN links
- **Current Status:** ✅ Hot-swapped with 100 real links

#### `siglip-real.ts` - Vector Generation

- **Purpose:** Generates SigLIP embeddings for images
- **Detects Meta CDN:** Checks for "scontent", "fbcdn", "instagram" in URL
- **Stores:** Embeddings in `productEmbeddings` map (in-memory)
- **Trigger:** On app startup (db-init.ts) and periodic sync

### 3. **Integration Points**

#### Current State
- ✅ Backend tRPC endpoints created
- ✅ Similarity search logic implemented
- ✅ VisualDiscoveryChain component created
- ⏳ ProductDetail.tsx needs integration (add VisualDiscoveryChain to sidebar)
- ⏳ Frontend needs to call `trpc.products.getSimilar` instead of search

---

## 🎬 EXACT PROMPTS FOR NEXT AGENT

### **Prompt 1: Complete Visual Discovery Integration**

```
You are taking over Soko Africa frontend development. The visual discovery 
chain component is built but NOT YET integrated into ProductDetail.tsx.

Your task:
1. Open client/src/pages/ProductDetail.tsx
2. Replace the "Similar Products" section with the VisualDiscoveryChain component
3. Change the similarProducts query from search to getSimilar:
   FROM: trpc.products.search.useQuery({ query: product?.name || "", limit: 8 })
   TO:   trpc.products.getSimilar.useQuery({ productId: productId, limit: 8 })
4. Render VisualDiscoveryChain in the sidebar with:
   - initialProductId={productId}
   - onProductClick={(id) => navigate(`/product/${id}`)}
   - maxChainLength={6}
5. Test: Click a product, verify the discovery chain loads with similarity scores
6. Commit with message: "feat: Integrate Visual Discovery Chain into ProductDetail"
```

### **Prompt 2: Backend Embedding Population**

```
The similarity search endpoints are ready but embeddings are empty (productEmbeddings map).

Your task:
1. Check server/services/siglip-real.ts - verify it detects Meta CDN links
2. Check server/db-init.ts - ensure it calls SigLIP vectorization on startup
3. Verify the heartbeat-sync worker is running and populating embeddings
4. If embeddings are still empty:
   - Add console.log statements to track vectorization progress
   - Check if SigLIP service is accessible
   - Verify Meta CDN links are valid (no 403 errors)
5. Once embeddings are populated, test similarity search:
   - Click a product on the frontend
   - Verify VisualDiscoveryChain shows related products
   - Check similarity scores are between 0-1
6. Commit with message: "fix: Ensure SigLIP embeddings are populated on startup"
```

### **Prompt 3: Taste Profile Personalization**

```
Soko's killer feature is taste-based discovery. Currently, the system shows 
similarity based on individual products. Next step: build user taste profiles.

Your task:
1. Create a new file: client/src/hooks/useTasteProfile.ts
   - Track products the user clicks/favorites
   - Build a "taste vector" by averaging clicked product embeddings
   - Store in localStorage as "soko_taste_profile"

2. Modify VisualDiscoveryChain to accept userTasteVector prop
   - If provided, blend similarity with taste profile matching
   - Show "Personalized for You" badge when using taste profile

3. Modify Home.tsx to pass user taste profile to product recommendations
   - Call discovery.getNext with userTasteVector
   - Gradually personalize the feed as user explores

4. Test: 
   - Click 5-10 products of similar style
   - Verify recommendations become more personalized
   - Check taste vector is saved to localStorage

5. Commit with message: "feat: Add user taste profile personalization engine"
```

### **Prompt 4: Real-Time Inventory Sync**

```
The Meta CDN links are currently static. Next: implement real-time sync 
so when a seller updates their WhatsApp Business catalog, Soko reflects it instantly.

Your task:
1. Check server/workers/heartbeat-sync.ts
2. Implement periodic polling of Meta CDN links:
   - Every 5 minutes, fetch latest images from each link
   - Detect if images have changed (hash comparison)
   - Re-vectorize changed images using SigLIP
   - Update Milvus with new embeddings

3. Add sync status to admin dashboard:
   - Show last sync time per product
   - Show vectorization progress
   - Show any failed links (403, 404, etc.)

4. Implement retry logic:
   - If a link fails, retry 3 times with exponential backoff
   - After 3 failures, mark as "stale" and alert seller

5. Test:
   - Manually update a Meta CDN image
   - Verify Soko detects the change within 5 minutes
   - Verify new embedding is generated and stored

6. Commit with message: "feat: Implement real-time Meta CDN sync worker"
```

### **Prompt 5: Performance Optimization**

```
The frontend is beautiful but needs optimization for production.

Your task:
1. Implement virtual scrolling in AdvancedMasonryGrid
   - Only render visible items + buffer
   - Unrender items outside viewport
   - Measure performance: should handle 1000+ items smoothly

2. Add image optimization:
   - Implement blur-up effect (low-res placeholder → high-res)
   - Use WebP with JPEG fallback
   - Lazy load images with Intersection Observer

3. Add service worker for offline support:
   - Cache product grid on first visit
   - Allow browsing cached products offline
   - Sync when online

4. Code splitting:
   - Lazy load ProductDetail page
   - Lazy load SellerOnboarding page
   - Measure bundle size reduction

5. Test with Lighthouse:
   - Target: 90+ Performance score
   - Target: 95+ Accessibility score
   - Target: 90+ Best Practices score

6. Commit with message: "perf: Optimize frontend for production (virtual scroll, lazy load, service worker)"
```

### **Prompt 6: Mobile App Deployment**

```
Soko is currently web-only. Next: build mobile apps (iOS/Android) using React Native.

Your task:
1. Create mobile app scaffold using Expo:
   $ npx create-expo-app soko-mobile

2. Port key components:
   - PremiumLayout → Mobile-optimized navigation
   - AdvancedMasonryGrid → React Native FlatList with masonry
   - PremiumProductCard → React Native touchable component
   - VisualDiscoveryChain → Mobile gesture controls

3. Implement mobile-specific features:
   - Swipe left/right to navigate discovery chain
   - Pinch to zoom on product images
   - Haptic feedback on interactions
   - Bottom sheet for product details

4. Connect to same backend (tRPC works on mobile)
   - Use same API endpoints
   - Share authentication

5. Test on iOS and Android emulators
6. Deploy to App Store and Google Play

Commit with message: "feat: Launch Soko mobile app (iOS + Android)"
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Current Status
- ✅ Backend deployed to AWS EC2 (3.121.29.56)
- ✅ 100 Meta CDN links ingested
- ✅ Frontend components built (Premium UI)
- ✅ tRPC endpoints created
- ⏳ Visual Discovery Chain integration (IN PROGRESS)
- ⏳ Embeddings population (NEEDS VERIFICATION)
- ⏳ Production optimization (TODO)

### Before Going Live
- [ ] Verify all 100 products have SigLIP embeddings
- [ ] Test similarity search returns correct results
- [ ] Load test with 1000+ concurrent users
- [ ] Set up monitoring/alerting
- [ ] Configure CDN caching headers
- [ ] Set up SSL/TLS (HTTPS)
- [ ] Configure rate limiting
- [ ] Set up error tracking (Sentry)
- [ ] Create admin dashboard for monitoring

---

## 💾 HOW TO HAND OFF TO NEXT AGENT

### Step 1: Update This Document
Before handing off, update:
- **Current Status** section
- **What's Complete** vs **What's Remaining**
- **Next Priority** (which prompt to execute first)
- **Any Blockers** (AWS access, API keys, etc.)

### Step 2: Create a Summary
```markdown
## Handoff Summary

**What I Completed:**
- Premium UI redesign (surpasses Pinterest)
- Advanced masonry grid with dynamic height balancing
- 3D perspective product cards
- Visual Discovery Chain component
- tRPC endpoints for similarity search
- Backend similarity search logic

**What's Remaining:**
1. Integrate VisualDiscoveryChain into ProductDetail.tsx
2. Verify SigLIP embeddings are populated
3. Test end-to-end similarity discovery
4. Implement user taste profile personalization
5. Set up real-time sync worker
6. Performance optimization
7. Mobile app deployment

**Next Agent Should:**
- Execute Prompt 1 (Visual Discovery Integration)
- Then Prompt 2 (Backend Embedding Population)
- Then Prompt 3 (Taste Profile Personalization)

**Blockers:**
- None currently
- AWS access: Use SSH key in ~/.ssh/manus_key
- Backend URL: 3.121.29.56
```

### Step 3: Verify Everything Works
```bash
# Test backend
curl http://3.121.29.56/health

# Test similarity endpoint
curl http://3.121.29.56/trpc/products.getSimilar?input={"productId":1,"limit":5}

# Test frontend
npm run dev  # Should start on localhost:5173
```

### Step 4: Push Final Changes
```bash
cd /home/ubuntu/soko
git add .
git commit -m "handoff: Prepare for next agent - Visual Discovery Chain ready for integration"
git push origin main
```

---

## 📞 EMERGENCY CONTACTS

- **Backend Issues:** Check server logs: `ssh ubuntu@3.121.29.56 "pm2 logs"`
- **Database Issues:** Milvus connection string in ENV
- **API Issues:** Check tRPC error logs in browser console
- **Deployment Issues:** GitHub Actions CI/CD (if configured)

---

## 🎓 LEARNING RESOURCES

- **SigLIP:** Vision-language model for image embeddings
- **Milvus:** Vector database for similarity search
- **Framer Motion:** Advanced React animations
- **tRPC:** End-to-end typesafe APIs
- **Tailwind CSS:** Utility-first styling

---

**Last Updated:** February 3, 2026  
**Next Agent:** [Your Name]  
**Status:** 🟢 READY FOR HANDOFF

*This document is the source of truth. Update it before every handoff.*
