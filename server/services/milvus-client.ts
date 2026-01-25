import { MilvusClient } from "@milvus.io/milvus2-sdk-node";
import { ENV } from "../_core/env";

/**
 * Milvus Vector Database Client
 * 
 * Manages all interactions with Milvus for vector storage and similarity search
 * Handles collection management, embedding storage, and semantic search
 */

export interface MilvusConfig {
  address: string;
  username?: string;
  password?: string;
  timeout?: number;
}

export interface ProductEmbedding {
  productId: number;
  embedding: number[];
  metadata: {
    productName: string;
    category: string;
    price: number;
    sellerId: number;
  };
}

export interface SearchResult {
  productId: number;
  distance: number;
  score: number;
}

class MilvusVectorDB {
  private client: MilvusClient | null = null;
  private collectionName = "product_embeddings";
  private isConnected = false;

  /**
   * Initialize Milvus connection
   */
  async connect(config: MilvusConfig): Promise<void> {
    try {
      console.log("[Milvus] Connecting to Milvus...");

      this.client = new MilvusClient({
        address: config.address || ENV.milvusAddress || "localhost:19530",
        username: config.username || ENV.milvusUsername,
        password: config.password || ENV.milvusPassword,
        timeout: config.timeout || 30000,
      });

      // Test connection
      const health = await this.client.checkHealth();
      if (!health.isHealthy) {
        throw new Error("Milvus health check failed");
      }

      this.isConnected = true;
      console.log("[Milvus] Connected successfully");
    } catch (error) {
      console.error("[Milvus] Connection failed:", error);
      throw error;
    }
  }

  /**
   * Create collection for product embeddings
   */
  async createCollection(): Promise<void> {
    if (!this.client) throw new Error("Milvus not connected");

    try {
      console.log(`[Milvus] Creating collection: ${this.collectionName}`);

      // Check if collection exists
      const hasCollection = await this.client.hasCollection({
        collection_name: this.collectionName,
      });

      if (hasCollection.value) {
        console.log(`[Milvus] Collection ${this.collectionName} already exists`);
        return;
      }

      // Create collection
      await this.client.createCollection({
        collection_name: this.collectionName,
        fields: [
          {
            name: "product_id",
            description: "Product ID",
            data_type: 5, // DataType.Int64
            is_primary_key: true,
            autoID: false,
          },
          {
            name: "embedding",
            description: "Product embedding vector",
            data_type: 101, // DataType.FloatVector
            type_params: {
              dim: 768, // SigLIP embedding dimension
            },
          },
          {
            name: "product_name",
            description: "Product name",
            data_type: 21, // DataType.VarChar
            type_params: {
              max_length: 256,
            },
          },
          {
            name: "category",
            description: "Product category",
            data_type: 21, // DataType.VarChar
            type_params: {
              max_length: 64,
            },
          },
          {
            name: "price",
            description: "Product price",
            data_type: 10, // DataType.Float
          },
          {
            name: "seller_id",
            description: "Seller ID",
            data_type: 5, // DataType.Int64
          },
        ],
      });

      // Create index for faster search
      await this.client.createIndex({
        collection_name: this.collectionName,
        field_name: "embedding",
        index_type: "IVF_FLAT", // Fast approximate search
        metric_type: "L2", // Euclidean distance
        params: {
          nlist: 1024,
        },
      });

      console.log(`[Milvus] Collection created successfully`);
    } catch (error) {
      console.error("[Milvus] Collection creation failed:", error);
      throw error;
    }
  }

  /**
   * Insert product embeddings
   */
  async insertEmbeddings(embeddings: ProductEmbedding[]): Promise<void> {
    if (!this.client) throw new Error("Milvus not connected");

    try {
      console.log(`[Milvus] Inserting ${embeddings.length} embeddings...`);

      const data = embeddings.map((emb) => ({
        product_id: emb.productId,
        embedding: emb.embedding,
        product_name: emb.metadata.productName,
        category: emb.metadata.category,
        price: emb.metadata.price,
        seller_id: emb.metadata.sellerId,
      }));

      const result = await this.client.insert({
        collection_name: this.collectionName,
        data: data,
      });

      console.log(`[Milvus] Inserted ${result.insert_cnt} embeddings`);
    } catch (error) {
      console.error("[Milvus] Insertion failed:", error);
      throw error;
    }
  }

  /**
   * Search for similar products
   */
  async searchSimilar(
    queryEmbedding: number[],
    limit: number = 10,
    threshold: number = 0.5
  ): Promise<SearchResult[]> {
    if (!this.client) throw new Error("Milvus not connected");

    try {
      console.log(`[Milvus] Searching for ${limit} similar products...`);

      const results = await this.client.search({
        collection_name: this.collectionName,
        vector: queryEmbedding,
        limit: limit,
        metric_type: "L2",
        output_fields: ["product_id", "product_name", "category", "price"],
      });

      // Convert results format
      const searchResults: SearchResult[] = results.results.map((result: any) => ({
        productId: result.product_id,
        distance: result.distance,
        score: 1 / (1 + result.distance), // Convert distance to similarity score
      }));

      // Filter by threshold
      const filtered = searchResults.filter((r) => r.score >= threshold);

      console.log(`[Milvus] Found ${filtered.length} similar products`);
      return filtered;
    } catch (error) {
      console.error("[Milvus] Search failed:", error);
      throw error;
    }
  }

  /**
   * Delete product embedding
   */
  async deleteEmbedding(productId: number): Promise<void> {
    if (!this.client) throw new Error("Milvus not connected");

    try {
      console.log(`[Milvus] Deleting embedding for product ${productId}...`);

      await this.client.delete({
        collection_name: this.collectionName,
        expr: `product_id == ${productId}`,
      });

      console.log(`[Milvus] Embedding deleted`);
    } catch (error) {
      console.error("[Milvus] Deletion failed:", error);
      throw error;
    }
  }

  /**
   * Get collection stats
   */
  async getStats(): Promise<any> {
    if (!this.client) throw new Error("Milvus not connected");

    try {
      const stats = await this.client.getCollectionStatistics({
        collection_name: this.collectionName,
      });

      return {
        rowCount: stats.row_count,
        collectionName: this.collectionName,
        status: "active",
      };
    } catch (error) {
      console.error("[Milvus] Stats retrieval failed:", error);
      throw error;
    }
  }

  /**
   * Drop collection (for cleanup)
   */
  async dropCollection(): Promise<void> {
    if (!this.client) throw new Error("Milvus not connected");

    try {
      console.log(`[Milvus] Dropping collection: ${this.collectionName}`);

      await this.client.dropCollection({
        collection_name: this.collectionName,
      });

      console.log(`[Milvus] Collection dropped`);
    } catch (error) {
      console.error("[Milvus] Drop failed:", error);
      throw error;
    }
  }

  /**
   * Disconnect from Milvus
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.closeConnection();
      this.isConnected = false;
      console.log("[Milvus] Disconnected");
    }
  }

  /**
   * Check if connected
   */
  isConnectedStatus(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const milvusDB = new MilvusVectorDB();
