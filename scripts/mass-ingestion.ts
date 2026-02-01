#!/usr/bin/env node
/**
 * Mass Ingestion CLI
 * 
 * Usage:
 *   pnpm tsx scripts/mass-ingestion.ts [limit]
 * 
 * Examples:
 *   pnpm tsx scripts/mass-ingestion.ts          # Process all 2,050 URLs
 *   pnpm tsx scripts/mass-ingestion.ts 500      # Process first 500 URLs
 *   pnpm tsx scripts/mass-ingestion.ts 100      # Process first 100 URLs (high priority)
 */

import { executeMassIngestion } from "../server/services/mass-ingestion-orchestrator";
import { redisService } from "../server/services/redis-client";
import * as path from "path";

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           SOKO AFRICA - MASS DATA INJECTION SYSTEM             ║
║                                                                ║
║  Mission: Flood the ingestion queue with 2,050 WhatsApp links ║
║  Strategy: Stealth scraping + Batch processing + Redis queue  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);

  // Parse command line arguments
  const limit = process.argv[2] ? parseInt(process.argv[2], 10) : undefined;

  if (limit) {
    console.log(`[CLI] Running in TEST MODE: Processing first ${limit} URLs\n`);
  } else {
    console.log(`[CLI] Running in PRODUCTION MODE: Processing ALL URLs\n`);
  }

  try {
    // Initialize Redis
    console.log("[CLI] Connecting to Redis...");
    await redisService.connect();
    console.log("[CLI] ✓ Redis connected\n");

    // Execute mass ingestion
    const dataFilePath = path.join(process.cwd(), "data", "whatsapp-links.txt");
    const report = await executeMassIngestion(dataFilePath, limit);

    // Display final report
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                     INGESTION REPORT                           ║
╚════════════════════════════════════════════════════════════════╝

📊 STATISTICS:
  • Total Links Processed:  ${report.totalLinks}
  • Successful Scrapes:     ${report.successCount} (${((report.successCount / report.totalLinks) * 100).toFixed(1)}%)
  • Failed Scrapes:         ${report.failedCount} (${((report.failedCount / report.totalLinks) * 100).toFixed(1)}%)
  • Dead Links (404):       ${report.deadLinks}
  • Rate Limited (429):     ${report.rateLimited}

⏱️  PERFORMANCE:
  • Total Duration:         ${(report.duration / 1000).toFixed(2)}s
  • Average Time Per Batch: ${(report.averageTimePerBatch / 1000).toFixed(2)}s
  • Batches Processed:      ${report.batches.length}

📁 REPORT SAVED: ingestion-report.json

🚀 NEXT STEPS:
  1. Check Redis queue: redis-cli LLEN bull:soko-ingestion:wait
  2. Monitor workers: Check Docker logs for background processing
  3. Verify frontend: Products should appear in real-time on the marketplace

╔════════════════════════════════════════════════════════════════╗
║                    MISSION ACCOMPLISHED                        ║
╚════════════════════════════════════════════════════════════════╝
    `);

    // Disconnect Redis
    await redisService.disconnect();
    console.log("[CLI] ✓ Redis disconnected");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ FATAL ERROR:", error);
    
    // Cleanup
    try {
      await redisService.disconnect();
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    process.exit(1);
  }
}

// Run main function
main();
