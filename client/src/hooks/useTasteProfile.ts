import { useEffect, useState, useCallback } from "react";

export interface TasteProfile {
  clickedProducts: number[];
  favoritedProducts: number[];
  viewedCategories: number[];
  tasteVector: number[];
  lastUpdated: number;
  interactionCount: number;
}

/**
 * useTasteProfile Hook
 * Tracks user interactions and builds a personalized taste vector
 * Stores profile in localStorage for persistence across sessions
 */
export function useTasteProfile() {
  const [profile, setProfile] = useState<TasteProfile>({
    clickedProducts: [],
    favoritedProducts: [],
    viewedCategories: [],
    tasteVector: [],
    lastUpdated: Date.now(),
    interactionCount: 0,
  });

  const STORAGE_KEY = "soko_taste_profile";
  const MAX_HISTORY = 50; // Keep last 50 interactions

  // Load profile from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem(STORAGE_KEY);
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
      } catch (e) {
        console.error("Failed to load taste profile:", e);
      }
    }
  }, []);

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  /**
   * Record a product click
   * Adds to interaction history and updates taste vector
   */
  const recordClick = useCallback((productId: number, embedding?: number[]) => {
    setProfile((prev) => {
      const newClicked = [productId, ...prev.clickedProducts].slice(0, MAX_HISTORY);
      const newVector = embedding ? blendVectors(prev.tasteVector, embedding) : prev.tasteVector;

      return {
        ...prev,
        clickedProducts: newClicked,
        tasteVector: newVector,
        interactionCount: prev.interactionCount + 1,
        lastUpdated: Date.now(),
      };
    });
  }, []);

  /**
   * Record a product favorite
   * Stronger signal than click
   */
  const recordFavorite = useCallback((productId: number, embedding?: number[]) => {
    setProfile((prev) => {
      const newFavorited = [productId, ...prev.favoritedProducts].slice(0, MAX_HISTORY);
      // Favorites have 2x weight in taste vector
      const weightedEmbedding = embedding ? embedding.map((v) => v * 2) : [];
      const newVector = weightedEmbedding.length > 0 ? blendVectors(prev.tasteVector, weightedEmbedding) : prev.tasteVector;

      return {
        ...prev,
        favoritedProducts: newFavorited,
        tasteVector: newVector,
        interactionCount: prev.interactionCount + 1,
        lastUpdated: Date.now(),
      };
    });
  }, []);

  /**
   * Record a category view
   * Tracks category preferences
   */
  const recordCategoryView = useCallback((categoryId: number) => {
    setProfile((prev) => {
      const newCategories = [categoryId, ...prev.viewedCategories].slice(0, MAX_HISTORY);

      return {
        ...prev,
        viewedCategories: newCategories,
        interactionCount: prev.interactionCount + 1,
        lastUpdated: Date.now(),
      };
    });
  }, []);

  /**
   * Get category preference score
   * Returns 0-1 indicating how much user likes a category
   */
  const getCategoryScore = useCallback((categoryId: number): number => {
    if (profile.viewedCategories.length === 0) return 0.5;

    const count = profile.viewedCategories.filter((c) => c === categoryId).length;
    return Math.min(count / profile.viewedCategories.length, 1);
  }, [profile.viewedCategories]);

  /**
   * Get taste profile strength
   * Returns 0-1 indicating how confident the profile is
   */
  const getProfileStrength = useCallback((): number => {
    if (profile.interactionCount === 0) return 0;
    return Math.min(profile.interactionCount / 20, 1); // Full confidence at 20 interactions
  }, [profile.interactionCount]);

  /**
   * Reset profile (for testing or user request)
   */
  const reset = useCallback(() => {
    const newProfile: TasteProfile = {
      clickedProducts: [],
      favoritedProducts: [],
      viewedCategories: [],
      tasteVector: [],
      lastUpdated: Date.now(),
      interactionCount: 0,
    };
    setProfile(newProfile);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    profile,
    recordClick,
    recordFavorite,
    recordCategoryView,
    getCategoryScore,
    getProfileStrength,
    reset,
  };
}

/**
 * Blend two vectors using exponential moving average
 * Newer interactions have more weight
 */
function blendVectors(existing: number[], new_: number[], alpha: number = 0.3): number[] {
  if (existing.length === 0) return new_;
  if (new_.length === 0) return existing;

  const maxLen = Math.max(existing.length, new_.length);
  const result: number[] = [];

  for (let i = 0; i < maxLen; i++) {
    const e = existing[i] || 0;
    const n = new_[i] || 0;
    result.push(e * (1 - alpha) + n * alpha);
  }

  return result;
}

/**
 * Calculate cosine similarity between two vectors
 * Used for matching user taste with product embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  const minLen = Math.min(a.length, b.length);
  for (let i = 0; i < minLen; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}
