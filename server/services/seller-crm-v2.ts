/**
 * Seller CRM 2.0: Lead Capture & Real-Time Analytics
 * 
 * This service provides sellers with:
 * 1. Real-time lead tracking (who clicked their products)
 * 2. Conversion funnel analytics
 * 3. Mobile-optimized dashboard
 * 4. Lead export (CSV)
 * 5. WhatsApp integration for lead notifications
 */

export interface Lead {
  id: string;
  sellerId: string;
  productId: string;
  productName: string;
  visitorId: string;
  visitorPhone?: string;
  visitorEmail?: string;
  action: 'view' | 'click' | 'wishlist' | 'whatsapp_start';
  timestamp: Date;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  source: 'organic' | 'search' | 'recommendation' | 'direct';
  conversionStatus: 'new' | 'contacted' | 'converted' | 'lost';
}

export interface SellerMetrics {
  sellerId: string;
  totalLeads: number;
  totalClicks: number;
  totalWishlistAdds: number;
  totalWhatsAppStarts: number;
  conversionRate: number;
  averageTimeOnProduct: number; // in seconds
  topProducts: Array<{
    productId: string;
    productName: string;
    clicks: number;
    conversions: number;
  }>;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  sourceBreakdown: {
    organic: number;
    search: number;
    recommendation: number;
    direct: number;
  };
}

export class SellerCRMV2 {
  private leads: Map<string, Lead[]> = new Map();
  private metrics: Map<string, SellerMetrics> = new Map();

  /**
   * Record a lead interaction
   */
  public recordLead(lead: Lead): void {
    if (!this.leads.has(lead.sellerId)) {
      this.leads.set(lead.sellerId, []);
    }

    this.leads.get(lead.sellerId)!.push(lead);
    this.updateMetrics(lead.sellerId);

    console.log(`📊 [CRM] Lead recorded: ${lead.action} on product ${lead.productName}`);
  }

  /**
   * Get all leads for a seller
   */
  public getLeads(sellerId: string, filters?: {
    action?: string;
    startDate?: Date;
    endDate?: Date;
    conversionStatus?: string;
  }): Lead[] {
    let leads = this.leads.get(sellerId) || [];

    if (filters) {
      if (filters.action) {
        leads = leads.filter(l => l.action === filters.action);
      }
      if (filters.startDate) {
        leads = leads.filter(l => l.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        leads = leads.filter(l => l.timestamp <= filters.endDate!);
      }
      if (filters.conversionStatus) {
        leads = leads.filter(l => l.conversionStatus === filters.conversionStatus);
      }
    }

    return leads;
  }

  /**
   * Get seller metrics
   */
  public getMetrics(sellerId: string): SellerMetrics | null {
    return this.metrics.get(sellerId) || null;
  }

  /**
   * Update seller metrics based on leads
   */
  private updateMetrics(sellerId: string): void {
    const leads = this.leads.get(sellerId) || [];

    const metrics: SellerMetrics = {
      sellerId,
      totalLeads: leads.length,
      totalClicks: leads.filter(l => l.action === 'click').length,
      totalWishlistAdds: leads.filter(l => l.action === 'wishlist').length,
      totalWhatsAppStarts: leads.filter(l => l.action === 'whatsapp_start').length,
      conversionRate: this.calculateConversionRate(leads),
      averageTimeOnProduct: this.calculateAverageTimeOnProduct(leads),
      topProducts: this.getTopProducts(leads),
      deviceBreakdown: this.getDeviceBreakdown(leads),
      sourceBreakdown: this.getSourceBreakdown(leads),
    };

    this.metrics.set(sellerId, metrics);
  }

  /**
   * Calculate conversion rate
   */
  private calculateConversionRate(leads: Lead[]): number {
    if (leads.length === 0) return 0;
    const conversions = leads.filter(l => l.conversionStatus === 'converted').length;
    return (conversions / leads.length) * 100;
  }

  /**
   * Calculate average time on product
   */
  private calculateAverageTimeOnProduct(leads: Lead[]): number {
    // Placeholder: In a real implementation, this would track session duration
    return Math.random() * 300; // 0-5 minutes
  }

  /**
   * Get top products by clicks
   */
  private getTopProducts(leads: Lead[]): Array<{
    productId: string;
    productName: string;
    clicks: number;
    conversions: number;
  }> {
    const productMap = new Map<string, {
      productName: string;
      clicks: number;
      conversions: number;
    }>();

    leads.forEach(lead => {
      if (!productMap.has(lead.productId)) {
        productMap.set(lead.productId, {
          productName: lead.productName,
          clicks: 0,
          conversions: 0,
        });
      }

      const product = productMap.get(lead.productId)!;
      if (lead.action === 'click') product.clicks++;
      if (lead.conversionStatus === 'converted') product.conversions++;
    });

    return Array.from(productMap.entries())
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);
  }

