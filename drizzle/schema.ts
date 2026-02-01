import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, datetime } from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Categories table
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// Vendors table (formerly Sellers) - Supporting 'Sovereign Vendors'
export const vendors = mysqlTable("vendors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  storeName: varchar("storeName", { length: 255 }).notNull(),
  description: text("description"),
  whatsappPhone: varchar("whatsappPhone", { length: 20 }),
  tier: mysqlEnum("tier", ["bronze", "gold", "platinum"]).default("bronze").notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalSales: int("totalSales").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = typeof vendors.$inferInsert;

// Products table - Linked to VendorID
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(), // Changed to decimal for KES tracking
  currency: varchar("currency", { length: 3 }).default("KES").notNull(),
  imageUrl: text("imageUrl"),
  stock: int("stock").default(0),
  source: varchar("source", { length: 100 }).default("nairobi_market"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// Price History table - Tracking every KES fluctuation
export const priceHistory = mysqlTable("price_history", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("KES").notNull(),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});

export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPriceHistory = typeof priceHistory.$inferInsert;

// Comments/Reviews table
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  userId: int("userId").notNull(),
  rating: int("rating"),
  text: text("text"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

// Favorites table
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Product embeddings for semantic search
export const productEmbeddings = mysqlTable("product_embeddings", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().unique(),
  imageEmbedding: text("imageEmbedding").notNull(),
  textEmbedding: text("textEmbedding").notNull(),
  hybridEmbedding: text("hybridEmbedding").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Quality Control table
export const qualityControl = mysqlTable("quality_control", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().unique(),
  decision: mysqlEnum("decision", ["approved", "rejected", "flagged"]).notNull(),
  reason: text("reason"),
  geminiAnalysis: text("geminiAnalysis"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Orders table
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  buyerId: int("buyerId"),
  productId: int("productId").notNull(),
  vendorId: int("vendorId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }).notNull(),
  buyerPhone: varchar("buyerPhone", { length: 20 }),
  buyerName: varchar("buyerName", { length: 100 }),
  status: mysqlEnum("status", ["initiated", "confirmed", "shipped", "delivered", "cancelled"]).default("initiated").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  vendors: many(vendors),
  comments: many(comments),
  favorites: many(favorites),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  user: one(users, { fields: [vendors.userId], references: [users.id] }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  vendor: one(vendors, { fields: [products.vendorId], references: [vendors.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  comments: many(comments),
  favorites: many(favorites),
  priceHistory: many(priceHistory),
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  product: one(products, { fields: [priceHistory.productId], references: [products.id] }),
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

export const qualityControlRelations = relations(qualityControl, ({ one }) => ({
  product: one(products, { fields: [qualityControl.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  product: one(products, { fields: [orders.productId], references: [products.id] }),
  vendor: one(vendors, { fields: [orders.vendorId], references: [vendors.id] }),
  buyer: one(users, { fields: [orders.buyerId], references: [users.id] }),
}));
