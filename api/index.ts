import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import analyticsRouter from "../server/routes/analytics";
import recommendationsRouter from "../server/routes/recommendations";
import crmRouter from "../server/routes/crm";
import { initializeVectorStore } from "../server/services/siglip-milvus";
import { ENV } from "../server/_core/env";

const app = express();

// Initialize Vector Store for AI Visual Discovery
if (ENV.enableMilvus && ENV.milvusAddress) {
  initializeVectorStore(ENV.milvusAddress).catch(err => {
    console.error("[Server] Failed to initialize Milvus:", err);
  });
}

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
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
