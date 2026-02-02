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
import { registerAllProcessors } from "./services/job-processors";
import { redisService } from "./services/redis-client";
import { jobQueueService } from "./services/job-queue";

async function startServer() {
  const isWorker = process.argv.includes("--worker");

  // Always initialize Redis first as it's required for both App and Worker
  console.log("🔌 Connecting to Redis...");
  await redisService.connect().catch(err => {
    console.error("❌ Failed to connect to Redis:", err);
    process.exit(1);
  });

  if (isWorker) {
    console.log("👷 Starting Soko Africa BullMQ Worker...");
    
    // Initialize JobQueue before registering processors
    await jobQueueService.initialize();
    await registerAllProcessors();
    
    // Minimal health check server for the worker
    const app = express();
    app.get("/health", (_req, res) => {
      res.status(200).json({ 
        status: "ok", 
        mode: "worker", 
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });
    const port = parseInt(process.env.PORT || "3000");
    app.listen(port, "0.0.0.0", () => {
      console.log(`✅ Worker health check running on port ${port}`);
    });
    return;
  }

  console.log("🚀 Starting Soko Africa Production Server...");
  
  // Initialize JobQueue for the app (to add jobs)
  await jobQueueService.initialize().catch(err => {
    console.error("⚠️ JobQueue initialization failed:", err);
  });

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

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.status(200).json({ 
      status: "ok", 
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: "1.0.5-industrial"
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
