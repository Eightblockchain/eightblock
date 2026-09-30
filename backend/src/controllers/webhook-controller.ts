import crypto from 'crypto';
import type { Request, Response } from 'express';
import { stopSending, type StopReason } from '../services/subscription-service.js';
import { logger } from '../utils/logger.js';

/** Svix, which delivers Resend webhooks, rejects replays older than five minutes too. */
const TOLERANCE_SECONDS = 5 * 60;

interface SvixHeaders {
  id?: string;
  timestamp?: string;
  signature?: string;
}

/** https://docs.svix.com/receiving/verifying-payloads/how-manual */
export function verifyWebhookSignature(
  secret: string,
  headers: SvixHeaders,
  payload: string,
  now = Date.now()
) {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) return false;
  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt) || Math.abs(now / 1000 - sentAt) > TOLERANCE_SECONDS) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = crypto
    .createHmac('sha256', key)
    .update(`${id}.${timestamp}.${payload}`)
    .digest();
  return signature.split(' ').some((entry) => {
    const [version, value] = entry.split(',');
    if (version !== 'v1' || !value) return false;
    const given = Buffer.from(value, 'base64');
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
  });
}

interface ResendEvent {
  type?: string;
  data?: { to?: string[]; bounce?: { type?: string } };
}

function stopReason(event: ResendEvent): StopReason | null {
  if (event.type === 'email.complained') return 'complained';
  // Temporary failures such as a full mailbox are retried by Resend; only permanent ones stop mail.
  if (event.type === 'email.bounced' && event.data?.bounce?.type !== 'Transient') return 'bounced';
  return null;
}

const address = (recipient: string) => (/<([^>]+)>/.exec(recipient)?.[1] ?? recipient).trim();

/** Resend reports bounces and spam complaints here; those addresses never get mail again. */
export async function resendWebhook(req: Request, res: Response) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret) return res.status(503).json({ error: 'RESEND_WEBHOOK_SECRET is not set' });

  const payload = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  const verified = verifyWebhookSignature(
    secret,
    {
      id: req.get('svix-id'),
      timestamp: req.get('svix-timestamp'),
      signature: req.get('svix-signature'),
    },
    payload
  );
  if (!verified) return res.status(401).json({ error: 'Invalid signature' });

  let event: ResendEvent;
  try {
    event = JSON.parse(payload) as ResendEvent;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const reason = stopReason(event);
  if (reason) {
    for (const recipient of event.data?.to ?? []) {
      if (await stopSending(address(recipient), reason)) {
        logger.info(`Newsletter: stopped mail to an address that ${reason}`);
      }
    }
  }
  return res.json({ received: true });
}
