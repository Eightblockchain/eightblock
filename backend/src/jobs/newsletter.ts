import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import { purgeUnconfirmed } from '../services/subscription-service.js';
import { runDigestIfDue } from '../services/newsletter-automation.js';

export function startNewsletterJobs(): void {
  // In PM2 cluster mode every instance runs this file; only the first one should schedule.
  const instance = process.env.NODE_APP_INSTANCE;
  if (instance !== undefined && instance !== '0') return;

  cron.schedule(
    '17 3 * * *',
    async () => {
      try {
        const { deleted, reverted } = await purgeUnconfirmed();
        if (deleted || reverted) {
          logger.info(`Newsletter: dropped ${deleted + reverted} unconfirmed signups`);
        }
      } catch (error) {
        logger.error(`Unconfirmed signup cleanup failed: ${(error as Error).message}`);
      }
    },
    { timezone: 'UTC' }
  );

  // The digest day, hour and timezone live in the admin settings and can change at any
  // time, so this checks every few minutes instead of scheduling a fixed cron expression.
  let lastSkip = '';
  cron.schedule(
    '*/5 * * * *',
    async () => {
      try {
        const outcome = await runDigestIfDue();
        if (!outcome) return;
        if (outcome.sent) {
          logger.info(
            `Weekly digest: sending ${outcome.articles} articles (campaign ${outcome.campaignId})`
          );
        } else if (outcome.reason !== lastSkip) {
          logger.info(`Weekly digest skipped: ${outcome.reason}`);
        }
        lastSkip = outcome.sent ? '' : outcome.reason;
      } catch (error) {
        logger.error(`Weekly digest failed: ${(error as Error).message}`);
      }
    },
    { timezone: 'UTC' }
  );
  logger.info('Newsletter jobs started (digest schedule is set on the admin newsletter page)');
}
