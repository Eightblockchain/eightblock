import cron from 'node-cron';
import { recomputeAllScores } from '../utils/score.js';
import { logger } from '../utils/logger.js';

/**
 * Run every 30 minutes.
 * Even articles with zero new activity get their score recalculated so the
 * time-decay is applied continuously - old articles naturally sink without
 * needing any special event to trigger them.
 */
export function startScoreDecayJob(): void {
  // In PM2 cluster mode every instance runs this file; only the first one should schedule.
  const instance = process.env.NODE_APP_INSTANCE;
  if (instance !== undefined && instance !== '0') return;

  cron.schedule('*/30 * * * *', async () => {
    try {
      logger.info('Score decay job: starting recompute');
      await recomputeAllScores();
      logger.info('Score decay job: done');
    } catch (error) {
      logger.error(`Score decay job failed: ${(error as Error).message}`);
    }
  });

  logger.info('Score decay cron job scheduled (every 30 minutes)');
}
