import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/AppError';
import { UserRole } from '@prisma/client';

export function protect(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = authHeader.slice(7);

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    next(err);
  }
}

/** Restrict to specific roles after protect(). */
export const restrictTo =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new UnauthorizedError('You do not have permission to perform this action'));
    }
    next();
  };
