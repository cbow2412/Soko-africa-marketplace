/**
 * Analytics API Routes - Commercial Dashboard Backend
 * 
 * Endpoints for seller analytics, metrics computation, and real-time tracking
 */

import express from "express";
import { AnalyticsEngine, ClickEvent, ConversionEvent, SellerMetrics } from "../services/analytics-engine";

const router = express.Router();

// Mock data storage for demonstration
const clickEvents: ClickEvent[] = [];
const conversionEvents: ConversionEvent[] = [];

/**
 * POST /api/analytics/click
 * Track a click event
 */
router.post("/click", (req: any, res: any) => {
  try {
    const { productId, sellerId, userId, source, sessionId, deviceType, userAgent } = req.body;

    if (!productId || !sellerId || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const clickEvent: ClickEvent = {
      id: `click_${Date.now()}_${Math.random()}`,
      productId,
      sellerId,
      userId,
      timestamp: new Date(),
      source: source || "homepage",
      sessionId: sessionId || `session_${userId}_${Date.now()}`,
      deviceType: deviceType || "mobile",
      userAgent: userAgent || "unknown",
    };

    clickEvents.push(clickEvent);

    console.log(`[Analytics] Tracked click: ${productId} from ${source}`);
    res.json({ success: true, eventId: clickEvent.id });
  } catch (error) {
    console.error("[Analytics] Error tracking click:", error);
    res.status(500).json({ error: "Failed to track click" });
  }
});

/**
 * POST /api/analytics/conversion
 * Track a conversion event
 */
router.post("/conversion", (req: any, res: any) => {
  try {
    const { productId, sellerId, userId, amount, currency, conversionType } = req.body;

    if (!productId || !sellerId || !userId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const conversionEvent: ConversionEvent = {
      id: `conv_${Date.now()}_${Math.random()}`,
      productId,
      sellerId,
      userId,
      timestamp: new Date(),
      amount,
      currency: currency || "KES",
      conversionType: conversionType || "whatsapp_click",
    };

    conversionEvents.push(conversionEvent);

    console.log(`[Analytics] Tracked conversion: ${productId} for KES ${amount}`);
    res.json({ success: true, eventId: conversionEvent.id });
  } catch (error) {
    console.error("[Analytics] Error tracking conversion:", error);
    res.status(500).json({ error: "Failed to track conversion" });
  }
});

/**
 * GET /api/analytics/seller/:sellerId
 * Get seller metrics for a given time window
 */
router.get("/seller/:sellerId", async (req: any, res: any) => {
  try {
    const { sellerId } = req.params;
    const { timeWindow = "week" } = req.query as { timeWindow?: "day" | "week" | "month" };

    // Filter events for this seller
    const sellerClicks = clickEvents.filter((e) => e.sellerId === sellerId);
    const sellerConversions = conversionEvents.filter((e) => e.sellerId === sellerId);

    if (sellerClicks.length === 0 && sellerConversions.length === 0) {
      return res.json({
        sellerId,
        totalClicks: 0,
        totalConversions: 0,
        conversionRate: 0,
        averageOrderValue: 0,
        ctr: 0,
        impressions: 0,
        revenue: 0,
        topProducts: [],
        trafficSources: {},
        deviceBreakdown: {},
        timeSeriesData: [],
        anomalyScore: 0,
      });
    }

    // Compute metrics
    const metrics = await AnalyticsEngine.computeSellerMetrics(sellerId, sellerClicks, sellerConversions, timeWindow);

    console.log(`[Analytics] Computed metrics for seller ${sellerId}`);
    res.json(metrics);
  } catch (error) {
    console.error("[Analytics] Error computing seller metrics:", error);
    res.status(500).json({ error: "Failed to compute metrics" });
  }
});

/**
 * GET /api/analytics/product/:productId
 * Get product-level metrics
 */
router.get("/product/:productId", async (req: any, res: any) => {
  try {
    const { productId } = req.params;

    // Filter events for this product
    const productClicks = clickEvents.filter((e) => e.productId === productId);
    const productConversions = conversionEvents.filter((e) => e.productId === productId);

    // Mock embedding
    const mockEmbedding = new Array(768).fill(0).map(() => Math.random() * 2 - 1);

    // Compute metrics
    const metrics = await AnalyticsEngine.computeProductMetrics(productId, productClicks, productConversions, mockEmbedding);

    console.log(`[Analytics] Computed metrics for product ${productId}`);
    res.json(metrics);
  } catch (error) {
    console.error("[Analytics] Error computing product metrics:", error);
    res.status(500).json({ error: "Failed to compute metrics" });
  }
});

/**
 * GET /api/analytics/seller/:sellerId/forecast
 * Get revenue forecast for next N days
 */
router.get("/seller/:sellerId/forecast", async (req: any, res: any) => {
  try {
    const { sellerId } = req.params;
    const { daysAhead = 7 } = req.query;

    // Filter events for this seller
    const sellerClicks = clickEvents.filter((e) => e.sellerId === sellerId);
    const sellerConversions = conversionEvents.filter((e) => e.sellerId === sellerId);

    // Compute historical metrics
    const metrics = await AnalyticsEngine.computeSellerMetrics(sellerId, sellerClicks, sellerConversions, "week");

    // Generate forecast
    const forecast = AnalyticsEngine.predictFutureMetrics(metrics.timeSeriesData, parseInt(daysAhead as string) || 7);

    console.log(`[Analytics] Generated forecast for seller ${sellerId}`);
    res.json({ forecast });
  } catch (error) {
    console.error("[Analytics] Error generating forecast:", error);
    res.status(500).json({ error: "Failed to generate forecast" });
  }
});

/**
 * GET /api/analytics/seller/:sellerId/cohorts
 * Get cohort analysis for seller
 */
router.get("/seller/:sellerId/cohorts", async (req: any, res: any) => {
  try {
    const { sellerId } = req.params;

    // Filter events for this seller
    const sellerClicks = clickEvents.filter((e) => e.sellerId === sellerId);
    const sellerConversions = conversionEvents.filter((e) => e.sellerId === sellerId);

    // Compute metrics (includes cohort analysis)
    const metrics = await AnalyticsEngine.computeSellerMetrics(sellerId, sellerClicks, sellerConversions, "month");

    // Convert cohort map to array for JSON serialization
    const cohortsArray = Array.from(metrics.cohortAnalysis.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    console.log(`[Analytics] Retrieved cohort analysis for seller ${sellerId}`);
    res.json({ cohorts: cohortsArray });
  } catch (error) {
    console.error("[Analytics] Error retrieving cohort analysis:", error);
    res.status(500).json({ error: "Failed to retrieve cohort analysis" });
  }
});

/**
 * GET /api/analytics/health
 * Health check endpoint
 */
router.get("/health", (req: any, res: any) => {
  res.json({
    status: "healthy",
    totalClicksTracked: clickEvents.length,
    totalConversionsTracked: conversionEvents.length,
    timestamp: new Date(),
  });
});

/**
 * POST /api/analytics/reset
 * Reset analytics data (for testing)
 */
router.post("/reset", (req: any, res: any) => {
  clickEvents.length = 0;
  conversionEvents.length = 0;
  console.log("[Analytics] Reset all analytics data");
  res.json({ success: true, message: "Analytics data reset" });
});

export default router;
