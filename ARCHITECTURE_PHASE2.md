# Architecture Update: Phase 3 - Scout & Hydrate Ingestion Engine

## Overview

Phase 3 introduces a major architectural pivot from heavy, browser-based scraping to a lightweight **"Scout & Hydrate"** pipeline. This leverages the static Open Graph (OG) metadata in WhatsApp product links to achieve a **10x reduction in compute cost** and bypasses the "Lazy Load" bottleneck, transforming Soko Africa into a high-speed **Visual Search Index** of the WhatsApp commerce layer.

## System Components

### Ingestion Engine (The Scout & Hydrate Pipeline)

The previous monolithic scraping job is split into two highly optimized, concurrent steps:

#### 1. The Scout (Playwright)
- **Purpose**: Fast, minimal browser interaction to extract product identifiers.
- **Process**: Playwright navigates to the seller's catalog URL (`wa.me/c/...`) and extracts all 16-digit `Product_ID`s and the `Seller_Phone`. It **does not** wait for images or full page load.
- **Output**: A JSON array of `{ productId, sellerPhone }` pairs, queued for hydration.

#### 2. The Hydrator (Axios/Cheerio)
- **Purpose**: Lightweight, concurrent metadata extraction.
- **Process**: A dedicated worker uses `axios` or `undici` to fetch the constructed product link (`wa.me/p/[Product_ID]/[Phone_Number]`). `Cheerio` is used to quickly parse the HTML `<head>` for `og:image`, `og:title`, and `og:description`.
- **Concurrency**: Controlled by `p-limit` library, allowing up to **20 concurrent fetches** per worker.
- **Self-Healing**: Implements **User-Agent rotation** and **Exponential Backoff** on 429/5xx errors to prevent rate limiting. 404 errors (deleted products) are logged and skipped.

### SigLIP Embedding Service Upgrade

The embedding generation process is upgraded to create a more robust, "concept-first" vector.

- **Model**: SigLIP-base (768-dimensional vectors).
- **Hybrid Vectorization**: A weighted average of the image and text embeddings is used: **0.6 Image / 0.4 Text**.
- **Zero-Copy Vectorization**: The `og:image` URL is fetched directly into memory, processed by SigLIP, and immediately discarded. **No temporary disk storage is used.**
- **Text Cleaning**: A simple Regex/String utility is applied to the concatenated `title + description` to strip noise (emojis, "inbox for price") before text vectorization.

## Database Schema Updates

The `products` table is updated to support the new ingestion and synchronization logic.

| Field | Type | Purpose |
| :--- | :--- | :--- |
| `productId` | `VARCHAR(16)` | The unique 16-digit WhatsApp Product ID. |
| `sellerPhone` | `VARCHAR(15)` | The seller's phone number, enabling easy batch 'Re-Hydration'. |
| `imageUrl` | `TEXT` | Stores the **Meta CDN link** for initial display. |
| `lastHydratedAt` | `TIMESTAMP` | Timestamp of the last successful metadata fetch, used for 'Heartbeat Sync' logic. |
| `s3ImageUrl` | `TEXT` | (New) URL for the image stored in our S3 bucket (used by Lazy Persistence). |

## Data Flow (Scout & Hydrate Pipeline)

```mermaid
graph TD
    A[Seller Catalog URL] --> B(Queue: sync-seller);
    B --> C{Worker: The Scout};
    C --> D[Playwright: Extract Product IDs];
    D --> E{JSON Array: {productId, sellerPhone}};
    E --> F(Queue: hydrate-product);
    F --> G{Worker: The Hydrator};
    G --> H[Axios/Cheerio: Fetch wa.me/p/ Link];
    H --> I{Extract: og:image, og:title, og:description};
    I --> J(Queue: generate-embedding);
    J --> K{Worker: SigLIP Service};
    K --> L[Zero-Copy: 0.6 Image / 0.4 Text Vector];
    L --> M[Store Vector in Milvus];
    M --> N(Queue: quality-control);
    N --> O{Worker: Gemini QC};
    O --> P{Decision: Approved?};
    P -- Approved --> Q(Queue: lazy-persistence);
    P -- Approved --> R[Update Product: lastHydratedAt, imageUrl];
    P -- Rejected/Flagged --> R;
    Q --> S{Worker: S3 Uploader};
    S --> T[Download Meta CDN Image];
    T --> U[Upload to S3];
    U --> V[Update Product: s3ImageUrl];
    R --> W[Product Live on Marketplace];
```

## Performance Characteristics (Post-Refactor)

| Metric | Previous (Scrape) | New (Scout & Hydrate) | Improvement |
| :--- | :--- | :--- | :--- |
| **Scraping Cost** | High (Full Browser) | Low (Minimal Browser) | 10x |
| **Ingestion Speed** | 10-20 products/min | **~100-200 products/min** | 10x |
| **Concurrency** | Limited by Playwright | 20 Concurrent Fetches | 20x |
| **Media Ownership** | None | Lazy Persistence (S3) | Critical |

## Lazy Persistence Strategy

1.  The `imageUrl` field stores the ephemeral **Meta CDN link**.
2.  Only products that receive an **"Approved"** decision from the Gemini QC worker are queued for `lazy-persistence`.
3.  The `lazy-persistence` worker downloads the image from the Meta CDN link and uploads it to our S3 bucket, storing the permanent URL in `s3ImageUrl`.
4.  The frontend will prioritize `s3ImageUrl` if available, falling back to `imageUrl` (Meta CDN) if the S3 upload is pending.

## Error Handling & Self-Healing

| Scenario | Strategy |
| :--- | :--- |
| **Rate Limit (429)** | **Exponential Backoff**: Wait 1s, 2s, 4s, etc., before retrying the Hydrator job. |
| **Deleted Product (404)** | Log the event in `catalogSyncLogs` and mark the product as inactive in the database. **Do not crash the worker.** |
| **Ephemeral Link Failure** | The `lazy-persistence` worker will retry the download. If it fails, the product remains on the Meta CDN link until the next 'Heartbeat Sync'. |
| **Headless Detection** | **User-Agent Rotation** in the Hydrator to mimic common mobile browsers. |
