# 🏗️ Soko Africa: Enterprise Schema Architecture v2.0 Analysis

## 📌 Introduction
This document outlines the architectural considerations and rationale behind implementing Enterprise Schema Architecture v2.0 for Soko Africa. The primary goal is to establish a robust, scalable, and compliant foundation capable of supporting 10M+ SKUs across multiple regions, with a strong emphasis on financial-grade audit trails, GDPR compliance, real-time inventory, and AI-powered vector search.

## 💡 Core Architectural Mandates
The new schema design is driven by the following critical mandates:

1.  **Event Sourcing with CQRS Patterns:** To ensure financial-grade audit trails and support complex analytical queries without impacting transactional performance.
2.  **Multi-Tenant Vendor Isolation:** To securely manage data for sovereign vendors, each with their own configurations and data.
3.  **Vector-Relational Bridging:** To seamlessly integrate AI-powered vector search (SigLIP-768) with the relational database for enhanced product discovery.
4.  **GDPR Compliance:** To handle personal data with appropriate consent mechanisms and soft-deletion capabilities.

## 📊 TiDB Scalability Bottlenecks for 10M+ Items (Revisited)
With the introduction of Event Sourcing and Vector-Relational Bridging, the previous bottlenecks are re-evaluated and new considerations arise:

### 1. Hotspot Issues in Distributed Storage (Event Store)
Event Sourcing often leads to high write throughput on the event store. If events are appended sequentially with auto-incrementing IDs, this can still create write hotspots in TiDB.
-   **Solution:** Utilize UUIDs for event IDs (`productEvents.uuid`) to distribute writes across TiKV regions. For `productEvents.id` (serial), TiDB's distributed auto-increment should mitigate hotspots, but monitoring is crucial.

### 2. Index Bloat and Write Latency (Event Store & Products)
Event Sourcing introduces an immutable log of all changes, which can grow very large. The `products` table also has numerous indexes for various query patterns.
-   **Solution:**
    -   **Event Store:** Indexes on `productEvents.productId`, `productEvents.eventType`, and `productEvents.createdAt` are essential for reconstructing aggregate states and analytical queries. These should be carefully designed to support CQRS read models.
    -   **Products Table:** The proposed indexes (`statusIdx`, `vendorStatusIdx`, `vectorIdx`, `hashIdx`, `priceIdx`, `categoryIdx`, `createdIdx`, `slugIdx`, `uuidIdx`, `activePriceIdx`, `vendorCategoryIdx`) are comprehensive. Regular review of query patterns and index usage in TiDB will be necessary to optimize and remove redundant indexes.

### 3. Transactional Integrity vs. Throughput (CQRS Write Model)
Event Sourcing separates write (command) and read (query) models. Writes to the event store must be atomic and highly available. Materializing read models from events can be asynchronous.
-   **Solution:** Ensure that the write path (commands -> event store) is optimized for high throughput. TiDB's distributed transactions are well-suited for this. Read models (e.g., `ProductSearchView`) will be eventually consistent, which is acceptable for most marketplace scenarios. Implement robust retry mechanisms for read model materialization.

### 4. Semantic Search Performance (Vector-Relational Bridging)
Integrating vector search directly with the relational schema requires careful consideration. Storing `visualEmbedding` as JSON in `products` is a cache, but the primary vector search will occur in a dedicated Vector DB (Zilliz).
-   **Solution:** The `vectorId` in the `products` table acts as the bridge to Zilliz. The `vectorCollections` table manages metadata for Zilliz. The `vectorStatus` in `products` is crucial for tracking the synchronization state with the Vector DB. Queries involving semantic search will first hit Zilliz for vector similarity, then join back to TiDB using `vectorId` to retrieve product details.

### 5. Multi-Tenancy and Data Isolation
Each vendor is a tenant. While TiDB is distributed, ensuring logical isolation and efficient querying across tenants is key.
-   **Solution:** The `vendorId` is a foreign key in the `products` table and implicitly in `productEvents` (via `productId`). All queries must include `vendorId` to ensure data isolation. This design naturally supports multi-tenancy at the application layer.

## 🛠️ Enterprise Schema v2.0 Implementation Details

### 1. Vendor Management (`vendors` table)
-   **UUIDs:** Introduction of `uuid` for global distributed identification, mitigating write hotspots.
-   **Comprehensive Vendor Attributes:** Includes `businessName`, `legalName`, `registrationNumber`, `whatsappNumber`, `tier`, `trustScore`, `verificationStatus`, `commissionRate`, `subscriptionPlan`, `payoutMethod`, `shippingRegions`, `returnPolicy`, and GDPR-related consent fields.
-   **Soft Deletes:** `deletedAt` for GDPR compliance and data retention policies.
-   **Indexes:** Strategic indexes on `tier`, `trustScore`, `verificationStatus`, `catalogSyncEnabled`, `lastCatalogSyncAt`, `whatsappNumber`, and `uuid` for efficient querying.

