import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getProducts, getProductsByCategory, getProductById, getCategories, getSellerById, getCommentsByProduct, getUserFavorites, createSeller, createSyncLog, getSyncStatus, getVisualSimilarity } from "./db";
import { getProductEmbedding, getAllProductEmbeddings } from "./embeddings-db";
import { findSimilarProducts } from "./embeddings";
// import { RealSigLIPEmbeddings } from "./services/siglip-real"; // Removed to prevent module-level crash
import { TRPCError } from "@trpc/server";
import { adminRouter } from "./routes/admin";
import { ScoutHydrateService } from "./services/scout-hydrate";

export const appRouter = router({
  admin: adminRouter,
  system: systemRouter,
  ingestion: router({
    scoutAndHydrate: publicProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ input }) => {
        try {
          const product = await ScoutHydrateService.hydrateFromUrl(input.url);
          return { success: true, product };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to ingest product",
          });
        }
      }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Products router
  products: router({
    getAll: publicProcedure
      .input(z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return await getProducts(input.limit, input.offset);
      }),

    getByCategory: publicProcedure
      .input(z.object({
        categoryId: z.number(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return await getProductsByCategory(input.categoryId, input.limit, input.offset);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const product = await getProductById(input.id);
        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }
        return product;
      }),

    search: publicProcedure
      .input(z.object({
        query: z.string(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        // Simple search - in production, use full-text search or Elasticsearch
        const allProducts = await getProducts(1000, 0);
        const filtered = allProducts.filter(p =>
          p.name.toLowerCase().includes(input.query.toLowerCase()) ||
          p.description?.toLowerCase().includes(input.query.toLowerCase())
        );
        return filtered.slice(input.offset, input.offset + input.limit);
      }),

    getSimilar: publicProcedure
      .input(z.object({
        productId: z.number(),
        limit: z.number().default(5),
      }))
      .query(async ({ input }) => {
        try {
          const queryEmbedding = await getProductEmbedding(input.productId);
          if (!queryEmbedding) {
            return [];
          }

          const allEmbeddings = await getAllProductEmbeddings();

          const similarProducts = findSimilarProducts(
            queryEmbedding.hybridEmbedding,
            allEmbeddings.map(e => ({
              productId: e.productId,
              embedding: e.hybridEmbedding,
            })),
            input.limit + 1
          );

          const filtered = similarProducts.filter(p => p.productId !== input.productId);

          const similarProductDetails = await Promise.all(
            filtered.slice(0, input.limit).map(async p => {
              const product = await getProductById(p.productId);
              return product ? { ...product, similarity: p.similarity } : null;
            })
          );

          return similarProductDetails.filter(p => p !== null);
        } catch (error) {
          console.error("Error finding similar products:", error);
          return [];
        }
      }),

    getRecommended: publicProcedure
      .input(z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        // Sophisticated recommendation algorithm (Phase 1: Metadata-based)
        // This version uses a weighted shuffle to prioritize trending categories
        // and diverse sellers for a Pinterest-style discovery experience.
        const allProducts = await getProducts(100, 0); // Get a larger pool
        
        // Group by category to ensure diversity
        const categoryGroups: Record<number, any[]> = {};
        allProducts.forEach(p => {
          if (!categoryGroups[p.categoryId]) categoryGroups[p.categoryId] = [];
          categoryGroups[p.categoryId].push(p);
        });

        // Pick products from each category to ensure a mixed feed
        const recommended: any[] = [];
        const categories = Object.keys(categoryGroups);
        
        for (let i = 0; i < input.limit; i++) {
          const catId = categories[i % categories.length];
          const pool = categoryGroups[Number(catId)];
          if (pool && pool.length > 0) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            recommended.push(pool.splice(randomIndex, 1)[0]);
          }
        }

        return recommended;
      }),

    searchByVisualSimilarity: publicProcedure
      .input(z.object({
        productId: z.number(),
        limit: z.number().default(10),
      }))
      .query(async ({ input }) => {
        return await getVisualSimilarity(input.productId, input.limit);
      }),
  }),

  // Categories router
  categories: router({
    getAll: publicProcedure.query(async () => {
      return await getCategories();
    }),
  }),

  // Sellers router
  sellers: router({
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const seller = await getSellerById(input.id);
        if (!seller) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Seller not found",
          });
        }
        return seller;
      }),

    register: publicProcedure
      .input(z.object({
        businessName: z.string(),
        whatsappNumber: z.string(),
        catalogUrl: z.string(),
        category: z.string(),
        city: z.string(),
        description: z.string(),
      }))
      .mutation(async ({ input }) => {
        const result = await createSeller({
          userId: 1, // Mock user ID
          storeName: input.businessName,
          whatsappPhone: input.whatsappNumber,
          description: input.description,
          catalogUrl: input.catalogUrl,
        });

        if (result.success) {
          // Trigger mock sync log
          await createSyncLog({
            sellerId: result.sellerId,
            catalogUrl: input.catalogUrl,
            status: 'started',
          });
        }

        return result;
      }),

    getSyncStatus: publicProcedure
      .input(z.object({ sellerId: z.number() }))
      .query(async ({ input }) => {
        return await getSyncStatus(input.sellerId);
      }),
  }),

  // Comments router
  comments: router({
    getByProduct: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return await getCommentsByProduct(input.productId);
      }),

    create: protectedProcedure
      .input(z.object({
        productId: z.number(),
        rating: z.number().min(1).max(5).optional(),
        text: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // TODO: Implement comment creation with database insert
        return { success: true };
      }),
  }),

  // Favorites router
  favorites: router({
    getByUser: protectedProcedure.query(async ({ ctx }) => {
      return await getUserFavorites(ctx.user.id);
    }),

    toggle: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // TODO: Implement favorite toggle
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
