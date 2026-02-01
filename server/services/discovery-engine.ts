/**
 * Discovery Engine - Soko AI Pipeline
 * 
 * Core AI service for visual product discovery using SigLIP-768 embeddings
 * and Zilliz Cloud (managed Milvus) for ANN search.
 * 
 * Architecture:
 * - SigLIP-768: google/siglip-base-patch16-224 model for image embeddings
 * - Zilliz Cloud: Vector database with cosine similarity search
 * - Zero-Storage: Images streamed to model, discarded after vectorization
 * 
 * @author Chief AI Scientist
 * @version 1.0.0
 */

import { MilvusClient, DataType, MetricType } from "@zilliz/milvus2-sdk-node";

/**
 * Vector record structure for Zilliz collection
 */
export interface VectorRecord {
  productId: number;
  embedding: number[];
  vendorId: number;
  price: number;
  categoryId?: number;
  stock?: number;
  createdAt: number;
}

/**
 * Search result from ANN query
 */
export interface SearchResult {
  productId: number;
  similarity: number;
  distance: number;
}

/**
 * Discovery Engine Configuration
 */
interface DiscoveryEngineConfig {
  collectionName: string;
  embeddingDimension: number;
  metricType: MetricType;
  indexType: string;
}

/**
 * Discovery Engine - Main Service Class
 */
export class DiscoveryEngine {
  private client: MilvusClient | null = null;
  private isConnected: boolean = false;
  
  private readonly config: DiscoveryEngineConfig = {
    collectionName: "soko_discovery",
    embeddingDimension: 768, // SigLIP-base-patch16-224 output dimension
    metricType: MetricType.COSINE, // Cosine similarity for L2-normalized vectors
    indexType: "AUTOINDEX", // Zilliz Auto-Indexing for maximum retrieval speed
  };

