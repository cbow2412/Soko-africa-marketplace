/**
 * SOKO AFRICA - ENTERPRISE SCHEMA v2.0
 * Classification: Core Infrastructure
 * Architect: Morgan Blacksheep
 * Standards: Event Sourcing, CQRS, Multi-Tenant, GDPR-Ready
 */

import { 
  mysqlTable, serial, varchar, decimal, timestamp, json, 
  int, boolean, index, uniqueIndex, text, bigint 
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// ==========================================
// DOMAIN: Vendor Management (Multi-Tenant)
// ==========================================
export const vendorTiers = ['bronze', 'silver', 'gold', 'platinum', 'enterprise'] as const;
export type VendorTier = typeof vendorTiers[number];

export const verificationStatuses = ['pending', 'verified', 'suspended', 'banned'] as const;
export type VerificationStatus = typeof verificationStatuses[number];

export const vendors = mysqlTable('vendors', {
  // Primary Identity
  id: serial('id').primaryKey(),
  uuid: varchar('uuid', { length: 36 }).notNull().unique(), // Global distributed ID
  
  // Business Identity
  businessName: varchar('business_name', { length: 255 }).notNull(),
  legalName: varchar('legal_name', { length: 255 }),
  registrationNumber: varchar('registration_number', { length: 50 }), // KRA PIN, etc.
  
  // WhatsApp Integration (Core Channel)
  whatsappNumber: varchar('whatsapp_number', { length: 20 }).notNull().unique(),
  whatsappBusinessId: varchar('whatsapp_business_id', { length: 64 }), // Meta API ID
  whatsappApiToken: varchar('whatsapp_api_token', { length: 512 }), // Encrypted
  catalogSyncEnabled: boolean('catalog_sync_enabled').default(true),
  lastCatalogSyncAt: timestamp('last_catalog_sync_at'),
  autoPublishProducts: boolean('auto_publish_products').default(false),
  
  // Trust & Safety
  tier: varchar('tier', { length: 20 }).$type<VendorTier>().default('bronze').notNull(),
  trustScore: decimal('trust_score', { precision: 3, scale: 2 }).default('0.00'), // 0.00-5.00
  verificationStatus: varchar('verification_status', { length: 20 }).$type<VerificationStatus>().default('pending'),
  verifiedAt: timestamp('verified_at'),
  suspendedAt: timestamp('suspended_at'),
  suspensionReason: varchar('suspension_reason', { length: 512 }),
  
  // Commercial Terms
  commissionRate: decimal('commission_rate', { precision: 4, scale: 2 }).default('10.00'), // Percentage
  subscriptionPlan: varchar('subscription_plan', { length: 20 }).default('free'), // free/pro/enterprise
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  payoutMethod: varchar('payout_method', { length: 20 }).default('mpesa'), // mpesa/bank/crypto
  payoutDetails: json('payout_details'), // Encrypted M-Pesa till, bank account, etc.
  
  // Operational
  defaultCurrency: varchar('default_currency', { length: 3 }).default('KES'),
  shippingRegions: json('shipping_regions'), // ["Nairobi", "Mombasa", "Nakuru"]
  returnPolicy: text('return_policy'),
  
  // GDPR/Privacy
  dataProcessingConsent: boolean('data_processing_consent').default(false),
  marketingConsent: boolean('marketing_consent').default(false),
  consentRecordedAt: timestamp('consent_recorded_at'),
  
  // Audit
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete for GDPR
  createdBy: varchar('created_by', { length: 100 }).default('system'), // Agent ID
}, (table) => ({
  // Performance Indexes
  tierIdx: index('vendor_tier_idx').on(table.tier),
  trustIdx: index('vendor_trust_idx').on(table.trustScore),
  verificationIdx: index('vendor_verification_idx').on(table.verificationStatus),
  syncIdx: index('vendor_sync_idx').on(table.catalogSyncEnabled, table.lastCatalogSyncAt),
  whatsappIdx: uniqueIndex('vendor_whatsapp_idx').on(table.whatsappNumber),
  uuidIdx: uniqueIndex('vendor_uuid_idx').on(table.uuid),
}));

// ==========================================
// DOMAIN: Product Catalog (Event Sourced)
// ==========================================
export const productStatuses = [
  'draft',              // Initial creation
  'pending_review',     // Awaiting moderation
  'active',             // Live on marketplace
  'paused',             // Vendor paused
  'out_of_stock',       // Inventory depleted
  'price_changed',      // Pending price update propagation
  'suspended',          // Policy violation
  'archived',           // Soft delete
  'failed_ingestion',   // Pipeline error
  'failed_vectorization' // AI pipeline error
] as const;
export type ProductStatus = typeof productStatuses[number];

export const products = mysqlTable('products', {
  // Primary Identity
  id: serial('id').primaryKey(),
  uuid: varchar('uuid', { length: 36 }).notNull().unique(), // Global distributed ID
  
  // Foreign Keys
  vendorId: serial('vendor_id').references(() => vendors.id).notNull(),
  
  // Core Content
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(), // SEO: modern-grey-sofa-nairobi-12345
  description: json('description'), // Structured: { text: "...", features: [...], specs: {...} }
  shortDescription: varchar('short_description', { length: 500 }), // Meta description
  
  // Pricing (Multi-currency for expansion)
  priceKes: decimal('price_kes', { precision: 12, scale: 2 }).notNull(), // Kenyan Shilling (primary)
  priceUsd: decimal('price_usd', { precision: 12, scale: 2 }), // US Dollar
  priceNgn: decimal('price_ngn', { precision: 12, scale: 2 }), // Nigerian Naira (future)
  priceZar: decimal('price_zar', { precision: 12, scale: 2 }), // South African Rand (future)
  priceNegotiable: boolean('price_negotiable').default(false), // WhatsApp haggling culture
  originalPriceKes: decimal('original_price_kes', { precision: 12, scale: 2 }), // For "was/now" displays
  
  // Media (WhatsApp Catalog Bridge)
  sourceUrl: varchar('source_url', { length: 512 }).notNull(), // Original wa.me link
  imageUrl: varchar('image_url', { length: 512 }).notNull(), // Primary CDN URL
  imageUrlCdn: varchar('image_url_cdn', { length: 512 }), // Cloudflare/CloudFront optimized
  imageHash: varchar('image_hash', { length: 64 }).notNull().unique(), // SHA-256 deduplication
  imageDimensions: json('image_dimensions'), // { width: 1200, height: 800 }
  imageSizeKb: int('image_size_kb'), // For bandwidth optimization
  galleryUrls: json('gallery_urls'), // Additional images from WhatsApp catalog
  
  // AI/Vector Infrastructure (Zilliz Bridge)
  vectorId: varchar('vector_id', { length: 64 }).unique(), // Zilliz primary key
  vectorStatus: varchar('vector_status', { length: 20 }).default('pending'), // pending/ready/failed/none
  vectorDimensions: int('vector_dimensions').default(768), // SigLIP-768 standard
  vectorModelVersion: varchar('vector_model_version', { length: 20 }).default('siglip-base-1.0'),
  similarityHash: varchar('similarity_hash', { length: 16 }), // LSH for approximate dedup
  visualEmbedding: json('visual_embedding'), // Cache for quick similarity without Zilliz roundtrip
  
  // AI-Enhanced Categorization
  categoryId: int('category_id'), // Future: normalized taxonomy table
  aiCategory: varchar('ai_category', { length: 100 }), // SigLIP predicted: "furniture/sofas/modern"
  aiTags: json('ai_tags'), // ["modern", "grey", "leather", "3-seater", "nairobi"]
  aiConfidenceScore: decimal('ai_confidence_score', { precision: 3, scale: 2 }), // 0.00-1.00
  aiSuggestedPrice: decimal('ai_suggested_price', { precision: 12, scale: 2 }), // Market analysis
  
  // Discovery & SEO
  searchKeywords: json('search_keywords'), // Extracted terms for full-text search
  metaTitle: varchar('meta_title', { length: 70 }),
  metaDescription: varchar('meta_description', { length: 160 }),
  canonicalUrl: varchar('canonical_url', { length: 512 }),
  
  // Engagement Metrics
  viewCount: int('view_count').default(0),
  clickCount: int('click_count').default(0),
  inquiryCount: int('inquiry_count').default(0), // WhatsApp clicks
  conversionCount: int('conversion_count').default(0), // Tracked sales
  clickThroughRate: decimal('click_through_rate', { precision: 5, scale: 4 }).default('0.0000'),
  searchRankingScore: decimal('search_ranking_score', { precision: 8, scale: 4 }).default('0.0000'), // Elasticsearch BM25
  
  // State Machine
  status: varchar('status', { length: 30 }).$type<ProductStatus>().default('draft').notNull(),
  statusReason: varchar('status_reason', { length: 255 }), // Why suspended/archived
  moderatedAt: timestamp('moderated_at'),
  moderatedBy: varchar('moderated_by', { length: 100 }), // Agent or admin ID
  
  // Pipeline Tracking (Observability)
  ingestionSource: varchar('ingestion_source', { length: 50 }).default('whatsapp_manual'), // whatsapp_auto/api/csv
  ingestionJobId: varchar('ingestion_job_id', { length: 64 }), // BullMQ job reference
  ingestionAttemptedAt: timestamp('ingestion_attempted_at'),
  ingestionCompletedAt: timestamp('ingestion_completed_at'),
  ingestionDurationMs: int('ingestion_duration_ms'), // Performance metric
  ingestionWorkerNode: varchar('ingestion_worker_node', { length: 64 }), // Hostname
  retryCount: int('retry_count').default(0),
  lastError: json('last_error'), // Structured: { code, message, stack, timestamp }
  lastErrorAt: timestamp('last_error_at'),
  
  // Flexible Attributes (Schema Evolution)
  attributes: json('attributes'), // { color: "charcoal", material: "genuine_leather", warranty: "12_months" }
  whatsappMetadata: json('whatsapp_metadata'), // Original catalog parsing context
  
  // Versioning (Optimistic Locking)
  version: int('version').default(1),
  lastModifiedBy: varchar('last_modified_by', { length: 100 }).default('system'),
  
  // Audit
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  // Query Optimization Indexes
  statusIdx: index('product_status_idx').on(table.status),
  vendorStatusIdx: index('product_vendor_status_idx').on(table.vendorId, table.status),
  vendorCreatedIdx: index('product_vendor_created_idx').on(table.vendorId, table.createdAt),
  vectorIdx: uniqueIndex('product_vector_idx').on(table.vectorId),
  hashIdx: uniqueIndex('product_hash_idx').on(table.imageHash),
  priceIdx: index('product_price_idx').on(table.priceKes),
  categoryIdx: index('product_category_idx').on(table.aiCategory),
  createdIdx: index('product_created_idx').on(table.createdAt),
  slugIdx: uniqueIndex('product_slug_idx').on(table.slug),
  uuidIdx: uniqueIndex('product_uuid_idx').on(table.uuid),
  
  // Composite indexes for common queries
  activePriceIdx: index('product_active_price_idx').on(table.status, table.priceKes),
  vendorCategoryIdx: index('product_vendor_category_idx').on(table.vendorId, table.aiCategory),
}));

