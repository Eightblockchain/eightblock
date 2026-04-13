import cron from 'node-cron';
import { recomputeAllScores } from '../utils/score.js';
import { logger } from '../utils/logger.js';

/**
 * Run every 30 minutes.
 * Even articles with zero new activity get their score recalculated so the
 * time-decay is applied continuously — old articles naturally sink without
 * needing any special event to trigger them.
 */
export function startScoreDecayJob(): void {
  cron.schedule('*/30 * * * *', async () => {
    logger.info('Score decay job: starting recompute');
    await recomputeAllScores();
    logger.info('Score decay job: done');
  });

  logger.info('Score decay cron job scheduled (every 30 minutes)');
}
