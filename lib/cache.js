// lib/cache.js
// Simple cache implementation with optional Redis backend.
// Provides get, set, and has functions. In-memory cache uses a Map with TTL support.

let inMemoryCache = new Map();
let ttlMap = new Map(); // stores expiration timestamps (ms)

// Helper to check if a key is expired
function isExpired(key) {
  const expireAt = ttlMap.get(key);
  return expireAt !== undefined && Date.now() > expireAt;
}

// If REDIS_URL is set, attempt to use ioredis (fallback to in-memory if import fails)
let redisClient = null;
let redisInitPromise = null;

async function getRedisClient() {
  if (redisClient) return redisClient;
  if (!process.env.REDIS_URL) return null;
  if (!redisInitPromise) {
    redisInitPromise = import('ioredis')
      .then(({ default: Redis }) => {
        redisClient = new Redis(process.env.REDIS_URL);
        console.log('Cache: Using Redis backend');
        return redisClient;
      })
      .catch((e) => {
        console.warn('Cache: ioredis not installed, falling back to in-memory cache');
        return null;
      });
  }
  return redisInitPromise;
}

/** Get a cached value. Returns undefined if missing or expired. */
export async function get(key) {
  const client = await getRedisClient();
  if (client) {
    try {
      const payload = await client.get(key);
      if (!payload) return undefined;
      const { value, expiresAt } = JSON.parse(payload);
      if (expiresAt && Date.now() > expiresAt) {
        await client.del(key);
        return undefined;
      }
      return value;
    } catch (e) {
      console.error('Cache get error (Redis):', e);
    }
  }
  // In-memory fallback
  if (isExpired(key)) {
    inMemoryCache.delete(key);
    ttlMap.delete(key);
    return undefined;
  }
  return inMemoryCache.get(key);
}

/** Set a cached value with optional ttlMs (milliseconds). */
export async function set(key, value, ttlMs = 10 * 60 * 1000) { // default 10 minutes
  const client = await getRedisClient();
  if (client) {
    try {
      const expiresAt = ttlMs ? Date.now() + ttlMs : null;
      const payload = JSON.stringify({ value, expiresAt });
      if (ttlMs) {
        await client.set(key, payload, 'PX', ttlMs);
      } else {
        await client.set(key, payload);
      }
      return;
    } catch (e) {
      console.error('Cache set error (Redis):', e);
    }
  }
  // In-memory fallback
  inMemoryCache.set(key, value);
  if (ttlMs) {
    ttlMap.set(key, Date.now() + ttlMs);
  } else {
    ttlMap.delete(key);
  }
}

/** Check if a key exists and is not expired. */
export async function has(key) {
  const client = await getRedisClient();
  if (client) {
    try {
      const exists = await client.exists(key);
      return exists === 1;
    } catch (e) {
      console.error('Cache has error (Redis):', e);
    }
  }
  if (isExpired(key)) {
    inMemoryCache.delete(key);
    ttlMap.delete(key);
    return false;
  }
  return inMemoryCache.has(key);
}
