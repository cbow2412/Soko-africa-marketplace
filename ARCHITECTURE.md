# Soko Africa Marketplace - Complete Architecture & Technical Documentation

## Project Overview

**Soko Africa** is a production-grade e-commerce marketplace platform designed specifically for Kenyan sellers and buyers. It aggregates authentic Kenyan inventory (shoes, fashion, furniture, electronics, accessories, jewelry, and more) into a Pinterest-style browsing experience with real product images, seller information, and direct WhatsApp integration for seamless buyer-seller communication.

### Core Philosophy

The platform solves a critical problem: **Small Kenyan traders (in Gikomba, Githurai, Kilimani, etc.) cannot afford websites but want online exposure.** Soko Africa eliminates this barrier by:

1. **Automated Catalog Ingestion** - Sellers provide WhatsApp Business catalog links
2. **AI-Powered Quality Control** - Gemini AI validates products automatically
3. **Semantic Discovery** - SigLIP embeddings enable visual similarity search
4. **Direct Ordering** - WhatsApp integration for frictionless transactions

### Key Features

- **Pinterest-Style Masonry Grid** - Responsive infinite scroll layout for browsing 1000+ products
- **Dark Mode UI** - Modern dark theme with amber accents for premium feel
- **Real Product Images** - All products display high-quality images from Unsplash
- **Category Filtering** - 8 product categories with instant filtering
- **Full-Text Search** - Search products by name and description
- **Semantic Search** - SigLIP-powered visual similarity search
- **Product Detail Pages** - Comprehensive product information with seller details
- **WhatsApp Integration** - Direct "Chat with Seller" button for instant communication
- **Seller Profiles** - Store information, ratings, and contact details
- **No Authentication Required** - Browse marketplace freely without sign-up
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

---