### 2. Product Catalog (`products` table)
-   **UUIDs:** `uuid` for global distributed identification.
-   **Vendor Linkage:** `vendorId` as a foreign key, ensuring multi-tenancy.
-   **Rich Product Attributes:** `title`, `slug`, `description` (JSON), `shortDescription`, multi-currency pricing (`priceKes`, `priceUsd`, etc.), `sourceUrl`, `imageUrl`, `imageHash`, `imageDimensions`, `galleryUrls`.
-   **AI/Vector Integration:** `vectorId` (link to Zilliz), `vectorStatus`, `vectorDimensions`, `vectorModelVersion`, `similarityHash`, `visualEmbedding` (cache), `aiCategory`, `aiTags`, `aiConfidenceScore`, `aiSuggestedPrice`.
-   **Engagement Metrics:** `viewCount`, `clickCount`, `inquiryCount`, `conversionCount`, `clickThroughRate`, `searchRankingScore`.
-   **State Machine:** `status` (draft, active, suspended, etc.), `statusReason`, `moderatedAt`, `moderatedBy`.
-   **Pipeline Tracking:** Detailed fields for `ingestionSource`, `ingestionJobId`, `ingestionAttemptedAt`, `ingestionCompletedAt`, `ingestionDurationMs`, `ingestionWorkerNode`, `retryCount`, `lastError`.
-   **Flexible Attributes:** `attributes` (JSON) for schema evolution, `whatsappMetadata`.
-   **Versioning:** `version` for optimistic locking.
-   **Soft Deletes:** `deletedAt`.
-   **Indexes:** Extensive indexing for various query patterns, including composite indexes for common vendor-specific and status-based searches.

### 3. Event Store (`productEvents` table)
-   **Immutable Audit Trail:** Records every significant change to a product.
-   **Event Details:** `eventType`, `eventVersion`, `eventData` (immutable snapshot), `previousState`.
-   **Actor & Context:** `actor`, `actorType`, `correlationId`, `sessionId`, `ipAddress`, `userAgent` for comprehensive auditing.
-   **Timestamping:** `createdAt`, `processedAt`.
-   **Indexes:** Optimized for event stream retrieval by `productId` and `productUuid`, and for analytical queries by `eventType`, `actor`, and `createdAt`.

### 4. Price History (`priceHistory` table)
-   **Financial Audit:** Records all price changes for a product.
-   **Details:** `productId`, `priceKes`, `priceUsd`, `changedBy`, `changeReason`, `effectiveFrom`, `effectiveTo`.
-   **Indexes:** `productPriceIdx` for efficient retrieval of price history for a given product.

### 5. Dead Letter Queue (`ingestionFailures` table)
-   **Operational Resilience:** Captures and manages failed ingestion attempts.
-   **Failure Details:** `errorCategory`, `errorCode`, `errorMessage`, `errorStack`, `errorFingerprint`.
-   **Retry Management:** `retryAttempts`, `lastRetryAt`, `nextRetryAt`, `permanentFailure`.
-   **Resolution Workflow:** `resolvedAt`, `resolvedBy`, `resolutionType`, `resolutionNotes`.
-   **Indexes:** For efficient management of failures, including `retryIdx`, `vendorIdx`, `categoryIdx`, `fingerprintIdx`, and `createdIdx`.

### 6. Vector Collection Metadata (`vectorCollections` table)
-   **Zilliz Sync:** Manages metadata for vector collections in Zilliz.
-   **Configuration:** `collectionName`, `zillizCollectionId`, `dimension`, `metricType`, `consistencyLevel`.
-   **Statistics:** `vectorCount`, `lastSyncAt`, `syncStatus`.

### 7. Materialized Views (`ProductSearchView`)
-   **CQRS Read Model:** A denormalized view for optimized search and display. This will likely be materialized in an external search engine (e.g., Elasticsearch, Typesense) rather than directly in TiDB as a view, to leverage specialized search capabilities.

## 🚀 Migration Strategy

1.  **Generate Migration:** Use `npx drizzle-kit generate --name enterprise_foundation_v2` to create the Drizzle migration file.
2.  **Review and Adjust:** Carefully review the generated SQL migration for correctness and potential data loss. Manual adjustments might be necessary for complex data transformations.
3.  **Zero-Downtime Deployment:** For production environments, a zero-downtime migration strategy will be crucial. This typically involves:
    -   Adding new columns and tables without dropping old ones.
    -   Backfilling data to new columns/tables.
    -   Updating application code to use the new schema.
    -   Removing old columns/tables in a subsequent deployment.

## 🎓 Conclusion
This Enterprise Schema Architecture v2.0 provides a robust and forward-looking foundation for Soko Africa. By embracing Event Sourcing, CQRS, multi-tenancy, and vector-relational bridging, we are well-positioned to scale to millions of SKUs, ensure data integrity, meet compliance requirements, and power advanced AI features. The detailed schema definition and indexing strategy are designed to optimize performance on TiDB, while the architectural patterns lay the groundwork for future expansion and resilience.

**Prepared by: Chief Systems Architect (Manus AI)**
