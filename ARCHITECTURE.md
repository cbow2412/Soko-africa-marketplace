# Soko Africa Marketplace - Architecture & Technical Documentation

## Project Overview

**Soko Africa** is a modern, dark-mode e-commerce marketplace platform designed specifically for Kenyan products. It aggregates authentic Kenyan inventory (shoes, fashion, furniture, electronics, accessories, jewelry, and more) into a Pinterest-style browsing experience with real product images, seller information, and direct WhatsApp integration for seamless buyer-seller communication.

### Key Features

- **Pinterest-Style Masonry Grid**: Responsive infinite scroll layout for browsing 1000+ products
- **Dark Mode UI**: Modern dark theme with amber accents for premium feel
- **Real Product Images**: All products display high-quality images from Unsplash
- **Category Filtering**: 8 product categories with instant filtering
- **Full-Text Search**: Search products by name and description
- **Product Detail Pages**: Comprehensive product information with seller details
- **WhatsApp Integration**: Direct "Chat with Seller" button for instant communication
- **Seller Profiles**: Store information, ratings, and contact details
- **No Authentication Required**: Browse marketplace freely without sign-up
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

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

### Tables

#### `users`
Stores user information for authentication and profiles.
```sql
- id (INT, PK, AI)
- openId (VARCHAR, UNIQUE) - Manus OAuth identifier
- name (TEXT)
- email (VARCHAR)
- loginMethod (VARCHAR)
- role (ENUM: 'user', 'admin')
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
- lastSignedIn (TIMESTAMP)
```

#### `categories`
Product categories for filtering and organization.
```sql
- id (INT, PK, AI)
- name (VARCHAR, UNIQUE) - Category name (Shoes, Fashion, Furniture, etc.)
- description (TEXT)
- createdAt (TIMESTAMP)
```

#### `sellers`
Seller/store information and ratings.
```sql
- id (INT, PK, AI)
- userId (INT, FK) - Reference to users table
- storeName (VARCHAR) - Business name
- description (TEXT) - Store description
- whatsappPhone (VARCHAR) - WhatsApp contact number
- rating (DECIMAL 3,2) - Average seller rating (0.00-5.00)
- totalSales (INT) - Total number of sales
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

#### `products`
Product catalog with 1000+ items.
```sql
- id (INT, PK, AI)
- sellerId (INT, FK) - Reference to sellers table
- categoryId (INT, FK) - Reference to categories table
- name (VARCHAR) - Product name
- description (TEXT) - Product description
- price (VARCHAR) - Price in KES (stored as string for flexibility)
- imageUrl (TEXT) - URL to product image (Unsplash)
- stock (INT) - Available quantity
- source (VARCHAR) - Source marketplace (nairobi_market, etc.)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

#### `comments`
User reviews and ratings for products.
```sql
- id (INT, PK, AI)
- productId (INT, FK) - Reference to products table
- userId (INT, FK) - Reference to users table
- rating (INT) - Star rating (1-5)
- text (TEXT) - Review comment
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

#### `favorites`
User's saved/favorited products.
```sql
- id (INT, PK, AI)
- userId (INT, FK) - Reference to users table
- productId (INT, FK) - Reference to products table
- createdAt (TIMESTAMP)
```

### Database Relationships

```
users (1) ──→ (many) sellers
users (1) ──→ (many) comments
users (1) ──→ (many) favorites

sellers (1) ──→ (many) products
categories (1) ──→ (many) products

products (1) ──→ (many) comments
products (1) ──→ (many) favorites
```

---

## API Architecture (tRPC)

### Router Structure

```typescript
appRouter
├── auth
│   ├── me (query) - Get current user
│   └── logout (mutation) - Sign out user
├── products
│   ├── getAll (query) - Fetch products with pagination
│   ├── getByCategory (query) - Filter by category
│   ├── getById (query) - Get single product details
│   └── search (query) - Full-text search
├── categories
│   └── getAll (query) - List all categories
├── sellers
│   └── getById (query) - Get seller details
├── comments
│   ├── getByProduct (query) - Get product reviews
│   └── create (mutation) - Add new review
└── favorites
    ├── getByUser (query) - Get user's favorites
    └── toggle (mutation) - Save/unsave product
