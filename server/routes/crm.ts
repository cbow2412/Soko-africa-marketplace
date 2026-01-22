/**
 * Seller CRM API Router
 * 
 * Endpoints for sellers to manage and view their leads
 */

import express, { Request, Response } from "express";
import { sellerCRM } from "../services/seller-crm";
import { heartbeatSync } from "../workers/heartbeat-sync";

const router = express.Router();

/**
 * POST /api/crm/leads
 * 
 * Record a new lead
 * 
 * Body:
 * {
 *   sellerId: string,
 *   productId: number,
 *   customerId: string,
 *   interactionType: "view" | "click" | "wishlist" | "whatsapp_start",
 *   metadata: {
 *     deviceType: string,
 *     referralSource: string
 *   }
 * }
 */
router.post("/leads", async (req: Request, res: Response) => {
  try {
    const { sellerId, productId, customerId, interactionType, metadata } = req.body;

    if (!sellerId || !productId || !customerId || !interactionType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const lead = {
      leadId: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sellerId,
      productId,
      customerId,
      interactionType: interactionType as "view" | "click" | "wishlist" | "whatsapp_start",
      timestamp: new Date(),
      metadata: metadata || { deviceType: "unknown", referralSource: "direct" },
    };

    sellerCRM.recordLead(lead);

    res.json({
      success: true,
      leadId: lead.leadId,
      message: "Lead recorded successfully",
    });
  } catch (error) {
    console.error("[CRM] Error recording lead:", error);
    res.status(500).json({ error: "Failed to record lead" });
  }
});

/**
 * GET /api/crm/sellers/:sellerId/leads
 * 
 * Get all leads for a seller
 */
router.get("/sellers/:sellerId/leads", async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const leads = sellerCRM.getSellerLeads(sellerId, limit);

    res.json({
      sellerId,
      leads,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("[CRM] Error getting leads:", error);
    res.status(500).json({ error: "Failed to get leads" });
  }
});

/**
 * GET /api/crm/sellers/:sellerId/funnel
 * 
 * Get conversion funnel for a seller
 */
router.get("/sellers/:sellerId/funnel", async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;

    const funnel = sellerCRM.getConversionFunnel(sellerId);

    res.json({
      sellerId,
      funnel,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("[CRM] Error getting funnel:", error);
    res.status(500).json({ error: "Failed to get conversion funnel" });
  }
});

/**
 * GET /api/crm/sellers/:sellerId/export
 * 
 * Export leads as CSV
 */
router.get("/sellers/:sellerId/export", async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;

    const csv = sellerCRM.exportLeadsAsCSV(sellerId);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="leads_${sellerId}_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error("[CRM] Error exporting leads:", error);
    res.status(500).json({ error: "Failed to export leads" });
  }
});

/**
 * GET /api/crm/stats
 * 
 * Get CRM system statistics
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = sellerCRM.getStats();

    res.json({
      crm: stats,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("[CRM] Error getting stats:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

/**
 * GET /api/crm/heartbeat/status
 * 
 * Get Heartbeat Sync Worker status
 */
router.get("/heartbeat/status", async (req: Request, res: Response) => {
  try {
    const stats = heartbeatSync.getStats();
    const syncStatus = heartbeatSync.getSyncStatus();

    res.json({
      heartbeat: stats,
      sellers: syncStatus,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("[CRM] Error getting heartbeat status:", error);
    res.status(500).json({ error: "Failed to get heartbeat status" });
  }
});

/**
 * POST /api/crm/heartbeat/sync/:sellerId
 * 
 * Manually trigger a sync for a specific seller
 */
router.post("/heartbeat/sync/:sellerId", async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;

    const job = await heartbeatSync.syncSeller(sellerId);

    if (!job) {
      return res.status(404).json({ error: "Seller not found" });
    }

    res.json({
      success: true,
      job,
      message: "Sync completed",
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("[CRM] Error syncing seller:", error);
    res.status(500).json({ error: "Failed to sync seller" });
  }
});

export default router;
