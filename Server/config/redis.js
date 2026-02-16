import { createClient } from "redis";

let redisClient = null;
let isConnected = false;

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || "0"),
};

/**
 * Initialize Redis client
 */
export const initRedis = async () => {
  try {
    // Check if caching is enabled
    if (process.env.CACHE_ENABLED === "false") {
      console.log("⚠️  Redis caching is disabled via CACHE_ENABLED=false");
      return null;
    }

    redisClient = createClient({
      socket: {
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
      },
      password: REDIS_CONFIG.password,
      database: REDIS_CONFIG.database,
    });

    // Error handling
    redisClient.on("error", (err) => {
      console.error("❌ Redis Client Error:", err.message);
      isConnected = false;
    });

    redisClient.on("connect", () => {
      console.log("🔄 Redis connecting...");
    });

    redisClient.on("ready", () => {
      console.log("✅ Redis connected successfully");
      console.log(`   Host: ${REDIS_CONFIG.host}:${REDIS_CONFIG.port}`);
      console.log(`   DB: ${REDIS_CONFIG.database}`);
      isConnected = true;
    });

    redisClient.on("end", () => {
      console.log("⚠️  Redis connection closed");
      isConnected = false;
    });

    // Connect to Redis
    await redisClient.connect();

    return redisClient;
  } catch (error) {
    console.error("❌ Failed to initialize Redis:", error.message);
    console.log("⚠️  Application will continue without caching");
    return null;
  }
};

/**
 * Get Redis client instance
 */
export const getRedisClient = () => {
  return redisClient;
};

/**
 * Check if Redis is connected
 */
export const isRedisConnected = () => {
  return isConnected && redisClient?.isOpen;
};

/**
 * Gracefully close Redis connection
 */
export const closeRedis = async () => {
  if (redisClient && isConnected) {
    await redisClient.quit();
    console.log("✅ Redis connection closed gracefully");
  }
};

export default {
  initRedis,
  getRedisClient,
  isRedisConnected,
  closeRedis,
};
