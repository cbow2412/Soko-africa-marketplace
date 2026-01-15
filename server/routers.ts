import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getProducts, getProductsByCategory, getProductById, getCategories, getSellerById, getCommentsByProduct, getUserFavorites } from "./db";
import { getProductEmbedding, getAllProductEmbeddings } from "./embeddings-db";
import { findSimilarProducts } from "./embeddings";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
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
