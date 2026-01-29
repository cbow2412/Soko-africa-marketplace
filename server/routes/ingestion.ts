import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { ScoutHydrateService } from "../services/scout-hydrate";

/**
 * Ingestion Router
 * Handles real-time product discovery and hydration from WhatsApp
 */
export const ingestionRouter = router({
  scoutAndHydrate: publicProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input }) => {
      try {
        console.log(`[Ingestion] Processing request for: ${input.url}`);
        const product = await ScoutHydrateService.hydrateFromUrl(input.url);
        
        // In a real scenario, we would save this to the database here
        // For now, we return the hydrated product to the frontend
        return {
          success: true,
          product: {
            ...product,
            id: Math.floor(Math.random() * 1000000), // Temporary ID
            stock: 10,
            sellerId: 1,
            categoryId: 1,
          }
        };
      } catch (error: any) {
        console.error(`[Ingestion] Failed to process ${input.url}:`, error);
        throw new Error(error.message || "Failed to ingest product");
      }
    }),
});
