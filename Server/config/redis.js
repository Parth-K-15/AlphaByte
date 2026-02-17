import { createClient } from "redis";

let redisClient = null;
let isConnected = false;
let lastErrorLog = { key: null, at: 0 };

const logRedisErrorThrottled = (err) => {
  const code = err?.code || "UNKNOWN";
  const msg = err?.message || String(err);
  const key = `${code}:${msg}`;
  const now = Date.now();
  if (lastErrorLog.key === key && now - lastErrorLog.at < 2000) {
    return;
  }
  lastErrorLog = { key, at: now };
  console.error("❌ Redis Client Error:", code || msg);
};

/**
 * Initialize Redis client
 */
export const initRedis = async () => {
  try {
    // Allow Redis for multiple features (cache, rate limiting, etc.)
    // If both are explicitly disabled, skip Redis entirely.
    if (process.env.CACHE_ENABLED === "false" && process.env.RATE_LIMIT_ENABLED === "false") {
      console.log("⚠️  Redis is disabled via CACHE_ENABLED=false and RATE_LIMIT_ENABLED=false");
      return null;
    }

    // Read config at runtime (after dotenv has loaded)
    const redisUrlFromEnv = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || "";
    const host = process.env.REDIS_HOST || "localhost";
    const port = parseInt(process.env.REDIS_PORT || "6379");
    const password = process.env.REDIS_PASSWORD || undefined;
    const database = parseInt(process.env.REDIS_DB || "0");

    const isRemoteHost = host !== "localhost" && host !== "127.0.0.1";
    const isRemote = Boolean(redisUrlFromEnv) || isRemoteHost;

    console.log(
      `🔧 Redis Config: ${redisUrlFromEnv ? "url=SET" : `host=${host}, port=${port}`}, tls=${isRemote}`,
    );

    // Prefer URL-based connection when provided (Upstash commonly provides this)
    // Accept redis:// or rediss://
    if (redisUrlFromEnv) {
      redisClient = createClient({
        url: redisUrlFromEnv,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.log("⚠️  Redis reconnection attempts exhausted. Continuing without Redis features.");
              return false;
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });
    } else if (isRemoteHost) {
      // Remote Redis via host/port/password (rediss:// = Redis over TLS)
      const redisUrl = `rediss://default:${password}@${host}:${port}`;
      redisClient = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.log("⚠️  Redis reconnection attempts exhausted. Continuing without Redis features.");
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
              console.log("⚠️  Redis reconnection attempts exhausted. Continuing without Redis features.");
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
      logRedisErrorThrottled(err);
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
    console.log("⚠️  Application will continue without Redis features (cache/rate limiting)");
    console.log("💡 Fix: start Redis locally, or set REDIS_URL/REDIS_HOST, or disable with RATE_LIMIT_ENABLED=false and CACHE_ENABLED=false");
    
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
