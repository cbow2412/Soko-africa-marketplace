import { Queue } from "bullmq";
import Redis from "ioredis";

async function test() {
  console.log("Testing direct Redis connection...");
  const redis = new Redis();
  await redis.set("test-key", "hello");
  const val = await redis.get("test-key");
  console.log("Redis GET test-key:", val);

  console.log("Testing BullMQ injection...");
  const queue = new Queue("test-queue", { connection: redis });
  await queue.add("test-job", { foo: "bar" });
  console.log("Job added to test-queue");
  
  const len = await redis.llen("bull:test-queue:wait");
  console.log("Queue length:", len);
  
  await queue.close();
  await redis.quit();
}

test().catch(console.error);
