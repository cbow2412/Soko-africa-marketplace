/**
 * Collaborative Filtering Recommendation Engine
 * 
 * Implements a hybrid recommendation system that blends:
 * 1. Visual Similarity (from Milvus vectors)
 * 2. User Behavior (clicks, views, purchases)
 * 3. Collaborative Filtering (matrix factorization)
 * 
 * Algorithm: Weighted combination of content-based and collaborative filtering
 * - Content-based: SigLIP visual similarity (0.4 weight)
 * - Collaborative: User-product interaction matrix (0.6 weight)
 */

export interface UserInteraction {
  userId: string;
  productId: number;
  interactionType: "view" | "click" | "purchase" | "wishlist";
  timestamp: Date;
  weight: number; // 1 for view, 2 for click, 3 for purchase, 2.5 for wishlist
}

export interface UserProfile {
  userId: string;
  interactions: UserInteraction[];
  latentFactors: number[]; // User embedding (e.g., 50-dim)
}

export interface ProductProfile {
  productId: number;
  latentFactors: number[]; // Product embedding (e.g., 50-dim)
  visualVector: number[]; // From SigLIP (768-dim)
  category: string;
  price: number;
}

export interface RecommendationScore {
  productId: number;
  score: number;
  reasons: string[];
}

/**
 * Collaborative Filtering Engine
 * Uses matrix factorization to learn latent factors for users and products
 */
export class CollaborativeFilteringEngine {
  private userProfiles: Map<string, UserProfile> = new Map();
  private productProfiles: Map<number, ProductProfile> = new Map();
  private interactionMatrix: Map<string, Map<number, number>> = new Map();

  // Hyperparameters
  private readonly LATENT_DIM = 50; // Dimension of latent factors
  private readonly LEARNING_RATE = 0.01;
  private readonly REGULARIZATION = 0.01;
  private readonly EPOCHS = 10;

  /**
   * Record a user interaction
   */
  recordInteraction(interaction: UserInteraction): void {
    // Update interaction matrix
    if (!this.interactionMatrix.has(interaction.userId)) {
      this.interactionMatrix.set(interaction.userId, new Map());
    }

    const userInteractions = this.interactionMatrix.get(interaction.userId)!;
    const currentWeight = userInteractions.get(interaction.productId) || 0;
    userInteractions.set(interaction.productId, currentWeight + interaction.weight);

    // Update user profile
    if (!this.userProfiles.has(interaction.userId)) {
      this.userProfiles.set(interaction.userId, {
        userId: interaction.userId,
        interactions: [],
        latentFactors: this.initializeRandomVector(this.LATENT_DIM),
      });
    }

    const userProfile = this.userProfiles.get(interaction.userId)!;
    userProfile.interactions.push(interaction);
  }

  /**
   * Train the collaborative filtering model using SGD
   */
  async trainModel(): Promise<void> {
    console.log("[CF] Starting model training...");

    for (let epoch = 0; epoch < this.EPOCHS; epoch++) {
      let totalError = 0;
      let count = 0;

      // Iterate through all interactions
      for (const [userId, productInteractions] of this.interactionMatrix) {
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) continue;

        for (const [productId, rating] of productInteractions) {
          const productProfile = this.productProfiles.get(productId);
          if (!productProfile) continue;

          // Predict rating
          const prediction = this.predictRating(userProfile.latentFactors, productProfile.latentFactors);

          // Calculate error
          const error = rating - prediction;
          totalError += error * error;
          count++;

          // Update latent factors using gradient descent
          const gradient = -2 * error;

          // Update user factors
          for (let i = 0; i < this.LATENT_DIM; i++) {
            const userGradient =
              gradient * productProfile.latentFactors[i] + this.REGULARIZATION * userProfile.latentFactors[i];
            userProfile.latentFactors[i] -= this.LEARNING_RATE * userGradient;
          }

          // Update product factors
          for (let i = 0; i < this.LATENT_DIM; i++) {
            const productGradient =
              gradient * userProfile.latentFactors[i] + this.REGULARIZATION * productProfile.latentFactors[i];
            productProfile.latentFactors[i] -= this.LEARNING_RATE * productGradient;
          }
        }
      }

      const rmse = Math.sqrt(totalError / count);
      console.log(`[CF] Epoch ${epoch + 1}/${this.EPOCHS} - RMSE: ${rmse.toFixed(4)}`);
    }

    console.log("[CF] Model training complete");
  }

  /**
   * Get personalized recommendations for a user
   */
  getRecommendations(
    userId: string,
    visualSimilarities: Map<number, number>,
    topK: number = 10
  ): RecommendationScore[] {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      console.warn(`[CF] User ${userId} not found, returning empty recommendations`);
      return [];
    }

    const recommendations: RecommendationScore[] = [];
    const viewedProducts = new Set(
      this.interactionMatrix.get(userId)?.keys() || []
    );

    // Score all products
    for (const [productId, productProfile] of this.productProfiles) {
      // Skip already viewed products
      if (viewedProducts.has(productId)) continue;

      // Collaborative filtering score
      const cfScore = this.predictRating(userProfile.latentFactors, productProfile.latentFactors);

      // Visual similarity score (from Milvus)
      const visualScore = visualSimilarities.get(productId) || 0;

      // Hybrid score: 0.6 collaborative + 0.4 visual
      const hybridScore = 0.6 * cfScore + 0.4 * visualScore;

      recommendations.push({
        productId,
        score: hybridScore,
        reasons: this.generateReasons(cfScore, visualScore, productProfile),
      });
    }

    // Sort by score and return top K
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Register a product in the collaborative filtering system
   */
  registerProduct(productId: number, visualVector: number[], category: string, price: number): void {
    this.productProfiles.set(productId, {
      productId,
      latentFactors: this.initializeRandomVector(this.LATENT_DIM),
      visualVector,
      category,
      price,
    });
  }

  /**
   * Predict rating between user and product
   */
  private predictRating(userFactors: number[], productFactors: number[]): number {
    let score = 0;
    for (let i = 0; i < this.LATENT_DIM; i++) {
      score += userFactors[i] * productFactors[i];
    }
    // Normalize to 0-5 scale
    return Math.max(0, Math.min(5, score));
  }

  /**
   * Generate human-readable reasons for recommendations
   */
  private generateReasons(cfScore: number, visualScore: number, productProfile: ProductProfile): string[] {
    const reasons: string[] = [];

    if (cfScore > 3.5) {
      reasons.push("Popular with similar users");
    }

    if (visualScore > 0.7) {
      reasons.push("Visually similar to your interests");
    }

    reasons.push(`Category: ${productProfile.category}`);

    return reasons;
  }

  /**
   * Initialize random vector for latent factors
   */
  private initializeRandomVector(dim: number): number[] {
    const vector: number[] = [];
    for (let i = 0; i < dim; i++) {
      vector.push((Math.random() - 0.5) * 0.1); // Small random values
    }
    return vector;
  }

  /**
   * Get statistics about the model
   */
  getStats(): {
    userCount: number;
    productCount: number;
    interactionCount: number;
    avgInteractionsPerUser: number;
  } {
    let totalInteractions = 0;
    for (const interactions of this.interactionMatrix.values()) {
      totalInteractions += interactions.size;
    }

    return {
      userCount: this.userProfiles.size,
      productCount: this.productProfiles.size,
      interactionCount: totalInteractions,
      avgInteractionsPerUser: this.userProfiles.size > 0 ? totalInteractions / this.userProfiles.size : 0,
    };
  }
}

// Singleton instance
export const cfEngine = new CollaborativeFilteringEngine();
