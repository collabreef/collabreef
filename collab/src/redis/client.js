import Redis from 'ioredis';

let redis = null;

export function createRedisClient(config = {}) {
  const addr = config.addr || process.env.REDIS_ADDR || 'localhost:6379';
  const password = config.password || process.env.REDIS_PASSWORD || undefined;
  const db = config.db ?? parseInt(process.env.REDIS_DB || '0', 10);

  const [host, port] = addr.split(':');

  redis = new Redis({
    host,
    port: parseInt(port, 10) || 6379,
    password: password || undefined,
    db,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      return Math.min(times * 200, 5000);
    },
  });

  redis.on('connect', () => {
    console.log(`Redis connected: ${addr}`);
  });

  redis.on('error', (err) => {
    console.error('Redis error:', err.message);
  });

  return redis;
}

export function getRedis() {
  if (!redis) {
    throw new Error('Redis client not initialized. Call createRedisClient() first.');
  }
  return redis;
}
