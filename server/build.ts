import * as esbuild from "esbuild";
import path from "path";
import fs from "fs";

async function buildServer() {
  console.log("🔨 Building Soko Africa Server...");
  
  const ignorePlugin = {
    name: 'ignore-problematic-modules',
    setup(build) {
      build.onResolve({ filter: /^(@babel\/preset-typescript|lightningcss|@tailwindcss\/oxide|@babel\/core|@milvus\.io\/milvus2-sdk-node|@tailwindcss\/node)/ }, args => {
        return { path: args.path, namespace: 'ignore' }
      })
      build.onLoad({ filter: /.*/, namespace: 'ignore' }, () => {
        return { 
          contents: 'module.exports = new Proxy({}, { get: () => () => ({}) });', 
          loader: 'js' 
        }
      })
    },
  }

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
      packages: "external",
      logLevel: "silent", // Suppress build warnings/errors
      banner: {
        js: "import { createRequire as _createRequire } from 'module'; const require = _createRequire(import.meta.url);",
      },
    });
    console.log("✅ Server build complete: dist/server/index.js");
  } catch (error) {
    console.error("❌ Server build failed:", error);
    process.exit(1);
  }
}

buildServer();
