import { UserRole } from '@prisma/client';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import { hashPassword, comparePassword } from '../../utils/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken, expiryToSeconds } from '../../utils/jwt';
import { ConflictError, ForbiddenError, UnauthorizedError } from '../../utils/AppError';
import { RegisterInput, LoginInput } from './auth.schema';
import { JwtPayload } from '../../types';

const REFRESH_TTL = expiryToSeconds(env.JWT_REFRESH_EXPIRES_IN);
const refreshKey = (userId: string) => `tb:refresh:${userId}`;

// ─── Register ─────────────────────────────────────────────────────────────────

export async function register(input: RegisterInput) {
  const { email, phone, password, role, displayName } = input;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
    select: { email: true, phone: true },
  });

  if (existing) {
    const field = existing.email === email ? 'Email' : 'Phone number';
    throw new ConflictError(`${field} is already registered`);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      phone,
      passwordHash,
      role,
      ...(role === UserRole.BUYER && {
        buyer: { create: {} },
      }),
      ...(role === UserRole.VENDOR && {
        vendor: {
          create: {
            displayName: displayName!,
          },
        },
      }),
    },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      createdAt: true,
      buyer: { select: { id: true } },
      vendor: { select: { id: true, displayName: true, isApproved: true } },
    },
  });

  const tokens = await issueTokens({ sub: user.id, role: user.role });

  return { user, tokens };
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(input: LoginInput) {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      isActive: true,
      isSuspended: true,
      passwordHash: true,
      buyer: { select: { id: true } },
      vendor: { select: { id: true, displayName: true, isApproved: true } },
    },
  });

  if (!user) throw new UnauthorizedError('Invalid email or password');
  if (!user.isActive) throw new UnauthorizedError('Account is deactivated');

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid email or password');

  if (user.isSuspended) {
    throw new ForbiddenError('Your account has been suspended. Please contact support.');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const { passwordHash: _, ...safeUser } = user;
  const tokens = await issueTokens({ sub: user.id, role: user.role });

  return { user: safeUser, tokens };
}

// ─── Refresh ──────────────────────────────────────────────────────────────────

export async function refresh(incomingToken: string) {
  const payload = verifyRefreshToken(incomingToken);

  const stored = await redis.get(refreshKey(payload.sub));
  if (!stored || stored !== incomingToken) {
    throw new UnauthorizedError('Refresh token is invalid or has been revoked');
  }

  // Rotate: delete old, issue new pair
  await redis.del(refreshKey(payload.sub));

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) throw new UnauthorizedError('Account not found or deactivated');

  const tokens = await issueTokens({ sub: user.id, role: user.role });
  return { tokens };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(userId: string) {
  await redis.del(refreshKey(userId));
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function issueTokens(payload: JwtPayload) {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await redis.setex(refreshKey(payload.sub), REFRESH_TTL, refreshToken);

  return { accessToken, refreshToken };
}
