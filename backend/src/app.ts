import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import routes from '@/routes';
import { errorHandler } from '@/middleware/error-handler';
import { logger } from '@/utils/logger';
import swaggerDoc from '@/utils/swagger';
import { apiLimiter } from '@/middleware/rate-limit';
import { getAllowedOrigins } from '@/config/origins';
import { ensureCsrfCookie, csrfProtection } from '@/middleware/csrf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const app = express();

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
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(compression());
app.use(cookieParser());
app.use('/api', ensureCsrfCookie);
app.use('/api', csrfProtection);
app.use(express.json({ limit: '10mb' })); // Prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.get('/healthz', (_req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

app.use('/api', routes);

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

app.use(errorHandler);

process.on('uncaughtException', (err) => logger.error(`uncaughtException ${err.message}`));
process.on('unhandledRejection', (err) =>
  logger.error(`unhandledRejection ${(err as Error).message}`)
);
