import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { getProducts, getProductsByCategory, getProductById, getCategories } from "./db";

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

  // Health check
  health: publicProcedure.query(async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  }),
});

export type AppRouter = typeof appRouter;
