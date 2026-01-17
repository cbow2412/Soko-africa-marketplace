import { invokeLLM } from "../_core/llm";

/**
 * Gemini AI Quality Control Service
 * 
 * Analyzes product images and metadata
 * Makes approval/rejection decisions based on platform standards
 */

export interface QCResult {
  decision: "approved" | "rejected" | "flagged";
  reason?: string;
  confidence: number;
  analysis: {
    imageQuality: {
      isBlurry: boolean;
      isAIGenerated: boolean;
      isAppropriate: boolean;
      resolution: string;
    };
    productAuthenticity: {
      isReal: boolean;
      isBanned: boolean;
      category: string;
    };
    description: {
      isSpam: boolean;
      matchesImage: boolean;
      features: string[];
    };
    price: {
      isReasonable: boolean;
      currency: string;
    };
  };
}

export class GeminiQualityControl {
  /**
   * Analyze product for quality control
   */
  static async analyzeProduct(
    productName: string,
    description: string,
    price: string,
    imageUrl: string
  ): Promise<QCResult> {
    console.log(`[GeminiQC] Analyzing product: ${productName}`);

    try {
      // Call Gemini to analyze image and metadata
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a quality control expert for an African e-commerce marketplace. 
Analyze the product image and metadata to determine if it meets platform standards.
Return a JSON response with your analysis.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please analyze this product for our marketplace:
Product Name: ${productName}
Description: ${description}
Price: ${price}

Evaluate:
1. Image Quality: Is it clear, not blurry, not AI-generated, appropriate?
2. Product Authenticity: Is it a real product, not counterfeit/banned?
3. Description: Is it spam-free, matches the image, has key features?
4. Price: Is it reasonable for the category?

Return JSON with:
{
  "decision": "approved|rejected|flagged",
  "reason": "explanation",
  "confidence": 0.0-1.0,
  "imageQuality": {
    "isBlurry": boolean,
    "isAIGenerated": boolean,
    "isAppropriate": boolean,
    "resolution": "good|fair|poor"
  },
  "productAuthenticity": {
    "isReal": boolean,
    "isBanned": boolean,
    "category": "inferred category"
  },
  "description": {
    "isSpam": boolean,
    "matchesImage": boolean,
    "features": ["feature1", "feature2"]
  },
  "price": {
    "isReasonable": boolean,
    "currency": "KES"
  }
}`,
              },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "qc_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                decision: {
                  type: "string",
                  enum: ["approved", "rejected", "flagged"],
                },
                reason: { type: "string" },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                imageQuality: {
                  type: "object",
                  properties: {
                    isBlurry: { type: "boolean" },
                    isAIGenerated: { type: "boolean" },
                    isAppropriate: { type: "boolean" },
                    resolution: { type: "string" },
                  },
                  required: ["isBlurry", "isAIGenerated", "isAppropriate", "resolution"],
                },
                productAuthenticity: {
                  type: "object",
                  properties: {
                    isReal: { type: "boolean" },
                    isBanned: { type: "boolean" },
                    category: { type: "string" },
                  },
                  required: ["isReal", "isBanned", "category"],
                },
                description: {
                  type: "object",
                  properties: {
                    isSpam: { type: "boolean" },
                    matchesImage: { type: "boolean" },
                    features: { type: "array", items: { type: "string" } },
                  },
                  required: ["isSpam", "matchesImage", "features"],
                },
                price: {
                  type: "object",
                  properties: {
                    isReasonable: { type: "boolean" },
                    currency: { type: "string" },
                  },
                  required: ["isReasonable", "currency"],
                },
              },
              required: [
                "decision",
                "reason",
                "confidence",
                "imageQuality",
                "productAuthenticity",
                "description",
                "price",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const analysisText = response.choices[0]?.message.content;
      if (!analysisText) {
        throw new Error("No response from Gemini");
      }

      const analysis = JSON.parse(analysisText);

      // Apply rejection logic based on analysis
      let decision: "approved" | "rejected" | "flagged" = analysis.decision;
      let reason = analysis.reason;

      // Hard rejection rules
      if (analysis.imageQuality.isBlurry) {
        decision = "rejected";
        reason = "Image is blurry - please provide a clear product photo";
      } else if (analysis.imageQuality.isAIGenerated) {
        decision = "rejected";
        reason = "Image appears to be AI-generated - please use real product photos";
      } else if (!analysis.imageQuality.isAppropriate) {
        decision = "rejected";
        reason = "Image contains inappropriate content";
      } else if (!analysis.productAuthenticity.isReal) {
        decision = "rejected";
        reason = "Product appears to be counterfeit or not authentic";
      } else if (analysis.productAuthenticity.isBanned) {
        decision = "rejected";
        reason = "This product category is not allowed on our platform";
      } else if (analysis.description.isSpam) {
        decision = "rejected";
        reason = "Product description appears to be spam or misleading";
      }

      // Flagging rules (manual review needed)
      if (decision !== "rejected") {
        if (!analysis.description.matchesImage) {
          decision = "flagged";
          reason = "Description may not match the image - flagged for manual review";
        } else if (!analysis.price.isReasonable) {
          decision = "flagged";
          reason = "Price seems unusual for this product - flagged for manual review";
        }
      }

      console.log(
        `[GeminiQC] Decision for ${productName}: ${decision} (confidence: ${analysis.confidence})`
      );

      return {
        decision,
        reason,
        confidence: analysis.confidence,
        analysis,
      };
    } catch (error) {
      console.error("[GeminiQC] Error analyzing product:", error);

      // Default to flagged on error
      return {
        decision: "flagged",
        reason: "Could not analyze product - flagged for manual review",
        confidence: 0.5,
        analysis: {
          imageQuality: {
            isBlurry: false,
            isAIGenerated: false,
            isAppropriate: true,
            resolution: "unknown",
          },
          productAuthenticity: {
            isReal: true,
            isBanned: false,
            category: "Unknown",
          },
          description: {
            isSpam: false,
            matchesImage: true,
            features: [],
          },
          price: {
            isReasonable: true,
            currency: "KES",
          },
        },
      };
    }
  }

  /**
   * Batch analyze multiple products
   */
  static async analyzeProducts(
    products: Array<{ name: string; description: string; price: string; imageUrl: string }>
  ): Promise<QCResult[]> {
    console.log(`[GeminiQC] Analyzing ${products.length} products in batch`);

    const results: QCResult[] = [];

    for (const product of products) {
      try {
        const result = await this.analyzeProduct(
          product.name,
          product.description,
          product.price,
          product.imageUrl
        );
        results.push(result);

        // Rate limiting: wait 500ms between requests
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`[GeminiQC] Error analyzing ${product.name}:`, error);
        results.push({
          decision: "flagged",
          reason: "Analysis error",
          confidence: 0,
          analysis: {
            imageQuality: {
              isBlurry: false,
              isAIGenerated: false,
              isAppropriate: true,
              resolution: "unknown",
            },
            productAuthenticity: {
              isReal: true,
              isBanned: false,
              category: "Unknown",
            },
            description: {
              isSpam: false,
              matchesImage: true,
              features: [],
            },
            price: {
              isReasonable: true,
              currency: "KES",
            },
          },
        });
      }
    }

    return results;
  }
}
