import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { BATCH_SIZE, loadEmailArticles, sendNewsletterBatch } from './email-service.js';

/** A SENDING campaign bumps updatedAt after every batch; one that goes quiet this long was interrupted. */
const STALE_AFTER_MS = 10 * 60_000;
const PAUSE_BETWEEN_BATCHES_MS = 600;

const SENDABLE: Prisma.NewsletterCampaignWhereInput = {
  OR: [{ status: { in: ['DRAFT', 'FAILED'] } }, { status: 'SENT', failedCount: { gt: 0 } }],
};

let stopping = false;
const inFlight = new Set<Promise<unknown>>();

/**
 * Called on shutdown: running deliveries finish and record their current batch, then pause.
 * Stopping mid-batch could lose the record of emails the provider already accepted.
 */
export async function stopDeliveries() {
  stopping = true;
  await Promise.allSettled([...inFlight]);
}

export async function recoverInterrupted() {
  await prisma.newsletterCampaign.updateMany({
    where: { status: 'SENDING', updatedAt: { lt: new Date(Date.now() - STALE_AFTER_MS) } },
    data: {
      status: 'FAILED',
      lastError:
        'Sending stopped before it finished, most likely because the server restarted. Send again to reach the remaining subscribers; nobody receives it twice.',
    },
  });
}

/**
 * Marks the campaign SENDING and delivers it in the background. Returns false when it is
 * already sending or fully sent, so two clicks (or two servers) never send it twice.
 */
export async function startDelivery(id: string) {
  const claimed = await prisma.newsletterCampaign.updateMany({
    where: { id, ...SENDABLE },
    data: { status: 'SENDING', lastError: null },
  });
  if (!claimed.count) return false;

  const run = deliverCampaign(id).catch(async (err) => {
    console.error('[newsletter] delivery crashed:', err);
    await prisma.newsletterCampaign
      .update({
        where: { id },
        data: {
          status: 'FAILED',
          lastError: err instanceof Error ? err.message : 'Sending failed',
        },
      })
      .catch(() => undefined);
  });
  inFlight.add(run);
  void run.finally(() => inFlight.delete(run));
  return true;
}

async function recount(campaignId: string) {
  const counts = await prisma.newsletterDelivery.groupBy({
    by: ['status'],
    where: { campaignId },
    _count: true,
  });
  const of = (status: 'SENT' | 'FAILED') => counts.find((c) => c.status === status)?._count ?? 0;
  return { recipientCount: of('SENT'), failedCount: of('FAILED') };
}

/** Sends to every active subscriber who has not received this campaign yet, in batches. */
export async function deliverCampaign(campaignId: string, pauseMs = PAUSE_BETWEEN_BATCHES_MS) {
  const campaign = await prisma.newsletterCampaign.findUniqueOrThrow({ where: { id: campaignId } });
  const articles = await loadEmailArticles(campaign.articleIds);

  const done = new Set(
    (
      await prisma.newsletterDelivery.findMany({
        where: { campaignId, status: 'SENT' },
        select: { email: true },
      })
    ).map((d) => d.email)
  );
  const pending = (
    await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      select: { email: true, unsubscribeToken: true },
    })
  ).filter((s) => !done.has(s.email));

  await prisma.newsletterCampaign.update({
    where: { id: campaignId },
    data: { totalCount: done.size + pending.length },
  });

  let deliveredThisRun = 0;
  let firstError: string | null = null;

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const chunk = pending.slice(i, i + BATCH_SIZE);
    const results = await sendNewsletterBatch(chunk, campaign, articles);

    await prisma.$transaction(
      results.map((r) =>
        prisma.newsletterDelivery.upsert({
          where: { campaignId_email: { campaignId, email: r.email } },
          create: {
            campaignId,
            email: r.email,
            status: r.error ? 'FAILED' : 'SENT',
            providerId: r.providerId,
            error: r.error,
          },
          update: {
            status: r.error ? 'FAILED' : 'SENT',
            providerId: r.providerId,
            error: r.error ?? null,
          },
        })
      )
    );

    const delivered = results.filter((r) => !r.error).length;
    deliveredThisRun += delivered;
    firstError ??= results.find((r) => r.error)?.error ?? null;

    // A first batch that fails completely is a setup problem (bad key, unverified domain);
    // stop instead of hammering the provider with the rest of the list.
    if (i === 0 && delivered === 0 && done.size === 0) {
      await prisma.newsletterCampaign.update({
        where: { id: campaignId },
        data: { status: 'FAILED', lastError: firstError, ...(await recount(campaignId)) },
      });
      return;
    }

    const more = i + BATCH_SIZE < pending.length;
    if (stopping && more) {
      await prisma.newsletterCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'FAILED',
          lastError:
            'Sending paused because the server restarted. Send again to reach the remaining subscribers; nobody receives it twice.',
          ...(await recount(campaignId)),
        },
      });
      return;
    }
    await prisma.newsletterCampaign.update({
      where: { id: campaignId },
      data: await recount(campaignId),
    });
    if (more) await new Promise((r) => setTimeout(r, pauseMs));
  }

  const counts = await recount(campaignId);
  await prisma.newsletterCampaign.update({
    where: { id: campaignId },
    data: {
      ...counts,
      status: counts.recipientCount > 0 ? 'SENT' : 'FAILED',
      sentAt: campaign.sentAt ?? (deliveredThisRun > 0 ? new Date() : null),
      lastError:
        counts.failedCount > 0
          ? `${counts.failedCount} could not be delivered. ${firstError ?? ''}`.trim()
          : null,
    },
  });
}
