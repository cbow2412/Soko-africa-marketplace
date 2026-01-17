import { createClient, RedisClientType } from "redis";

/**
 * Redis Client Service
 * 
 * Manages Redis connection, caching, and session management
 * Used for search result caching, job queue, and rate limiting
 */

export interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  timeout?: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // For cache invalidation
}

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  /**
   * Initialize Redis connection
   */
  async connect(config: RedisConfig = {}): Promise<void> {
    try {
      console.log("[Redis] Connecting to Redis...");

      const {
        host = process.env.REDIS_HOST || "localhost",
        port = parseInt(process.env.REDIS_PORT || "6379"),
        password = process.env.REDIS_PASSWORD,
        db = 0,
        timeout = 5000,
      } = config;

      this.client = createClient({
        host,
        port,
        password,
        db,
        socket: {
          connectTimeout: timeout,
        },
      });

      // Handle connection events
      this.client.on("error", (err) => {
        console.error("[Redis] Error:", err);
      });

      this.client.on("connect", () => {
        console.log("[Redis] Connected");
      });

      // Connect
      await this.client.connect();
      this.isConnected = true;

      console.log("[Redis] Connected successfully");
    } catch (error) {
      console.error("[Redis] Connection failed:", error);
      throw error;
    }
  }

  /**
   * Set cache value
   */
  async set(
    key: string,
    value: any,
    options: CacheOptions = {}
  ): Promise<void> {
    if (!this.client) throw new Error("Redis not connected");

    try {
      const serialized = JSON.stringify(value);
      const { ttl = 3600 } = options; // Default 1 hour

      if (ttl > 0) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }

      console.log(`[Redis] Set cache: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error("[Redis] Set failed:", error);
      throw error;
    }
  }

  /**
   * Get cache value
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client) throw new Error("Redis not connected");

    try {
      const value = await this.client.get(key);

      if (!value) {
        console.log(`[Redis] Cache miss: ${key}`);
        return null;
      }

      console.log(`[Redis] Cache hit: ${key}`);
      return JSON.parse(value) as T;
    } catch (error) {
      console.error("[Redis] Get failed:", error);
      throw error;
    }
  }

  /**
   * Delete cache value
   */
  async delete(key: string): Promise<void> {
    if (!this.client) throw new Error("Redis not connected");

    try {
      await this.client.del(key);
      console.log(`[Redis] Deleted: ${key}`);
    } catch (error) {
      console.error("[Redis] Delete failed:", error);
      throw error;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!this.client) throw new Error("Redis not connected");

    try {
      await this.client.flushDb();
      console.log("[Redis] Cache cleared");
    } catch (error) {
      console.error("[Redis] Clear failed:", error);
      throw error;
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    if (!this.client) throw new Error("Redis not connected");

    try {
      const result = await this.client.incrBy(key, amount);
      console.log(`[Redis] Incremented ${key} by ${amount} -> ${result}`);
      return result;
    } catch (error) {
      console.error("[Redis] Increment failed:", error);
      throw error;
    }
  }

  /**
   * Rate limiting (token bucket algorithm)
   */
  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number }> {
    if (!this.client) throw new Error("Redis not connected");

    try {
      const current = await this.client.incr(key);

      if (current === 1) {
        // First request in window
        await this.client.expire(key, windowSeconds);
      }

      const allowed = current <= limit;
      const remaining = Math.max(0, limit - current);

      console.log(
        `[Redis] Rate limit check: ${key} (${current}/${limit}) - ${allowed ? "ALLOWED" : "BLOCKED"}`
      );

      return { allowed, remaining };
    } catch (error) {
      console.error("[Redis] Rate limit check failed:", error);
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<any> {
    if (!this.client) throw new Error("Redis not connected");

    try {
      const info = await this.client.info("stats");
      const dbSize = await this.client.dbSize();

      return {
        connected: this.isConnected,
        dbSize,
        info,
      };
    } catch (error) {
      console.error("[Redis] Stats retrieval failed:", error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      console.log("[Redis] Disconnected");
    }
  }

  /**
   * Check connection status
   */
  isConnectedStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get raw client for advanced operations
   */
  getClient(): RedisClientType | null {
    return this.client;
  }
}

// Export singleton instance
export const redisService = new RedisService();
