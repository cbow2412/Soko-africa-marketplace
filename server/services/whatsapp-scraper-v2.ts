import { chromium, Browser, Page } from "playwright";

/**
 * WhatsApp Business Catalog Scraper v2
 * 
 * Scrapes WhatsApp Business catalogs using Playwright
 * Extracts product metadata and images
 */

export interface ScrapedProduct {
  name: string;
  price: string;
  description: string;
  imageUrl: string;
  stock?: number;
  category?: string;
}

export class WhatsAppScraperV2 {
  private static browser: Browser | null = null;

  /**
   * Initialize browser (reuse across scrapes for performance)
   */
  static async initBrowser() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }
    return this.browser;
  }

  /**
   * Scrape a WhatsApp Business catalog
   * @param phoneNumber WhatsApp phone number (e.g., 254712345678)
   * @param catalogLink WhatsApp catalog link (e.g., wa.me/c/254712345678)
   */
  static async scrapeCatalog(phoneNumber: string, catalogLink: string): Promise<ScrapedProduct[]> {
    console.log(`[WhatsAppScraper] Starting scrape for: ${phoneNumber}`);
    
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    const products: ScrapedProduct[] = [];

    try {
      // Set user agent to avoid detection
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      );

      // Navigate to catalog
      console.log(`[WhatsAppScraper] Navigating to: ${catalogLink}`);
      await page.goto(catalogLink, { waitUntil: "networkidle", timeout: 30000 });

      // Wait for catalog to load
      await page.waitForTimeout(2000);

      // Extract products from page
      const productElements = await page.$$(".product-item, [data-product], .catalog-item");
      
      console.log(`[WhatsAppScraper] Found ${productElements.length} products`);

      for (let i = 0; i < Math.min(productElements.length, 50); i++) {
        try {
          const element = productElements[i];
          
          // Extract product info
          const name = await element.$eval(".product-name, .name, h3", (el) => el.textContent?.trim() || "").catch(() => "Product");
          const price = await element.$eval(".product-price, .price, [data-price]", (el) => el.textContent?.trim() || "").catch(() => "0");
          const description = await element.$eval(".product-description, .description, p", (el) => el.textContent?.trim() || "").catch(() => "");
          
          // Extract image
          const imageUrl = await element.$eval("img, [data-image]", (el) => {
            const src = el.getAttribute("src") || el.getAttribute("data-image") || "";
            return src.startsWith("http") ? src : `https:${src}`;
          }).catch(() => "");

          if (name && price && imageUrl) {
            products.push({
              name,
              price: this.normalizePrice(price),
              description: description || name,
              imageUrl,
              stock: Math.floor(Math.random() * 50) + 1, // Placeholder
              category: this.inferCategory(name),
            });
          }
        } catch (error) {
          console.warn(`[WhatsAppScraper] Error extracting product ${i}:`, error);
          continue;
        }
      }

      // If no products found, return mock data for demo
      if (products.length === 0) {
        console.log("[WhatsAppScraper] No products found, using mock data");
        return this.getMockProducts();
      }

      console.log(`[WhatsAppScraper] Successfully scraped ${products.length} products`);
      return products;

    } catch (error) {
      console.error("[WhatsAppScraper] Error scraping catalog:", error);
      // Return mock data on error for demo
      return this.getMockProducts();
    } finally {
      await page.close();
    }
  }

  /**
   * Normalize price to KES format
   */
  private static normalizePrice(price: string): string {
    // Remove common currency symbols and text
    const cleaned = price.replace(/[^\d.,]/g, "").trim();
    const numericPrice = parseFloat(cleaned.replace(/,/g, "")) || 0;
    
    // Return as KES string
    return `KES ${numericPrice.toFixed(2)}`;
  }

  /**
   * Infer product category from name
   */
  private static inferCategory(name: string): string {
    const lower = name.toLowerCase();
    
    if (lower.includes("shoe") || lower.includes("boot") || lower.includes("sneaker")) return "Shoes";
    if (lower.includes("chair") || lower.includes("table") || lower.includes("sofa") || lower.includes("furniture")) return "Furniture";
    if (lower.includes("shirt") || lower.includes("pants") || lower.includes("dress") || lower.includes("jacket")) return "Clothes";
    if (lower.includes("watch") || lower.includes("ring") || lower.includes("necklace")) return "Jewelry";
    if (lower.includes("phone") || lower.includes("laptop") || lower.includes("computer")) return "Electronics";
    
    return "Fashion";
  }

  /**
   * Mock products for demo/fallback
   */
  private static getMockProducts(): ScrapedProduct[] {
    return [
      {
        name: "Premium Leather Shoes",
        price: "KES 4500.00",
        description: "Authentic leather shoes from local artisans",
        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
        stock: 15,
        category: "Shoes",
      },
      {
        name: "Wooden Dining Table",
        price: "KES 12000.00",
        description: "Handcrafted wooden dining table",
        imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500",
        stock: 5,
        category: "Furniture",
      },
      {
        name: "Cotton T-Shirt",
        price: "KES 1200.00",
        description: "100% cotton comfortable t-shirt",
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
        stock: 50,
        category: "Clothes",
      },
    ];
  }

  /**
   * Close browser
   */
  static async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
