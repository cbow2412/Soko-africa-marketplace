import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { serveStatic } from "./_core/vite";
import analyticsRouter from "./routes/analytics";
import recommendationsRouter from "./routes/recommendations";
import crmRouter from "./routes/crm";
import { initializeVectorStore } from "./services/siglip-milvus";
import { ENV } from "./_core/env";

async function startServer() {
  console.log("🚀 Starting Soko Africa Production Server...");

  // Initialize Vector Store for AI Visual Discovery
  if (ENV.enableMilvus && ENV.milvusAddress) {
    console.log("🧬 Initializing Milvus Vector Store...");
    await initializeVectorStore(ENV.milvusAddress).catch(err => {
      console.error("[Server] Failed to initialize Milvus:", err);
    });
  }

  const app = express();
  const server = createServer(app);

  // Configure body parser
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // OAuth callback
  registerOAuthRoutes(app);

  // Analytics API
  app.use("/api/analytics", analyticsRouter);
  // Recommendations API
  app.use("/api/recommendations", recommendationsRouter);
  // CRM API
  app.use("/api/crm", crmRouter);

  // tRPC API
  const trpcMiddleware = createExpressMiddleware({
    router: appRouter,
    createContext,
  });
  app.use("/api/trpc", trpcMiddleware);
  app.use("/trpc", trpcMiddleware);

  // Health check endpoint for Railway
  app.get("/health", (_req, res) => {
    res.status(200).json({ 
      status: "ok", 
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: "1.0.4-production"
    });
  });

  // Serve static files in production
  console.log("📦 Serving static files from dist/public...");
  serveStatic(app);

  const port = parseInt(process.env.PORT || "3000");
  server.listen(port, "0.0.0.0", () => {
    console.log(`✅ Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(err => {
  console.error("❌ Fatal error during server startup:", err);
  process.exit(1);
});
