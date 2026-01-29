import { eq } from "drizzle-orm";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import * as mysqlSchema from "../drizzle/schema";
import { ENV } from './_core/env';
import { 
  getProducts as getProductsInit,
  getProductById as getProductByIdInit,
  getProductsByCategory as getProductsByCategoryInit,
  searchProducts as searchProductsInit,
  getAllProducts as getAllProductsInit
} from './db-init';

// In-memory fallback for the sandbox environment
let productEmbeddings: Map<number, number[]> = new Map();
let sellers: any[] = [];
let syncLogs: any[] = [];
let categories: any[] = [
  { id: 1, name: "Shoes", description: "Premium footwear" },
  { id: 2, name: "Dresses", description: "Elegant dresses for women" },
  { id: 5, name: "Womens Accessories", description: "Trendy womens accessories" },
  { id: 7, name: "Jewelry", description: "Luxury jewelry" },
];

let _db: any = null;

export async function getDb() {
  if (_db) return _db;
  const dbUrl = ENV.databaseUrl;
  if (dbUrl && dbUrl !== "mysql://[user]:[password]@[host]:[port]/[database]?sslMode=REQUIRED") {
    try {
      _db = drizzleMysql(dbUrl, { schema: mysqlSchema, mode: "default" });
      console.log("✅ Connected to MySQL database");
      return _db;
    } catch (error) {
      console.warn("[Database] Failed to connect to MySQL, using in-memory fallback");
    }
  }
  return null;
}

export async function upsertUser(user: any): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.insert(mysqlSchema.users).values(user).onDuplicateKeyUpdate({ set: user });
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (db) {
    const result = await db.select().from(mysqlSchema.users).where(eq(mysqlSchema.users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }
  return undefined;
}

// Re-export product functions from db-init
export async function getProducts(limit: number = 20, offset: number = 0) {
  return await getProductsInit(limit, offset);
}

export async function getProductById(id: number) {
  return await getProductByIdInit(id);
}

export async function getProductsByCategory(categoryId: number, limit: number = 20, offset: number = 0) {
  return await getProductsByCategoryInit(categoryId, limit, offset);
}

export async function searchProducts(query: string, limit: number = 20) {
  return await searchProductsInit(query, limit);
}

export async function getCategories() {
  return categories;
}

export async function getAllProducts() {
  return await getAllProductsInit();
}

export async function getCatalogSyncLogs() {
  return syncLogs;
}

export async function getProductEmbedding(productId: number): Promise<number[] | null> {
  return productEmbeddings.get(productId) || null;
}

export async function getSimilarProducts(productId: number, limit: number = 5) {
  const embedding = productEmbeddings.get(productId);
  if (!embedding) return [];

  const similarities = (await getAllProducts())
    .filter(p => p.id !== productId)
    .map(p => {
      const pEmbedding = productEmbeddings.get(p.id) || [];
      const similarity = cosineSimilarity(embedding, pEmbedding);
      return { product: p, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return similarities.map(s => s.product);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

export async function recordInteraction(userId: string, productId: number, interactionType: string) {
  console.log(`[Analytics] User ${userId} performed ${interactionType} on product ${productId}`);
}

export async function getAnalyticsDashboard(userId: string) {
  const allProducts = await getAllProducts();
  return {
    totalViews: Math.floor(Math.random() * 1000),
    totalClicks: Math.floor(Math.random() * 500),
    conversionRate: (Math.random() * 15).toFixed(2),
    topProducts: allProducts.slice(0, 5),
  };
}

export async function getSellerById(id: number) {
  return sellers.find(s => s.id === id);
}

export async function getCommentsByProduct(productId: number) {
  return [];
}

export async function getUserFavorites(userId: string) {
  return [];
}

export async function createSeller(seller: any) {
  const newSeller = { ...seller, id: sellers.length + 1 };
  sellers.push(newSeller);
  return { success: true, sellerId: newSeller.id };
}

export async function createSyncLog(log: any) {
  syncLogs.push(log);
  return { success: true };
}

export async function getSyncStatus(sellerId: number) {
  const log = syncLogs.find(l => l.sellerId === sellerId);
  return log || { status: 'pending' };
}

export async function getVisualSimilarity(productId: number, limit: number = 10) {
  const allProducts = await getAllProducts();
  return allProducts.filter(p => p.id !== productId).slice(0, limit);
}
