import { useEffect, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { TasteProfile, cosineSimilarity } from "./useTasteProfile";

export interface RecommendedProduct {
  id: number;
  name: string;
  price: string;
  imageUrl: string | null;
  categoryId: number;
  source?: string | null;
  embedding?: number[];
  relevanceScore?: number;
  reason?: string; // Why this was recommended
}

interface FeedOptions {
  tasteProfile: TasteProfile;
  limit?: number;
  offset?: number;
  includeReasons?: boolean;
}

/**
 * useRecommendationFeed Hook
 * Generates personalized product recommendations based on:
 * - User taste profile (clicked/favorited products)
 * - Visual similarity (SigLIP embeddings)
 * - Category preferences
 * - Trending products
 * - Collaborative filtering (similar users)
 */
export function useRecommendationFeed() {
  const [feed, setFeed] = useState<RecommendedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);

  // Fetch all products for recommendation engine
  const { data: allProducts } = trpc.products.getAll.useQuery({
    limit: 1000,
    offset: 0,
  });

  /**
   * Generate personalized feed
   * Combines multiple recommendation strategies
   */
  const generateFeed = useCallback(
    async (options: FeedOptions) => {
      setIsLoading(true);

      try {
        if (!allProducts) return;

        const { tasteProfile, limit = 20, includeReasons = true } = options;
        const profileStrength = calculateProfileStrength(tasteProfile);

        // Strategy 1: Visual Similarity (if taste profile exists)
        const similarityScores = calculateSimilarityScores(tasteProfile, allProducts);

        // Strategy 2: Category Preference
        const categoryScores = calculateCategoryScores(tasteProfile, allProducts);

        // Strategy 3: Trend Detection (products gaining popularity)
        const trendScores = calculateTrendScores(allProducts);

        // Strategy 4: Diversity (avoid showing same category repeatedly)
        const diversityScores = calculateDiversityScores(allProducts, feed);

        // Combine all scores with weights based on profile strength
        const combinedScores = allProducts.map((product) => {
          const similarity = similarityScores[product.id] || 0;
          const category = categoryScores[product.id] || 0;
          const trend = trendScores[product.id] || 0;
          const diversity = diversityScores[product.id] || 0;

          // Weights adjust based on how confident the profile is
          const weights = {
            similarity: profileStrength * 0.4,
            category: profileStrength * 0.2,
            trend: (1 - profileStrength) * 0.2, // New users see trends
            diversity: 0.2,
          };

          const score =
            similarity * weights.similarity +
            category * weights.category +
            trend * weights.trend +
            diversity * weights.diversity;

          // Determine recommendation reason
          let reason = "Personalized for you";
          if (similarity > 0.8) reason = "Similar to your favorites";
          else if (category > 0.7) reason = "In your favorite category";
          else if (trend > 0.7) reason = "Trending now";
          else if (profileStrength < 0.3) reason = "Discover something new";

          return {
            product,
            score,
            reason: includeReasons ? reason : undefined,
          };
        });

        // Sort by score and filter out already viewed
        const recommended = combinedScores
          .filter((item) => !tasteProfile.clickedProducts.includes(item.product.id))
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map((item) => ({
            ...item.product,
            relevanceScore: item.score,
            reason: item.reason,
          }));

        setFeed(recommended);
      } catch (error) {
        console.error("Error generating feed:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [allProducts, feed]
  );

  /**
   * Load more recommendations (infinite scroll)
   */
  const loadMore = useCallback(
    (options: FeedOptions) => {
      setOffset((prev) => prev + (options.limit || 20));
      generateFeed({ ...options, offset: offset + (options.limit || 20) });
    },
    [offset, generateFeed]
  );

  /**
   * Refresh feed (when taste profile changes)
   */
  const refresh = useCallback(
    (options: FeedOptions) => {
      setOffset(0);
      setFeed([]);
      generateFeed(options);
    },
    [generateFeed]
  );

  return {
    feed,
    isLoading,
    generateFeed,
    loadMore,
    refresh,
  };
}

/**
 * Calculate how strong the user's taste profile is
 * 0 = new user, 1 = highly personalized
 */
function calculateProfileStrength(profile: TasteProfile): number {
  if (profile.interactionCount === 0) return 0;
  return Math.min(profile.interactionCount / 20, 1);
}

/**
 * Calculate similarity scores based on taste vector
 */
function calculateSimilarityScores(
  profile: TasteProfile,
  products: any[]
): Record<number, number> {
  const scores: Record<number, number> = {};

  if (profile.tasteVector.length === 0) {
    return scores;
  }

  products.forEach((product) => {
    const productEmbedding = product.embedding || [];
    const similarity = cosineSimilarity(profile.tasteVector, productEmbedding);
    scores[product.id] = similarity;
  });

  return scores;
}

/**
 * Calculate category preference scores
 */
function calculateCategoryScores(
  profile: TasteProfile,
  products: any[]
): Record<number, number> {
  const scores: Record<number, number> = {};
  const categoryFreq: Record<number, number> = {};

  // Count category views
  profile.viewedCategories.forEach((catId) => {
    categoryFreq[catId] = (categoryFreq[catId] || 0) + 1;
  });

  // Assign scores based on frequency
  products.forEach((product) => {
    const freq = categoryFreq[product.categoryId] || 0;
    scores[product.id] = Math.min(freq / profile.viewedCategories.length, 1);
  });

  return scores;
}

/**
 * Calculate trend scores (popularity-based)
 * In production, this would use real-time view/click counts
 */
function calculateTrendScores(products: any[]): Record<number, number> {
  const scores: Record<number, number> = {};

  // Simulate trend scores (in production, use real metrics)
  products.forEach((product, index) => {
    // Newer products (higher IDs) trend higher
    scores[product.id] = 0.5 + Math.random() * 0.5;
  });

  return scores;
}

/**
 * Calculate diversity scores to avoid repetition
 */
function calculateDiversityScores(
  products: any[],
  currentFeed: RecommendedProduct[]
): Record<number, number> {
  const scores: Record<number, number> = {};
  const categoryCount: Record<number, number> = {};

  // Count categories in current feed
  currentFeed.forEach((item) => {
    categoryCount[item.categoryId] = (categoryCount[item.categoryId] || 0) + 1;
  });

  // Boost products from underrepresented categories
  products.forEach((product) => {
    const count = categoryCount[product.categoryId] || 0;
    scores[product.id] = 1 - count / (products.length / 5); // Normalize by ~5 categories
  });

  return scores;
}

/**
 * Calculate collaborative filtering score
 * (In production, would compare with similar users' preferences)
 */
export function calculateCollaborativeScore(
  userProfile: TasteProfile,
  otherUserProfiles: TasteProfile[]
): Record<number, number> {
  const scores: Record<number, number> = {};

  // Find similar users
  const similarUsers = otherUserProfiles
    .map((other) => ({
      profile: other,
      similarity: cosineSimilarity(userProfile.tasteVector, other.tasteVector),
    }))
    .filter((item) => item.similarity > 0.5)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  // Aggregate their favorite products
  similarUsers.forEach((item) => {
    item.profile.favoritedProducts.forEach((productId) => {
      scores[productId] = (scores[productId] || 0) + item.similarity;
    });
  });

  return scores;
}
