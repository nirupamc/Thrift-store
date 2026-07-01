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

const allowedOrigins = [
  'http://localhost:3000',
  ...(env.FRONTEND_URL ? [env.FRONTEND_URL] : []),
  ...env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
].filter((o, i, arr) => o && arr.indexOf(o) === i); // deduplicate

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);
app.set('trust proxy', 1);

// ── Static file serving ───────────────────────────────────────────────────────
// NOTE: local /uploads works for development only. In production, image
// uploads should go through Cloudinary (already wired in config/cloudinary.ts).
// Render's ephemeral filesystem does not persist between deploys.
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
