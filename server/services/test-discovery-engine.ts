/**
 * Test Script for Discovery Engine
 * 
 * Validates:
 * 1. Zilliz Cloud connection
 * 2. Collection creation with AUTOINDEX
 * 3. SigLIP embedding generation (Mocked for local test if no HF_TOKEN)
 * 4. ANN search logic
 */

import { discoveryEngine } from "./discovery-engine.js";
import { siglipPipeline } from "./siglip-pipeline.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.production") });

async function runTest() {
  console.log("🚀 Starting Discovery Engine Pipeline Test...");

  try {
    // 1. Test Connection
    console.log("\n--- Phase 1: Connection ---");
    await discoveryEngine.connect();
    const isHealthy = await discoveryEngine.healthCheck();
    console.log(`Zilliz Health Check: ${isHealthy ? "PASS" : "FAIL"}`);

    if (!isHealthy) throw new Error("Zilliz not healthy");

    // 2. Test Collection Creation
    console.log("\n--- Phase 2: Collection Setup ---");
    await discoveryEngine.createCollection();
    const stats = await discoveryEngine.getStats();
    console.log("Collection Stats:", stats);

    // 3. Test Embedding Generation (Simulated)
    console.log("\n--- Phase 3: SigLIP Embedding ---");
    const testImageUrl = "https://images.unsplash.com/photo-1542291026-7eec264c27ff"; // Red Nike Shoe
    
    let embedding: number[];
    if (process.env.HF_TOKEN && process.env.HF_TOKEN !== "your_hugging_face_token_here") {
      embedding = await siglipPipeline.generateImageEmbedding(testImageUrl);
    } else {
      console.log("⚠️ HF_TOKEN not found, using mock 768-dim vector for testing");
      embedding = new Array(768).fill(0).map(() => Math.random());
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      embedding = embedding.map(v => v / norm);
    }
    console.log(`Embedding generated: ${embedding.slice(0, 5).map(v => v.toFixed(4)).join(", ")}...`);

    // 4. Test Insertion
    console.log("\n--- Phase 4: Vector Insertion ---");
    const testProductId = Math.floor(Math.random() * 1000000);
    await discoveryEngine.insertVector({
      productId: testProductId,
      embedding: embedding,
      vendorId: 101,
      price: 4500,
      categoryId: 5,
      createdAt: Date.now(),
    });

    // 5. Test ANN Search
    console.log("\n--- Phase 5: ANN Search ---");
    const results = await discoveryEngine.getRelatedItems(embedding, 5);
    console.log(`Found ${results.length} related items.`);
    results.forEach((res, i) => {
      console.log(`${i + 1}. Product ${res.productId} - Similarity: ${res.similarity.toFixed(4)}`);
    });

    console.log("\n✅ Discovery Engine Pipeline Test Completed Successfully!");
  } catch (error) {
    console.error("\n❌ Test Failed:", error);
  } finally {
    await discoveryEngine.disconnect();
  }
}

runTest();
