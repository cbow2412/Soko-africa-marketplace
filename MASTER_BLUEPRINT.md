# Soko Africa Marketplace: Master Blueprint and Technical Deep Dive

## I. Executive Summary: The Visual Discovery Engine

The Soko Africa Marketplace is not a traditional e-commerce platform; it is a **Visual Discovery Engine** designed to bridge the informal, high-volume commerce conducted over platforms like WhatsApp with a structured, enterprise-grade digital marketplace. Its core innovation lies in leveraging **Vector Database Technology** and **Advanced AI** to create a **Pinterest-style infinite scrolling experience** that prioritizes visual similarity and semantic relevance over traditional keyword search.

The project's success hinges on three pillars:
1.  **Seamless Ingestion**: Automated, resilient scraping of WhatsApp Business Catalogs.
2.  **Intelligent Curation**: AI-powered quality control and image enhancement.
3.  **Visual Discovery**: A hybrid vector search engine (SigLIP + Milvus) driving the infinite scroll UI.

## II. The Visual Discovery Architecture

The user interface is intentionally designed to mimic the **Pinterest/Instagram** experience, encouraging endless browsing and impulse discovery. This is achieved through a client-side implementation of **infinite scrolling** combined with a server-side **cursor-based pagination** system that queries the vector database. The UI is a **masonry grid** layout, which is visually dense and highly effective for displaying a large volume of heterogeneous product images, a direct nod to the Pinterest design philosophy. This layout maximizes the visual impact of the AI-curated product images. [2]

### A. The SigLIP-Milvus Vector Pipeline: The Engine of Visual Discovery

The heart of the discovery engine is the **SigLIP-Milvus Pipeline**, which converts every product image and its associated text into a single, high-dimensional vector embedding.

| Component | Role | Technology | Output |
| :--- | :--- | :--- | :--- |
| **SigLIP Model** | Generates Hybrid Embeddings | Hugging Face (HF_TOKEN) | 768-Dimensional Vector |
| **Milvus Client** | Stores and Indexes Vectors | Zilliz Cloud (Milvus) | Vector Index (IVF_FLAT) |
| **Hybrid Search** | Combines Text and Image Queries | Custom TypeScript Logic | Ranked List of Product IDs |

**Key Insight**: The embedding is a **60% Image / 40% Text** hybrid, a critical design choice to ensure visual relevance dominates. This means a search for "red dress" will prioritize products that *look* like a red dress, even if the seller only described it as "beautiful gown." This hybrid approach is what enables the "Pinterest-style" discovery, as it allows for highly accurate cross-modal search, where an image can be used to query for similar text, and vice-versa. The vector space is intentionally skewed towards the visual component to facilitate the endless browsing experience. [1]

### B. The Infinite Scroll Mechanism

The frontend (React/Vite) implements a custom hook for infinite scrolling. This is a **cursor-based pagination** strategy, which is superior to offset-based pagination for large, constantly changing datasets.

1.  **Initial Load**: Client requests `GET /api/products?limit=20`.
2.  **Server Response**: Returns 20 products and a `next_cursor` (the **vector embedding** of the last product).
3.  **Scroll Trigger**: When the user reaches the bottom of the viewport, the client requests `GET /api/products?limit=20&cursor=[next_cursor]`.
4.  **Vector Query**: The server uses the `next_cursor` vector to query Milvus for the next 20 most visually and semantically similar products. This is a **vector-based continuation**, ensuring that the subsequent batch of products is not just the next page, but the next most relevant set in the high-dimensional vector space, creating the illusion of an endless, highly curated feed. This is the key to the "Jumia Killer" discovery experience. [3]

## III. Agent-Proof Documentation: Core Business Logic

This section details the critical, non-obvious business logic that an external agent would struggle to infer.

### A. The "Real Seller" Data Model

The system uses a highly specific data model to track the origin and quality of ingested data.

| Field | Description | Business Rationale |
| :--- | :--- | :--- |
| `is_real_seller` | Boolean flag for verified sellers. | Only verified sellers are included in the main discovery feed. |
| `whatsapp_id` | The 16-digit WhatsApp Business ID. | Primary key for CRM and Onboarding services. |
| `qc_score` | Quality Control Score (0.0 - 1.0). | Products below 0.7 are automatically hidden or sent for manual review. |
| `ingestion_source` | e.g., 'WHATSAPP_V3', 'MANUAL_UPLOAD'. | Crucial for auditing and debugging ingestion pipeline failures. |

### B. AI-Powered Quality Control (`GeminiQualityControl`)

The Gemini AI service is used to enforce marketplace standards, preventing low-quality or prohibited items from reaching the public feed.

1.  **Image Analysis**: Checks for watermarks, poor lighting, or non-product images (e.g., a seller's personal photo).
2.  **Text Analysis**: Checks for profanity, misleading claims, or missing key attributes (e.g., size, price).
3.  **QC Score Calculation**: A weighted average of image and text quality is calculated.
4.  **Action**: If `qc_score < 0.7`, the product is flagged, and the `SellerCRM` service is notified to follow up.

### C. The Jumia Killer Advantage: Scalability

The choice of **TiDB Cloud** and **Zilliz Cloud (Milvus)** ensures horizontal scalability, a necessity for the African market's rapid growth.

- **TiDB**: Handles massive transactional load (orders, user data, audit logs) with MySQL compatibility.
- **Milvus**: Provides sub-100ms latency for vector search, enabling the real-time, continuous discovery experience.

## IV. Deployment and Infrastructure

The project is configured for two primary deployment targets:

1.  **Vercel (Frontend/API Gateway)**: For the client and serverless functions.
2.  **Dedicated VM/Cloud Run (Backend Workers)**: For long-running tasks like the WhatsApp Scraper and the Heartbeat Sync workers.

The CI/CD pipeline (`ci-cd.yml`) is designed to handle this hybrid deployment, ensuring that the core application is always available and the background workers are independently managed.

## V. References

[1]: Internal Architecture Document - SigLIP Hybrid Embedding Strategy. (Not publicly available)
[2]: Frontend Design Specification - Masonry Grid Layout. (Not publicly available)
[3]: Backend API Specification - Cursor-Based Vector Pagination. (Not publicly available)

The project is configured for two primary deployment targets:

1.  **Vercel (Frontend/API Gateway)**: For the client and serverless functions.
2.  **Dedicated VM/Cloud Run (Backend Workers)**: For long-running tasks like the WhatsApp Scraper and the Heartbeat Sync workers.

The CI/CD pipeline (`ci-cd.yml`) is designed to handle this hybrid deployment, ensuring that the core application is always available and the background workers are independently managed.

---
*This document is a living blueprint for the Soko Africa Marketplace. It contains proprietary architectural and business logic. Do not share with external parties.*
