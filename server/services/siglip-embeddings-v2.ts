/**
 * SigLIP Embeddings Service v2
 * 
 * Generates vector embeddings for products using SigLIP model
 * Enables semantic search and similarity matching
 * 
 * Note: In production, integrate with Hugging Face API or local model
 * For MVP, using deterministic embeddings based on product features
 */

export interface EmbeddingResult {
  imageEmbedding: number[];
  textEmbedding: number[];
  hybridEmbedding: number[];
}

export class SigLIPEmbeddings {
  private static readonly EMBEDDING_DIMENSION = 768;

  /**
   * Generate embeddings for a product
   */
  static async generateEmbeddings(
    productName: string,
    description: string,
    imageUrl: string
  ): Promise<EmbeddingResult> {
    console.log(`[SigLIP] Generating embeddings for: ${productName}`);

    try {
      // Generate text embedding from product name and description
      const textEmbedding = this.generateTextEmbedding(productName, description);

      // Generate image embedding (deterministic based on image features)
      const imageEmbedding = this.generateImageEmbedding(imageUrl);

      // Create hybrid embedding (60% image, 40% text)
      const hybridEmbedding = this.createHybridEmbedding(imageEmbedding, textEmbedding);

      console.log(`[SigLIP] Embeddings generated successfully`);

      return {
        imageEmbedding,
        textEmbedding,
        hybridEmbedding,
      };
    } catch (error) {
      console.error("[SigLIP] Error generating embeddings:", error);
      throw error;
    }
  }

  /**
   * Generate text embedding from product name and description
   * Uses deterministic hashing for consistency
   */
  private static generateTextEmbedding(productName: string, description: string): number[] {
    const text = `${productName} ${description}`.toLowerCase();

    // Extract features from text
    const features = {
      hasShoe: text.includes("shoe") ? 1 : 0,
      hasFurniture: text.includes("furniture") || text.includes("table") || text.includes("chair") ? 1 : 0,
      hasClothes: text.includes("shirt") || text.includes("pants") || text.includes("dress") ? 1 : 0,
      hasJewelry: text.includes("ring") || text.includes("necklace") || text.includes("bracelet") ? 1 : 0,
      hasElectronics: text.includes("phone") || text.includes("laptop") || text.includes("computer") ? 1 : 0,
      hasLeather: text.includes("leather") ? 1 : 0,
      hasWood: text.includes("wood") || text.includes("wooden") ? 1 : 0,
      hasMetal: text.includes("metal") || text.includes("steel") ? 1 : 0,
      hasCotton: text.includes("cotton") ? 1 : 0,
      hasVintage: text.includes("vintage") ? 1 : 0,
      hasHandmade: text.includes("handmade") || text.includes("artisan") ? 1 : 0,
      isPremium: text.includes("premium") || text.includes("luxury") ? 1 : 0,
      isAffordable: text.includes("affordable") || text.includes("budget") ? 1 : 0,
      hasColor: text.includes("black") || text.includes("white") || text.includes("red") || text.includes("blue") ? 1 : 0,
      hasSize: text.includes("small") || text.includes("medium") || text.includes("large") ? 1 : 0,
    };

    // Create embedding from features
    const embedding = new Array(this.EMBEDDING_DIMENSION).fill(0);

    // Map features to embedding dimensions
    let featureIndex = 0;
    for (const [key, value] of Object.entries(features)) {
      embedding[featureIndex % this.EMBEDDING_DIMENSION] += value * 0.5;
      featureIndex++;
    }

    // Add hash-based values for remaining dimensions
    const hash = this.hashString(text);
    for (let i = 0; i < this.EMBEDDING_DIMENSION; i++) {
      const hashValue = ((hash >> (i % 32)) & 1) ? 0.3 : -0.3;
      embedding[i] += hashValue;
    }

    // Normalize
    return this.normalizeEmbedding(embedding);
  }

  /**
   * Generate image embedding based on image URL features
   */
  private static generateImageEmbedding(imageUrl: string): number[] {
    const embedding = new Array(this.EMBEDDING_DIMENSION).fill(0);

    // Extract features from URL
    const urlLower = imageUrl.toLowerCase();
    const features = {
      hasShoe: urlLower.includes("shoe") ? 1 : 0,
      hasFurniture: urlLower.includes("furniture") || urlLower.includes("chair") || urlLower.includes("table") ? 1 : 0,
      hasClothes: urlLower.includes("clothes") || urlLower.includes("shirt") || urlLower.includes("dress") ? 1 : 0,
      hasProduct: urlLower.includes("product") ? 1 : 0,
      isUnsplash: urlLower.includes("unsplash") ? 1 : 0,
      isHighRes: urlLower.includes("w=500") || urlLower.includes("w=1000") ? 1 : 0,
    };

    // Map features to embedding
    let featureIndex = 0;
    for (const [key, value] of Object.entries(features)) {
      embedding[featureIndex % this.EMBEDDING_DIMENSION] += value * 0.6;
      featureIndex++;
    }

    // Add URL hash
    const urlHash = this.hashString(imageUrl);
    for (let i = 0; i < this.EMBEDDING_DIMENSION; i++) {
      const hashValue = ((urlHash >> (i % 32)) & 1) ? 0.4 : -0.4;
      embedding[i] += hashValue;
    }

    return this.normalizeEmbedding(embedding);
  }

  /**
   * Create hybrid embedding (weighted combination of image and text)
   */
  private static createHybridEmbedding(imageEmbedding: number[], textEmbedding: number[]): number[] {
    const hybrid = new Array(this.EMBEDDING_DIMENSION);

    // 60% image, 40% text
    for (let i = 0; i < this.EMBEDDING_DIMENSION; i++) {
      hybrid[i] = imageEmbedding[i] * 0.6 + textEmbedding[i] * 0.4;
    }

    return this.normalizeEmbedding(hybrid);
  }

  /**
   * Normalize embedding to unit vector
   */
  private static normalizeEmbedding(embedding: number[]): number[] {
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));

    if (magnitude === 0) {
      return embedding.map(() => 1 / Math.sqrt(this.EMBEDDING_DIMENSION));
    }

    return embedding.map((val) => val / magnitude);
  }

  /**
   * Simple hash function for string
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  static cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Find similar products based on embeddings
   */
  static findSimilarProducts(
    queryEmbedding: number[],
    productEmbeddings: Array<{ productId: number; embedding: number[] }>,
    limit: number = 10
  ): Array<{ productId: number; similarity: number }> {
    const similarities = productEmbeddings.map((product) => ({
      productId: product.productId,
      similarity: this.cosineSimilarity(queryEmbedding, product.embedding),
    }));

    // Sort by similarity descending
    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, limit);
  }
}
