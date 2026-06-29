import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { initSockets } from './sockets';
import { logger } from './utils/logger';

const httpServer = http.createServer(app);
initSockets(httpServer);

async function bootstrap(): Promise<void> {
  await connectDatabase();
  logger.info('PostgreSQL connected');

  await connectRedis();

  httpServer.listen(env.PORT, () => {
    logger.info(`ThriftBazaar API running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Health: http://localhost:${env.PORT}/api/${env.API_VERSION}/health`);
  });
}

async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received — shutting down gracefully`);
  httpServer.close(async () => {
    await disconnectDatabase();
    await disconnectRedis();
    logger.info('Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { err });
  process.exit(1);
});

bootstrap().catch((err) => {
  logger.error('Bootstrap failed', { err });
  process.exit(1);
});
