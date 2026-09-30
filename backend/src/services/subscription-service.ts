import { prisma } from '../prisma/client.js';
import { getNewsletterSettings } from './newsletter-settings.js';

export type StopReason = 'unsubscribed' | 'bounced' | 'complained';

async function confirmCutoff(now = new Date()) {
  const { confirmExpiryDays } = await getNewsletterSettings();
  return new Date(now.getTime() - confirmExpiryDays * 24 * 60 * 60 * 1000);
}

/** A PENDING signup whose confirmation email is older than the expiry can no longer be confirmed. */
export async function confirmationExpired(confirmSentAt: Date | null, now = new Date()) {
  return !confirmSentAt || confirmSentAt < (await confirmCutoff(now));
}

/**
 * Stops all mail to an address. An address that never confirmed is forgotten entirely;
 * one that was subscribed keeps its row so churn history stays intact.
 * Returns false when there was nothing to stop.
 */
export async function stopSending(email: string, reason: StopReason) {
  const subscription = await prisma.subscription.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!subscription || subscription.status === 'UNSUBSCRIBED') return false;

  if (subscription.status === 'PENDING' && !subscription.unsubscribedAt) {
    await prisma.subscription.delete({ where: { id: subscription.id } });
    return true;
  }
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'UNSUBSCRIBED',
      unsubscribeReason: reason,
      confirmToken: null,
      // A returning subscriber who never confirmed keeps the date they actually left.
      ...(subscription.status === 'ACTIVE' && { unsubscribedAt: new Date() }),
    },
  });
  return true;
}

/**
 * Drops signups nobody confirmed within the expiry: new addresses are deleted, people who
 * had subscribed before go back to unsubscribed.
 */
export async function purgeUnconfirmed(now = new Date()) {
  const stale = { status: 'PENDING' as const, confirmSentAt: { lt: await confirmCutoff(now) } };
  const [deleted, reverted] = await prisma.$transaction([
    prisma.subscription.deleteMany({ where: { ...stale, unsubscribedAt: null } }),
    prisma.subscription.updateMany({
      where: { ...stale, unsubscribedAt: { not: null } },
      data: { status: 'UNSUBSCRIBED', confirmToken: null },
    }),
  ]);
  return { deleted: deleted.count, reverted: reverted.count };
}
