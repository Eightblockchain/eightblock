import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { logger } from './utils/logger.js';
import { prisma } from './prisma/client.js';
import { getRedisClient } from './utils/redis.js';
import { apiLimiter } from './middleware/rate-limit.js';
import { getAllowedOrigins } from './config/origins.js';
import { ensureCsrfCookie, csrfProtection } from './middleware/csrf.js';
import { EMAIL_ASSETS_DIR } from './services/email-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const app = express();

const isProduction = process.env.NODE_ENV === 'production';

// Behind nginx the client IP arrives in X-Forwarded-For. Without this, rate limits would
// bucket every visitor under the proxy's IP. Set TRUST_PROXY to the number of proxy hops.
const trustProxy = process.env.TRUST_PROXY ?? (isProduction ? '1' : '');
if (trustProxy) {
  app.set('trust proxy', /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy);
}

// Enhanced security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS configuration
const allowedOrigins = getAllowedOrigins();
/** Mail providers call this from their own servers; the unsubscribe token authenticates it. */
const ONE_CLICK_UNSUBSCRIBE = '/api/subscriptions/unsubscribe/one-click';
app.use(
  cors<express.Request>((req, callback) => {
    const origin = req.header('Origin');
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin))
      return callback(null, { origin: true, credentials: true });
    if (req.path === ONE_CLICK_UNSUBSCRIBE) return callback(null, { origin: false });
    callback(new Error('Not allowed by CORS'));
  })
);

app.use(compression());
app.use(cookieParser());
app.use('/api', ensureCsrfCookie);
app.use('/api', csrfProtection);
// Webhook signatures cover the exact bytes sent, so these routes get the unparsed body.
app.use('/api/webhooks', express.raw({ type: '*/*', limit: '1mb' }));
// The largest body is an article (content is capped at 500k characters).
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
// Query strings can carry unsubscribe and confirmation tokens, so only the path is logged.
morgan.token('path', (req: express.Request) => req.originalUrl.split('?')[0]);
app.use(
  morgan(
    isProduction
      ? ':remote-addr [:date[clf]] ":method :path HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms'
      : 'dev',
    { skip: () => process.env.NODE_ENV === 'test' }
  )
);

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/email-assets', express.static(EMAIL_ASSETS_DIR, { maxAge: '30d' }));

app.get(['/healthz', '/health'], (_req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

const withTimeout = <T>(promise: Promise<T>, ms: number) =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);

// Readiness: the deploy health check and uptime monitors should hit this, not /healthz.
app.get('/readyz', async (_req, res) => {
  const [database, redis] = await Promise.all([
    withTimeout(prisma.$queryRaw`SELECT 1`, 3000).then(
      () => true,
      () => false
    ),
    withTimeout(getRedisClient()?.ping() ?? Promise.reject(new Error('no client')), 3000).then(
      (pong) => pong === 'PONG',
      () => false
    ),
  ]);
  const ready = database && redis;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'unavailable', database, redis });
});

app.use('/api', routes);

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

app.use(errorHandler);

// The process state is undefined after an uncaught exception; exit so PM2 restarts it cleanly.
process.on('uncaughtException', (err) => {
  logger.error(`uncaughtException ${err.stack || err.message}`);
  process.exit(1);
});
process.on('unhandledRejection', (err) =>
  logger.error(`unhandledRejection ${(err as Error)?.stack || err}`)
);
