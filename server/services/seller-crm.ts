/**
 * Seller CRM Lead Capture System
 * 
 * Tracks all customer interactions with seller products:
 * - Product views
 * - Clicks to WhatsApp
 * - Wishlist additions
 * - Potential conversions
 * 
 * This data is aggregated and displayed in the Commercial Dashboard
 * so sellers can see exactly which customers are interested in their products.
 */

export interface Lead {
  leadId: string;
  sellerId: string;
  productId: number;
  customerId: string;
  customerPhone?: string;
  interactionType: "view" | "click" | "wishlist" | "whatsapp_start";
  timestamp: Date;
  metadata: {
    deviceType: string;
    location?: string;
    referralSource: string;
  };
}

export interface SellerLeads {
  sellerId: string;
  totalLeads: number;
  leadsLast24h: number;
  leadsLast7d: number;
  topProducts: Array<{
    productId: number;
    productName: string;
    leadCount: number;
    conversionRate: number;
  }>;
  recentLeads: Lead[];
}

/**
 * Seller CRM Manager
 */
export class SellerCRMManager {
  private leads: Map<string, Lead[]> = new Map(); // sellerId -> leads
  private leadHistory: Lead[] = [];

  /**
   * Record a new lead
   */
  recordLead(lead: Lead): void {
    if (!this.leads.has(lead.sellerId)) {
      this.leads.set(lead.sellerId, []);
    }

    this.leads.get(lead.sellerId)!.push(lead);
    this.leadHistory.push(lead);

    console.log(`[CRM] Recorded ${lead.interactionType} lead for seller ${lead.sellerId}, product ${lead.productId}`);
  }

  /**
   * Get all leads for a seller
   */
  getSellerLeads(sellerId: string, limit: number = 50): SellerLeads {
    const sellerLeads = this.leads.get(sellerId) || [];

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const leadsLast24h = sellerLeads.filter((l) => l.timestamp > last24h).length;
    const leadsLast7d = sellerLeads.filter((l) => l.timestamp > last7d).length;

    // Calculate top products
    const productMap = new Map<number, { name: string; count: number }>();
    for (const lead of sellerLeads) {
      if (!productMap.has(lead.productId)) {
        productMap.set(lead.productId, { name: `Product ${lead.productId}`, count: 0 });
      }
      productMap.get(lead.productId)!.count++;
    }

    const topProducts = Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        leadCount: data.count,
        conversionRate: 0.15, // Placeholder
      }))
      .sort((a, b) => b.leadCount - a.leadCount)
      .slice(0, 10);

    return {
      sellerId,
      totalLeads: sellerLeads.length,
      leadsLast24h,
      leadsLast7d,
      topProducts,
      recentLeads: sellerLeads.slice(-limit),
    };
  }

  /**
   * Get lead conversion funnel for a seller
   */
  getConversionFunnel(sellerId: string): {
    views: number;
    clicks: number;
    whatsappStarts: number;
    conversionRate: number;
  } {
    const sellerLeads = this.leads.get(sellerId) || [];

    const views = sellerLeads.filter((l) => l.interactionType === "view").length;
    const clicks = sellerLeads.filter((l) => l.interactionType === "click").length;
    const whatsappStarts = sellerLeads.filter((l) => l.interactionType === "whatsapp_start").length;

    return {
      views,
      clicks,
      whatsappStarts,
      conversionRate: views > 0 ? (whatsappStarts / views) * 100 : 0,
    };
  }

  /**
   * Export leads as CSV for seller
   */
  exportLeadsAsCSV(sellerId: string): string {
    const sellerLeads = this.leads.get(sellerId) || [];

    let csv = "Lead ID,Product ID,Customer ID,Interaction Type,Timestamp,Device Type,Referral Source\n";

    for (const lead of sellerLeads) {
      csv += `${lead.leadId},${lead.productId},${lead.customerId},${lead.interactionType},${lead.timestamp.toISOString()},${lead.metadata.deviceType},${lead.metadata.referralSource}\n`;
    }

    return csv;
  }

  /**
   * Get statistics about the CRM system
   */
  getStats(): {
    totalLeads: number;
    uniqueSellers: number;
    leadsLast24h: number;
    avgLeadsPerSeller: number;
  } {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let totalLeads = 0;
    let leadsLast24h = 0;

    for (const leads of this.leads.values()) {
      totalLeads += leads.length;
      leadsLast24h += leads.filter((l) => l.timestamp > last24h).length;
    }

    return {
      totalLeads,
      uniqueSellers: this.leads.size,
      leadsLast24h,
      avgLeadsPerSeller: this.leads.size > 0 ? totalLeads / this.leads.size : 0,
    };
  }
}

// Singleton instance
export const sellerCRM = new SellerCRMManager();