// ==========================================
// DOMAIN: Event Store (Immutable Audit Trail)
// ==========================================
export const productEvents = mysqlTable('product_events', {
  id: serial('id').primaryKey(),
  uuid: varchar('uuid', { length: 36 }).notNull().unique(),
  
  // Event Target
  productId: serial('product_id').references(() => products.id).notNull(),
  productUuid: varchar('product_uuid', { length: 36 }).notNull(), // Denormalized for querying
  
  // Event Content
  eventType: varchar('event_type', { length: 50 }).notNull(), // created/updated/vectorized/published/price_changed/suspended
  eventVersion: int('event_version').default(1), // Schema versioning for events
  eventData: json('event_data').notNull(), // Immutable snapshot of changes
  previousState: json('previous_state'), // For rollback analysis
  
  // Actor & Context
  actor: varchar('actor', { length: 100 }).notNull(), // Agent ID, user ID, or 'system'
  actorType: varchar('actor_type', { length: 20 }).default('agent'), // agent/user/system/vendor
  correlationId: varchar('correlation_id', { length: 36 }), // Distributed tracing (X-Request-ID)
  sessionId: varchar('session_id', { length: 64 }), // User session for audit
  ipAddress: varchar('ip_address', { length: 45 }), // IPv6 compatible
  userAgent: varchar('user_agent', { length: 512 }),
  
  // Timestamping
  createdAt: timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'), // When event was materialized to read models
}, (table) => ({
  // Event sourcing queries
  productEventIdx: index('event_product_idx').on(table.productId, table.createdAt),
  productUuidIdx: index('event_product_uuid_idx').on(table.productUuid),
  correlationIdx: index('event_correlation_idx').on(table.correlationId),
  actorIdx: index('event_actor_idx').on(table.actor),
  typeIdx: index('event_type_idx').on(table.eventType),
  createdIdx: index('event_created_idx').on(table.createdAt),
}));

