import * as esbuild from "esbuild";
import path from "path";
import fs from "fs";

async function buildServer() {
  console.log("🔨 Building Soko Africa Server...");

  const outDir = path.resolve(process.cwd(), "dist/server");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  try {
    await esbuild.build({
      entryPoints: ["server/index.ts"],
      bundle: true,
      platform: "node",
      target: "node22",
      outfile: "dist/server/index.js",
      format: "esm",
      external: [
        "express",
        "mysql2",
        "drizzle-orm",
        "dotenv",
        "playwright",
        "canvas",
        "sharp",
        "@zilliz/milvus2-sdk-node"
      ],
      banner: {
        js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
      },
    });
    console.log("✅ Server build complete: dist/server/index.js");
  } catch (error) {
    console.error("❌ Server build failed:", error);
    process.exit(1);
  }
}

buildServer();
