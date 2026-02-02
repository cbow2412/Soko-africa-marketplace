/**
 * SOKO AFRICA - NEURAL ENGINE v2.0
 * Simulation: 2,050-item flood test
 */

import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import crypto from 'crypto';

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
const ingestionQueue = new Queue('ingestion-queue', { connection: redis });

async function simulateFlood() {
  console.log('🌊 Starting 2,050-item flood simulation...');
  
  const items = 2050;
  const batchSize = 50;
  
  for (let i = 0; i < items; i += batchSize) {
    const batch = [];
    for (let j = 0; j < Math.min(batchSize, items - i); j++) {
      const id = i + j;
      batch.push(ingestionQueue.add(`product-${id}`, {
        url: `https://picsum.photos/seed/${id}/224/224`,
        vendorId: Math.floor(Math.random() * 100) + 1,
        imageHash: crypto.createHash('md5').update(`img-${id}`).digest('hex'),
        title: `Simulated Product ${id}`,
        price: Math.floor(Math.random() * 10000) + 500,
        metadata: {
          aiTags: ['simulated', 'test-flood', 'neural-engine-v2']
        }
      }));
    }
    await Promise.all(batch);
    console.log(`[Flood] Queued ${Math.min(i + batchSize, items)} / ${items} items`);
  }
  
  console.log('✅ Flood simulation queued successfully.');
  process.exit(0);
}

simulateFlood().catch(console.error);