// ==========================================
// DOMAIN: Price History (Financial Audit)
// ==========================================
export const priceHistory = mysqlTable('price_history', {
  id: serial('id').primaryKey(),
  productId: serial('product_id').references(() => products.id).notNull(),
  
  priceKes: decimal('price_kes', { precision: 12, scale: 2 }).notNull(),
  priceUsd: decimal('price_usd', { precision: 12, scale: 2 }),
  changedBy: varchar('changed_by', { length: 100 }).notNull(), // Agent or vendor
  changeReason: varchar('change_reason', { length: 255 }), // "market_adjustment", "vendor_request", "ai_suggestion"
  
  effectiveFrom: timestamp('effective_from').defaultNow().notNull(),
  effectiveTo: timestamp('effective_to'), // Null = current price
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  productPriceIdx: index('price_product_idx').on(table.productId, table.effectiveFrom),
}));

// ==========================================
// DOMAIN: Dead Letter Queue (Operational Resilience)
// ==========================================
export const ingestionFailures = mysqlTable('ingestion_failures', {
  id: serial('id').primaryKey(),
  uuid: varchar('uuid', { length: 36 }).notNull().unique(),
  
  // Source Information
  sourceUrl: varchar('source_url', { length: 512 }).notNull(),
  vendorId: serial('vendor_id').references(() => vendors.id),
  vendorUuid: varchar('vendor_uuid', { length: 36 }),
  
  // Failure Classification
  errorCategory: varchar('error_category', { length: 50 }).notNull(), // network/ai/database/validation/meta_rate_limit/meta_404
  errorCode: varchar('error_code', { length: 50 }), // HTTP status, AI error code, DB error code
  errorMessage: varchar('error_message', { length: 1024 }),
  errorStack: json('error_stack'),
  errorFingerprint: varchar('error_fingerprint', { length: 64 }), // Hash for grouping similar errors
  
  // Context
  workerNode: varchar('worker_node', { length: 64 }), // Hostname
  jobId: varchar('job_id', { length: 64 }), // BullMQ job ID
  correlationId: varchar('correlation_id', { length: 36 }),
  
  // Payload Preservation
  originalPayload: json('original_payload'), // Full job data for replay
  
  // Retry Management
  retryAttempts: int('retry_attempts').default(0),
  lastRetryAt: timestamp('last_retry_at'),
  nextRetryAt: timestamp('next_retry_at'), // Exponential backoff scheduling
  permanentFailure: boolean('permanent_failure').default(false),
  
  // Resolution Workflow
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: varchar('resolved_by', { length: 100 }),
  resolutionType: varchar('resolution_type', { length: 50 }), // manual_retry/auto_retry/discarded/fixed_upstream
  resolutionNotes: text('resolution_notes'),
  
  // Audit
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Operational queries
  retryIdx: index('failure_retry_idx').on(table.permanentFailure, table.nextRetryAt),
  vendorIdx: index('failure_vendor_idx').on(table.vendorId),
  categoryIdx: index('failure_category_idx').on(table.errorCategory),
  fingerprintIdx: index('failure_fingerprint_idx').on(table.errorFingerprint),
  createdIdx: index('failure_created_idx').on(table.createdAt),
}));

