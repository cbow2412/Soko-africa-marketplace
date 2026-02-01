/**
 * SigLIP Inference Pipeline - Soko AI Pipeline
 * 
 * Implements in-memory inference for image embeddings using the 
 * google/siglip-base-patch16-224 model via Hugging Face Inference API.
 * 
 * Zero-Storage Compliance:
 * Images are fetched as buffers, sent to the model, and discarded immediately.
 * No raw image files are stored on disk.
 * 
 * @author Chief AI Scientist
 * @version 1.0.0
 */

import axios from "axios";

/**
 * SigLIP Pipeline Configuration
 */
interface SigLIPConfig {
  modelId: string;
  hfToken: string;
  embeddingDimension: number;
}

/**
 * SigLIP Inference Pipeline Service
 */
export class SigLIPPipeline {
  private readonly config: SigLIPConfig;
  private readonly apiUrl: string;

  constructor() {
    const hfToken = process.env.HF_TOKEN;
    
    if (!hfToken || hfToken === "your_hugging_face_token_here") {
      console.warn("[SigLIP Pipeline] HF_TOKEN not set or using placeholder. Inference may fail.");
    }

    this.config = {
      modelId: "google/siglip-base-patch16-224",
      hfToken: hfToken || "",
      embeddingDimension: 768,
    };

    this.apiUrl = `https://api-inference.huggingface.co/pipeline/feature-extraction/${this.config.modelId}`;
  }

  /**
   * Generate embedding for an image URL
   * 
   * @param imageUrl - Public URL of the product image
   * @returns 768-dimensional L2-normalized embedding vector
   */
  async generateImageEmbedding(imageUrl: string): Promise<number[]> {
    console.log(`[SigLIP Pipeline] Generating embedding for image: ${imageUrl}`);

    try {
      // 1. Stream image to memory (Zero-Storage Compliance)
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 10000, // 10s timeout
      });

      const imageBuffer = Buffer.from(response.data);
      console.log(`[SigLIP Pipeline] Image streamed to memory (${imageBuffer.length} bytes)`);

      // 2. Call Hugging Face Inference API
      const hfResponse = await axios.post(this.apiUrl, imageBuffer, {
        headers: {
          Authorization: `Bearer ${this.config.hfToken}`,
          "Content-Type": "application/octet-stream",
        },
      });

      let embedding: number[] = hfResponse.data;

      // Handle potential nested response from HF API
      if (Array.isArray(embedding) && Array.isArray(embedding[0])) {
        // Some models return [1, 768] or [seq_len, 768], we take the first vector (CLS or pooled)
        embedding = embedding[0] as number[];
      }

      // 3. Validate dimension
      if (embedding.length !== this.config.embeddingDimension) {
        // If it's a patch-based output, we might need to pool it
        // But siglip-base-patch16-224 feature extraction usually returns the pooled output
        console.warn(`[SigLIP Pipeline] Unexpected embedding dimension: ${embedding.length}. Expected ${this.config.embeddingDimension}`);
      }

      // 4. L2 Normalization (Ensures dot product = cosine similarity)
      const normalizedEmbedding = this.l2Normalize(embedding);

      console.log(`✅ [SigLIP Pipeline] Embedding generated and normalized`);
      
      // Image buffer is naturally garbage collected here (Zero-Storage)
      return normalizedEmbedding;
    } catch (error: any) {
      console.error("❌ [SigLIP Pipeline] Inference failed:", error.message);
      if (error.response) {
        console.error("   HF API Error:", error.response.data);
      }
      throw new Error(`SigLIP inference failed: ${error.message}`);
    }
  }

  /**
   * L2 Normalization
   * 
   * ||v|| = sqrt(sum(v_i^2))
   * v_normalized = v / ||v||
   */
  private l2Normalize(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) return vector;
    return vector.map((val) => val / norm);
  }
}

// Export singleton instance
export const siglipPipeline = new SigLIPPipeline();
