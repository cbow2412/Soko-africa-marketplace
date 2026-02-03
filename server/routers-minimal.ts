import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { getProducts, getProductsByCategory, getProductById, getCategories, getAllProducts } from "./db";
import { ingestionRouter } from "./routes/ingestion";
import { adminRouter } from "./routes/admin";

/**
 * Minimal tRPC Router - Simplified to avoid module-level crashes
 */
export const appRouter = router({
  // Products router
  products: router({
    getAll: publicProcedure
      .input(z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        try {
          return await getProducts(input.limit, input.offset);
        } catch (error) {
          console.error("Error fetching products:", error);
          return [];
        }
      }),

    getByCategory: publicProcedure
      .input(z.object({
        categoryId: z.number(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        try {
          return await getProductsByCategory(input.categoryId, input.limit, input.offset);
        } catch (error) {
          console.error("Error fetching products by category:", error);
          return [];
        }
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        try {
          return await getProductById(input.id);
        } catch (error) {
          console.error("Error fetching product:", error);
          return null;
        }
      }),

    search: publicProcedure
      .input(z.object({
        query: z.string(),
        limit: z.number().default(20),
      }))
      .query(async ({ input }) => {
        try {
          const allProducts = await getProducts(1000, 0);
          const filtered = allProducts.filter(p =>
            p.name.toLowerCase().includes(input.query.toLowerCase()) ||
            p.description?.toLowerCase().includes(input.query.toLowerCase())
          );
          return filtered.slice(0, input.limit);
        } catch (error) {
          console.error("Error searching products:", error);
          return [];
        }
      }),

    /**
     * Visual Similarity Search - AI-Powered Discovery
     * Returns products mathematically closest to the clicked product using SigLIP embeddings
     */
    getSimilar: publicProcedure
      .input(z.object({
        productId: z.number(),
        limit: z.number().default(12),
        threshold: z.number().default(0.5),
      }))
      .query(async ({ input }) => {
        try {
          // Import similarity search from services
          const { getVisualSimilarity } = await import("../db");
          const similarProducts = await getVisualSimilarity(input.productId, input.limit);
          return similarProducts || [];
        } catch (error) {
          console.error("Error fetching similar products:", error);
          // Fallback: return random products from same category
          const product = await getProductById(input.productId);
          if (product) {
            const allProducts = await getProducts(1000, 0);
            const categoryProducts = allProducts.filter(p => p.categoryId === product.categoryId && p.id !== input.productId);
            return categoryProducts.slice(0, input.limit);
          }
          return [];
        }
      }),
  }),

  // Categories router
  categories: router({
    getAll: publicProcedure.query(async () => {
      try {
        return await getCategories();
      } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
      }
    }),
  }),

  // Ingestion router
  ingestion: ingestionRouter,

  // Admin router
  admin: adminRouter,

  // Recommendations router (added for Home page compatibility)
  products_recommended: router({
    getRecommended: publicProcedure
      .input(z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        try {
          return await getProducts(input.limit, input.offset);
        } catch (error) {
          console.error("Error fetching recommended products:", error);
          return [];
        }
      }),
  }),

  // Visual Discovery router
  discovery: router({
    /**
     * Get the next product in the discovery chain
     * Uses vector similarity to find the closest match
     */
    getNext: publicProcedure
      .input(z.object({
        currentProductId: z.number(),
        userTasteVector: z.array(z.number()).optional(),
      }))
      .query(async ({ input }) => {
        try {
          const { getVisualSimilarity } = await import("../db");
          const nextProducts = await getVisualSimilarity(input.currentProductId, 1);
          return nextProducts?.[0] || null;
        } catch (error) {
          console.error("Error getting next product:", error);
          return null;
        }
      }),
  }),

  // Health check
  health: publicProcedure.query(async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  }),
});

export type AppRouter = typeof appRouter;
