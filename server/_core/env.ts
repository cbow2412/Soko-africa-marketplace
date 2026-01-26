export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "your-super-secret-jwt-key-change-this-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  
  // Milvus Configuration
  milvusAddress: process.env.MILVUS_ADDRESS ?? "",
  milvusUsername: process.env.MILVUS_USERNAME ?? "",
  milvusPassword: process.env.MILVUS_PASSWORD ?? "",
  
  // AI/ML Services
  hfToken: process.env.HF_TOKEN ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiProjectId: process.env.GEMINI_PROJECT_ID ?? "",
  
  // Feature Flags
  enableMilvus: true,
  enableGeminiQC: true,
};
