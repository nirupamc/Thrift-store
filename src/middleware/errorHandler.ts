import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError, ValidationError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors as Record<string, string[]>;
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: fieldErrors,
    });
    return;
  }

  // Our custom validation error
  if (err instanceof ValidationError) {
    res.status(422).json({
      success: false,
      message: err.message,
      code: err.code,
      errors: err.errors,
    });
    return;
  }

  // All operational AppErrors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
    return;
  }

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = (err.meta?.target as string[]) ?? [];
      res.status(409).json({
        success: false,
        message: `${fields.join(', ')} already exists`,
        code: 'CONFLICT',
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Record not found', code: 'NOT_FOUND' });
      return;
    }
  }

  // Unknown — hide internals in production
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