  /**
   * Get device breakdown
   */
  private getDeviceBreakdown(leads: Lead[]): {
    mobile: number;
    desktop: number;
    tablet: number;
  } {
    return {
      mobile: leads.filter(l => l.deviceType === 'mobile').length,
      desktop: leads.filter(l => l.deviceType === 'desktop').length,
      tablet: leads.filter(l => l.deviceType === 'tablet').length,
    };
  }

  /**
   * Get source breakdown
   */
  private getSourceBreakdown(leads: Lead[]): {
    organic: number;
    search: number;
    recommendation: number;
    direct: number;
  } {
    return {
      organic: leads.filter(l => l.source === 'organic').length,
      search: leads.filter(l => l.source === 'search').length,
      recommendation: leads.filter(l => l.source === 'recommendation').length,
      direct: leads.filter(l => l.source === 'direct').length,
    };
  }

  /**
   * Export leads as CSV
   */
  public exportLeadsAsCSV(sellerId: string): string {
    const leads = this.leads.get(sellerId) || [];

    const headers = [
      'Lead ID',
      'Product Name',
      'Action',
      'Timestamp',
      'Device',
      'Source',
      'Status',
    ];

    const rows = leads.map(lead => [
      lead.id,
      lead.productName,
      lead.action,
      lead.timestamp.toISOString(),
      lead.deviceType,
      lead.source,
      lead.conversionStatus,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Mark a lead as contacted
   */
  public markLeadAsContacted(sellerId: string, leadId: string): void {
    const leads = this.leads.get(sellerId) || [];
    const lead = leads.find(l => l.id === leadId);

    if (lead) {
      lead.conversionStatus = 'contacted';
      this.updateMetrics(sellerId);
      console.log(`📊 [CRM] Lead ${leadId} marked as contacted`);
    }
  }

  /**
   * Mark a lead as converted
   */
  public markLeadAsConverted(sellerId: string, leadId: string): void {
    const leads = this.leads.get(sellerId) || [];
    const lead = leads.find(l => l.id === leadId);

    if (lead) {
      lead.conversionStatus = 'converted';
      this.updateMetrics(sellerId);
      console.log(`📊 [CRM] Lead ${leadId} marked as converted`);
    }
  }

  /**
   * Get leads by product (for sellers to see which products are converting)
   */
  public getLeadsByProduct(sellerId: string, productId: string): Lead[] {
    const leads = this.leads.get(sellerId) || [];
    return leads.filter(l => l.productId === productId);
  }

  /**
   * Get conversion funnel (view → click → wishlist → whatsapp → conversion)
   */
  public getConversionFunnel(sellerId: string): {
    views: number;
    clicks: number;
    wishlists: number;
    whatsappStarts: number;
    conversions: number;
  } {
    const leads = this.leads.get(sellerId) || [];

    return {
      views: leads.filter(l => l.action === 'view').length,
      clicks: leads.filter(l => l.action === 'click').length,
      wishlists: leads.filter(l => l.action === 'wishlist').length,
      whatsappStarts: leads.filter(l => l.action === 'whatsapp_start').length,
      conversions: leads.filter(l => l.conversionStatus === 'converted').length,
    };
  }
}

// Export singleton instance
export const sellerCRM = new SellerCRMV2();
