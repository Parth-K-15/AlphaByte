import { getRedisClient, initRedis, isRedisConnected } from "../config/redis.js";

const TOKEN_BUCKET_LUA = `
-- KEYS[1] = bucket key
-- ARGV[1] = capacity
-- ARGV[2] = refillRatePerMs
-- ARGV[3] = nowMs
-- ARGV[4] = cost
-- ARGV[5] = ttlMs

local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local nowMs = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])
local ttlMs = tonumber(ARGV[5])

local data = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(data[1])
local ts = tonumber(data[2])

if tokens == nil then
  tokens = capacity
  ts = nowMs
end

if nowMs < ts then
  ts = nowMs
end

local delta = nowMs - ts
if delta > 0 then
  tokens = math.min(capacity, tokens + (delta * refillRate))
  ts = nowMs
end

local allowed = 0
local retryAfterMs = 0

if tokens >= cost then
  allowed = 1
  tokens = tokens - cost
else
  if refillRate > 0 then
    retryAfterMs = math.ceil((cost - tokens) / refillRate)
  else
    retryAfterMs = 0
  end
end

redis.call('HSET', key, 'tokens', tokens, 'ts', ts)
if ttlMs and ttlMs > 0 then
  redis.call('PEXPIRE', key, ttlMs)
end

return { allowed, tokens, retryAfterMs }
`;

let lazyInitPromise = null;

const tryLazyInitRedis = async () => {
  if (isRedisConnected()) return;
  if (lazyInitPromise) return lazyInitPromise;
  lazyInitPromise = (async () => {
    try {
      await initRedis();
    } finally {
      // allow future retries if init failed
      lazyInitPromise = null;
    }
  })();
  return lazyInitPromise;
};

const getClientIp = (req) => {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) {
    return xff.split(",")[0].trim();
  }
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) {
    return realIp.trim();
  }
  return (
    req.ip ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "unknown"
  );
};

const clampPositiveInt = (value, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
};

/**
 * Redis-backed Token Bucket rate limiter.
 *
 * - Atomic: uses Redis EVAL (Lua)
 * - Fail-open: if Redis is unavailable, requests proceed
 *
 * Options:
 * - name: unique name per limiter (used in redis key)
 * - capacity: max burst tokens
 * - refillTokens: tokens refilled per interval
 * - refillIntervalMs: interval duration in ms
 * - cost: tokens per request (default 1)
 * - identifier: (req) => string (default ip)
 * - enabled: boolean (default true unless RATE_LIMIT_ENABLED=false)
 */
export const tokenBucketRateLimit = (options) => {
  const name = options?.name || "default";

  const envEnabled = process.env.RATE_LIMIT_ENABLED;
  const enabled =
    typeof options?.enabled === "boolean"
      ? options.enabled
      : envEnabled === undefined
        ? true
        : envEnabled !== "false";

  const capacity = clampPositiveInt(options?.capacity, 60);
  const refillTokens = clampPositiveInt(options?.refillTokens, capacity);
  const refillIntervalMs = clampPositiveInt(options?.refillIntervalMs, 60_000);
  const cost = clampPositiveInt(options?.cost, 1);

  const identifier =
    typeof options?.identifier === "function"
      ? options.identifier
      : (req) => getClientIp(req);

  const keyPrefix = options?.keyPrefix || "ratelimit:tb";

  // tokens/ms
  const refillRatePerMs = refillTokens / refillIntervalMs;
  const refillTimeForCapacityMs = Math.ceil(capacity / refillRatePerMs);
  const ttlMs = Math.max(5_000, refillTimeForCapacityMs * 2);

  if (!Number.isFinite(refillRatePerMs) || refillRatePerMs <= 0) {
    throw new Error(
      `Invalid rate limiter config for ${name}: refillTokens/refillIntervalMs must be > 0`,
    );
  }

  return async (req, res, next) => {
    if (!enabled) return next();
    if (typeof options?.skip === "function" && options.skip(req)) return next();

    // Ensure Redis is connected (serverless-safe)
    if (!isRedisConnected()) {
      await tryLazyInitRedis();
    }

    if (!isRedisConnected()) {
      // Fail-open if Redis is unavailable
      return next();
    }

    try {
      const redisClient = getRedisClient();
      const rawId = identifier(req);
      const id = String(rawId || "unknown");
      const key = `${keyPrefix}:${name}:${id}`;
      const nowMs = Date.now();

      const result = await redisClient.eval(TOKEN_BUCKET_LUA, {
        keys: [key],
        arguments: [
          String(capacity),
          String(refillRatePerMs),
          String(nowMs),
          String(cost),
          String(ttlMs),
        ],
      });

      const allowed = Number(result?.[0] ?? 0);
      const tokensRemaining = Number(result?.[1] ?? 0);
      const retryAfterMs = Number(result?.[2] ?? 0);

      res.setHeader("X-RateLimit-Limit", String(capacity));
      res.setHeader(
        "X-RateLimit-Remaining",
        String(Math.max(0, Math.floor(tokensRemaining))),
      );

      if (allowed === 1) {
        return next();
      }

      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));

      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again shortly.",
        code: "RATE_LIMITED",
        retryAfterSeconds,
      });
    } catch (error) {
      // Fail-open on unexpected limiter errors
      console.error("Rate limiter error:", error?.message || error);
      return next();
    }
  };
};

export default {
  tokenBucketRateLimit,
};
