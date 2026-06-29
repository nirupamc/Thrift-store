import { Response } from 'express';

interface SuccessPayload<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

interface ErrorPayload {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: Record<string, unknown>,
): Response<SuccessPayload<T>> {
  return res.status(statusCode).json({ success: true, message, data, ...(meta && { meta }) });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  code?: string,
  errors?: Record<string, string[]>,
): Response<ErrorPayload> {
  return res.status(statusCode).json({ success: false, message, ...(code && { code }), ...(errors && { errors }) });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Success',
): Response {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
}