  /**
   * Connect to Zilliz Cloud instance
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      console.log("[Discovery Engine] Already connected to Zilliz Cloud");
      return;
    }

    try {
      const address = process.env.MILVUS_ADDRESS;
      const username = process.env.MILVUS_USERNAME;
      const password = process.env.MILVUS_PASSWORD;

      if (!address || !username || !password) {
        throw new Error(
          "Missing Zilliz credentials. Set MILVUS_ADDRESS, MILVUS_USERNAME, and MILVUS_PASSWORD"
        );
      }

      // Parse Zilliz Cloud endpoint
      const url = new URL(address);
      const host = url.hostname;
      const port = parseInt(url.port || "19530");

      console.log(`[Discovery Engine] Connecting to Zilliz Cloud at ${host}:${port}...`);

      this.client = new MilvusClient({
        address: host,
        port,
        username,
        password,
        ssl: true,
        channelOptions: {
          "grpc.max_receive_message_length": -1,
          "grpc.max_send_message_length": -1,
        },
      });

      // Verify connection with health check
      const healthCheck = await this.client.checkHealth();
      if (!healthCheck.isHealthy) {
        throw new Error("Zilliz Cloud health check failed");
      }

      this.isConnected = true;
      console.log("✅ [Discovery Engine] Connected to Zilliz Cloud");
    } catch (error) {
      console.error("❌ [Discovery Engine] Failed to connect to Zilliz:", error);
      throw error;
    }
  }

  /**
   * Create the soko_discovery collection with proper schema
   * 
   * Schema:
   * - product_id: int64 (primary key) - Product identifier from MySQL
   * - embedding: float_vector(768) - SigLIP-768 embedding with L2 normalization
   * - vendor_id: int64 - Seller/Vendor identifier
   * - price: float - Product price in KES
   * - category_id: int32 - Product category
   * - stock: int32 - Available stock quantity
   * - created_at: int64 - Unix timestamp
   */
  async createCollection(): Promise<void> {
    if (!this.client) await this.connect();

    try {
      // Check if collection already exists
      const collections = await this.client!.listCollections();
      const exists = collections.data.some(
        (c) => c.name === this.config.collectionName
      );

      if (exists) {
        console.log(
          `✅ [Discovery Engine] Collection '${this.config.collectionName}' already exists`
        );
        return;
      }

      console.log(
        `[Discovery Engine] Creating collection '${this.config.collectionName}'...`
      );

      // Create collection with schema
      await this.client!.createCollection({
        collection_name: this.config.collectionName,
        fields: [
          {
            name: "product_id",
            description: "Product identifier (primary key)",
            data_type: DataType.Int64,
            is_primary_key: true,
            autoID: false,
          },
          {
            name: "embedding",
            description: "768-dimensional SigLIP embedding (L2-normalized)",
            data_type: DataType.FloatVector,
            type_params: {
              dim: this.config.embeddingDimension.toString(),
            },
          },
          {
            name: "vendor_id",
            description: "Vendor/Seller identifier",
            data_type: DataType.Int64,
          },
          {
            name: "price",
            description: "Product price in KES",
            data_type: DataType.Float,
          },
          {
            name: "category_id",
            description: "Product category identifier",
            data_type: DataType.Int32,
          },
          {
            name: "stock",
            description: "Available stock quantity",
            data_type: DataType.Int32,
          },
          {
            name: "created_at",
            description: "Unix timestamp of product creation",
            data_type: DataType.Int64,
          },
        ],
        enable_dynamic_field: false,
      });

      console.log(
        `[Discovery Engine] Creating AUTOINDEX on embedding field for maximum retrieval speed...`
      );

      // Create AUTOINDEX for optimal performance
      // Zilliz will automatically select the best index algorithm
      await this.client!.createIndex({
        collection_name: this.config.collectionName,
        field_name: "embedding",
        index_name: "embedding_autoindex",
        index_type: this.config.indexType,
        metric_type: this.config.metricType,
      });

      // Load collection into memory for fast queries
      await this.client!.loadCollectionSync({
        collection_name: this.config.collectionName,
      });

      console.log(
        `✅ [Discovery Engine] Collection '${this.config.collectionName}' created with AUTOINDEX`
      );
      console.log(
        `   - Dimension: ${this.config.embeddingDimension}`
      );
      console.log(
        `   - Metric: ${this.config.metricType} (optimized for L2-normalized vectors)`
      );
      console.log(
        `   - Index: ${this.config.indexType} (maximum retrieval speed)`
      );
    } catch (error) {
      console.error("❌ [Discovery Engine] Failed to create collection:", error);
      throw error;
    }
  }

