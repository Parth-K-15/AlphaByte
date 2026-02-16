import { createClient } from "redis";

let redisClient = null;
let isConnected = false;

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

    // Read config at runtime (after dotenv has loaded)
    const host = process.env.REDIS_HOST || "localhost";
    const port = parseInt(process.env.REDIS_PORT || "6379");
    const password = process.env.REDIS_PASSWORD || undefined;
    const database = parseInt(process.env.REDIS_DB || "0");
    const isRemote = host !== "localhost" && host !== "127.0.0.1";

    console.log(`🔧 Redis Config: host=${host}, port=${port}, tls=${isRemote}`);

    // Use URL-based connection for remote Redis (Upstash)
    // rediss:// = Redis over TLS
    if (isRemote) {
      const redisUrl = `rediss://default:${password}@${host}:${port}`;
      redisClient = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.log("⚠️  Redis reconnection attempts exhausted. Continuing without cache.");
              return false;
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });
    } else {
      // Local Redis (no TLS)
      redisClient = createClient({
        socket: {
          host: host,
          port: port,
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.log("⚠️  Redis reconnection attempts exhausted. Continuing without cache.");
              return false;
            }
            return Math.min(retries * 100, 3000);
          },
        },
        password: password,
        database: database,
      });
    }

    // Error handling
    redisClient.on("error", (err) => {
      console.error("❌ Redis Client Error:", err.code || err.message || err);
      isConnected = false;
    });

    redisClient.on("connect", () => {
      console.log("🔄 Redis connecting...");
    });

    redisClient.on("ready", () => {
      console.log("✅ Redis connected successfully");
      console.log(`   Host: ${host}:${port}`);
      console.log(`   TLS: ${isRemote ? "enabled" : "disabled"}`);
      console.log(`   DB: ${database}`);
      isConnected = true;
    });

    redisClient.on("end", () => {
      console.log("⚠️  Redis connection closed");
      isConnected = false;
    });

    // Connect to Redis with timeout
    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
    );

    await Promise.race([connectPromise, timeoutPromise]);

    return redisClient;
  } catch (error) {
    console.error("❌ Failed to initialize Redis:", error.code || error.message || 'Unknown error');
    console.log("⚠️  Application will continue without caching");
    console.log("💡 To disable caching, set CACHE_ENABLED=false in .env");
    
    // Clean up failed client
    if (redisClient) {
      try {
        await redisClient.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
      redisClient = null;
    }
    
    isConnected = false;
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
