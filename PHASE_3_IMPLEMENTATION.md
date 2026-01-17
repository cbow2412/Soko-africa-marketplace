# Phase 3: Seller Onboarding + Dashboard + Order Management

## Objective

Implement complete seller lifecycle: registration with catalog input → automatic scraping → product publishing → order management → seller notifications.

## Components to Build

### 1. Seller Onboarding Flow

**Frontend Pages:**
- Seller registration page (`SellerOnboarding.tsx`)
- WhatsApp catalog URL input
- Business information form
- Payment/verification setup

**Backend Services:**
- Seller registration endpoint
- Catalog URL validation
- Trigger job queue for scraping
- Seller profile creation

**Database Updates:**
- Store seller info with catalog URL
- Track onboarding status (pending → verified → active)
- Store seller WhatsApp number and business details

### 2. Seller Dashboard

**Frontend Pages:**
- Dashboard overview (`SellerDashboard.tsx`)
- Product management page
- Order history page
- Analytics and stats
- Settings page

**Features:**
- Real-time order notifications
- Product performance metrics
- Catalog sync status
- Revenue tracking
- Customer messages

**Backend Services:**
- Get seller dashboard data
- Get seller orders
- Get seller products
- Get seller analytics
- Update seller settings

### 3. Order Management

**Frontend Pages:**
- Order tracking page
- Order details page
- Buyer order history

**Backend Services:**
- Create order from product
- Get order status
- Update order status
- Send order notifications
- Track order lifecycle

**Order Lifecycle:**
1. Buyer clicks "Order via WhatsApp"
2. Order created in database
3. Seller receives notification
4. Seller confirms via WhatsApp
5. Order marked as confirmed
6. Seller ships product
7. Order marked as shipped
8. Buyer receives product
9. Order marked as delivered

### 4. Notifications

**Types:**
- New order received
- Order confirmed
- Order shipped
- Order delivered
- Product approved
- Product rejected
- Catalog sync complete

**Channels:**
- In-app notifications
- WhatsApp messages
- Email notifications

## Database Schema Updates

**New Tables:**
- `orders` - Order tracking
- `orderItems` - Items in each order
- `sellerNotifications` - Seller alerts
- `catalogSyncLogs` - Scraping history

**Updated Tables:**
- `sellers` - Add catalogUrl, status, verificationDate
- `products` - Add approvalStatus, approvedDate

## API Endpoints (tRPC)

### Seller Routes
- `seller.register` - Register new seller
- `seller.getDashboard` - Get dashboard data
- `seller.getOrders` - Get seller's orders
- `seller.getProducts` - Get seller's products
- `seller.getAnalytics` - Get performance metrics
- `seller.updateSettings` - Update seller info
- `seller.syncCatalog` - Trigger manual sync

### Order Routes
- `order.create` - Create new order
- `order.getByUser` - Get user's orders
- `order.getBySeller` - Get seller's orders
- `order.updateStatus` - Update order status
- `order.getDetails` - Get order details

### Notification Routes
- `notification.getForSeller` - Get seller notifications
- `notification.markAsRead` - Mark notification read
- `notification.delete` - Delete notification

## Frontend Components

### Seller Onboarding
```
Registration Form
├── Business Name
├── WhatsApp Number
├── Catalog URL
├── Business Category
└── Terms & Conditions
```

### Seller Dashboard
```
Dashboard Overview
├── Stats Cards (Orders, Revenue, Products)
├── Recent Orders Table
├── Top Products
└── Notifications
```

### Order Management
```
Order Details
├── Product Info
├── Buyer Info
├── Order Status
├── Timeline
└── Actions (Confirm, Ship, Deliver)
```

## Success Criteria

- ✅ Seller registration working
- ✅ Catalog URL triggers scraping job
- ✅ Dashboard shows real-time data
- ✅ Orders created successfully
- ✅ Notifications sent to sellers
- ✅ Order status tracking working
- ✅ All code pushed to GitHub
- ✅ Complete documentation

## Timeline

- Estimated: 3-4 hours
- Target: Complete Phase 3 by end of session

## Commits to Make

1. `feat: Add seller onboarding flow and registration`
2. `feat: Build seller dashboard with analytics`
3. `feat: Implement order management system`
4. `feat: Add seller notifications`
5. `docs: Update ARCHITECTURE.md with seller flow`
