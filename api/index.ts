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

// Vector Store initialization is deferred to prevent serverless cold-start crash.
// It will be initialized on first use or by a dedicated background job.

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

// tRPC API - Handle both /api/trpc and /trpc for compatibility
const trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext,
});

app.use("/api/trpc", trpcMiddleware);
app.use("/trpc", trpcMiddleware);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
