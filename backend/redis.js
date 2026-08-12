const Redis = require('ioredis');
require('dotenv').config();

let redisClient;

try {
  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        console.warn(`Redis connection failed after ${times} retries. Running in fallback mode without Redis caching.`);
        return null; // Stop retrying
      }
      return Math.min(times * 100, 2000);
    }
  });

  redisClient.on('error', (err) => {
    console.error('Redis error:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('Connected to Redis successfully');
  });
} catch (err) {
  console.error('Failed to initialize Redis client:', err);
  redisClient = null;
}

// Fallback cache helper if Redis is down
const cacheFallback = {};

const getCache = async (key) => {
  if (redisClient && redisClient.status === 'ready') {
    try {
      return await redisClient.get(key);
    } catch (e) {
      console.warn('Redis GET failed, falling back to in-memory store:', e.message);
    }
  }
  return cacheFallback[key] || null;
};

const setCache = async (key, value, expireSeconds = null) => {
  if (redisClient && redisClient.status === 'ready') {
    try {
      if (expireSeconds) {
        await redisClient.set(key, value, 'EX', expireSeconds);
      } else {
        await redisClient.set(key, value);
      }
      return;
    } catch (e) {
      console.warn('Redis SET failed, falling back to in-memory store:', e.message);
    }
  }
  cacheFallback[key] = value;
  if (expireSeconds) {
    setTimeout(() => {
      delete cacheFallback[key];
    }, expireSeconds * 1000);
  }
};

const delCache = async (key) => {
  if (redisClient && redisClient.status === 'ready') {
    try {
      await redisClient.del(key);
      return;
    } catch (e) {
      console.warn('Redis DEL failed, falling back to in-memory store:', e.message);
    }
  }
  delete cacheFallback[key];
};

module.exports = {
  redisClient,
  getCache,
  setCache,
  delCache
};
