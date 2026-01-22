/**
 * Recommendations API Router
 * 
 * Endpoints:
 * - GET /api/recommendations/personalized/:userId - Get personalized recommendations
 * - POST /api/recommendations/interaction - Record user interaction
 * - GET /api/recommendations/stats - Get recommendation engine stats
 */

import express, { Request, Response } from "express";
import { cfEngine } from "../services/collaborative-filtering";
import { searchSimilarProducts } from "../services/siglip-milvus";

const router = express.Router();

/**
 * GET /api/recommendations/personalized/:userId
 * 
 * Get personalized product recommendations for a user
 * 
 * Query params:
 * - limit: number (default: 10)
 * - includeVisualSimilarity: boolean (default: true)
 */
router.get("/personalized/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const includeVisualSimilarity = req.query.includeVisualSimilarity !== "false";

    console.log(`[Recommendations] Getting recommendations for user: ${userId}`);

    // Get visual similarities (if enabled)
    let visualSimilarities = new Map<number, number>();
    if (includeVisualSimilarity) {
      // For now, we'll use a placeholder
      // In production, this would use the user's recent product vectors
      // to find visually similar products
      console.log("[Recommendations] Visual similarity lookup not yet implemented");
    }

    // Get collaborative filtering recommendations
    const recommendations = cfEngine.getRecommendations(userId, visualSimilarities, limit);

    if (recommendations.length === 0) {
      return res.json({
        userId,
        recommendations: [],
        message: "No recommendations available yet. Keep interacting with products!",
      });
    }

    res.json({
      userId,
      recommendations,
      count: recommendations.length,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("[Recommendations] Error:", error);
    res.status(500).json({ error: "Failed to get recommendations" });
  }
});

/**
 * POST /api/recommendations/interaction
 * 
 * Record a user interaction (view, click, purchase, wishlist)
 * 
 * Body:
 * {
 *   userId: string,
 *   productId: number,
 *   interactionType: "view" | "click" | "purchase" | "wishlist"
 * }
 */
router.post("/interaction", async (req: Request, res: Response) => {
  try {
    const { userId, productId, interactionType } = req.body;

    if (!userId || !productId || !interactionType) {
      return res.status(400).json({ error: "Missing required fields: userId, productId, interactionType" });
    }

    const validTypes = ["view", "click", "purchase", "wishlist"];
    if (!validTypes.includes(interactionType)) {
      return res.status(400).json({ error: `Invalid interactionType. Must be one of: ${validTypes.join(", ")}` });
    }

    // Weight mapping
    const weightMap: Record<string, number> = {
      view: 1,
      click: 2,
      purchase: 3,
      wishlist: 2.5,
    };

    const interaction = {
      userId,
      productId,
      interactionType: interactionType as "view" | "click" | "purchase" | "wishlist",
      timestamp: new Date(),
      weight: weightMap[interactionType],
    };

    cfEngine.recordInteraction(interaction);

    console.log(`[Recommendations] Recorded ${interactionType} for user ${userId} on product ${productId}`);

    res.json({
      success: true,
      message: `Interaction recorded: ${interactionType}`,
      interaction,
    });
  } catch (error) {
    console.error("[Recommendations] Error recording interaction:", error);
    res.status(500).json({ error: "Failed to record interaction" });
  }
});

/**
 * GET /api/recommendations/stats
 * 
 * Get statistics about the recommendation engine
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = cfEngine.getStats();

    res.json({
      engine: "Collaborative Filtering",
      stats,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("[Recommendations] Error getting stats:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

/**
 * POST /api/recommendations/train
 * 
 * Train the collaborative filtering model
 * (Usually called periodically by a background worker)
 */
router.post("/train", async (req: Request, res: Response) => {
  try {
    console.log("[Recommendations] Starting model training...");

    await cfEngine.trainModel();

    const stats = cfEngine.getStats();

    res.json({
      success: true,
      message: "Model training completed",
      stats,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("[Recommendations] Error training model:", error);
    res.status(500).json({ error: "Failed to train model" });
  }
});

/**
 * GET /api/recommendations/trending
 * 
 * Get trending products (most viewed/clicked in last 24 hours)
 */
router.get("/trending", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    // Placeholder implementation
    // In production, this would query a time-series database
    // to get products with the most interactions in the last 24 hours

    res.json({
      trending: [],
      period: "24h",
      limit,
      message: "Trending products not yet implemented",
    });
  } catch (error) {
    console.error("[Recommendations] Error getting trending:", error);
    res.status(500).json({ error: "Failed to get trending products" });
  }
});

export default router;
