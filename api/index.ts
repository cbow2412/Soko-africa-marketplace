import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth.ts";
import { appRouter } from "../server/routers.ts";
import { createContext } from "../server/_core/context.ts";
import analyticsRouter from "../server/routes/analytics.ts";
import recommendationsRouter from "../server/routes/recommendations.ts";
import crmRouter from "../server/routes/crm.ts";

const app = express();

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
