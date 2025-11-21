import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import routes from '@/routes';
import { errorHandler } from '@/middleware/error-handler';
import { logger } from '@/utils/logger';
import swaggerDoc from '@/utils/swagger';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
app.use('/api', routes);

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

app.use(errorHandler);

app.get('/healthz', (_req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

process.on('uncaughtException', (err) => logger.error(`uncaughtException ${err.message}`));
process.on('unhandledRejection', (err) => logger.error(`unhandledRejection ${(err as Error).message}`));
