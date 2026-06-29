import path from 'path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { requestLogger } from './middleware/requestLogger';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { router } from './routes';

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.ALLOWED_ORIGINS.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);
app.set('trust proxy', 1);

// ── Static file serving ───────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// ── General middleware ────────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use(globalRateLimiter);

// ── API docs ──────────────────────────────────────────────────────────────────
app.use(
  `/api/${env.API_VERSION}/docs`,
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { customSiteTitle: 'ThriftBazaar API Docs' }),
);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use(`/api/${env.API_VERSION}`, router);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export { app };
