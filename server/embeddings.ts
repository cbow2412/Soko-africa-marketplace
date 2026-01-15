import axios from "axios";

/**
 * SigLIP Embedding Service
 * Generates hybrid embeddings (image + text) for semantic product matching
 * Uses Hugging Face Inference API with SigLIP model
 */

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_API_URL = "https://api-inference.huggingface.co/models/google/siglip-base-patch16-224";

// Cache for embeddings to avoid redundant API calls
const embeddingCache = new Map<string, number[]>();

/**
 * Generate embedding for product image using SigLIP
 * SigLIP is optimized for image-text matching
 */
export async function generateImageEmbedding(imageUrl: string): Promise<number[]> {
  try {
    // Check cache first
    const cacheKey = `img_${imageUrl}`;
    if (embeddingCache.has(cacheKey)) {
      return embeddingCache.get(cacheKey)!;
    }

    // Fetch image and convert to base64
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 10000,
    });

    const base64Image = Buffer.from(imageResponse.data).toString("base64");
    const imageBase64 = `data:image/jpeg;base64,${base64Image}`;

    // Call Hugging Face API with image
    const response = await axios.post(
      `${HF_API_URL}`,
      {
        inputs: {
          image: imageBase64,
          text_input: "product image",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const embedding = response.data[0] || [];
    embeddingCache.set(cacheKey, embedding);
    return embedding;
  } catch (error) {
    console.error("Error generating image embedding:", error);
    // Return random embedding on error (768 dimensions for SigLIP)
    return Array(768)
      .fill(0)
      .map(() => Math.random() - 0.5);
  }
}

/**
 * Generate embedding for product text (name + description) using SigLIP
 */
export async function generateTextEmbedding(
  productName: string,
  description: string
): Promise<number[]> {
  try {
    const text = `${productName}. ${description || ""}`;
    const cacheKey = `txt_${text}`;

    if (embeddingCache.has(cacheKey)) {
      return embeddingCache.get(cacheKey)!;
    }

    // Call Hugging Face API with text
    const response = await axios.post(
      `${HF_API_URL}`,
      {
        inputs: {
          text_input: text,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const embedding = response.data[0] || [];
    embeddingCache.set(cacheKey, embedding);
    return embedding;
  } catch (error) {
    console.error("Error generating text embedding:", error);
    // Return random embedding on error
    return Array(768)
      .fill(0)
      .map(() => Math.random() - 0.5);
  }
}

/**
 * Create hybrid embedding by combining image and text embeddings
 * Weighted average: 60% image + 40% text (images more important for visual discovery)
 */
export function createHybridEmbedding(
  imageEmbedding: number[],
  textEmbedding: number[]
): number[] {
  const imageWeight = 0.6;
  const textWeight = 0.4;

  return imageEmbedding.map((val, idx) => {
    const textVal = textEmbedding[idx] || 0;
    return val * imageWeight + textVal * textWeight;
  });
}

/**
 * Cosine similarity between two embeddings
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Find similar products based on hybrid embeddings
 * Returns top N most similar products
 */
export function findSimilarProducts(
  queryEmbedding: number[],
  productEmbeddings: Array<{ productId: number; embedding: number[] }>,
  topN: number = 5
): Array<{ productId: number; similarity: number }> {
  const similarities = productEmbeddings.map(({ productId, embedding }) => ({
    productId,
    similarity: cosineSimilarity(queryEmbedding, embedding),
  }));

  // Sort by similarity descending and return top N
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN)
    .filter(item => item.similarity > 0.3); // Only return items with >30% similarity
}

/**
 * Normalize embedding vector to unit length
 */
export function normalizeEmbedding(embedding: number[]): number[] {
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return embedding;
  return embedding.map(val => val / magnitude);
}

/**
 * Batch generate embeddings for multiple products
 * Useful for initial seeding or bulk updates
 */
export async function batchGenerateEmbeddings(
  products: Array<{
    id: number;
    name: string;
    description: string;
    imageUrl: string;
  }>
): Promise<
  Array<{
    productId: number;
    imageEmbedding: number[];
    textEmbedding: number[];
    hybridEmbedding: number[];
  }>
> {
  const results = [];

  for (const product of products) {
    try {
      const imageEmbedding = await generateImageEmbedding(product.imageUrl);
      const textEmbedding = await generateTextEmbedding(product.name, product.description);
      const hybridEmbedding = createHybridEmbedding(imageEmbedding, textEmbedding);

      results.push({
        productId: product.id,
        imageEmbedding: normalizeEmbedding(imageEmbedding),
        textEmbedding: normalizeEmbedding(textEmbedding),
        hybridEmbedding: normalizeEmbedding(hybridEmbedding),
      });

      // Rate limiting: wait 500ms between API calls
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error generating embeddings for product ${product.id}:`, error);
    }
  }

  return results;
}
