import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import {
  EmailNotConfiguredError,
  emailConfigured,
  emailStatus,
  loadEmailArticles,
  previewCampaign as renderPreview,
  senderDefaults,
  sendTestNewsletter,
  type CampaignContent,
} from '../services/email-service.js';
import { recoverInterrupted, startDelivery } from '../services/newsletter-delivery.js';
import { articleCategories, categoryLabel } from '../utils/categories.js';
import {
  digestCandidates,
  nextDigestAt,
  sendWeeklyDigest,
} from '../services/newsletter-automation.js';
import { getNewsletterSettings, saveNewsletterSettings } from '../services/newsletter-settings.js';

const webhookConfigured = () => Boolean(process.env.RESEND_WEBHOOK_SECRET?.trim());

function content(body: Record<string, unknown>): CampaignContent {
  return {
    subject: String(body.subject),
    preheader: (body.preheader as string | null | undefined) || null,
    htmlContent: String(body.htmlContent ?? ''),
    articleIds: (body.articleIds as string[] | undefined) ?? [],
  };
}

export async function getStatus(_req: Request, res: Response) {
  const [activeSubscribers, pendingSubscribers, status, settings] = await Promise.all([
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.subscription.count({ where: { status: 'PENDING' } }),
    emailStatus(),
    getNewsletterSettings(),
  ]);
  return res.json({
    ...status,
    activeSubscribers,
    pendingSubscribers,
    settings,
    nextDigestAt: nextDigestAt(settings),
    webhookConfigured: webhookConfigured(),
  });
}

async function settingsResponse() {
  const settings = await getNewsletterSettings();
  return {
    settings,
    defaults: senderDefaults(),
    nextDigestAt: nextDigestAt(settings),
    emailConfigured: emailConfigured(),
    webhookConfigured: webhookConfigured(),
  };
}

export async function getSettings(_req: Request, res: Response) {
  return res.json(await settingsResponse());
}

export async function updateSettings(req: Request, res: Response) {
  await saveNewsletterSettings(req.body);
  return res.json(await settingsResponse());
}

export async function previewDigest(_req: Request, res: Response) {
  const settings = await getNewsletterSettings();
  const { articles, total } = await digestCandidates();
  return res.json({ articles, total, nextDigestAt: nextDigestAt(settings) });
}

export async function runDigest(_req: Request, res: Response) {
  const outcome = await sendWeeklyDigest();
  if (!outcome.sent) return res.status(409).json({ error: outcome.reason });
  return res.status(202).json(outcome);
}

export async function listCampaigns(_req: Request, res: Response) {
  await recoverInterrupted();
  const campaigns = await prisma.newsletterCampaign.findMany({ orderBy: { createdAt: 'desc' } });
  return res.json(campaigns);
}

export async function getCampaign(req: Request, res: Response) {
  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id: req.params.id } });
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  return res.json(campaign);
}

export async function listArticles(req: Request, res: Response) {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const ids =
    typeof req.query.ids === 'string'
      ? req.query.ids.split(',').filter(Boolean).slice(0, 10)
      : null;
  const articles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      ...(ids
        ? { id: { in: ids } }
        : q && { title: { contains: q, mode: 'insensitive' as const } }),
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
    select: {
      id: true,
      title: true,
      slug: true,
      categories: articleCategories,
      publishedAt: true,
      featuredImage: true,
      author: { select: { name: true } },
    },
  });
  return res.json(
    articles.map(({ categories, ...article }) => ({
      ...article,
      category: categoryLabel(categories),
    }))
  );
}

export async function previewCampaign(req: Request, res: Response) {
  return res.json(await renderPreview(content(req.body)));
}

export async function sendTest(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { email: true },
  });
  if (!user?.email)
    return res.status(400).json({ error: 'Your account has no email address to send a test to' });

  try {
    await sendTestNewsletter(user.email, content(req.body));
  } catch (err) {
    if (err instanceof EmailNotConfiguredError) return res.status(503).json({ error: err.message });
    console.error('[newsletter] test send failed:', err);
    return res.status(502).json({
      error: err instanceof Error ? err.message : 'The email provider rejected the message',
    });
  }
  return res.json({ to: user.email });
}

export async function createCampaign(req: Request, res: Response) {
  const campaign = await prisma.newsletterCampaign.create({ data: content(req.body) });
  return res.status(201).json(campaign);
}

export async function updateCampaign(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.newsletterCampaign.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Campaign not found' });
  if (existing.status !== 'DRAFT') {
    return res.status(400).json({ error: 'Only draft campaigns can be edited' });
  }

  const campaign = await prisma.newsletterCampaign.update({
    where: { id },
    data: content(req.body),
  });
  return res.json(campaign);
}

export async function deleteCampaign(req: Request, res: Response) {
  const { count } = await prisma.newsletterCampaign.deleteMany({
    where: { id: req.params.id, status: 'DRAFT' },
  });
  if (!count) return res.status(400).json({ error: 'Only drafts can be deleted' });
  return res.status(204).end();
}

export async function sendCampaign(req: Request, res: Response) {
  const { id } = req.params;
  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id } });
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  if (!emailConfigured())
    return res.status(503).json({ error: new EmailNotConfiguredError().message });

  const active = await prisma.subscription.count({ where: { status: 'ACTIVE' } });
  if (active === 0) return res.status(400).json({ error: 'No active subscribers' });

  if (!campaign.htmlContent.replace(/<[^>]+>/g, '').trim()) {
    const articles = await loadEmailArticles(campaign.articleIds);
    if (articles.length === 0) {
      return res.status(400).json({
        error: 'The featured articles are no longer published, so this email would be empty',
      });
    }
  }

  if (!(await startDelivery(id))) {
    return res.status(400).json({
      error:
        campaign.status === 'SENDING'
          ? 'This campaign is already sending'
          : 'This campaign was already sent',
    });
  }

  return res.status(202).json(await prisma.newsletterCampaign.findUnique({ where: { id } }));
}
