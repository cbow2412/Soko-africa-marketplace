# 🏗️ Soko Africa: Multi-Tenant Foundation Architectural Analysis

## 📌 TiDB Scalability Bottlenecks for 100,000+ Items

As we scale Soko Africa to 100,000+ items and beyond, several architectural bottlenecks in TiDB (Serverless) must be addressed to maintain the "Pinterest of Nairobi" experience.

### 1. Hotspot Issues in Distributed Storage
TiDB uses TiKV for storage, which partitions data into "Regions." If we use a simple auto-incrementing integer for `productId`, all new inserts will hit the same Region, creating a write hotspot.
- **Solution:** Use `AUTO_RANDOM` for primary keys or UUIDs to distribute writes across the cluster.

### 2. Index Bloat and Write Latency
With 100,000+ items, every additional index increases the write amplification.
- **Solution:** Implement a "Lean Indexing" strategy. Only index fields used in critical `WHERE` clauses (e.g., `vendorId`, `categoryId`, `status`). Use composite indexes for common query patterns like `(vendorId, status, createdAt)`.

### 3. Transactional Integrity vs. Throughput
Implementing "Soft Deletes" and "Price History" adds overhead to every write.
- **Solution:** Use TiDB's optimistic or pessimistic locking appropriately. For the 'Harvester' accounts (50+ concurrent requests), we must ensure that price history inserts don't block product updates.

### 4. Semantic Search Performance
Storing 768-dimension embeddings as JSON strings in TiDB and performing semantic search via the application layer will not scale.
- **Solution:** While the current requirement is for the "API Bridge," the long-term solution is TiDB's vector search capabilities (if available) or a dedicated vector DB. For now, we will optimize the ingestion bridge to handle the throughput.

---

## 🛠️ Implementation Strategy

### 1. Sovereign Vendor Schema
- Refactor `sellers` to `vendors`.
- Add `tier` (Bronze, Gold, Platinum).
- Ensure every `product` links to a `vendorId`.

### 2. Transactional Integrity
- **Soft Deletes:** Add `deletedAt` timestamp to all core tables.
- **Price History:** Create a `price_history` table with `productId`, `price`, `currency`, and `changedAt`.

### 3. Semantic Feed Ingestion (tRPC)
- Implement a type-safe procedure that handles batch inserts.
- Use TiDB's `INSERT IGNORE` or `ON DUPLICATE KEY UPDATE` to prevent deadlocks during high-concurrency ingestion.
- Implement a "Queue-First" approach for the Harvester accounts to decouple ingestion from the database transaction if necessary.

---

**Prepared by: Chief Systems Architect (Manus AI)**
