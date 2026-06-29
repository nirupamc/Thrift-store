import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { UserRole } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';

let _io: SocketServer | null = null;

export function initSockets(httpServer: HttpServer): SocketServer {
  _io = new SocketServer(httpServer, {
    cors: {
      origin:  env.ALLOWED_ORIGINS.split(','),
      methods: ['GET', 'POST'],
    },
  });

  // JWT middleware — anonymous connections are allowed; they just skip auto-join
  _io.use((socket, next) => {
    const raw = socket.handshake.auth.token as string | undefined;
    if (raw) {
      try {
        socket.data.user = verifyAccessToken(raw.replace(/^Bearer\s+/i, ''));
      } catch {
        // Invalid token — treat as unauthenticated, do not reject
      }
    }
    next();
  });

  _io.on('connection', async (socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    const user = socket.data.user;

    // Auto-join a room for every store the buyer currently follows
    if (user?.role === UserRole.BUYER) {
      try {
        const followed = await prisma.storeFollower.findMany({
          where:  { buyer: { userId: user.sub } },
          select: { storeId: true },
        });
        followed.forEach((f) => socket.join(`store:${f.storeId}`));
        logger.debug(`Buyer ${user.sub} auto-joined ${followed.length} store room(s)`);
      } catch {
        // Non-fatal — buyer still connects
      }
    }

    // Manual join / leave for stores followed after connect
    socket.on('store:join',  (storeId: string) => socket.join(`store:${storeId}`));
    socket.on('store:leave', (storeId: string) => socket.leave(`store:${storeId}`));

    // Order-level room for payment / fulfilment updates
    socket.on('join:order', (orderId: string) => socket.join(`order:${orderId}`));

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return _io;
}

export function getIo(): SocketServer {
  if (!_io) throw new Error('Socket.io server not initialised');
  return _io;
}
