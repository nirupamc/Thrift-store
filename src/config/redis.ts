import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

// Upstash provides a full rediss:// URL; local dev uses host/port/password.
// TLS is required for Upstash connections.
export const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      tls: { rejectUnauthorized: false },
      retryStrategy: (times) => Math.min(times * 100, 3000),
      maxRetriesPerRequest: 3,
    })
  : new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', { err }));

export async function connectRedis(): Promise<void> {
  // Upstash connections are always-on; only explicitly connect for local Redis.
  if (!process.env.REDIS_URL) {
    await redis.connect();
  }
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}
