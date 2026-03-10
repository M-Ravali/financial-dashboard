// Safe Redis wrapper - falls back gracefully if Redis is down
let redisClient = null;

try {
  const Redis = require('ioredis');
  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // don't retry
    enableOfflineQueue: false,
    lazyConnect: true,
  });
  redisClient.on('connect', () => console.log('✅ Redis Connected'));
  redisClient.on('error', () => {}); // silence errors
} catch (err) {
  console.log('⚠️ Redis unavailable');
}

const get = async (key) => {
  try {
    if (!redisClient) return null;
    return await redisClient.get(key);
  } catch {
    return null; // fallback to Finnhub
  }
};

const setex = async (key, ttl, value) => {
  try {
    if (!redisClient) return;
    await redisClient.setex(key, ttl, value);
  } catch {
    // silently fail
  }
};

module.exports = { get, setex };