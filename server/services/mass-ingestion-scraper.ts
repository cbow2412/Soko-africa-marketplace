import axios, { AxiosError } from "axios";
import * as cheerio from "cheerio";

/**
 * Mass Ingestion Stealth Scraper
 * 
 * Mission: Extract product metadata from WhatsApp catalog links without triggering Meta's bot defense.
 * 
 * Features:
 * - Rotating User-Agent headers (iPhone/Android mix)
 * - Exponential backoff retry on 429 (Too Many Requests)
 * - OG metadata extraction (og:image, og:title, price from description)
 * - Resilient error handling with dead link detection
 */

// Mobile User-Agent Pool (Real devices for stealth)
const USER_AGENTS = [
  // iPhone variants
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.7 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
  
  // Android variants
  "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 13; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 12; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36",
];

/**
 * Get a random User-Agent from the pool
 */
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Exponential backoff with jitter
 * @param attempt Current retry attempt (0-indexed)
 * @param baseDelay Base delay in milliseconds (default: 2000ms)
 */
async function exponentialBackoff(attempt: number, baseDelay: number = 2000): Promise<void> {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), 16000); // Cap at 16 seconds
  const jitter = Math.random() * 0.3 * delay; // Add 30% jitter
  const totalDelay = delay + jitter;
  
  console.log(`[Backoff] Waiting ${Math.round(totalDelay)}ms before retry (attempt ${attempt + 1})`);
  await new Promise((resolve) => setTimeout(resolve, totalDelay));
}

/**
 * Extract price from description text
 * Supports formats: "KES 1,500", "1500 KES", "KSh 1500"
 */
function extractPrice(text: string): string | null {
  // Try multiple price patterns
  const patterns = [
    /KES\s*([\d,]+)/i,
    /([\d,]+)\s*KES/i,
    /KSh\s*([\d,]+)/i,
    /([\d,]+)\s*KSh/i,
    /Ksh\s*([\d,]+)/i,
    /Price:\s*KES\s*([\d,]+)/i,
    /Price:\s*([\d,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const price = match[1].replace(/,/g, "");
      return `KES ${parseInt(price, 10)}`;
    }
  }

  return null;
}

export interface ScrapedProductData {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  price: string | null;
  scrapedAt: Date;
  success: boolean;
  error?: string;
}

/**
 * Scrape a single WhatsApp catalog URL
 * @param url WhatsApp catalog URL (e.g., https://wa.me/c/254712345678)
 * @param maxRetries Maximum number of retry attempts on rate limiting
 */
export async function scrapeWhatsAppCatalog(
  url: string,
  maxRetries: number = 3
): Promise<ScrapedProductData> {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      console.log(`[Scraper] Fetching ${url} (attempt ${attempt + 1}/${maxRetries + 1})`);

      const response = await axios.get(url, {
        headers: {
          "User-Agent": getRandomUserAgent(),
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Cache-Control": "max-age=0",
        },
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      });

      // Handle 404 (Dead Link)
      if (response.status === 404) {
        console.warn(`[Scraper] ⚠️ Dead link detected: ${url}`);
        return {
          url,
          title: null,
          description: null,
          imageUrl: null,
          price: null,
          scrapedAt: new Date(),
          success: false,
          error: "404_NOT_FOUND",
        };
      }

      // Handle 429 (Rate Limited)
      if (response.status === 429) {
        if (attempt < maxRetries) {
          console.warn(`[Scraper] ⚠️ Rate limited (429) on ${url}, retrying...`);
          await exponentialBackoff(attempt);
          attempt++;
          continue;
        } else {
          console.error(`[Scraper] ❌ Max retries exceeded for ${url}`);
          return {
            url,
            title: null,
            description: null,
            imageUrl: null,
            price: null,
            scrapedAt: new Date(),
            success: false,
            error: "429_RATE_LIMITED",
          };
        }
      }

      // Parse HTML with Cheerio
      const $ = cheerio.load(response.data);

      // Extract Open Graph metadata
      const ogTitle = $('meta[property="og:title"]').attr("content") || null;
      const ogDescription = $('meta[property="og:description"]').attr("content") || null;
      const ogImage = $('meta[property="og:image"]').attr("content") || null;

      // Extract price from description
      const price = ogDescription ? extractPrice(ogDescription) : null;

      // Validate extraction
      if (!ogTitle || !ogImage) {
        console.warn(`[Scraper] ⚠️ Incomplete metadata for ${url}`);
        return {
          url,
          title: ogTitle,
          description: ogDescription,
          imageUrl: ogImage,
          price,
          scrapedAt: new Date(),
          success: false,
          error: "INCOMPLETE_METADATA",
        };
      }

      console.log(`[Scraper] ✓ Successfully scraped: ${ogTitle}`);
      return {
        url,
        title: ogTitle,
        description: ogDescription,
        imageUrl: ogImage,
        price,
        scrapedAt: new Date(),
        success: true,
      };

    } catch (error) {
      const axiosError = error as AxiosError;

      // Handle network errors
      if (axiosError.code === "ECONNABORTED" || axiosError.code === "ETIMEDOUT") {
        if (attempt < maxRetries) {
          console.warn(`[Scraper] ⚠️ Timeout on ${url}, retrying...`);
          await exponentialBackoff(attempt);
          attempt++;
          continue;
        }
      }

      console.error(`[Scraper] ❌ Error scraping ${url}:`, axiosError.message);
      return {
        url,
        title: null,
        description: null,
        imageUrl: null,
        price: null,
        scrapedAt: new Date(),
        success: false,
        error: axiosError.message || "UNKNOWN_ERROR",
      };
    }
  }

  // Fallback (should never reach here)
  return {
    url,
    title: null,
    description: null,
    imageUrl: null,
    price: null,
    scrapedAt: new Date(),
    success: false,
    error: "MAX_RETRIES_EXCEEDED",
  };
}

/**
 * Batch scrape multiple URLs with concurrency control
 * @param urls Array of WhatsApp catalog URLs
 * @param concurrency Number of concurrent requests (default: 50)
 */
export async function batchScrapeWhatsAppCatalogs(
  urls: string[],
  concurrency: number = 50
): Promise<ScrapedProductData[]> {
  console.log(`[BatchScraper] Starting batch scrape of ${urls.length} URLs (concurrency: ${concurrency})`);
  
  const results: ScrapedProductData[] = [];
  const batches: string[][] = [];

  // Split URLs into batches
  for (let i = 0; i < urls.length; i += concurrency) {
    batches.push(urls.slice(i, i + concurrency));
  }

  console.log(`[BatchScraper] Processing ${batches.length} batches`);

  // Process batches sequentially (to avoid overwhelming the server)
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`[BatchScraper] Processing batch ${i + 1}/${batches.length} (${batch.length} URLs)`);

    const batchResults = await Promise.all(
      batch.map((url) => scrapeWhatsAppCatalog(url))
    );

    results.push(...batchResults);

    // Add delay between batches to avoid rate limiting
    if (i < batches.length - 1) {
      const delay = 1000 + Math.random() * 1000; // 1-2 second delay
      console.log(`[BatchScraper] Waiting ${Math.round(delay)}ms before next batch...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  const successCount = results.filter((r) => r.success).length;
  console.log(`[BatchScraper] ✓ Batch complete: ${successCount}/${results.length} successful`);

  return results;
}
