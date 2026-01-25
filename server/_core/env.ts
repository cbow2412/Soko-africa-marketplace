export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "your-super-secret-jwt-key-change-this-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "mysql://4USanJzjkavoy7p.root:ezUCO2pIXWrn1cb7@gateway01-privatelink.eu-central-1.prod.aws.tidbcloud.com:4000/test?sslMode=REQUIRED",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "https://oauth.soko-africa.com",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: true,
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  
  // Milvus Configuration
  milvusAddress: process.env.MILVUS_ADDRESS ?? "https://in01-6a31db6c21d17ea.aws-us-west-2.vectordb.zillizcloud.com:19530",
  milvusUsername: process.env.MILVUS_USERNAME ?? "db_admin",
  milvusPassword: process.env.MILVUS_PASSWORD ?? "Lh8,f^u4!qNx54XU",
  
  // AI/ML Services
  hfToken: process.env.HF_TOKEN ?? "", // Set this in Vercel environment variables
  geminiApiKey: process.env.GEMINI_API_KEY ?? "AIzaSyD37o8s1NAsG0pJ7m6gP5SS7CQJVfH6YiM",
  geminiProjectId: "projects/360725348802",
  
  // Feature Flags
  enableMilvus: true,
  enableGeminiQC: true,
};
