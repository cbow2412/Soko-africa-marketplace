# SigLIP Vector Embeddings - Implementation Guide

## Overview

Soko Africa Marketplace uses **SigLIP (Sigmoid Loss for Language Image Pre-training)** for semantic product matching. This enables Pinterest-style "Similar Products" discovery by finding visually and semantically similar items regardless of category or seller.

## What is SigLIP?

SigLIP is a vision-language model from Google that generates embeddings for both images and text. It's optimized for image-text matching tasks and works exceptionally well for e-commerce product discovery.

**Key Advantages:**
- **Multimodal**: Understands both images and text descriptions
- **Efficient**: Fast inference, suitable for real-time recommendations
- **Semantic**: Captures visual and conceptual similarity (e.g., "black shoes" similar to "dark sneakers")
- **Scalable**: Works well with 1000+ products

## Architecture

### Database Schema

```sql
CREATE TABLE product_embeddings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  productId INT UNIQUE NOT NULL,
  imageEmbedding TEXT NOT NULL,      -- JSON array (768 dimensions)
  textEmbedding TEXT NOT NULL,       -- JSON array (768 dimensions)
  hybridEmbedding TEXT NOT NULL,     -- JSON array (768 dimensions)
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

### Embedding Dimensions

- **SigLIP Base Model**: 768-dimensional embeddings
- **Image Embedding**: Extracted from product image
- **Text Embedding**: Extracted from product name + description
- **Hybrid Embedding**: Weighted combination (60% image + 40% text)

### Weighting Strategy

```
Hybrid Embedding = (0.6 × Image Embedding) + (0.4 × Text Embedding)
```

Why this weighting?
- **60% Image**: Visual similarity is primary for e-commerce discovery
- **40% Text**: Semantic meaning (category, material, style) matters for relevance

## Implementation

### 1. Embedding Generation Service (`server/embeddings.ts`)

```typescript
// Generate image embedding
const imageEmbedding = await generateImageEmbedding(imageUrl);

// Generate text embedding
const textEmbedding = await generateTextEmbedding(name, description);

// Create hybrid embedding
const hybridEmbedding = createHybridEmbedding(imageEmbedding, textEmbedding);
```

**API Used**: Hugging Face Inference API with `google/siglip-base-patch16-224`

**Rate Limiting**: 500ms between API calls to respect rate limits

### 2. Similarity Calculation

**Cosine Similarity Formula:**
```
similarity = (A · B) / (||A|| × ||B||)
```

Returns value between -1 and 1:
- **1.0** = Identical products
- **0.5** = Moderately similar
- **0.3** = Threshold for recommendation
- **0.0** = Orthogonal (no similarity)
- **-1.0** = Opposite

### 3. Similar Products Endpoint

**tRPC Procedure**: `products.getSimilar`

```typescript
trpc.products.getSimilar.useQuery({
  productId: 123,
  limit: 5  // Return top 5 similar products
})
```

**Algorithm:**
1. Fetch query product's hybrid embedding
2. Fetch all product embeddings from database
3. Calculate cosine similarity for each product
4. Filter products with similarity > 0.3
5. Sort by similarity (descending)
6. Return top N products with details

## Usage

### Generate Embeddings for All Products

```bash
# Set environment variables
export HUGGINGFACE_API_KEY="your_hf_token"
export DATABASE_URL="mysql://..."

# Run embedding generation
node generate-embeddings.mjs
```

**Processing Time**: ~1-2 hours for 1000 products (with 500ms rate limiting)

### Fetch Similar Products

**Frontend:**
```typescript
const { data: similarProducts } = trpc.products.getSimilar.useQuery({
  productId: 42,
  limit: 5
});
```

**Response:**
```json
[
  {
    "id": 156,
    "name": "Nike Air Force 1 Black",
    "price": "KES 3200",
    "imageUrl": "https://...",
    "similarity": 0.87
  },
  {
    "id": 289,
    "name": "Nike Blazer Mid",
    "price": "KES 3500",
    "imageUrl": "https://...",
    "similarity": 0.82
  }
]
```

## Performance Considerations

### Caching

- **Embedding Cache**: In-memory cache to avoid redundant API calls
- **Database Indexing**: Index on `productId` for fast lookups
- **Query Optimization**: Select only needed columns

### Scalability

| Products | Embeddings Size | Query Time |
|----------|-----------------|-----------|
| 100      | ~30 MB          | <100ms    |
| 500      | ~150 MB         | <200ms    |
| 1000     | ~300 MB         | <300ms    |
| 5000     | ~1.5 GB         | <500ms    |

### Optimization Strategies

1. **Batch Processing**: Generate embeddings in batches of 10-20 products
2. **Async Generation**: Run embedding generation as background job
3. **Vector Database**: Consider Pinecone/Weaviate for 10k+ products
4. **Approximate Nearest Neighbors**: Use FAISS for faster similarity search

## Hugging Face API Setup

### Get API Key

1. Visit [huggingface.co](https://huggingface.co)
2. Create account or login
3. Go to Settings → Access Tokens
4. Create new token with "read" permission
5. Copy token to `.env`:

```
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
```

### Model Used

**Model**: `google/siglip-base-patch16-224`
- **Publisher**: Google Research
- **Type**: Vision-Language Model
- **Input**: Images (224x224) + Text
- **Output**: 768-dimensional embeddings
- **License**: Apache 2.0

## Testing

### Unit Tests

```bash
pnpm test embeddings.test.ts
```

### Manual Testing

```typescript
// Test embedding generation
const imageEmb = await generateImageEmbedding("https://...");
console.log(imageEmb.length); // Should be 768

// Test similarity
const sim = cosineSimilarity(imageEmb, textEmb);
console.log(sim); // Should be between -1 and 1
```

## Troubleshooting

### Issue: "API Rate Limited"
**Solution**: Increase delay between requests (currently 500ms)

### Issue: "Embeddings are all zeros"
**Solution**: Check Hugging Face API key and model availability

### Issue: "Similar products not found"
**Solution**: Ensure embeddings are generated for all products

### Issue: "Slow similarity search"
**Solution**: Use vector database (Pinecone) for 10k+ products

## Future Enhancements

### Phase 2
- [ ] Real-time embedding updates when products are added
- [ ] User preference learning (personalized recommendations)
- [ ] A/B testing different weighting strategies

### Phase 3
- [ ] Vector database integration (Pinecone/Weaviate)
- [ ] Approximate Nearest Neighbors (FAISS)
- [ ] GPU acceleration for embedding generation

### Phase 4
- [ ] Fine-tuned SigLIP model on Kenyan product data
- [ ] Multi-language support (Swahili product descriptions)
- [ ] Cross-seller product bundling

## References

- [SigLIP Paper](https://arxiv.org/abs/2303.15343)
- [Hugging Face SigLIP Model](https://huggingface.co/google/siglip-base-patch16-224)
- [Cosine Similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
- [Vector Embeddings](https://www.pinecone.io/learn/vector-embeddings/)

## Support

For issues or questions:
- Check logs: `pnpm dev` shows embedding generation progress
- Verify API key: `echo $HUGGINGFACE_API_KEY`
- Test API: `curl -X POST https://api-inference.huggingface.co/models/google/siglip-base-patch16-224 -H "Authorization: Bearer $HUGGINGFACE_API_KEY"`
