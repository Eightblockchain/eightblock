import type { Request, Response } from 'express';
import type { Subscription } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import {
  emailConfigured,
  sendConfirmSubscriptionEmail,
  sendSubscriptionEmail,
  unsubscribeLinks,
} from '../services/email-service.js';
import { getNewsletterSettings } from '../services/newsletter-settings.js';
import { confirmationExpired, stopSending } from '../services/subscription-service.js';
import { randomUUID } from 'crypto';

export type SubscribeResult =
  | 'subscribed'
  | 'resubscribed'
  | 'already_subscribed'
  | 'confirmation_sent';

/** Submitting the form again this soon reuses the confirmation already in the inbox. */
const RESEND_CONFIRMATION_AFTER_MS = 5 * 60_000;

/** Google verified a signed-in reader's own address, so it needs no confirmation link. */
async function isOwnAddress(req: Request, email: string) {
  if (!req.user) return false;
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { email: true },
  });
  return user?.email?.toLowerCase() === email;
}

async function welcome(subscription: Subscription, returning: boolean) {
  if (!emailConfigured() || !(await getNewsletterSettings()).welcomeEmail) return false;
  void sendSubscriptionEmail(subscription.email, subscription.unsubscribeToken, {
    returning,
  }).catch((err) => console.error('[subscription] welcome email failed:', err));
  return true;
}

const activation = () => {
  const now = new Date();
  // A returning subscriber counts as a new signup on the day they come back; the earlier
  // unsubscribe stays on record so churn history is not rewritten.
  return { status: 'ACTIVE' as const, confirmedAt: now, createdAt: now };
};

export async function createSubscription(req: Request, res: Response) {
  try {
    const { email, topics } = req.body;

    const existing = await prisma.subscription.findUnique({ where: { email } });
    if (existing?.status === 'ACTIVE') {
      return res.json({
        email: existing.email,
        result: 'already_subscribed' satisfies SubscribeResult,
        emailSent: false,
      });
    }
    const returning = Boolean(existing?.unsubscribedAt);

    const { doubleOptIn } = await getNewsletterSettings();
    if (!doubleOptIn || (await isOwnAddress(req, email))) {
      const subscription = await prisma.subscription.upsert({
        where: { email },
        update: { topics, ...activation() },
        create: { email, topics, ...activation() },
      });
      return res.status(201).json({
        email: subscription.email,
        result: (returning ? 'resubscribed' : 'subscribed') satisfies SubscribeResult,
        emailSent: await welcome(subscription, returning),
      });
    }

    const alreadySent =
      existing?.status === 'PENDING' &&
      existing.confirmSentAt !== null &&
      Date.now() - existing.confirmSentAt.getTime() < RESEND_CONFIRMATION_AFTER_MS;
    const confirmToken = existing?.confirmToken ?? randomUUID();

    const subscription = await prisma.subscription.upsert({
      where: { email },
      update: {
        topics,
        status: 'PENDING',
        confirmToken,
        ...(!alreadySent && { confirmSentAt: new Date() }),
      },
      create: { email, topics, status: 'PENDING', confirmToken, confirmSentAt: new Date() },
    });

    const emailSent = emailConfigured();
    if (emailSent && !alreadySent) {
      void sendConfirmSubscriptionEmail(subscription.email, confirmToken).catch((err) =>
        console.error('[subscription] confirmation email failed:', err)
      );
    }

    return res.status(202).json({
      email: subscription.email,
      result: 'confirmation_sent' satisfies SubscribeResult,
      emailSent,
    });
  } catch (err) {
    console.error('[subscription] create failed:', err);
    return res.status(500).json({ error: 'Failed to subscribe' });
  }
}

/** The link in the confirmation email. Clicking it again later is harmless. */
export async function confirmSubscription(req: Request, res: Response) {
  const { token } = req.body;
  const subscription = await prisma.subscription.findUnique({ where: { confirmToken: token } });
  const invalid = () =>
    res.status(404).json({
      error: 'This confirmation link is no longer valid. Subscribe again to get a new one.',
    });

  if (!subscription) return invalid();
  if (subscription.status === 'ACTIVE') {
    return res.json({ email: subscription.email, result: 'already_subscribed' });
  }
  if (
    subscription.status !== 'PENDING' ||
    (await confirmationExpired(subscription.confirmSentAt))
  ) {
    return invalid();
  }

  const returning = Boolean(subscription.unsubscribedAt);
  // Two quick clicks must not send two welcome emails.
  const claimed = await prisma.subscription.updateMany({
    where: { id: subscription.id, status: 'PENDING' },
    data: activation(),
  });
  if (claimed.count) await welcome(subscription, returning);

  return res.json({
    email: subscription.email,
    result: (returning ? 'resubscribed' : 'subscribed') satisfies SubscribeResult,
  });
}

/** Newsletter status for the signed-in user's own address, so forms can skip a second signup. */
export async function getMySubscription(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { email: true },
  });
  if (!user?.email) return res.json({ email: null, subscribed: false });
  const subscription = await prisma.subscription.findUnique({
    where: { email: user.email.toLowerCase() },
    select: { status: true },
  });
  return res.json({ email: user.email, subscribed: subscription?.status === 'ACTIVE' });
}

/** Returns false when the token matches nobody. Repeat unsubscribes keep the first date. */
async function unsubscribeByToken(token: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { unsubscribeToken: token },
    select: { email: true },
  });
  if (!subscription) return false;
  await stopSending(subscription.email, 'unsubscribed');
  return true;
}

export async function unsubscribe(req: Request, res: Response) {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }
  if (!(await unsubscribeByToken(token))) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  return res.json({ success: true });
}

/** RFC 8058: mail clients POST here from their own servers when the reader clicks "Unsubscribe". */
export async function oneClickUnsubscribe(req: Request, res: Response) {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!token || !(await unsubscribeByToken(token))) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  return res.json({ success: true });
}

/** Someone opened the one-click link in a browser: show the normal unsubscribe page. */
export function oneClickRedirect(req: Request, res: Response) {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  return res.redirect(302, unsubscribeLinks(token).page);
}

export async function getSubscriptionStats(_req: Request, res: Response) {
  try {
    const count = await prisma.subscription.count({ where: { status: 'ACTIVE' } });
    return res.json({ count });
  } catch (err) {
    console.error('[subscription] stats failed:', err);
    return res.json({ count: 0 });
  }
}

export async function listSubscriptions(_req: Request, res: Response) {
  const rows = await prisma.subscription.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      topics: true,
      status: true,
      createdAt: true,
    },
  });
  return res.json({ subscribers: rows, count: rows.length });
}
