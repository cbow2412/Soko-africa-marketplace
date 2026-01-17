import { OpenAI } from "openai";

/**
 * Gemini AI Service
 * 
 * This service leverages Gemini (via OpenAI-compatible API) to analyze
 * product images and extract rich metadata, tags, and vector descriptions.
 */
export class GeminiAIService {
  private static client = new OpenAI();

  /**
   * Analyzes a product image and returns structured metadata.
   */
  static async analyzeProductImage(imageUrl: string) {
    console.log(`[GeminiAI] Analyzing image: ${imageUrl}`);

    try {
      const response = await this.client.chat.completions.create({
        model: "gemini-2.5-flash", // Using the latest Gemini model
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this product image for a Kenyan marketplace. Extract: 1. Product Name, 2. Category, 3. Estimated Price Range (KSh), 4. Key Features, 5. Visual Tags (e.g., 'vintage', 'leather'). Return as JSON." },
              { type: "image_url", image_url: { url: imageUrl } }
            ],
          },
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("[GeminiAI] Error analyzing image:", error);
      return null;
    }
  }

  /**
   * Generates a vector embedding for semantic search.
   * Note: In a real app, you'd use a dedicated embedding model like text-embedding-3-small.
   */
  static async generateEmbedding(text: string) {
    // Placeholder for vector embedding generation
    return new Array(1536).fill(0).map(() => Math.random());
  }
}
