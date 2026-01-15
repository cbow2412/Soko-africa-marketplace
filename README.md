# Soko Africa Marketplace

A modern, dark-mode e-commerce marketplace platform for Kenyan products with Pinterest-style browsing, real product images, seller integration, and WhatsApp direct messaging.

![Soko Africa](https://img.shields.io/badge/Status-Production%20Ready-green) ![License](https://img.shields.io/badge/License-MIT-blue) ![Products](https://img.shields.io/badge/Products-1000%2B-orange)

## 🎯 Features

- **📱 Pinterest-Style Masonry Grid** - Infinite scroll layout with responsive columns
- **🌙 Dark Mode UI** - Modern dark theme with amber accents
- **🖼️ Real Product Images** - High-quality images from Unsplash
- **🏷️ 8 Product Categories** - Shoes, Fashion, Furniture, Electronics, Accessories, Home Decor, Jewelry, Watches
- **🔍 Full-Text Search** - Search by product name and description
- **💬 WhatsApp Integration** - Direct "Chat with Seller" button
- **👥 Seller Profiles** - Store information, ratings, and contact details
- **🛍️ 1000+ Products** - Authentic Kenyan marketplace inventory
- **💰 KES Pricing** - All prices in Kenyan Shillings
- **📱 Responsive Design** - Works on desktop, tablet, and mobile
- **⚡ No Authentication Required** - Browse freely without sign-up

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- MySQL/TiDB database

### Installation

```bash
# Clone repository
git clone https://github.com/sokoafrica/marketplace.git
cd soko-africa-marketplace

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database URL and OAuth credentials

# Run database migrations
pnpm db:push

# Seed database with 1000+ products (one-time)
node seed-all.mjs

# Start development server
pnpm dev
```

Visit `http://localhost:3000` to see the marketplace.

## 📁 Project Structure

```
soko-africa-marketplace/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components (Home, ProductDetail)
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (Theme)
│   │   ├── hooks/         # Custom hooks (useAuth)
│   │   ├── lib/           # Utilities (tRPC client)
│   │   ├── App.tsx        # Main router
│   │   └── main.tsx       # Entry point
│   └── index.html
├── server/                # Express backend
│   ├── routers.ts         # tRPC procedures
│   ├── db.ts              # Database queries
│   └── _core/             # Framework internals
├── drizzle/               # Database schema
│   ├── schema.ts          # Table definitions
│   └── migrations/        # Migration files
├── ARCHITECTURE.md        # Technical documentation
├── README.md              # This file
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 19 + TypeScript
- Tailwind CSS 4
- tRPC for type-safe API calls
- Shadcn/UI components
- Wouter for routing

**Backend:**
- Express 4 + Node.js
- tRPC 11 for RPC layer
- Drizzle ORM for database
- MySQL 2 driver

**Database:**
- MySQL/TiDB relational database
- 6 core tables with relationships

### Key Flows

1. **Product Browsing**: User visits marketplace → Loads first 20 products → Infinite scroll loads more
2. **Category Filtering**: User clicks category → Filters products server-side → Resets pagination
3. **Product Search**: User types query → Searches name/description → Displays filtered results
4. **Product Details**: User clicks product → Loads detail page with seller info → Can chat via WhatsApp
5. **WhatsApp Chat**: User clicks "Chat with Seller" → Opens WhatsApp Web with pre-filled message

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.

## 📊 Database Schema

### Core Tables

- **users** - User accounts and authentication
- **categories** - Product categories (8 total)
- **sellers** - Store profiles and ratings
- **products** - Product catalog (1000+ items)
- **comments** - Product reviews and ratings
- **favorites** - User's saved products

All products include:
- Name, description, price (KES)
- High-quality image URL
- Stock quantity
- Seller information
- Category classification

## 🎨 Design System

### Colors
- **Background**: Slate-950 (#030712)
- **Surface**: Slate-800 (#1e293b)
- **Accent**: Amber-600 (#d97706)
- **Text**: White/Slate-300

### Typography
- **Headings**: Bold, large sizes
- **Body**: Regular weight, good contrast
- **Mono**: For product IDs and codes

### Spacing
- **Grid Gap**: 1rem (16px)
- **Padding**: 1-2rem
- **Margins**: Consistent spacing

## 🔌 API Endpoints

All endpoints use tRPC at `/api/trpc/[procedure]`

### Products
- `products.getAll` - Paginated products (20 per page)
- `products.getByCategory` - Filter by category
- `products.getById` - Get product details
- `products.search` - Full-text search

### Categories
- `categories.getAll` - List all categories

### Sellers
- `sellers.getById` - Get seller profile

### Comments
- `comments.getByProduct` - Get product reviews
- `comments.create` - Add review (protected)

### Favorites
- `favorites.getByUser` - Get saved products (protected)
- `favorites.toggle` - Save/unsave (protected)

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## 📦 Building for Production

```bash
# Build frontend and backend
pnpm build

# Start production server
pnpm start
```

## 🚢 Deployment

### Manus Hosting (Recommended)
- Built-in hosting with custom domains
- Automatic SSL certificates
- Database backups included
- Click "Publish" button in Manus UI

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
CMD ["pnpm", "start"]
```

### Other Platforms
- Railway, Render, Vercel (with backend separation)
- AWS, GCP, Azure (with Docker)

## 🔒 Security

- **OAuth**: Manus OAuth for authentication
- **Authorization**: Role-based access control
- **SQL Injection**: Protected by Drizzle ORM
- **XSS**: React auto-escaping
- **HTTPS**: All traffic encrypted
- **Input Validation**: Zod schemas

## 📈 Performance

- **Infinite Scroll**: Loads 20 products at a time
- **Image Optimization**: Unsplash CDN with parameters
- **Masonry Layout**: CSS-based (no JS overhead)
- **Database Indexing**: Optimized queries
- **Caching**: React Query caching

## 🎯 Future Roadmap

### Phase 2
- [ ] Seller dashboard
- [ ] Admin panel
- [ ] Order management
- [ ] Payment processing (Stripe/M-Pesa)

### Phase 3
- [ ] SigLIP semantic search
- [ ] AI recommendations
- [ ] User accounts & history
- [ ] Advanced reviews with images

### Phase 4
- [ ] Mobile app (React Native)
- [ ] Progressive Web App
- [ ] Real-time notifications
- [ ] Analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/sokoafrica/marketplace/issues)
- **Email**: support@sokoafrica.com
- **WhatsApp**: Contact sellers directly from marketplace

## 🙏 Acknowledgments

- [Unsplash](https://unsplash.com) for product images
- [Shadcn/UI](https://ui.shadcn.com) for components
- [Tailwind CSS](https://tailwindcss.com) for styling
- [tRPC](https://trpc.io) for type-safe APIs
- [Drizzle ORM](https://orm.drizzle.team) for database

---

**Made with ❤️ for Kenya's digital marketplace**

**Version**: 1.0.0 | **Status**: Production Ready | **Last Updated**: January 2026
