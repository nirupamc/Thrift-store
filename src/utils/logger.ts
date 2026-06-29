import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
  }),
);

const fileFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxFiles: '14d',
      zippedArchive: true,
    }),
    new DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxFiles: '14d',
      zippedArchive: true,
    }),
  ],
});
