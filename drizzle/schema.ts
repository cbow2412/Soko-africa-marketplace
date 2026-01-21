import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Categories table
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// Sellers table
export const sellers = mysqlTable("sellers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  storeName: varchar("storeName", { length: 255 }).notNull(),
  description: text("description"),
  whatsappPhone: varchar("whatsappPhone", { length: 20 }),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalSales: int("totalSales").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Seller = typeof sellers.$inferSelect;
export type InsertSeller = typeof sellers.$inferInsert;

// Products table
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: varchar("price", { length: 20 }).notNull(),
  imageUrl: text("imageUrl"),
  stock: int("stock").default(0),
  source: varchar("source", { length: 100 }).default("nairobi_market"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// Comments/Reviews table
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  userId: int("userId").notNull(),
  rating: int("rating"),
  text: text("text"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

// Favorites table
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

// Product embeddings for semantic search (SigLIP)
export const productEmbeddings = mysqlTable("product_embeddings", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().unique(),
  // Store embeddings as JSON arrays (768 dimensions for SigLIP)
  imageEmbedding: text("imageEmbedding").notNull(), // JSON stringified array
  textEmbedding: text("textEmbedding").notNull(), // JSON stringified array
  // Hybrid embedding (weighted average of image + text)
  hybridEmbedding: text("hybridEmbedding").notNull(), // JSON stringified array
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductEmbedding = typeof productEmbeddings.$inferSelect;
export type InsertProductEmbedding = typeof productEmbeddings.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sellers: many(sellers),
  comments: many(comments),
  favorites: many(favorites),
}));

export const sellersRelations = relations(sellers, ({ one, many }) => ({
  user: one(users, { fields: [sellers.userId], references: [users.id] }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(sellers, { fields: [products.sellerId], references: [sellers.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  comments: many(comments),
  favorites: many(favorites),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  product: one(products, { fields: [comments.productId], references: [products.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  product: one(products, { fields: [favorites.productId], references: [products.id] }),
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
}));


// Quality Control table for product QC decisions
export const qualityControl = mysqlTable("quality_control", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().unique(),
  decision: mysqlEnum("decision", ["approved", "rejected", "flagged"]).notNull(),
  reason: text("reason"), // Why rejected/flagged
  geminiAnalysis: text("geminiAnalysis"), // JSON stringified Gemini response
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0.00-1.00
  reviewedBy: int("reviewedBy"), // Admin user ID if manually reviewed
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QualityControl = typeof qualityControl.$inferSelect;
export type InsertQualityControl = typeof qualityControl.$inferInsert;

// Orders table for tracking buyer orders
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  buyerId: int("buyerId"), // Can be null for guest orders
  productId: int("productId").notNull(),
  sellerId: int("sellerId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  totalPrice: varchar("totalPrice", { length: 20 }).notNull(),
  buyerPhone: varchar("buyerPhone", { length: 20 }),
  buyerName: varchar("buyerName", { length: 100 }),
  status: mysqlEnum("status", ["initiated", "confirmed", "shipped", "delivered", "cancelled"]).default("initiated").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// Seller Notifications for order and sync alerts
export const sellerNotifications = mysqlTable("seller_notifications", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  type: mysqlEnum("type", ["order", "sync_complete", "sync_failed", "product_rejected", "product_approved"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  data: text("data"), // JSON stringified additional context
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SellerNotification = typeof sellerNotifications.$inferSelect;
export type InsertSellerNotification = typeof sellerNotifications.$inferInsert;

// Catalog Sync Logs for audit trail
export const catalogSyncLogs = mysqlTable("catalog_sync_logs", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  catalogUrl: text("catalogUrl"),
  status: mysqlEnum("status", ["started", "completed", "failed"]).notNull(),
  productsScraped: int("productsScraped").default(0),
  productsApproved: int("productsApproved").default(0),
  productsRejected: int("productsRejected").default(0),
  error: text("error"), // Error message if failed
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type CatalogSyncLog = typeof catalogSyncLogs.$inferSelect;
export type InsertCatalogSyncLog = typeof catalogSyncLogs.$inferInsert;

// Update sellers table with new fields
export const sellersUpdated = mysqlTable("sellers_updated", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  storeName: varchar("storeName", { length: 255 }).notNull(),
  description: text("description"),
  whatsappPhone: varchar("whatsappPhone", { length: 20 }),
  catalogUrl: varchar("catalogUrl", { length: 500 }), // WhatsApp catalog link
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalSales: int("totalSales").default(0),
  status: mysqlEnum("status", ["pending", "approved", "suspended", "rejected"]).default("pending").notNull(),
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Relations for new tables
export const qualityControlRelations = relations(qualityControl, ({ one }) => ({
  product: one(products, { fields: [qualityControl.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  product: one(products, { fields: [orders.productId], references: [products.id] }),
  seller: one(sellers, { fields: [orders.sellerId], references: [sellers.id] }),
  buyer: one(users, { fields: [orders.buyerId], references: [users.id] }),
}));

export const sellerNotificationsRelations = relations(sellerNotifications, ({ one }) => ({
  seller: one(sellers, { fields: [sellerNotifications.sellerId], references: [sellers.id] }),
}));

export const catalogSyncLogsRelations = relations(catalogSyncLogs, ({ one }) => ({
  seller: one(sellers, { fields: [catalogSyncLogs.sellerId], references: [sellers.id] }),
}));
