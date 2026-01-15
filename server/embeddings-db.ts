import { getDb } from "./db";
import { productEmbeddings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Save product embeddings to database
 */
export async function saveProductEmbedding(
  productId: number,
  imageEmbedding: number[],
  textEmbedding: number[],
  hybridEmbedding: number[]
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(productEmbeddings).values({
    productId,
    imageEmbedding: JSON.stringify(imageEmbedding),
    textEmbedding: JSON.stringify(textEmbedding),
    hybridEmbedding: JSON.stringify(hybridEmbedding),
  });
}

/**
 * Get product embedding by ID
 */
export async function getProductEmbedding(productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(productEmbeddings)
    .where(eq(productEmbeddings.productId, productId))
    .limit(1);

  if (result.length === 0) return null;

  const embedding = result[0];
  return {
    ...embedding,
    imageEmbedding: JSON.parse(embedding.imageEmbedding),
    textEmbedding: JSON.parse(embedding.textEmbedding),
    hybridEmbedding: JSON.parse(embedding.hybridEmbedding),
  };
}

/**
 * Get all product embeddings for similarity search
 */
export async function getAllProductEmbeddings() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db.select().from(productEmbeddings);

  return results.map(embedding => ({
    ...embedding,
    imageEmbedding: JSON.parse(embedding.imageEmbedding),
    textEmbedding: JSON.parse(embedding.textEmbedding),
    hybridEmbedding: JSON.parse(embedding.hybridEmbedding),
  }));
}

/**
 * Update product embedding
 */
export async function updateProductEmbedding(
  productId: number,
  imageEmbedding: number[],
  textEmbedding: number[],
  hybridEmbedding: number[]
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(productEmbeddings)
    .set({
      imageEmbedding: JSON.stringify(imageEmbedding),
      textEmbedding: JSON.stringify(textEmbedding),
      hybridEmbedding: JSON.stringify(hybridEmbedding),
      updatedAt: new Date(),
    })
    .where(eq(productEmbeddings.productId, productId));
}

/**
 * Check if product has embeddings
 */
export async function hasEmbedding(productId: number): Promise<boolean> {
  const embedding = await getProductEmbedding(productId);
  return embedding !== null;
}

/**
 * Delete product embedding
 */
export async function deleteProductEmbedding(productId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(productEmbeddings).where(eq(productEmbeddings.productId, productId));
}

/**
 * Get embeddings count
 */
export async function getEmbeddingsCount(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(productEmbeddings);
  return result.length;
}
