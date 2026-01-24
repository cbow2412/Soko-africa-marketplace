import { MilvusClient, DataType, MetricType } from "@milvus-io/milvus2-sdk-node";

/**
 * Milvus Vector Database Client - Production Integration
 * 
 * Integrates with Zilliz Cloud (managed Milvus) for:
 * - High-performance semantic search using SigLIP embeddings
 * - Visual similarity matching across 768-dimensional vectors
 * - Scalable product discovery and recommendations
 * 
 * Collection Schema:
 * - product_id: int64 (primary key)
 * - hybrid_embedding: float_vector (768 dimensions)
 * - seller_id: int64
 * - category_id: int32
 * - price: float
 * - stock: int32
 * - created_at: int64 (timestamp)
 */

interface SearchResult {
  productId: number;
  similarity: number;
  distance: number;
}

interface ProductVector {
  productId: number;
  embedding: number[];
  sellerId: number;
  categoryId: number;
  price: number;
  stock: number;
  createdAt: number;
}

class MilvusClientProduction {
  private client: MilvusClient | null = null;
  private collectionName = "products_embeddings";
  private isConnected = false;

  /**
   * Initialize Milvus client connection
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      const address = process.env.MILVUS_ADDRESS;
      const username = process.env.MILVUS_USERNAME;
      const password = process.env.MILVUS_PASSWORD;

      if (!address || !username || !password) {
        throw new Error("Missing Milvus credentials in environment variables");
      }

      // Parse Zilliz Cloud endpoint
      const url = new URL(address);
      const host = url.hostname;
      const port = parseInt(url.port || "19530");

      console.log(`[Milvus] Connecting to ${host}:${port}...`);

      this.client = new MilvusClient({
        address: host,
        port,
        username,
        password,
        ssl: true,
        channelOptions: {
          "grpc.max_receive_message_length": -1,
        },
      });

      // Test connection
      const healthCheck = await this.client.checkHealth();
      if (!healthCheck.isHealthy) {
        throw new Error("Milvus health check failed");
      }

      console.log("✅ Connected to Milvus (Zilliz Cloud)");
      this.isConnected = true;
    } catch (error) {
      console.error("❌ Failed to connect to Milvus:", error);
      throw error;
    }
  }

  /**
   * Create or verify collection schema
   */
  async ensureCollection(): Promise<void> {
    if (!this.client) await this.connect();

    try {
      // Check if collection exists
      const collections = await this.client!.listCollections();
      const exists = collections.data.some(c => c.name === this.collectionName);

      if (exists) {
        console.log(`✅ Collection '${this.collectionName}' already exists`);
        return;
      }

      console.log(`[Milvus] Creating collection '${this.collectionName}'...`);

      // Create collection with schema
      await this.client!.createCollection({
        collection_name: this.collectionName,
        fields: [
          {
            name: "product_id",
            description: "Product identifier",
            data_type: DataType.Int64,
            is_primary_key: true,
            autoID: false,
          },
          {
            name: "hybrid_embedding",
            description: "768-dimensional SigLIP hybrid embedding (0.6 image + 0.4 text)",
            data_type: DataType.FloatVector,
            type_params: {
              dim: "768",
            },
          },
          {
            name: "seller_id",
            description: "Seller identifier",
            data_type: DataType.Int64,
          },
          {
            name: "category_id",
            description: "Product category",
            data_type: DataType.Int32,
          },
          {
            name: "price",
            description: "Product price in KES",
            data_type: DataType.Float,
          },
          {
            name: "stock",
            description: "Available stock quantity",
            data_type: DataType.Int32,
          },
          {
            name: "created_at",
            description: "Timestamp when product was created",
            data_type: DataType.Int64,
          },
        ],
      });

      // Create index on embedding vector
      console.log("[Milvus] Creating index on embeddings...");
      await this.client!.createIndex({
        collection_name: this.collectionName,
        field_name: "hybrid_embedding",
        index_name: "embedding_index",
        index_type: "HNSW",
        metric_type: MetricType.COSINE,
        params: {
          M: 8,
          efConstruction: 200,
        },
      });

      // Load collection into memory
      await this.client!.loadCollectionSync({
        collection_name: this.collectionName,
      });

      console.log(`✅ Collection '${this.collectionName}' created and loaded`);
    } catch (error) {
      console.error("❌ Failed to ensure collection:", error);
      throw error;
    }
  }