  /**
   * Insert a single product vector into the collection
   * 
   * @param record - Vector record with product metadata
   */
  async insertVector(record: VectorRecord): Promise<void> {
    if (!this.client) await this.connect();

    try {
      // Ensure collection exists
      await this.createCollection();

      console.log(
        `[Discovery Engine] Inserting vector for product ${record.productId}...`
      );

      const data = [
        {
          field_name: "product_id",
          type: DataType.Int64,
          data: [record.productId],
        },
        {
          field_name: "embedding",
          type: DataType.FloatVector,
          data: [record.embedding],
        },
        {
          field_name: "vendor_id",
          type: DataType.Int64,
          data: [record.vendorId],
        },
        {
          field_name: "price",
          type: DataType.Float,
          data: [record.price],
        },
        {
          field_name: "category_id",
          type: DataType.Int32,
          data: [record.categoryId || 0],
        },
        {
          field_name: "stock",
          type: DataType.Int32,
          data: [record.stock || 0],
        },
        {
          field_name: "created_at",
          type: DataType.Int64,
          data: [record.createdAt],
        },
      ];

      await this.client!.insert({
        collection_name: this.config.collectionName,
        fields_data: data,
      });

      console.log(
        `✅ [Discovery Engine] Vector inserted for product ${record.productId}`
      );
    } catch (error) {
      console.error(
        `❌ [Discovery Engine] Failed to insert vector for product ${record.productId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Batch insert multiple product vectors
   * 
   * @param records - Array of vector records
   */
  async insertVectorsBatch(records: VectorRecord[]): Promise<void> {
    if (!this.client) await this.connect();
    if (records.length === 0) return;

    try {
      await this.createCollection();

      console.log(
        `[Discovery Engine] Batch inserting ${records.length} vectors...`
      );

      const data = [
        {
          field_name: "product_id",
          type: DataType.Int64,
          data: records.map((r) => r.productId),
        },
        {
          field_name: "embedding",
          type: DataType.FloatVector,
          data: records.map((r) => r.embedding),
        },
        {
          field_name: "vendor_id",
          type: DataType.Int64,
          data: records.map((r) => r.vendorId),
        },
        {
          field_name: "price",
          type: DataType.Float,
          data: records.map((r) => r.price),
        },
        {
          field_name: "category_id",
          type: DataType.Int32,
          data: records.map((r) => r.categoryId || 0),
        },
        {
          field_name: "stock",
          type: DataType.Int32,
          data: records.map((r) => r.stock || 0),
        },
        {
          field_name: "created_at",
          type: DataType.Int64,
          data: records.map((r) => r.createdAt),
        },
      ];

      const result = await this.client!.insert({
        collection_name: this.config.collectionName,
        fields_data: data,
      });

      console.log(
        `✅ [Discovery Engine] Batch inserted ${result.insert_cnt} vectors`
      );
    } catch (error) {
      console.error("❌ [Discovery Engine] Failed to batch insert vectors:", error);
      throw error;
    }
  }

  /**
   * Get related items using ANN search
   * 
   * Performs Approximate Nearest Neighbor search using cosine similarity.
   * Since embeddings are L2-normalized, cosine similarity is equivalent to dot product:
   * 
   * Similarity(A, B) = A · B = Σ(a_i * b_i)
   * 
   * @param vector - Query embedding vector (768 dimensions, L2-normalized)
   * @param limit - Number of results to return (default: 10)
   * @param filters - Optional filters for vendor, category, price range
   * @returns Array of search results with similarity scores
   */
  async getRelatedItems(
    vector: number[],
    limit: number = 10,
    filters?: {
      vendorId?: number;
      categoryId?: number;
      minPrice?: number;
      maxPrice?: number;
    }
  ): Promise<SearchResult[]> {
    if (!this.client) await this.connect();

    try {
      // Validate vector dimension
      if (vector.length !== this.config.embeddingDimension) {
        throw new Error(
          `Invalid embedding dimension. Expected ${this.config.embeddingDimension}, got ${vector.length}`
        );
      }

      // Build filter expression
      let filterExpr = "";
      if (filters) {
        const conditions: string[] = [];
        
        if (filters.vendorId !== undefined) {
          conditions.push(`vendor_id == ${filters.vendorId}`);
        }
        
        if (filters.categoryId !== undefined) {
          conditions.push(`category_id == ${filters.categoryId}`);
        }
        
        if (filters.minPrice !== undefined) {
          conditions.push(`price >= ${filters.minPrice}`);
        }
        
        if (filters.maxPrice !== undefined) {
          conditions.push(`price <= ${filters.maxPrice}`);
        }
        
        filterExpr = conditions.join(" && ");
      }

      console.log(
        `[Discovery Engine] Searching for ${limit} related items${filterExpr ? " with filters" : ""}...`
      );

      // Perform ANN search with cosine similarity
      const results = await this.client!.search({
        collection_name: this.config.collectionName,
        vectors: [vector],
        search_params: {
          anns_field: "embedding",
          topk: limit.toString(),
          metric_type: this.config.metricType,
          params: {
            // AUTOINDEX automatically optimizes search parameters
            level: 1, // Search level (1 = balanced, 2 = high recall, 3 = highest recall)
          },
        },
        filter: filterExpr || undefined,
        output_fields: ["product_id", "vendor_id", "price"],
      });

      if (!results.results || results.results.length === 0) {
        console.log("[Discovery Engine] No results found");
        return [];
      }

      // Transform results
      const searchResults: SearchResult[] = results.results[0].map((result: any) => ({
        productId: result.product_id,
        similarity: result.score, // Cosine similarity score (0 to 1)
        distance: 1 - result.score, // Convert to distance metric
      }));

      console.log(
        `✅ [Discovery Engine] Found ${searchResults.length} related items`
      );
      
      // Log top result for debugging
      if (searchResults.length > 0) {
        console.log(
          `   Top result: Product ${searchResults[0].productId} (similarity: ${searchResults[0].similarity.toFixed(4)})`
        );
      }

      return searchResults;
    } catch (error) {
      console.error("❌ [Discovery Engine] Failed to search related items:", error);
      throw error;
    }
  }

  /**
   * Delete a product vector from the collection
   * 
   * @param productId - Product identifier to delete
   */
  async deleteVector(productId: number): Promise<void> {
    if (!this.client) await this.connect();

    try {
      console.log(`[Discovery Engine] Deleting vector for product ${productId}...`);

      await this.client!.delete({
        collection_name: this.config.collectionName,
        expr: `product_id == ${productId}`,
      });

      console.log(
        `✅ [Discovery Engine] Vector deleted for product ${productId}`
      );
    } catch (error) {
      console.error(
        `❌ [Discovery Engine] Failed to delete vector for product ${productId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getStats(): Promise<{
    name: string;
    rowCount: number;
    dimension: number;
    metricType: string;
  }> {
    if (!this.client) await this.connect();

    try {
      const stats = await this.client!.getCollectionStats({
        collection_name: this.config.collectionName,
      });

      return {
        name: this.config.collectionName,
        rowCount: parseInt(stats.row_count),
        dimension: this.config.embeddingDimension,
        metricType: this.config.metricType,
      };
    } catch (error) {
      console.error("❌ [Discovery Engine] Failed to get stats:", error);
      throw error;
    }
  }

  /**
   * Health check for the Discovery Engine
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) await this.connect();
      const health = await this.client!.checkHealth();
      return health.isHealthy;
    } catch (error) {
      console.error("❌ [Discovery Engine] Health check failed:", error);
      return false;
    }
  }

  /**
   * Disconnect from Zilliz Cloud
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.closeConnection();
      this.isConnected = false;
      console.log("✅ [Discovery Engine] Disconnected from Zilliz Cloud");
    }
  }
}

// Export singleton instance
export const discoveryEngine = new DiscoveryEngine();

/**
 * Harvester Integration (Agent 01)
 * 
 * This function is called when the Harvester pushes a new product image URL.
 * It orchestrates the embedding generation and vector storage.
 */
import { siglipPipeline } from "./siglip-pipeline.js";

export async function processHarvesterPush(
  productId: number,
  imageUrl: string,
  metadata: {
    vendorId: number;
    price: number;
    categoryId?: number;
    stock?: number;
  }
): Promise<void> {
  console.log(`[Discovery Engine] Processing Harvester push for product ${productId}...`);

  try {
    // 1. Generate SigLIP-768 embedding (Zero-Storage)
    const embedding = await siglipPipeline.generateImageEmbedding(imageUrl);

    // 2. Store in Zilliz Cloud
    await discoveryEngine.insertVector({
      productId,
      embedding,
      vendorId: metadata.vendorId,
      price: metadata.price,
      categoryId: metadata.categoryId,
      stock: metadata.stock,
      createdAt: Date.now(),
    });

    console.log(`✅ [Discovery Engine] Harvester push processed successfully for product ${productId}`);
  } catch (error) {
    console.error(`❌ [Discovery Engine] Failed to process Harvester push:`, error);
    throw error;
  }
}
