import { getDb } from "../db";
import { sellers, catalogSyncLogs } from "../../drizzle/schema";
import { jobQueueService } from "./job-queue";
import { eq } from "drizzle-orm";

/**
 * Seller Onboarding Service
 * 
 * Handles seller registration, catalog validation, and sync initiation
 */

export interface SellerRegistrationData {
  userId: number;
  businessName: string;
  whatsappNumber: string;
  catalogUrl: string;
  category: string;
  city?: string;
  description?: string;
}

export interface OnboardingResult {
  success: boolean;
  sellerId?: number;
  syncJobId?: string;
  message: string;
  error?: string;
}

export class SellerOnboarding {
  /**
   * Validate catalog URL format
   */
  static validateCatalogUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Check if it's a WhatsApp Business catalog URL
      const isWhatsApp = 
        url.includes("whatsapp.com") ||
        url.includes("wa.me") ||
        url.includes("catalog");
      
      // Check if URL is HTTPS
      const isHttps = urlObj.protocol === "https:";
      
      return isWhatsApp && isHttps;
    } catch {
      return false;
    }
  }

  /**
   * Validate WhatsApp number format
   */
  static validateWhatsappNumber(number: string): boolean {
    // Remove all non-digit characters
    const cleaned = number.replace(/\D/g, "");
    
    // Check if it's a valid phone number (10-15 digits)
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  /**
   * Register new seller
   */
  static async registerSeller(
    data: SellerRegistrationData
  ): Promise<OnboardingResult> {
    try {
      console.log("[SellerOnboarding] Registering seller:", data.businessName);

      // Validate inputs
      if (!data.businessName || !data.businessName.trim()) {
        return {
          success: false,
          message: "Business name is required",
          error: "INVALID_BUSINESS_NAME",
        };
      }

      if (!this.validateWhatsappNumber(data.whatsappNumber)) {
        return {
          success: false,
          message: "Invalid WhatsApp number format",
          error: "INVALID_WHATSAPP_NUMBER",
        };
      }

      if (!this.validateCatalogUrl(data.catalogUrl)) {
        return {
          success: false,
          message: "Invalid WhatsApp Business catalog URL",
          error: "INVALID_CATALOG_URL",
        };
      }

      // Get database connection
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Check if seller already exists for this user
      const existingSeller = await db
        .select()
        .from(sellers)
        .where(eq(sellers.userId, data.userId))
        .limit(1);

      if (existingSeller.length > 0) {
        return {
          success: false,
          message: "Seller account already exists for this user",
          error: "SELLER_ALREADY_EXISTS",
        };
      }

      // Create seller record
      const cleanedPhone = data.whatsappNumber.replace(/\D/g, "");
      
      const insertResult = await db.insert(sellers).values({
        userId: data.userId,
        businessName: data.businessName.trim(),
        whatsappNumber: cleanedPhone,
        catalogUrl: data.catalogUrl,
        category: data.category || "General",
        city: data.city || null,
        description: data.description || null,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const sellerId = (insertResult as any).insertId;

      console.log("[SellerOnboarding] Seller created:", sellerId);

      // Log catalog sync initiation
      await db.insert(catalogSyncLogs).values({
        sellerId,
        catalogUrl: data.catalogUrl,
        status: "initiated",
        productsScraped: 0,
        productsApproved: 0,
        productsRejected: 0,
        startedAt: new Date(),
        completedAt: null,
        error: null,
      });

      // Queue catalog scraping job
      const jobId = await jobQueueService.addJob("sync-seller", {
        catalogUrl: data.catalogUrl,
        sellerId,
        businessName: data.businessName,
      });

      console.log("[SellerOnboarding] Catalog sync job queued:", jobId);

      return {
        success: true,
        sellerId,
        syncJobId: jobId,
        message: "Seller registered successfully. Catalog sync started.",
      };
    } catch (error) {
      console.error("[SellerOnboarding] Registration failed:", error);

      return {
        success: false,
        message: "Seller registration failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get seller by ID
   */
  static async getSeller(sellerId: number): Promise<any> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const seller = await db
        .select()
        .from(sellers)
        .where(eq(sellers.id, sellerId))
        .limit(1);

      return seller[0] || null;
    } catch (error) {
      console.error("[SellerOnboarding] Get seller failed:", error);
      throw error;
    }
  }

  /**
   * Get seller by user ID
   */
  static async getSellerByUserId(userId: number): Promise<any> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const seller = await db
        .select()
        .from(sellers)
        .where(eq(sellers.userId, userId))
        .limit(1);

      return seller[0] || null;
    } catch (error) {
      console.error("[SellerOnboarding] Get seller by user failed:", error);
      throw error;
    }
  }

  /**
   * Update seller status
   */
  static async updateSellerStatus(
    sellerId: number,
    status: "pending" | "verified" | "active" | "suspended"
  ): Promise<boolean> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(sellers)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(sellers.id, sellerId));

      console.log(`[SellerOnboarding] Seller ${sellerId} status updated to ${status}`);
      return true;
    } catch (error) {
      console.error("[SellerOnboarding] Update seller status failed:", error);
      throw error;
    }
  }

  /**
   * Get sync status for seller
   */
  static async getSyncStatus(sellerId: number): Promise<any> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const syncLog = await db
        .select()
        .from(catalogSyncLogs)
        .where(eq(catalogSyncLogs.sellerId, sellerId))
        .orderBy((t) => t.startedAt)
        .limit(1);

      return syncLog[0] || null;
    } catch (error) {
      console.error("[SellerOnboarding] Get sync status failed:", error);
      throw error;
    }
  }

  /**
   * Manually trigger catalog re-sync
   */
  static async triggerResync(sellerId: number): Promise<string> {
    try {
      const seller = await this.getSeller(sellerId);
      if (!seller) {
        throw new Error("Seller not found");
      }

      // Queue new sync job
      const jobId = await jobQueueService.addJob("sync-seller", {
        catalogUrl: seller.catalogUrl,
        sellerId,
        businessName: seller.businessName,
      });

      console.log("[SellerOnboarding] Resync triggered for seller:", sellerId);
      return jobId;
    } catch (error) {
      console.error("[SellerOnboarding] Trigger resync failed:", error);
      throw error;
    }
  }
}
