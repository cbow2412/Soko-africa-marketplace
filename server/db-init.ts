/**
 * Optimized Product Initialization Module
 * Handles loading of the 100-artifact hot-swapped Meta CDN catalog
 */

import { generateRealProductData } from './db-real-data';
import { RealSigLIPEmbeddings } from './services/siglip-real';
import { setProductEmbeddings } from './db';

let products: any[] = [];
let _initPromise: Promise<void> | null = null;
let _initialized = false;

/**
 * Initialize products asynchronously with error handling
 */
export async function ensureProductsInitialized(): Promise<void> {
  if (_initialized) return;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      if (products.length === 0) {
        console.log("🎯 Initializing High-Fidelity Meta CDN Catalog");
        console.log("   Zero-Copy Architecture: Direct Meta CDN Links");
        
        const startTime = Date.now();
        // Use the hot-swapped real data
        products = generateRealProductData();
        const elapsed = Date.now() - startTime;

        console.log(`✅ Loaded ${products.length} products in ${elapsed}ms`);

        // Generate and set embeddings
        console.log("🧠 Generating SigLIP embeddings for products...");
        const embeddingsArray = await RealSigLIPEmbeddings.generateBatchEmbeddings(
          products.map(p => ({ name: p.name, description: p.description, imageUrl: p.imageUrl }))
        );
        const newEmbeddingsMap = new Map<number, number[]>();
        products.forEach((p, index) => {
          newEmbeddingsMap.set(p.id, embeddingsArray[index]);
        });
        setProductEmbeddings(newEmbeddingsMap);
        console.log(`✅ Generated and set ${newEmbeddingsMap.size} product embeddings.`);
      }
      _initialized = true;
    } catch (error) {
      console.error("❌ Failed to initialize products:", error);
      products = [];
      _initialized = true;
      throw error;
    }
  })();

  return _initPromise;
}

/**
 * Get all products (ensures initialization)
 */
export async function getProducts(limit: number = 20, offset: number = 0) {
  await ensureProductsInitialized();
  return products.slice(offset, offset + limit);
}

/**
 * Get product by ID
 */
export async function getProductById(id: number) {
  await ensureProductsInitialized();
  return products.find(p => p.id === id);
}

/**
 * Get products by category
 */
export async function getProductsByCategory(categoryId: number, limit: number = 20, offset: number = 0) {
  await ensureProductsInitialized();
  const filtered = products.filter(p => p.categoryId === categoryId);
  return filtered.slice(offset, offset + limit);
}

/**
 * Search products
 */
export async function searchProducts(query: string, limit: number = 20) {
  await ensureProductsInitialized();
  const lowerQuery = query.toLowerCase();
  return products
    .filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      p.description.toLowerCase().includes(lowerQuery)
    )
    .slice(0, limit);
}

/**
 * Get all products (for analytics/recommendations)
 */
export async function getAllProducts() {
  await ensureProductsInitialized();
  return products;
}

export { products };