// ==========================================
// DOMAIN: Vector Collection Metadata (Zilliz Sync)
// ==========================================
export const vectorCollections = mysqlTable('vector_collections', {
  id: serial('id').primaryKey(),
  collectionName: varchar('collection_name', { length: 100 }).notNull().unique(),
  
  // Zilliz Configuration
  zillizCollectionId: varchar('zilliz_collection_id', { length: 64 }),
  dimension: int('dimension').default(768).notNull(),
  metricType: varchar('metric_type', { length: 20 }).default('COSINE'), // COSINE/L2/IP
  consistencyLevel: varchar('consistency_level', { length: 20 }).default('Bounded'),
  
  // Statistics
  vectorCount: bigint('vector_count', { mode: 'number' }).default(0),
  lastSyncAt: timestamp('last_sync_at'),
  syncStatus: varchar('sync_status', { length: 20 }).default('active'), // active/paused/error
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  nameIdx: uniqueIndex('vector_collection_name_idx').on(table.collectionName),
}));

// ==========================================
// VIEWS: Materialized Projections (Application Layer)
// ==========================================
export type ProductSearchView = {
  // Denormalized for Elasticsearch/Typesense
  id: number;
  uuid: string;
  title: string;
  description: string;
  priceKes: string;
  vendorName: string;
  vendorTier: VendorTier;
  vendorTrustScore: string;
  category: string;
  tags: string[];
  imageUrl: string;
  status: ProductStatus;
  vectorStatus: string;
  createdAt: Date;
  // Computed
  searchBoost: number; // Vendor tier + trust score + engagement
};