  /**
   * Insert product vectors into Milvus
   */
  async insertProducts(products: ProductVector[]): Promise<void> {
    if (!this.client) await this.connect();
    await this.ensureCollection();

    try {
      console.log(`[Milvus] Inserting ${products.length} product vectors...`);

      const data = [
        {
          field_name: "product_id",
          type: DataType.Int64,
          data: products.map(p => p.productId),
        },
        {
          field_name: "hybrid_embedding",
          type: DataType.FloatVector,
          data: products.map(p => p.embedding),
        },
        {
          field_name: "seller_id",
          type: DataType.Int64,
          data: products.map(p => p.sellerId),
        },
        {
          field_name: "category_id",
          type: DataType.Int32,
          data: products.map(p => p.categoryId),
        },
        {
          field_name: "price",
          type: DataType.Float,
          data: products.map(p => p.price),
        },
        {
          field_name: "stock",
          type: DataType.Int32,
          data: products.map(p => p.stock),
        },
        {
          field_name: "created_at",
          type: DataType.Int64,
          data: products.map(p => p.createdAt),
        },
      ];

      const result = await this.client!.insert({
        collection_name: this.collectionName,
        fields_data: data,
      });

      console.log(`✅ Inserted ${result.insert_cnt} product vectors into Milvus`);
    } catch (error) {
      console.error("❌ Failed to insert products:", error);
      throw error;
    }
  }

  /**
   * Upsert (insert or update) a single product vector
   */
  async upsertProduct(product: ProductVector): Promise<void> {
    if (!this.client) await this.connect();
    await this.ensureCollection();

    try {
      // Delete existing product if it exists
      try {
        await this.client!.delete({
          collection_name: this.collectionName,
          expr: `product_id == ${product.productId}`,
        });
      } catch (e) {
        // Ignore if product doesn't exist
      }

      // Insert new product
      await this.insertProducts([product]);
    } catch (error) {
      console.error(`❌ Failed to upsert product ${product.productId}:`, error);
      throw error;
    }
  }

  /**
   * Search for similar products using vector similarity
   */
  async searchSimilarProducts(
    queryEmbedding: number[],
    limit: number = 10,
    filters?: { sellerId?: number; categoryId?: number; minPrice?: number; maxPrice?: number }
  ): Promise<SearchResult[]> {
    if (!this.client) await this.connect();
    await this.ensureCollection();

    try {
      // Build filter expression
      let filterExpr = "";
      if (filters) {
        const conditions = [];
        if (filters.sellerId !== undefined) {
          conditions.push(`seller_id == ${filters.sellerId}`);
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

      console.log(`[Milvus] Searching for similar products (limit: ${limit})...`);

      const results = await this.client!.search({
        collection_name: this.collectionName,
        vectors: [queryEmbedding],
        search_params: {
          anns_field: "hybrid_embedding",
          topk: limit.toString(),
          metric_type: MetricType.COSINE,
          params: {
            ef: 64,
          },
        },
        filter: filterExpr || undefined,
        output_fields: ["product_id"],
      });

      if (!results.results || results.results.length === 0) {
        return [];
      }

      // Transform results
      const searchResults: SearchResult[] = results.results[0].map((result: any) => ({
        productId: result.product_id,
        similarity: result.score,
        distance: 1 - result.score, // Convert similarity to distance
      }));

      console.log(`✅ Found ${searchResults.length} similar products`);
      return searchResults;
    } catch (error) {
      console.error("❌ Failed to search similar products:", error);
      throw error;
    }
  }

  /**
   * Search products by category with vector similarity
   */
  async searchByCategory(
    queryEmbedding: number[],
    categoryId: number,
    limit: number = 20
  ): Promise<SearchResult[]> {
    return this.searchSimilarProducts(queryEmbedding, limit, { categoryId });
  }

  /**
   * Search products by seller with vector similarity
   */
  async searchBySeller(
    queryEmbedding: number[],
    sellerId: number,
    limit: number = 20
  ): Promise<SearchResult[]> {
    return this.searchSimilarProducts(queryEmbedding, limit, { sellerId });
  }

  /**
   * Delete a product vector
   */
  async deleteProduct(productId: number): Promise<void> {
    if (!this.client) await this.connect();

    try {
      console.log(`[Milvus] Deleting product ${productId}...`);

      await this.client!.delete({
        collection_name: this.collectionName,
        expr: `product_id == ${productId}`,
      });

      console.log(`✅ Deleted product ${productId} from Milvus`);
    } catch (error) {
      console.error(`❌ Failed to delete product:`, error);
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(): Promise<any> {
    if (!this.client) await this.connect();

    try {
      const stats = await this.client!.getCollectionStats({
        collection_name: this.collectionName,
      });

      return {
        name: this.collectionName,
        rowCount: stats.row_count,
        createdAt: stats.created_timestamp,
      };
    } catch (error) {
      console.error("❌ Failed to get collection stats:", error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) await this.connect();
      const health = await this.client!.checkHealth();
      return health.isHealthy;
    } catch (error) {
      console.error("❌ Milvus health check failed:", error);
      return false;
    }
  }

  /**
   * Disconnect from Milvus
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.closeConnection();
      this.isConnected = false;
      console.log("✅ Disconnected from Milvus");
    }
  }
}

// Export singleton instance
export const milvusClient = new MilvusClientProduction();
