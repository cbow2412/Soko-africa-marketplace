import axios from "axios";
import * as cheerio from "cheerio";
import { ENV } from "../_core/env";
import { RealSigLIPEmbeddings } from "./siglip-real";

export interface ScrapedProduct {
  name: string;
  price: string;
  description: string;
  imageUrl: string;
  sourceUrl: string;
  vector?: number[];
}

/**
 * Scout & Hydrate Service
 * PhD-Level "Zero-Storage" Ingestion Engine
 */
export class ScoutHydrateService {
  /**
   * Hydrates a product from a WhatsApp Business URL using OG tags
   */
  static async hydrateFromUrl(url: string): Promise<ScrapedProduct> {
    try {
      console.log(`[Scout] Fetching metadata for: ${url}`);
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      const $ = cheerio.load(data);
      
      // Extracting via Open Graph (The Secret Sauce)
      const name = $('meta[property="og:title"]').attr("content") || "Unknown Product";
      const description = $('meta[property="og:description"]').attr("content") || "";
      const imageUrl = $('meta[property="og:image"]').attr("content") || "";
      
      // Price extraction logic (often in description or custom tags for WA)
      const priceMatch = description.match(/KES\s?([\d,]+)/i) || description.match(/([\d,]+)\s?KES/i);
      const price = priceMatch ? `KES ${priceMatch[1]}` : "Contact for Price";

      if (!imageUrl) {
        throw new Error("Could not find high-res image in OG tags.");
      }

      console.log(`[Hydrate] Successfully extracted: ${name} with hotlink: ${imageUrl}`);

      // Vectorize for Visual Discovery
      let vector: number[] | undefined;
      try {
        vector = await RealSigLIPEmbeddings.generateEmbeddings(name, description, imageUrl);
        console.log(`[Vectorize] Generated SigLIP-768 embeddings for ${name}`);
      } catch (err) {
        console.warn(`[Vectorize] Failed to generate embeddings, falling back to text-only: ${err}`);
      }

      return {
        name,
        price,
        description,
        imageUrl,
        sourceUrl: url,
        vector,
      };
    } catch (error) {
      console.error(`[Scout-Hydrate] Error processing ${url}:`, error);
      throw error;
    }
  }
}