```

### API Endpoints

All endpoints are accessible via `/api/trpc/[procedure]` with POST requests.

#### Products
- `products.getAll` - Get paginated products (limit: 20, offset: 0)
- `products.getByCategory` - Filter products by category ID
- `products.getById` - Get detailed product information
- `products.search` - Search products by query string

#### Categories
- `categories.getAll` - Get all 8 product categories

#### Sellers
- `sellers.getById` - Get seller profile and ratings

#### Comments
- `comments.getByProduct` - Get all reviews for a product
- `comments.create` - Add new review (protected)

#### Favorites
- `favorites.getByUser` - Get user's saved products (protected)
- `favorites.toggle` - Save/unsave product (protected)

---

## Frontend Architecture

### Page Structure

```
client/src/
├── pages/
│   ├── Home.tsx - Marketplace homepage with masonry grid
│   ├── ProductDetail.tsx - Product detail page
│   └── NotFound.tsx - 404 page
├── components/
│   ├── ui/ - Shadcn/UI components
│   └── DashboardLayout.tsx - (for future admin/seller dashboards)
├── contexts/
│   └── ThemeContext.tsx - Dark mode theme provider
├── hooks/
│   └── useAuth.tsx - Authentication hook
├── lib/
│   └── trpc.ts - tRPC client configuration
├── App.tsx - Main router and layout
└── main.tsx - React entry point
```

### Component Hierarchy

```
App
├── ThemeProvider
│   └── TooltipProvider
│       └── Router
│           ├── Home (/)
│           │   ├── Header (sticky)
│           │   ├── Category Filter
│           │   └── Masonry Grid
│           │       └── ProductCard (infinite scroll)
│           └── ProductDetail (/product/:id)
│               ├── Header (back button)
│               ├── Product Image
│               ├── Product Info
│               └── Seller Card
```

### Key Features Implementation

#### Infinite Scroll
- Uses `IntersectionObserver` API to detect when user scrolls near bottom
- Automatically loads next 20 products
- Accumulates products in state without page reload
- Smooth loading indicators during fetch

#### Masonry Grid
- CSS `columns` property for responsive layout
- Auto-adjusts column count based on screen size (1 mobile, 2 tablet, 3-4 desktop)
- `break-inside-avoid` prevents card splitting across columns

#### Category Filtering
- Buttons toggle selected category
- Resets pagination offset when category changes
- Filters products server-side via tRPC query

#### Product Search
- Real-time search as user types
- Searches both product name and description
- Server-side filtering for performance

#### WhatsApp Integration
- "Chat with Seller" button opens WhatsApp Web
- Pre-fills message with product details
- Uses `https://wa.me/[phone]?text=[message]` format

---

## Data Flow

### Product Browsing Flow

```
1. User visits marketplace (/)
2. Home component loads
3. tRPC fetches:
   - categories.getAll() → Display category buttons
   - products.getAll() → Display first 20 products
4. User scrolls down
5. IntersectionObserver detects scroll
6. tRPC fetches next 20 products
7. Products append to existing list
8. Infinite loop continues until all products loaded
```

### Product Detail Flow

```
1. User clicks "View Details" or product card
2. Navigate to /product/:id
3. ProductDetail component loads
4. tRPC fetches:
   - products.getById(id) → Product details
   - sellers.getById(sellerId) → Seller info
   - comments.getByProduct(id) → Reviews
5. Display all information
6. User can:
   - Click "Chat with Seller" → Open WhatsApp
   - Click "Share" → Share product link
   - Click heart → Save to favorites
```

### Search Flow

```
1. User types in search box
2. Search query state updates
3. Pagination offset resets to 0
4. tRPC fetches products.search(query)
5. Results display in masonry grid
6. Infinite scroll works with filtered results
```

---

## Performance Optimizations

### Frontend
- **Code Splitting**: Lazy load ProductDetail page
- **Image Optimization**: Use Unsplash CDN with `?w=500&h=500&fit=crop` parameters
- **Masonry Layout**: CSS-based (no JavaScript overhead)
- **Intersection Observer**: Efficient scroll detection
- **Pagination**: Load 20 products at a time (not all 1000)

### Backend
- **Database Indexing**: Indexes on `categoryId`, `sellerId`, `name`
- **Query Optimization**: Select only needed columns
- **Pagination**: LIMIT and OFFSET for memory efficiency
- **Caching**: tRPC React Query caches responses

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
```

### Build & Run

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm db:push

# Seed database (one-time)
node seed-all.mjs

# Development
pnpm dev

# Production build
pnpm build

# Production run
pnpm start
```

### Deployment Platforms

- **Manus Hosting**: Built-in hosting with custom domains
- **Docker**: Containerize with Node.js base image
- **Railway/Render**: Deploy from GitHub
- **Vercel**: Frontend only (requires separate backend)

---

## Future Enhancements

### Phase 2 (Seller & Admin)
- Seller dashboard for managing products and orders
- Admin panel for marketplace management
- Order tracking system
- Payment processing (Stripe/M-Pesa)

### Phase 3 (Advanced Features)
- SigLIP semantic search for similar products
- AI-powered product recommendations
- User accounts and purchase history
- Wishlist management
- Product reviews with images
- Seller verification system

### Phase 4 (Mobile & Scale)
- Native mobile app (React Native)
- Progressive Web App (PWA)
- Real-time notifications
- Push notifications
- Analytics dashboard

---

## Security Considerations

- **Authentication**: Manus OAuth for secure login
- **Authorization**: Role-based access control (user/admin)
- **SQL Injection**: Drizzle ORM prevents SQL injection
- **XSS Protection**: React auto-escapes content
- **HTTPS**: All traffic encrypted
- **CORS**: Configured for trusted origins
- **Rate Limiting**: Implement on production
- **Input Validation**: Zod schemas validate all inputs

---

## Monitoring & Logging

- **Error Tracking**: Sentry or similar service
- **Performance Monitoring**: Web Vitals tracking
- **Database Monitoring**: Query performance logs
- **User Analytics**: Page views, search queries, product views
- **Health Checks**: Endpoint availability monitoring

---

## Contributing

1. Create feature branch from `main`
2. Make changes and test locally
3. Run `pnpm test` to verify tests pass
4. Submit pull request with description
5. Code review before merge

---

## License

MIT License - See LICENSE file for details

---

## Support & Contact

For issues, feature requests, or questions:
- GitHub Issues: [project-repo/issues](https://github.com/sokoafrica/marketplace/issues)
- Email: support@sokoafrica.com
- WhatsApp: Contact seller directly from marketplace

---

**Last Updated**: January 2026
**Version**: 1.0.0
**Status**: Production Ready
