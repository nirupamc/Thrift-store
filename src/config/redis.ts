import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

export const redis = new Redis({
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
  await redis.connect();
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}
