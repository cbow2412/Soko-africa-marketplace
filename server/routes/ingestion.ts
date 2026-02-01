import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { ScoutHydrateService } from "../services/scout-hydrate";
import { getDb } from "../db";
import * as schema from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Ingestion Router
 * Handles real-time product discovery and hydration from WhatsApp
 * Optimized for high-concurrency 'Harvester' accounts
 */
export const ingestionRouter = router({
  /**
   * Semantic Feed Ingestion
   * Processes a batch of URLs or a single URL for ingestion
   */
  semanticFeedIngestion: publicProcedure
    .input(z.object({
      urls: z.array(z.string().url()),
      vendorId: z.number(),
      categoryId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const results = [];

      // Process in parallel but with a limit to avoid overwhelming the system
      // For 50+ concurrent requests, we use Promise.all on the batch
      const ingestionPromises = input.urls.map(async (url) => {
        try {
          console.log(`[Ingestion] Processing: ${url} for Vendor: ${input.vendorId}`);
          
          // 1. Hydrate product data using AI (SigLIP/Gemini)
          const hydratedData = await ScoutHydrateService.hydrateFromUrl(url);
          
          if (!db) {
            // Fallback for environments without DB
            return { url, success: true, status: "mocked", product: hydratedData };
          }

          // 2. Transactional Integrity: Use a transaction for product update and price history
          return await db.transaction(async (tx) => {
            // Check if product already exists for this vendor and name
            const existingProducts = await tx.select()
              .from(schema.products)
              .where(
                sql`${schema.products.vendorId} = ${input.vendorId} AND ${schema.products.name} = ${hydratedData.name}`
              )
              .limit(1);

            let productId: number;
            const currentPrice = hydratedData.price.toString();

            if (existingProducts.length > 0) {
              const existing = existingProducts[0];
              productId = existing.id;

              // Update existing product
              await tx.update(schema.products)
                .set({
                  description: hydratedData.description,
                  price: currentPrice,
                  imageUrl: hydratedData.imageUrl,
                  updatedAt: new Date(),
                })
                .where(eq(schema.products.id, productId));

              // Only record price history if price changed
              if (existing.price !== currentPrice) {
                await tx.insert(schema.priceHistory).values({
                  productId,
                  price: currentPrice,
                  currency: "KES",
                });
              }
            } else {
              // Insert new product
              const [insertResult] = await tx.insert(schema.products).values({
                vendorId: input.vendorId,
                categoryId: input.categoryId || 1, // Default category
                name: hydratedData.name,
                description: hydratedData.description,
                price: currentPrice,
                imageUrl: hydratedData.imageUrl,
                source: "harvester",
              });
              
              productId = insertResult.insertId;

              // Initial price history record
              await tx.insert(schema.priceHistory).values({
                productId,
                price: currentPrice,
                currency: "KES",
              });
            }

            return { url, success: true, productId };
          });
        } catch (error: any) {
          console.error(`[Ingestion] Failed to process ${url}:`, error);
          return { url, success: false, error: error.message };
        }
      });

      const processedResults = await Promise.all(ingestionPromises);
      return {
        success: true,
        processed: processedResults.length,
        results: processedResults,
      };
    }),

  /**
   * Legacy scout and hydrate (maintained for compatibility)
   */
  scoutAndHydrate: publicProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input }) => {
      try {
        console.log(`[Ingestion] Processing request for: ${input.url}`);
        const product = await ScoutHydrateService.hydrateFromUrl(input.url);
        
        return {
          success: true,
          product: {
            ...product,
            id: Math.floor(Math.random() * 1000000),
            stock: 10,
            vendorId: 1,
            categoryId: 1,
          }
        };
      } catch (error: any) {
        console.error(`[Ingestion] Failed to process ${input.url}:`, error);
        throw new Error(error.message || "Failed to ingest product");
      }
    }),
});
