import 'dotenv/config';
import { checkEnv } from './config/env.js';
import { logger } from './utils/logger.js';

const { errors, warnings } = checkEnv();
warnings.forEach((warning) => logger.warn(`config: ${warning}`));
if (errors.length > 0) {
  errors.forEach((error) => logger.error(`config: ${error}`));
  logger.error('Refusing to start until the backend .env is fixed.');
  process.exit(1);
}

// Imported after the env check so a bad config reports every problem instead of the first throw.
// PM2 only logs unhandled rejections, so a failed import must exit explicitly or the process
// would stay up without listening.
const [
  { app },
  { prisma },
  { closeRedis },
  { startScoreDecayJob },
  { startNewsletterJobs },
  { stopDeliveries },
] = await Promise.all([
  import('./app.js'),
  import('./prisma/client.js'),
  import('./utils/redis.js'),
  import('./jobs/score-decay.js'),
  import('./jobs/newsletter.js'),
  import('./services/newsletter-delivery.js'),
]).catch((err: unknown) => {
  logger.error(`API failed to start: ${err instanceof Error ? err.stack : String(err)}`);
  process.exit(1);
});

const PORT = process.env.PORT ?? 5000;

const server = app.listen(PORT, () => {
  logger.info(`API server ready at http://localhost:${PORT}`);
  // deploy.sh sets this for the smoke-test boot, which must not run the digest or other jobs.
  if (process.env.DISABLE_JOBS !== '1') {
    startScoreDecayJob();
    startNewsletterJobs();
  }
  // PM2 (wait_ready) keeps the old instance serving until this one reports ready.
  process.send?.('ready');
});
server.on('error', (err) => {
  logger.error(`API failed to listen on port ${PORT}: ${err.message}`);
  process.exit(1);
});

let shuttingDown = false;
function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received, draining connections`);

  setTimeout(() => {
    logger.error('Forced shutdown after 10s');
    process.exit(1);
  }, 10_000).unref();

  const deliveries = stopDeliveries();
  server.close(async () => {
    await deliveries;
    await Promise.allSettled([prisma.$disconnect(), closeRedis()]);
    process.exit(0);
  });
  server.closeIdleConnections();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