## Complete End-to-End Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: SELLER ONBOARDING                                      │
├─────────────────────────────────────────────────────────────────┤
│ 1. Seller registers with WhatsApp Business catalog link         │
│ 2. Seller provides:                                             │
│    - WhatsApp number (e.g., +254712345678)                      │
│    - Store name                                                 │
│    - Catalog link (wa.me/c/254712345678)                        │
│    - Category focus (Shoes, Furniture, Fashion, etc.)           │
│ 3. System validates WhatsApp number format                      │
│ 4. Seller status: PENDING → SCRAPING                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: MCP + PLAYWRIGHT CATALOG SCRAPING                      │
├─────────────────────────────────────────────────────────────────┤
│ Service: server/services/whatsapp-scraper.ts                    │
│                                                                 │
│ 1. Launch Playwright browser                                    │
│ 2. Navigate to WhatsApp catalog URL (wa.me/c/[phone])           │
│ 3. Extract product metadata:                                    │
│    - Product name/title                                         │
│    - Price (in KES)                                             │
│    - Description/details                                        │
│    - Stock quantity                                             │
│    - Product images (download to S3)                            │
│ 4. Handle pagination (if catalog has >20 products)              │
│ 5. Retry logic for failed extractions                           │
│ 6. Rate limiting (500ms between requests)                       │
│ 7. Store raw scraped data temporarily                           │
│ 8. Seller status: SCRAPING → QC_REVIEW                          │
│                                                                 │
│ Output: Array of {name, price, description, imageUrl}          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: GEMINI AI QUALITY CONTROL LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│ Service: server/services/gemini-quality-control.ts              │
│                                                                 │
│ For each scraped product:                                       │
│                                                                 │
│ 1. Image Quality Analysis:                                      │
│    - Is image clear/not blurry? (reject if blurry)              │
│    - Is image authentic? (detect AI-generated, reject)          │
│    - Is image appropriate? (no explicit content)                │
│    - Image resolution >= 400x400px? (reject if too small)       │
│                                                                 │
│ 2. Product Authenticity Check:                                  │
│    - Is product real/not counterfeit? (reject if fake)          │
│    - Is product banned on platform? (reject if banned)          │
│    - Is product category correct? (flag if uncertain)           │
│                                                                 │
│ 3. Description Validation:                                      │
│    - Generate/validate product description using Gemini         │
│    - Extract key features (material, color, size, etc.)         │
│    - Detect spam/misleading claims (reject if spam)             │
│    - Ensure description matches image                           │
│                                                                 │
│ 4. Price Validation:                                            │
│    - Is price reasonable for category? (flag if unusual)        │
│    - Is price in valid KES format?                              │
│                                                                 │
│ 5. Decision Logic:                                              │
│    ✅ APPROVED - Product meets all standards                    │
│    ❌ REJECTED - Product fails quality checks (reason logged)   │
│    ⚠️  FLAGGED - Product needs manual review                    │
│                                                                 │
│ 6. Store QC decision in qualityControl table                    │
│ 7. Seller status: QC_REVIEW → APPROVED/REJECTED/FLAGGED         │
│                                                                 │
│ Output: {decision, reason, confidence, geminiAnalysis}          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: SIGLIP VECTORIZATION LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│ Service: server/services/siglip-embeddings.ts                   │
│                                                                 │
│ For APPROVED products only:                                     │
│                                                                 │
│ 1. Generate Image Embedding:                                    │
│    - Use SigLIP model (google/siglip-base-patch16-224)           │
│    - Input: Product image URL                                   │
│    - Output: 768-dimensional embedding vector                   │
│    - Cache result in productEmbeddings table                    │
│                                                                 │
│ 2. Generate Text Embedding:                                     │
│    - Use SigLIP model                                           │
│    - Input: Product name + description                          │
│    - Output: 768-dimensional embedding vector                   │
│    - Cache result in productEmbeddings table                    │
│                                                                 │
│ 3. Create Hybrid Embedding:                                     │
│    - Weighted combination: (0.6 × image) + (0.4 × text)         │
│    - Why? Visual similarity primary, semantic meaning secondary  │
│    - Output: 768-dimensional hybrid vector                      │
│    - Cache result in productEmbeddings table                    │
│                                                                 │
│ 4. Enable Semantic Search:                                      │
│    - Hybrid embedding used for similarity queries               │
│    - Cosine similarity algorithm                                │
│    - Find top-N similar products across ALL sellers             │
│                                                                 │
│ Output: {imageEmbedding, textEmbedding, hybridEmbedding}        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 5: DATABASE STORAGE & INDEXING                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Tables Updated:                                                 │
│ - products (new product record)                                 │
│ - productEmbeddings (vector embeddings)                         │
│ - qualityControl (QC decision & logs)                           │
│ - sellers (seller info & stats)                                 │
│ - catalogSyncLogs (scraping audit trail)                        │
│                                                                 │
│ Indexes Created:                                                │
│ - products.sellerId (for seller's product list)                 │
│ - products.categoryId (for category filtering)                  │
│ - productEmbeddings.productId (for embedding lookups)           │
│ - qualityControl.productId (for QC history)                     │
│ - qualityControl.decision (for admin filtering)                 │
│                                                                 │
│ Seller Status Updated: APPROVED → LIVE                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 6: MARKETPLACE DISCOVERY                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Buyers Experience:                                              │
│ 1. Browse Pinterest-style grid (approved products only)         │
│ 2. Search by keyword (text search)                              │
│ 3. Search by image (upload photo → SigLIP → find similar)       │
│ 4. Filter by category                                           │
│ 5. View similar products from different sellers                 │
│ 6. Click product → See seller info + WhatsApp button            │
│                                                                 │
│ Features:                                                       │
│ - Infinite scroll (load 40 products at a time)                  │
│ - Masonry layout (variable card heights)                        │
│ - Dark mode with amber accents                                  │
│ - Mobile-first responsive design                                │
│ - Real-time product updates                                     │
│ - Trending products section                                     │
│ - Category recommendations                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 7: ORDER MANAGEMENT                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Buyer Flow:                                                     │
│ 1. Click product → View details                                 │
│ 2. Select quantity                                              │
│ 3. Click "Order via WhatsApp"                                   │
│ 4. Opens WhatsApp with pre-filled message:                      │
│    "Hi, I'm interested in [Product Name] x[Qty] = KES [Total]"  │
│ 5. Seller receives order notification                           │
│ 6. Buyer can track order status                                 │
│                                                                 │
│ Seller Flow:                                                    │
│ 1. Receive order notifications (real-time)                      │
│ 2. View orders in seller dashboard                              │
│ 3. Update order status (Pending → Confirmed → Shipped)          │
│ 4. View order analytics (total orders, revenue, trends)         │
│ 5. Manage products (add, edit, delete)                          │
│ 6. View seller ratings and reviews                              │
│                                                                 │
│ Tables:                                                         │
│ - orders (order records)                                        │
│ - sellerNotifications (order alerts)                            │
│ - orderTracking (status updates)                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 8: ADMIN MODERATION & QUALITY ASSURANCE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Admin Dashboard Features:                                       │
│ 1. QC Queue - Review flagged products                           │
│ 2. Rejection Management - View/appeal rejected products         │
│ 3. Seller Verification - Approve/suspend sellers                │
│ 4. Product Moderation - Remove inappropriate content            │
│ 5. Analytics - Platform metrics & trends                        │
│ 6. Reports - Seller performance, product quality                │
│                                                                 │
│ Quality Metrics:                                                │
│ - Approval rate (% of products approved)                        │
│ - Rejection reasons (top 5)                                     │
│ - Seller ratings (average rating per seller)                    │
│ - Product performance (views, orders, ratings)                  │
│ - Platform health (total products, active sellers)              │
│                                                                 │
│ Tables:                                                         │
│ - qualityControl (QC decisions)                                 │
│ - moderationQueue (flagged products)                            │
│ - sellerVerification (seller status)                            │
│ - appealRequests (seller appeals)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **React 19**: Modern UI library with hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first styling
- **tRPC**: Type-safe RPC framework for client-server communication
- **Wouter**: Lightweight routing library
- **Shadcn/UI**: Pre-built component library
- **Lucide React**: Icon library

### Backend
- **Express 4**: Lightweight web framework
- **Node.js**: JavaScript runtime
- **tRPC 11**: Type-safe API layer
- **Drizzle ORM**: Type-safe database queries
- **MySQL 2**: Database driver
- **Playwright**: Web scraping for WhatsApp catalogs
- **Gemini AI**: Image analysis and quality control
- **SigLIP**: Vector embeddings for semantic search

### Database
- **MySQL/TiDB**: Relational database
- **Drizzle Kit**: Database migrations and schema management

### Development Tools
- **Vite**: Fast build tool and dev server
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler
- **Vitest**: Unit testing framework

---

## Database Schema

### Core Tables

#### `users`
User accounts for authentication and profiles.
```sql
- id (INT, PK, AI)
- openId (VARCHAR, UNIQUE) - Manus OAuth identifier
- name (TEXT)
- email (VARCHAR)
- loginMethod (VARCHAR)
- role (ENUM: 'user', 'admin', 'seller')
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
- lastSignedIn (TIMESTAMP)
```

#### `sellers`
Seller/store information and ratings.
```sql
- id (INT, PK, AI)
- userId (INT, FK) - Reference to users table
- storeName (VARCHAR) - Business name
- description (TEXT) - Store description
- whatsappPhone (VARCHAR) - WhatsApp contact number
- catalogUrl (VARCHAR) - WhatsApp Business catalog link
- rating (DECIMAL 3,2) - Average seller rating (0.00-5.00)
- totalSales (INT) - Total number of sales
- status (ENUM: 'pending', 'approved', 'suspended', 'rejected')
- lastSyncedAt (TIMESTAMP) - Last catalog sync time
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

#### `categories`
Product categories for filtering and organization.
```sql
- id (INT, PK, AI)
- name (VARCHAR, UNIQUE) - Category name (Shoes, Fashion, Furniture, etc.)
- description (TEXT)
- createdAt (TIMESTAMP)
```

#### `products`
Product catalog with 1000+ items.
```sql
- id (INT, PK, AI)
- sellerId (INT, FK) - Reference to sellers table
- categoryId (INT, FK) - Reference to categories table
- name (VARCHAR) - Product name
- description (TEXT) - Product description
- price (VARCHAR) - Price in KES
- imageUrl (TEXT) - URL to product image
- stock (INT) - Available quantity
- source (VARCHAR) - Source marketplace
- status (ENUM: 'approved', 'rejected', 'pending')
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

#### `productEmbeddings` (NEW)
Vector embeddings for semantic search.
```sql
- id (INT, PK, AI)
- productId (INT, FK, UNIQUE) - Reference to products
- imageEmbedding (TEXT) - JSON array (768 dimensions)
- textEmbedding (TEXT) - JSON array (768 dimensions)
- hybridEmbedding (TEXT) - JSON array (768 dimensions)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

#### `qualityControl` (NEW)
QC decisions and audit trail.
```sql
- id (INT, PK, AI)
- productId (INT, FK) - Reference to products
- decision (ENUM: 'approved', 'rejected', 'flagged')
- reason (TEXT) - Why product was rejected/flagged
- geminiAnalysis (JSON) - Full Gemini analysis result
- confidence (DECIMAL 3,2) - Confidence score (0-1)
- reviewedBy (INT, FK) - Admin user who reviewed (if manual)
- reviewedAt (TIMESTAMP)
- createdAt (TIMESTAMP)
```

#### `orders` (NEW)
Order records for tracking.
```sql
- id (INT, PK, AI)
- buyerId (INT, FK) - Reference to users
- productId (INT, FK) - Reference to products
- sellerId (INT, FK) - Reference to sellers
- quantity (INT)
- totalPrice (VARCHAR)
- buyerPhone (VARCHAR) - Buyer contact number
- status (ENUM: 'initiated', 'confirmed', 'shipped', 'delivered', 'cancelled')
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

#### `sellerNotifications` (NEW)
Order and sync notifications for sellers.
```sql
- id (INT, PK, AI)
- sellerId (INT, FK) - Reference to sellers
- type (ENUM: 'order', 'sync_complete', 'sync_failed', 'product_rejected')
- title (VARCHAR)
- message (TEXT)
- data (JSON) - Additional context
- read (BOOLEAN)
- createdAt (TIMESTAMP)
```

#### `catalogSyncLogs` (NEW)
Audit trail for catalog scraping.
```sql
- id (INT, PK, AI)
- sellerId (INT, FK) - Reference to sellers
- catalogUrl (VARCHAR)
- status (ENUM: 'started', 'completed', 'failed')
- productsScraped (INT)
- productsApproved (INT)
- productsRejected (INT)
- error (TEXT) - Error message if failed
- startedAt (TIMESTAMP)
- completedAt (TIMESTAMP)
```

#### `comments`
User reviews and ratings for products.
```sql
- id (INT, PK, AI)
- productId (INT, FK)
- userId (INT, FK)
- rating (INT) - Star rating (1-5)
- text (TEXT) - Review comment
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

#### `favorites`
User's saved/favorited products.
```sql
- id (INT, PK, AI)
- userId (INT, FK)
- productId (INT, FK)
- createdAt (TIMESTAMP)
```

---

## API Architecture (tRPC)

### Router Structure

```typescript
appRouter
├── auth
│   ├── me (query)
│   └── logout (mutation)
├── products
│   ├── getAll (query)
│   ├── getByCategory (query)
│   ├── getById (query)
│   ├── search (query)
│   └── getSimilar (query) - SigLIP semantic search
├── categories
│   └── getAll (query)
├── sellers
│   ├── getById (query)
│   ├── register (mutation) - Trigger scraping pipeline
│   ├── getDashboard (query) - Seller stats & orders
│   └── resyncCatalog (mutation) - Manual resync
├── orders
│   ├── create (mutation) - Create order
│   ├── getByUser (query) - User's orders
│   ├── getByS eller (query) - Seller's orders
│   └── updateStatus (mutation) - Update order status
├── admin
│   ├── getQCQueue (query) - Pending QC items
│   ├── approveProduct (mutation)
│   ├── rejectProduct (mutation)
│   ├── getMetrics (query) - Platform analytics
│   └── getSellers (query) - Seller management
└── notifications
    ├── getByUser (query)
    ├── markAsRead (mutation)
    └── subscribe (subscription) - Real-time updates
```

---

## Frontend Architecture

### Page Structure

```
client/src/
├── pages/
│   ├── Home.tsx - Marketplace homepage with masonry grid
│   ├── ProductDetail.tsx - Product detail page
│   ├── SellerOnboarding.tsx - Seller registration
│   ├── SellerDashboard.tsx - Seller management
│   ├── AdminPanel.tsx - Admin moderation
│   ├── OrderTracking.tsx - Order history
│   └── NotFound.tsx - 404 page
├── components/
│   ├── ui/ - Shadcn/UI components
│   ├── PinterestGrid.tsx - Masonry grid component
│   ├── ProductCard.tsx - Product card with hover
│   ├── SellerCard.tsx - Seller information
│   └── OrderCard.tsx - Order tracking card
├── contexts/
│   └── ThemeContext.tsx - Dark mode theme provider
├── hooks/
│   ├── useAuth.tsx - Authentication hook
│   └── useInfiniteScroll.tsx - Infinite scroll hook
├── lib/
│   └── trpc.ts - tRPC client configuration
├── App.tsx - Main router and layout
└── main.tsx - React entry point
```

---

## Data Flow

### Seller Onboarding Flow

```
1. Seller visits /seller/register
2. Fills form: name, WhatsApp number, catalog link, category
3. Clicks "Register & Scrape"
4. Backend triggers WhatsApp scraper
5. Playwright extracts products from catalog
6. Gemini AI analyzes each product
7. Approved products stored in database
8. Seller receives notification: "X products approved, Y rejected"
9. Products appear on marketplace
10. Seller can view dashboard with orders & analytics
```

### Product Discovery Flow

```
1. User visits marketplace (/)
2. Loads first 40 products (infinite scroll)
3. User searches or filters by category
4. Products displayed in Pinterest masonry grid
5. User clicks product → Modal overlay with details
6. User clicks "Order via WhatsApp"
7. Opens WhatsApp with pre-filled message
8. Seller receives order notification
9. Seller confirms order in dashboard
10. Buyer can track order status
```

### Semantic Search Flow

```
1. User uploads product image or searches by text
2. Frontend sends query to backend
3. Backend generates SigLIP embedding
4. Calculates cosine similarity with all product embeddings
5. Returns top 10 similar products
6. Frontend displays similar products in grid
7. Products grouped by similarity score
8. User can see products from different sellers
```

---

## Performance Optimizations

### Frontend
- **Code Splitting**: Lazy load pages
- **Image Optimization**: Unsplash CDN with parameters
- **Masonry Layout**: CSS-based (no JavaScript overhead)
- **Intersection Observer**: Efficient scroll detection
- **Pagination**: Load 40 products at a time

### Backend
- **Database Indexing**: Indexes on key fields
- **Query Optimization**: Select only needed columns
- **Caching**: tRPC React Query caches responses
- **Batch Processing**: Process embeddings in batches
- **Rate Limiting**: Respect API limits (500ms between requests)

### Database
- **Connection Pooling**: MySQL connection reuse
- **Prepared Statements**: Prevent SQL injection
- **Foreign Keys**: Maintain referential integrity

---

## Deployment

### Environment Variables

```
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-secret-key
VITE_APP_ID=manus-oauth-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
GEMINI_API_KEY=your-gemini-api-key
```

### Build & Run

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm db:push

# Development
pnpm dev

# Production build
pnpm build

# Production run
pnpm start
```

---

## Security Considerations

- **Authentication**: Manus OAuth for secure login
- **Authorization**: Role-based access control (user/admin/seller)
- **SQL Injection**: Drizzle ORM prevents SQL injection
- **XSS Protection**: React auto-escapes content
- **HTTPS**: All traffic encrypted
- **CORS**: Configured for trusted origins
- **Rate Limiting**: Implement on production
- **Input Validation**: Zod schemas validate all inputs

---

## Future Enhancements

### Phase 2
- [ ] Payment processing (Stripe/M-Pesa)
- [ ] Seller verification system
- [ ] Product reviews with images
- [ ] Wishlist management

### Phase 3
- [ ] AI-powered product recommendations
- [ ] User accounts and purchase history
- [ ] Real-time notifications
- [ ] Analytics dashboard

### Phase 4
- [ ] Native mobile app (React Native)
- [ ] Progressive Web App (PWA)
- [ ] Push notifications
- [ ] Multi-language support (Swahili)

---

**Last Updated**: January 2026
**Version**: 2.0.0 (Complete Pipeline)
**Status**: In Development
