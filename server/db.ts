import { eq } from "drizzle-orm";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import { drizzle as drizzleSqlite } from "drizzle-orm/sqlite3";
import sqlite3 from "sqlite3";
import * as mysqlSchema from "../drizzle/schema";
import * as sqliteSchema from "../drizzle/sqlite-schema";
import { ENV } from './_core/env';
import path from "path";

let _db: any = null;
let isSqlite = false;

export async function getDb() {
  if (_db) return _db;

  if (process.env.DATABASE_URL) {
    try {
      _db = drizzleMysql(process.env.DATABASE_URL, { schema: mysqlSchema, mode: "default" });
      isSqlite = false;
      console.log("✅ Connected to MySQL database");
    } catch (error) {
      console.warn("[Database] Failed to connect to MySQL, falling back to SQLite:", error);
      await setupSqlite();
    }
  } else {
    console.log("ℹ️ No DATABASE_URL found, using local SQLite database");
    await setupSqlite();
  }
  return _db;
}

async function setupSqlite() {
  const dbPath = path.join(process.cwd(), "local.db");
  const db = new sqlite3.Database(dbPath);
  _db = drizzleSqlite(db, { schema: sqliteSchema });
  isSqlite = true;
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          openId TEXT NOT NULL UNIQUE,
          name TEXT,
          email TEXT,
          loginMethod TEXT,
          role TEXT DEFAULT 'user',
          createdAt INTEGER,
          updatedAt INTEGER,
          lastSignedIn INTEGER
        );
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          createdAt INTEGER
        );
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS sellers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          storeName TEXT NOT NULL,
          description TEXT,
          whatsappPhone TEXT,
          rating REAL DEFAULT 0,
          totalSales INTEGER DEFAULT 0,
          createdAt INTEGER,
          updatedAt INTEGER
        );
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sellerId INTEGER NOT NULL,
          categoryId INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          price TEXT NOT NULL,
          imageUrl TEXT,
          stock INTEGER DEFAULT 0,
          source TEXT DEFAULT 'nairobi_market',
          createdAt INTEGER,
          updatedAt INTEGER
        );
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          productId INTEGER NOT NULL,
          userId INTEGER NOT NULL,
          rating INTEGER,
          text TEXT,
          createdAt INTEGER,
          updatedAt INTEGER
        );
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          productId INTEGER NOT NULL,
          createdAt INTEGER
        );
      `, (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  });
}

const getTables = () => isSqlite ? sqliteSchema : mysqlSchema;

export async function upsertUser(user: any): Promise<void> {
  const db = await getDb();
  const { users } = getTables();
  try {
    if (isSqlite) {
      const existing = await db.select().from(users).where(eq(users.openId, user.openId)).get();
      if (existing) {
        await db.update(users).set(user).where(eq(users.openId, user.openId)).run();
      } else {
        await db.insert(users).values(user).run();
      }
    } else {
      await db.insert(users).values(user).onDuplicateKeyUpdate({ set: user });
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  const { users } = getTables();
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProducts(limit: number = 20, offset: number = 0) {
  const db = await getDb();
  const { products } = getTables();
  return await db.select().from(products).limit(limit).offset(offset);
}

export async function getProductsByCategory(categoryId: number, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  const { products } = getTables();
  return await db.select().from(products).where(eq(products.categoryId, categoryId)).limit(limit).offset(offset);
}

export async function getProductById(id: number) {
  const db = await getDb();
  const { products } = getTables();
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCategories() {
  const db = await getDb();
  const { categories } = getTables();
  return await db.select().from(categories);
}

export async function getSellerById(id: number) {
  const db = await getDb();
  const { sellers } = getTables();
  const result = await db.select().from(sellers).where(eq(sellers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCommentsByProduct(productId: number) {
  const db = await getDb();
  const { comments } = getTables();
  return await db.select().from(comments).where(eq(comments.productId, productId));
}

export async function getUserFavorites(userId: number) {
  const db = await getDb();
  const { favorites } = getTables();
  return await db.select().from(favorites).where(eq(favorites.userId, userId));
}
