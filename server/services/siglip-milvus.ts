/**
 * SigLIP + Milvus Integration Service
 * 
 * Handles:
 * 1. Hybrid vector generation (0.6 Image + 0.4 Text)
 * 2. Vector insertion into Milvus
 * 3. Similarity search via Milvus
 * 
 * Architecture:
 * - Image embedding: SigLIP vision model (768-dim)
 * - Text embedding: SigLIP text model (768-dim)
 * - Hybrid: Weighted average (0.6 * image + 0.4 * text)
 * - Storage: Milvus vector database
 * - Index: IVF_FLAT with L2 distance metric
 */

import { milvusDB, ProductEmbedding, SearchResult } from "./milvus-client";

export interface HybridVector {
  productId: number;
  imageVector: number[];
  textVector: number[];
  hybridVector: number[];
  metadata: {
    productName: string;
    category: string;
    price: number;
    sellerId: number;
    imageUrl: string;
  };
}

export interface SimilarProduct {
  productId: number;
  productName: string;
  category: string;
  price: number;
  similarity: number;
}

/**
 * In-memory fallback vector store (for development without Milvus)
 * In production, this will be replaced by actual Milvus calls
 */
class VectorStore {
  private vectors: Map<number, { vector: number[]; metadata: any }> = new Map();
  private milvusEnabled = false;

  async initialize(milvusAddress?: string): Promise<void> {
    if (milvusAddress) {
      try {
        await milvusDB.connect({ address: milvusAddress });
        await milvusDB.createCollection();
        this.milvusEnabled = true;
        console.log("✅ [SigLIP-Milvus] Milvus enabled");
      } catch (error) {
        console.warn("[SigLIP-Milvus] Milvus connection failed, using in-memory fallback:", error);
        this.milvusEnabled = false;
      }
    }
  }

  async insertVector(embedding: ProductEmbedding): Promise<void> {
    if (this.milvusEnabled) {
      try {
        await milvusDB.insertEmbeddings([embedding]);
      } catch (error) {
        console.error("[SigLIP-Milvus] Milvus insertion failed:", error);
        // Fallback to in-memory
        this.vectors.set(embedding.productId, {
          vector: embedding.embedding,
          metadata: embedding.metadata,
        });
      }
    } else {
      // In-memory storage
      this.vectors.set(embedding.productId, {
        vector: embedding.embedding,
        metadata: embedding.metadata,
      });
    }
  }

  async searchSimilar(
    queryVector: number[],
    limit: number = 10,
    threshold: number = 0.5
  ): Promise<SearchResult[]> {
    if (this.milvusEnabled) {
      try {
        return await milvusDB.searchSimilar(queryVector, limit, threshold);
      } catch (error) {
        console.error("[SigLIP-Milvus] Milvus search failed:", error);
        // Fallback to in-memory
        return this.searchInMemory(queryVector, limit, threshold);
      }
    } else {
      return this.searchInMemory(queryVector, limit, threshold);
    }
  }

  private searchInMemory(
    queryVector: number[],
    limit: number,
    threshold: number
  ): SearchResult[] {
    const results: SearchResult[] = [];

    for (const [productId, { vector }] of this.vectors) {
      const distance = this.calculateL2Distance(queryVector, vector);
      const score = 1 / (1 + distance);

      if (score >= threshold) {
        results.push({
          productId,
          distance,
          score,
        });
      }
    }

    // Sort by score descending and limit
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private calculateL2Distance(v1: number[], v2: number[]): number {
    let sum = 0;
    for (let i = 0; i < v1.length; i++) {
      const diff = v1[i] - v2[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  getStats(): { vectorCount: number; milvusEnabled: boolean } {
    return {
      vectorCount: this.vectors.size,
      milvusEnabled: this.milvusEnabled,
    };
  }
}

// Singleton instance
const vectorStore = new VectorStore();

/**
 * Generate hybrid vector (0.6 Image + 0.4 Text)
 */
export function generateHybridVector(
  imageVector: number[],
  textVector: number[]
): number[] {
  if (imageVector.length !== textVector.length) {
    throw new Error("Image and text vectors must have the same dimension");
  }

  const hybridVector: number[] = [];
  for (let i = 0; i < imageVector.length; i++) {
    hybridVector.push(0.6 * imageVector[i] + 0.4 * textVector[i]);
  }

  return hybridVector;
}

/**
 * Normalize vector to unit length
 */
export function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) return vector;
  return vector.map((v) => v / magnitude);
}

/**
 * Insert hybrid vector into Milvus
 */
export async function insertHybridVector(hybridVec: HybridVector): Promise<void> {
  const embedding: ProductEmbedding = {
    productId: hybridVec.productId,
    embedding: hybridVec.hybridVector,
    metadata: {
      productName: hybridVec.metadata.productName,
      category: hybridVec.metadata.category,
      price: hybridVec.metadata.price,
      sellerId: hybridVec.metadata.sellerId,
    },
  };

  await vectorStore.insertVector(embedding);
  console.log(`[SigLIP-Milvus] Inserted vector for product ${hybridVec.productId}`);
}

/**
 * Search for similar products using hybrid vector
 */
export async function searchSimilarProducts(
  queryHybridVector: number[],
  limit: number = 10,
  threshold: number = 0.5
): Promise<SimilarProduct[]> {
  const results = await vectorStore.searchSimilar(queryHybridVector, limit, threshold);

  // In a real scenario, you'd fetch product metadata from the database
  // For now, we'll return the results as-is
  return results.map((r) => ({
    productId: r.productId,
    productName: `Product ${r.productId}`,
    category: "Unknown",
    price: 0,
    similarity: r.score,
  }));
}

/**
 * Initialize the vector store (call this on app startup)
 */
export async function initializeVectorStore(milvusAddress?: string): Promise<void> {
  await vectorStore.initialize(milvusAddress);
  console.log("✅ [SigLIP-Milvus] Vector store initialized");
}

/**
 * Get vector store statistics
 */
export function getVectorStoreStats() {
  return vectorStore.getStats();
}

/**
 * Batch insert hybrid vectors
 */
export async function batchInsertHybridVectors(vectors: HybridVector[]): Promise<void> {
  for (const vec of vectors) {
    await insertHybridVector(vec);
  }
  console.log(`[SigLIP-Milvus] Batch inserted ${vectors.length} vectors`);
}
