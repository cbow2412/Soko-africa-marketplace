import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user"),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).defaultNow(),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow(),
});

export const sellers = sqliteTable("sellers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  storeName: text("storeName").notNull(),
  description: text("description"),
  whatsappPhone: text("whatsappPhone"),
  rating: real("rating").default(0),
  totalSales: integer("totalSales").default(0),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow(),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sellerId: integer("sellerId").notNull(),
  categoryId: integer("categoryId").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price").notNull(),
  imageUrl: text("imageUrl"),
  stock: integer("stock").default(0),
  source: text("source").default("nairobi_market"),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow(),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("productId").notNull(),
  userId: integer("userId").notNull(),
  rating: integer("rating"),
  text: text("text"),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow(),
});

export const favorites = sqliteTable("favorites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  productId: integer("productId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow(),
});
