#!/usr/bin/env node

import mysql from "mysql2/promise";
import { batchGenerateEmbeddings } from "./server/embeddings.ts";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

if (!HF_API_KEY) {
  console.error("HUGGINGFACE_API_KEY environment variable is not set");
  process.exit(1);
}

async function generateAllEmbeddings() {
  console.log("🚀 Starting embedding generation for all products...");

  try {
    // Parse database URL
    const url = new URL(DATABASE_URL);
    const connection = await mysql.createConnection({
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
    });

    // Fetch all products
    console.log("📦 Fetching products from database...");
    const [products] = await connection.execute(
      "SELECT id, name, description, imageUrl FROM products LIMIT 1000"
    );

    console.log(`✅ Found ${products.length} products`);

    // Generate embeddings in batches
    console.log("🔄 Generating embeddings (this may take a while)...");
    const embeddings = await batchGenerateEmbeddings(products);

    console.log(`✅ Generated ${embeddings.length} embeddings`);

    // Save embeddings to database
    console.log("💾 Saving embeddings to database...");
    for (const embedding of embeddings) {
      await connection.execute(
        `INSERT INTO product_embeddings (productId, imageEmbedding, textEmbedding, hybridEmbedding)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         imageEmbedding = VALUES(imageEmbedding),
         textEmbedding = VALUES(textEmbedding),
         hybridEmbedding = VALUES(hybridEmbedding)`,
        [
          embedding.productId,
          JSON.stringify(embedding.imageEmbedding),
          JSON.stringify(embedding.textEmbedding),
          JSON.stringify(embedding.hybridEmbedding),
        ]
      );
    }

    console.log("✅ All embeddings saved successfully!");

    // Verify
    const [count] = await connection.execute(
      "SELECT COUNT(*) as count FROM product_embeddings"
    );
    console.log(`📊 Total embeddings in database: ${count[0].count}`);

    await connection.end();
  } catch (error) {
    console.error("❌ Error generating embeddings:", error);
    process.exit(1);
  }
}

generateAllEmbeddings();
