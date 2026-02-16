import { getRedisClient, isRedisConnected } from "../config/redis.js";

/**
 * Caching middleware for GET requests
 * @param {number} ttl - Time to live in seconds
 * @param {function} keyGenerator - Function to generate cache key from req
 */
export const cache = (ttl, keyGenerator) => {
  return async (req, res, next) => {
    // Skip caching if Redis is not connected or caching is disabled
    if (!isRedisConnected()) {
      return next();
    }

    try {
      const cacheKey = keyGenerator(req);
      const redisClient = getRedisClient();

      // Try to get cached data
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        // Cache hit
        const data = JSON.parse(cachedData);
        return res.json(data);
      }

      // Cache miss - store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function (data) {
        // Only cache successful responses
        if (res.statusCode === 200 && data) {
          redisClient
            .setEx(cacheKey, ttl, JSON.stringify(data))
            .catch((err) => console.error("Cache storage error:", err.message));
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error.message);
      // Continue without caching on error
      next();
    }
  };
};

/**
 * Simple cache getter
 */
export const getCache = async (key) => {
  if (!isRedisConnected()) return null;

  try {
    const redisClient = getRedisClient();
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Cache get error:", error.message);
    return null;
  }
};

/**
 * Simple cache setter
 */
export const setCache = async (key, value, ttl = 300) => {
  if (!isRedisConnected()) return false;

  try {
    const redisClient = getRedisClient();
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Cache set error:", error.message);
    return false;
  }
};

/**
 * Delete a single cache key
 */
export const deleteCache = async (key) => {
  if (!isRedisConnected()) return false;

  try {
    const redisClient = getRedisClient();
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error("Cache delete error:", error.message);
    return false;
  }
};

/**
 * Delete multiple cache keys by pattern
 */
export const deleteCachePattern = async (pattern) => {
  if (!isRedisConnected()) return false;

  try {
    const redisClient = getRedisClient();
    const keys = await redisClient.keys(pattern);

    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`🗑️  Cleared ${keys.length} cache keys matching: ${pattern}`);
    }

    return true;
  } catch (error) {
    console.error("Cache pattern delete error:", error.message);
    return false;
  }
};

/**
 * Clear all cache
 */
export const clearAllCache = async () => {
  if (!isRedisConnected()) return false;

  try {
    const redisClient = getRedisClient();
    await redisClient.flushDb();
    console.log("🗑️  All cache cleared");
    return true;
  } catch (error) {
    console.error("Cache clear error:", error.message);
    return false;
  }
};

export default {
  cache,
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  clearAllCache,
};
