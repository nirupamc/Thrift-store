import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
