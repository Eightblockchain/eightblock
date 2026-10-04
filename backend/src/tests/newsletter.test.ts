import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';

const mocks = vi.hoisted(() => ({ batchSend: vi.fn(), emailSend: vi.fn() }));
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mocks.emailSend },
    batch: { send: mocks.batchSend },
  })),
}));

const hasDatabase = Boolean(process.env.TEST_DATABASE_URL);
const SITE = 'http://localhost:3000';
const run = randomUUID().slice(0, 8);

type App = typeof import('../app.js').app;
type Db = typeof import('../prisma/client.js').prisma;

interface Payload {
  to: string;
  subject: string;
  text: string;
  html: string;
  headers: Record<string, string>;
}

const accept = (payload: Payload[]) => ({
  data: { data: payload.map((_, i) => ({ id: `msg-${i}` })) },
  error: null,
});

describe.skipIf(!hasDatabase)('newsletter sending', () => {
  let app: App;
  let prisma: Db;
  let cookie = '';
  let adminId = '';
  const mine = (p: Payload[]) => p.filter((m) => m.to.startsWith(`vitest-${run}`));
  const emails = ['a', 'b', 'c'].map((k) => `vitest-${run}-${k}@example.invalid`);
  const tokens: Record<string, string> = {};

  const post = (path: string) => request(app).post(path).set('Origin', SITE).set('Cookie', cookie);
  const get = (path: string) => request(app).get(path).set('Cookie', cookie);

  async function settled(id: string) {
    for (let i = 0; i < 50; i++) {
      const c = await prisma.newsletterCampaign.findUniqueOrThrow({ where: { id } });
      if (c.status !== 'SENDING') return c;
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error('campaign never finished sending');
  }

  beforeAll(async () => {
    process.env.EMAIL_PROVIDER_API_KEY = 're_test_key';
    // Lets later signups arrive from their own X-Forwarded-For address, each with a fresh
    // subscribe rate-limit bucket.
    process.env.TRUST_PROXY = 'loopback';
    ({ app } = await import('../app.js'));
    ({ prisma } = await import('../prisma/client.js'));
    const { signToken } = await import('../utils/jwt.js');

    const admin = await prisma.user.create({
      data: { email: `vitest-${run}-admin@example.invalid`, name: 'Vitest admin', role: 'ADMIN' },
    });
    adminId = admin.id;
    cookie = `auth_token=${signToken({ userId: admin.id, role: 'ADMIN' })}`;

    for (const email of emails) {
      const sub = await prisma.subscription.create({ data: { email } });
      tokens[email] = sub.unsubscribeToken;
    }
    await prisma.subscription.create({
      data: { email: `vitest-${run}-gone@example.invalid`, status: 'UNSUBSCRIBED' },
    });
  });

  beforeEach(() => {
    process.env.EMAIL_PROVIDER_API_KEY = 're_test_key';
    mocks.batchSend.mockReset();
    mocks.emailSend.mockReset();
  });

  afterAll(async () => {
    if (!prisma) return;
    delete process.env.EMAIL_PROVIDER_API_KEY;
    delete process.env.TRUST_PROXY;
    await prisma.newsletterSettings.deleteMany();
    await prisma.newsletterCampaign.deleteMany({
      where: { subject: { startsWith: `vitest-${run}` } },
    });
    await prisma.subscription.deleteMany({ where: { email: { startsWith: `vitest-${run}` } } });
    await prisma.user.deleteMany({ where: { id: adminId } });
    await prisma.$disconnect();
    const { closeRedis } = await import('../utils/redis.js');
    await closeRedis();
  });

  it('reports whether sending is configured', async () => {
    const res = await get('/api/newsletters/status');
    expect(res.status).toBe(200);
    expect(res.body.configured).toBe(true);
    expect(res.body.activeSubscribers).toBeGreaterThanOrEqual(3);

    delete process.env.EMAIL_PROVIDER_API_KEY;
    expect((await get('/api/newsletters/status')).body.configured).toBe(false);
  });

  it('previews the exact email with campaign-tagged links', async () => {
    const res = await post('/api/newsletters/preview').send({
      subject: `vitest-${run} preview`,
      preheader: 'Inbox teaser',
      htmlContent: `<p>Hello <a href="${SITE}/writing">readers</a></p>`,
    });
    expect(res.status).toBe(200);
    expect(res.body.html).toContain('Inbox teaser');
    expect(res.body.html).toContain('utm_source=newsletter');
    expect(res.body.text).toContain('Hello readers');
  });

  it('needs a message or at least one article', async () => {
    const res = await post('/api/newsletters').send({
      subject: `vitest-${run} empty`,
      htmlContent: '<p> </p>',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Write a message or feature at least one article');
  });

  it('serves the email logo publicly for campaign emails', async () => {
    const res = await request(app).get('/email-assets/logo.png');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });

  it('sends a test to the signed-in admin only', async () => {
    mocks.emailSend.mockResolvedValue({ data: { id: 'test-1' }, error: null });
    const res = await post('/api/newsletters/test').send({
      subject: `vitest-${run} test`,
      htmlContent: '<p>Hi</p>',
    });
    expect(res.status).toBe(200);
    expect(res.body.to).toBe(`vitest-${run}-admin@example.invalid`);
    expect(mocks.emailSend).toHaveBeenCalledOnce();
    expect(mocks.emailSend.mock.calls[0][0]).toMatchObject({
      to: `vitest-${run}-admin@example.invalid`,
      subject: `[Test] vitest-${run} test`,
      attachments: [{ inlineContentId: 'eightblock-logo', contentType: 'image/png' }],
    });
    expect(mocks.emailSend.mock.calls[0][0].html).toContain('src="cid:eightblock-logo"');

    mocks.emailSend.mockResolvedValue({
      data: null,
      error: { name: 'validation_error', message: 'Domain not verified' },
    });
    const rejected = await post('/api/newsletters/test').send({
      subject: `vitest-${run} test`,
      htmlContent: '<p>Hi</p>',
    });
    expect(rejected.status).toBe(502);
    expect(rejected.body.error).toBe('Domain not verified');
  });

  it('refuses to send when no email key is set', async () => {
    const draft = await post('/api/newsletters').send({
      subject: `vitest-${run} nokey`,
      htmlContent: '<p>x</p>',
    });
    delete process.env.EMAIL_PROVIDER_API_KEY;
    const res = await post(`/api/newsletters/${draft.body.id}/send`);
    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/EMAIL_PROVIDER_API_KEY/);
    expect(
      (await prisma.newsletterCampaign.findUniqueOrThrow({ where: { id: draft.body.id } })).status
    ).toBe('DRAFT');
  });

  it('stops on a setup error, then delivers on retry without duplicates', async () => {
    const draft = await post('/api/newsletters').send({
      subject: `vitest-${run} launch`,
      preheader: 'Big news',
      htmlContent: '<p>We launched.</p>',
    });
    const id = draft.body.id;

    mocks.batchSend.mockResolvedValueOnce({
      data: null,
      error: { name: 'validation_error', message: 'The eightblock.dev domain is not verified.' },
    });
    expect((await post(`/api/newsletters/${id}/send`)).status).toBe(202);
    const failed = await settled(id);
    expect(failed.status).toBe('FAILED');
    expect(failed.lastError).toBe('The eightblock.dev domain is not verified.');
    expect(failed.recipientCount).toBe(0);
    expect(mocks.batchSend).toHaveBeenCalledOnce();

    mocks.batchSend.mockImplementation(async (payload: Payload[]) => accept(payload));
    expect((await post(`/api/newsletters/${id}/send`)).status).toBe(202);
    const sent = await settled(id);
    expect(sent).toMatchObject({ status: 'SENT', failedCount: 0, lastError: null });
    expect(sent.recipientCount).toBe(sent.totalCount);
    expect(sent.sentAt).toBeInstanceOf(Date);

    const payload = mine(mocks.batchSend.mock.calls[1][0]);
    expect(payload.map((m) => m.to).sort()).toEqual([...emails].sort());
    const first = payload.find((m) => m.to === emails[0])!;
    expect(first.subject).toBe(`vitest-${run} launch`);
    expect(first.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    expect(first.headers['List-Unsubscribe']).toContain(
      `/api/subscriptions/unsubscribe/one-click?token=${tokens[emails[0]]}`
    );
    expect(first.html).toContain(`/newsletter/unsubscribe?token=${tokens[emails[0]]}`);
    expect(first.text).toContain('We launched.');
    expect(first.html).toContain('/email-assets/logo.png');

    const again = await post(`/api/newsletters/${id}/send`);
    expect(again.status).toBe(400);
    expect(again.body.error).toBe('This campaign was already sent');
  });

  it('skips subscribers who already received a resumed campaign', async () => {
    const draft = await post('/api/newsletters').send({
      subject: `vitest-${run} resume`,
      htmlContent: '<p>x</p>',
    });
    await prisma.newsletterDelivery.create({
      data: { campaignId: draft.body.id, email: emails[0], status: 'SENT' },
    });
    mocks.batchSend.mockImplementation(async (payload: Payload[]) => accept(payload));

    expect((await post(`/api/newsletters/${draft.body.id}/send`)).status).toBe(202);
    await settled(draft.body.id);
    const to = mine(mocks.batchSend.mock.calls.flatMap((c) => c[0])).map((m) => m.to);
    expect(to).not.toContain(emails[0]);
    expect(to).toEqual(expect.arrayContaining([emails[1], emails[2]]));
  });

  it('marks a campaign that stopped mid-send as failed so it can be resumed', async () => {
    const draft = await post('/api/newsletters').send({
      subject: `vitest-${run} stuck`,
      htmlContent: '<p>x</p>',
    });
    await prisma.$executeRaw`UPDATE "NewsletterCampaign" SET status = 'SENDING', "updatedAt" = now() - interval '1 hour' WHERE id = ${draft.body.id}`;
    await get('/api/newsletters');
    const stuck = await prisma.newsletterCampaign.findUniqueOrThrow({
      where: { id: draft.body.id },
    });
    expect(stuck.status).toBe('FAILED');
    expect(stuck.lastError).toMatch(/nobody receives it twice/);
  });

  it('only deletes drafts', async () => {
    const draft = await post('/api/newsletters').send({
      subject: `vitest-${run} delete`,
      htmlContent: '<p>x</p>',
    });
    expect(
      (
        await request(app)
          .delete(`/api/newsletters/${draft.body.id}`)
          .set('Origin', SITE)
          .set('Cookie', cookie)
      ).status
    ).toBe(204);
    const sent = await prisma.newsletterCampaign.findFirstOrThrow({
      where: { subject: `vitest-${run} launch` },
    });
    expect(
      (
        await request(app)
          .delete(`/api/newsletters/${sent.id}`)
          .set('Origin', SITE)
          .set('Cookie', cookie)
      ).status
    ).toBe(400);
  });

  it('supports one-click unsubscribe from mail providers', async () => {
    const token = tokens[emails[2]];
    const res = await request(app)
      .post(`/api/subscriptions/unsubscribe/one-click?token=${token}`)
      .set('Origin', 'https://mail.google.com')
      .type('form')
      .send('List-Unsubscribe=One-Click');
    expect(res.status).toBe(200);
    expect(
      (await prisma.subscription.findUniqueOrThrow({ where: { email: emails[2] } })).status
    ).toBe('UNSUBSCRIBED');

    const opened = await request(app).get(
      `/api/subscriptions/unsubscribe/one-click?token=${token}`
    );
    expect(opened.status).toBe(302);
    expect(opened.headers.location).toMatch(
      new RegExp(`/newsletter/unsubscribe\\?token=${token}$`)
    );

    expect(
      (await request(app).post('/api/subscriptions/unsubscribe/one-click?token=nope')).status
    ).toBe(404);
  });

  async function sentEmail() {
    for (let i = 0; i < 50 && mocks.emailSend.mock.calls.length === 0; i++) {
      await new Promise((r) => setTimeout(r, 20));
    }
    expect(mocks.emailSend).toHaveBeenCalledOnce();
    return mocks.emailSend.mock.calls[0][0];
  }

  const quiet = () => new Promise((r) => setTimeout(r, 100));
  const anonymous = (path: string) => request(app).post(path).set('Origin', SITE);

  it('asks for confirmation first, then welcomes, and never emails twice for the same step', async () => {
    mocks.emailSend.mockResolvedValue({ data: { id: 'confirm-1' }, error: null });
    const email = `vitest-${run}-reader@example.invalid`;

    const first = await anonymous('/api/subscriptions').send({ email });
    expect(first.status).toBe(202);
    expect(first.body).toMatchObject({ result: 'confirmation_sent', emailSent: true });
    const confirmation = await sentEmail();
    expect(confirmation).toMatchObject({
      from: 'Eightblock <noreply@news.eightblock.dev>',
      to: email,
      subject: 'Confirm your Eightblock newsletter subscription',
      tags: [{ name: 'category', value: 'subscription-confirm' }],
    });
    expect(confirmation.headers).toBeUndefined();
    const { confirmToken } = await prisma.subscription.findUniqueOrThrow({ where: { email } });
    expect(confirmation.html).toContain(`${SITE}/newsletter/confirm?token=${confirmToken}`);
    expect(confirmation.text).toContain('expires in 7 days');

    mocks.emailSend.mockClear();
    const retry = await anonymous('/api/subscriptions').send({ email });
    expect(retry.body.result).toBe('confirmation_sent');
    await quiet();
    expect(mocks.emailSend).not.toHaveBeenCalled();

    const confirmed = await anonymous('/api/subscriptions/confirm').send({ token: confirmToken });
    expect(confirmed.body.result).toBe('subscribed');
    const welcome = await sentEmail();
    expect(welcome.subject).toBe("You're subscribed to the Eightblock newsletter");
    expect(welcome.headers['List-Unsubscribe']).toContain('/unsubscribe/one-click?token=');

    mocks.emailSend.mockClear();
    await anonymous('/api/subscriptions/confirm').send({ token: confirmToken });
    const again = await anonymous('/api/subscriptions').send({ email });
    expect(again.status).toBe(200);
    expect(again.body).toMatchObject({ result: 'already_subscribed', emailSent: false });
    await quiet();
    expect(mocks.emailSend).not.toHaveBeenCalled();

    const { unsubscribeToken } = await prisma.subscription.findUniqueOrThrow({ where: { email } });
    await anonymous('/api/subscriptions/unsubscribe').send({ token: unsubscribeToken });
    await anonymous('/api/subscriptions').send({ email });
    expect((await sentEmail()).subject).toBe('Confirm your Eightblock newsletter subscription');
    mocks.emailSend.mockClear();
    const renewed = await prisma.subscription.findUniqueOrThrow({ where: { email } });
    await anonymous('/api/subscriptions/confirm').send({ token: renewed.confirmToken });
    expect((await sentEmail()).subject).toBe("You're back on the Eightblock newsletter");
  });

  it("subscribes a signed-in reader's own address without a confirmation link", async () => {
    const me = () => get('/api/subscriptions/me');
    expect((await request(app).get('/api/subscriptions/me')).status).toBe(401);
    expect((await me()).body).toEqual({
      email: `vitest-${run}-admin@example.invalid`,
      subscribed: false,
    });
    mocks.emailSend.mockResolvedValue({ data: { id: 'welcome-2' }, error: null });
    const res = await post('/api/subscriptions').send({
      email: `vitest-${run}-admin@example.invalid`,
    });
    expect(res.status).toBe(201);
    expect(res.body.result).toBe('subscribed');
    expect((await sentEmail()).subject).toBe("You're subscribed to the Eightblock newsletter");
    expect((await me()).body.subscribed).toBe(true);
  });

  it('expires confirmation links and drops signups nobody confirmed', async () => {
    const { purgeUnconfirmed } = await import('../services/subscription-service.js');
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const stranger = await prisma.subscription.create({
      data: {
        email: `vitest-${run}-stale@example.invalid`,
        status: 'PENDING',
        confirmToken: randomUUID(),
        confirmSentAt: eightDaysAgo,
      },
    });
    const leftBefore = new Date('2026-01-01T00:00:00Z');
    const returning = await prisma.subscription.create({
      data: {
        email: `vitest-${run}-stale-back@example.invalid`,
        status: 'PENDING',
        confirmToken: randomUUID(),
        confirmSentAt: eightDaysAgo,
        unsubscribedAt: leftBefore,
      },
    });

    const expired = await anonymous('/api/subscriptions/confirm').send({
      token: stranger.confirmToken,
    });
    expect(expired.status).toBe(404);
    expect(expired.body.error).toMatch(/Subscribe again/);

    await purgeUnconfirmed();
    expect(await prisma.subscription.findUnique({ where: { id: stranger.id } })).toBeNull();
    expect(
      await prisma.subscription.findUniqueOrThrow({ where: { id: returning.id } })
    ).toMatchObject({
      status: 'UNSUBSCRIBED',
      confirmToken: null,
      unsubscribedAt: leftBefore,
    });
  });

  describe('Resend webhook', () => {
    const secret = `whsec_${Buffer.from('vitest-webhook-secret').toString('base64')}`;

    async function deliver(event: object, { sign = secret, at = Date.now() } = {}) {
      const { createHmac } = await import('node:crypto');
      const body = JSON.stringify(event);
      const id = `msg_${randomUUID()}`;
      const timestamp = String(Math.floor(at / 1000));
      const signature = createHmac('sha256', Buffer.from(sign.replace(/^whsec_/, ''), 'base64'))
        .update(`${id}.${timestamp}.${body}`)
        .digest('base64');
      return request(app)
        .post('/api/webhooks/resend')
        .set('Content-Type', 'application/json')
        .set('svix-id', id)
        .set('svix-timestamp', timestamp)
        .set('svix-signature', `v1,${signature}`)
        .send(body);
    }

    beforeEach(() => {
      process.env.RESEND_WEBHOOK_SECRET = secret;
    });
    afterAll(() => {
      delete process.env.RESEND_WEBHOOK_SECRET;
    });

    it('rejects unsigned, forged and replayed calls', async () => {
      const event = { type: 'email.complained', data: { to: [emails[0]] } };
      expect((await request(app).post('/api/webhooks/resend').send(event)).status).toBe(401);
      expect((await deliver(event, { sign: 'whsec_Zm9yZ2Vk' })).status).toBe(401);
      expect((await deliver(event, { at: Date.now() - 10 * 60_000 })).status).toBe(401);
      delete process.env.RESEND_WEBHOOK_SECRET;
      expect((await deliver(event)).status).toBe(503);
      expect(
        (await prisma.subscription.findUniqueOrThrow({ where: { email: emails[0] } })).status
      ).toBe('ACTIVE');
    });

    it('stops mail to addresses that bounce hard or report spam', async () => {
      const transient = await deliver({
        type: 'email.bounced',
        data: { to: [emails[0]], bounce: { type: 'Transient' } },
      });
      expect(transient.status).toBe(200);
      expect(
        (await prisma.subscription.findUniqueOrThrow({ where: { email: emails[0] } })).status
      ).toBe('ACTIVE');

      await deliver({
        type: 'email.bounced',
        data: { to: [emails[0]], bounce: { type: 'Permanent' } },
      });
      await deliver({ type: 'email.complained', data: { to: [`Reader <${emails[1]}>`] } });
      await deliver({ type: 'email.delivered', data: { to: [emails[2]] } });

      const status = async (email: string) =>
        prisma.subscription.findUniqueOrThrow({ where: { email } });
      expect(await status(emails[0])).toMatchObject({
        status: 'UNSUBSCRIBED',
        unsubscribeReason: 'bounced',
      });
      expect(await status(emails[1])).toMatchObject({
        status: 'UNSUBSCRIBED',
        unsubscribeReason: 'complained',
      });
      expect((await status(emails[2])).unsubscribeReason).not.toBe('bounced');

      await prisma.subscription.updateMany({
        where: { email: { in: [emails[0], emails[1]] } },
        data: { status: 'ACTIVE', unsubscribeReason: null, unsubscribedAt: null },
      });
    });
  });

  describe('automatic newsletters', () => {
    let articleSeq = 0;
    async function publish(status: 'DRAFT' | 'PUBLISHED' = 'PUBLISHED') {
      articleSeq += 1;
      const res = await post('/api/articles').send({
        title: `vitest-${run} article ${articleSeq}`,
        slug: `vitest-${run}-article-${articleSeq}`,
        excerpt: `Excerpt ${articleSeq}`,
        content: '<p>Body</p>',
        categoryIds: ['cardano'],
        status,
      });
      expect(res.status).toBe(201);
      return res.body.id as string;
    }
    async function articleDraft(articleId: string) {
      for (let i = 0; i < 50; i++) {
        const draft = await prisma.newsletterCampaign.findUnique({
          where: { sourceKey: `article:${articleId}` },
        });
        if (draft) return draft;
        await new Promise((r) => setTimeout(r, 20));
      }
      return null;
    }

    const startedAt = new Date();
    afterAll(async () => {
      await prisma.newsletterCampaign.deleteMany({
        where: { kind: 'DIGEST', createdAt: { gte: startedAt } },
      });
      await prisma.article.deleteMany({ where: { authorId: adminId } });
    });

    it('drafts a newsletter for an article the first time it is published, and never sends it alone', async () => {
      const id = await publish();
      const draft = await articleDraft(id);
      expect(draft).toMatchObject({
        kind: 'ARTICLE',
        status: 'DRAFT',
        subject: `vitest-${run} article ${articleSeq}`,
        preheader: `Excerpt ${articleSeq}`,
        articleIds: [id],
      });
      expect(mocks.batchSend).not.toHaveBeenCalled();

      await request(app)
        .put(`/api/articles/${id}`)
        .set('Origin', SITE)
        .set('Cookie', cookie)
        .send({ status: 'DRAFT' });
      await request(app)
        .put(`/api/articles/${id}`)
        .set('Origin', SITE)
        .set('Cookie', cookie)
        .send({ status: 'PUBLISHED' });
      await quiet();
      expect(await prisma.newsletterCampaign.count({ where: { articleIds: { has: id } } })).toBe(1);
    });

    it('dates an article from when it went live, not when the draft was started', async () => {
      const id = await publish('DRAFT');
      expect(await articleDraft(id)).toBeNull();
      const { createdAt } = await prisma.article.findUniqueOrThrow({ where: { id } });
      await new Promise((r) => setTimeout(r, 30));
      await request(app)
        .put(`/api/articles/${id}`)
        .set('Origin', SITE)
        .set('Cookie', cookie)
        .send({ status: 'PUBLISHED' });
      const live = await prisma.article.findUniqueOrThrow({ where: { id } });
      expect(live.publishedAt.getTime()).toBeGreaterThan(createdAt.getTime());
      expect(await articleDraft(id)).not.toBeNull();
    });

    it('sends a weekly digest of articles no newsletter covered, then skips until there is something new', async () => {
      const { sendWeeklyDigest } = await import('../services/newsletter-automation.js');
      mocks.batchSend.mockImplementation(async (payload: Payload[]) => accept(payload));

      const emailedId = await publish();
      const emailedDraft = (await articleDraft(emailedId))!;
      expect((await post(`/api/newsletters/${emailedDraft.id}/send`)).status).toBe(202);
      await settled(emailedDraft.id);

      const freshId = await publish();
      expect(await articleDraft(freshId)).not.toBeNull();
      mocks.batchSend.mockClear();

      const outcome = await sendWeeklyDigest();
      expect(outcome.sent).toBe(true);
      const digest = await settled((outcome as { campaignId: string }).campaignId);
      expect(digest).toMatchObject({ kind: 'DIGEST', status: 'SENT' });
      expect(digest.articleIds).toContain(freshId);
      expect(digest.articleIds).not.toContain(emailedId);
      expect(digest.subject).toMatch(/^This week on Eightblock: /);
      expect(mine(mocks.batchSend.mock.calls.flatMap((c) => c[0])).length).toBeGreaterThan(0);
      expect(
        await prisma.newsletterCampaign.findUnique({ where: { sourceKey: `article:${freshId}` } })
      ).toBeNull();

      expect(await sendWeeklyDigest()).toEqual({
        sent: false,
        reason: 'Every article from this week was already emailed',
      });
      expect(await sendWeeklyDigest(new Date('2001-01-01T09:00:00Z'))).toEqual({
        sent: false,
        reason: 'Nothing was published this week',
      });
    });
  });

  it('welcomes new accounts from the noreply sender without newsletter headers', async () => {
    mocks.emailSend.mockResolvedValue({ data: { id: 'account-1' }, error: null });
    const { sendAccountWelcomeEmail } = await import('../services/email-service.js');
    await sendAccountWelcomeEmail({
      email: `vitest-${run}-new@example.invalid`,
      name: 'Ada Lovelace',
    });

    const message = mocks.emailSend.mock.calls[0][0];
    expect(message).toMatchObject({
      from: 'Eightblock <noreply@news.eightblock.dev>',
      subject: 'Welcome to Eightblock, your account is ready',
      tags: [{ name: 'category', value: 'account-welcome' }],
    });
    expect(message.headers).toBeUndefined();
    expect(message.html).toContain('Welcome to Eightblock, Ada');
    expect(message.html).toContain('/newsletter"');
  });

  describe('settings', () => {
    const DEFAULTS = {
      fromAddress: null,
      transactionalFrom: null,
      replyTo: null,
      postalAddress: null,
      doubleOptIn: true,
      confirmExpiryDays: 7,
      welcomeEmail: true,
      accountWelcome: true,
      articleDrafts: true,
      digestEnabled: true,
      digestDay: 1,
      digestHour: 9,
      digestTimezone: 'UTC',
      digestMaxArticles: 10,
    };
    const put = (body: object) =>
      request(app)
        .put('/api/newsletters/settings')
        .set('Origin', SITE)
        .set('Cookie', cookie)
        .send({ ...DEFAULTS, ...body });
    let visitor = 0;
    const signup = (email: string) =>
      anonymous('/api/subscriptions')
        .set('X-Forwarded-For', `203.0.113.${++visitor}`)
        .send({ email });

    afterEach(async () => {
      const { clearNewsletterSettingsCache } = await import('../services/newsletter-settings.js');
      await prisma.newsletterSettings.deleteMany();
      clearNewsletterSettingsCache();
    });

    it('lets admins change settings, validated, and keeps editors out', async () => {
      const initial = await get('/api/newsletters/settings');
      expect(initial.status).toBe(200);
      expect(initial.body.settings).toMatchObject(DEFAULTS);
      expect(initial.body.defaults.fromAddress).toBe('Eightblock <newsletter@news.eightblock.dev>');
      expect(initial.body.emailConfigured).toBe(true);

      expect((await put({ fromAddress: 'not an address' })).status).toBe(400);
      expect((await put({ digestTimezone: 'Mars/Olympus' })).status).toBe(400);
      expect((await put({ digestHour: 24 })).status).toBe(400);

      const saved = await put({
        fromAddress: 'Vitest News <news@example.dev>',
        digestDay: 5,
        digestTimezone: 'Europe/Berlin',
      });
      expect(saved.status).toBe(200);
      expect(saved.body.settings).toMatchObject({ digestDay: 5, digestTimezone: 'Europe/Berlin' });
      expect(saved.body.nextDigestAt).toEqual(expect.any(String));
      expect((await get('/api/newsletters/status')).body.from).toBe(
        'Vitest News <news@example.dev>'
      );

      mocks.emailSend.mockResolvedValue({ data: { id: 'test-2' }, error: null });
      await post('/api/newsletters/test').send({
        subject: `vitest-${run} sender`,
        htmlContent: '<p>Hi</p>',
      });
      expect(mocks.emailSend.mock.calls[0][0].from).toBe('Vitest News <news@example.dev>');

      const { signToken } = await import('../utils/jwt.js');
      const editor = await prisma.user.create({
        data: { email: `vitest-${run}-editor@example.invalid`, role: 'EDITOR' },
      });
      try {
        const editorCookie = `auth_token=${signToken({ userId: editor.id, role: 'EDITOR' })}`;
        const read = await request(app)
          .get('/api/newsletters/settings')
          .set('Cookie', editorCookie);
        expect(read.status).toBe(403);
        const write = await request(app)
          .put('/api/newsletters/settings')
          .set('Origin', SITE)
          .set('Cookie', editorCookie)
          .send(DEFAULTS);
        expect(write.status).toBe(403);
      } finally {
        await prisma.user.delete({ where: { id: editor.id } });
      }
    });

    it('subscribes straight away when double opt-in is off, and respects the welcome switch', async () => {
      await put({ doubleOptIn: false });
      mocks.emailSend.mockResolvedValue({ data: { id: 'welcome-3' }, error: null });
      const direct = await signup(`vitest-${run}-direct@example.invalid`);
      expect(direct.status).toBe(201);
      expect(direct.body).toMatchObject({ result: 'subscribed', emailSent: true });
      expect((await sentEmail()).subject).toBe("You're subscribed to the Eightblock newsletter");

      mocks.emailSend.mockClear();
      await put({ doubleOptIn: false, welcomeEmail: false });
      const silent = await signup(`vitest-${run}-silent@example.invalid`);
      expect(silent.body).toMatchObject({ result: 'subscribed', emailSent: false });
      await quiet();
      expect(mocks.emailSend).not.toHaveBeenCalled();
    });

    it('uses the configured confirmation expiry', async () => {
      await put({ confirmExpiryDays: 2 });
      mocks.emailSend.mockResolvedValue({ data: { id: 'confirm-2' }, error: null });
      const email = `vitest-${run}-short@example.invalid`;
      await signup(email);
      expect((await sentEmail()).text).toContain('expires in 2 days');

      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const pending = await prisma.subscription.update({
        where: { email },
        data: { confirmSentAt: threeDaysAgo },
      });
      const res = await anonymous('/api/subscriptions/confirm').send({
        token: pending.confirmToken,
      });
      expect(res.status).toBe(404);
    });

    it('skips the account welcome and article drafts when they are switched off', async () => {
      await put({ accountWelcome: false, articleDrafts: false });
      const { sendAccountWelcomeEmail } = await import('../services/email-service.js');
      expect(
        await sendAccountWelcomeEmail({ email: `vitest-${run}-quiet@example.invalid`, name: null })
      ).toBeNull();
      expect(mocks.emailSend).not.toHaveBeenCalled();

      const { draftArticleNewsletter } = await import('../services/newsletter-automation.js');
      const article = await prisma.article.create({
        data: {
          title: `vitest-${run} no draft`,
          slug: `vitest-${run}-no-draft`,
          description: 'x',
          content: '<p>x</p>',
          status: 'PUBLISHED',
          publishedAt: new Date(),
          authorId: adminId,
        },
      });
      try {
        expect(await draftArticleNewsletter(article.id)).toBe(false);
      } finally {
        await prisma.article.delete({ where: { id: article.id } });
      }
    });

    it('works out when the digest is due in the chosen timezone', async () => {
      const { digestDue, nextDigestAt } = await import('../services/newsletter-automation.js');
      const newYork = {
        digestEnabled: true,
        digestDay: 1,
        digestHour: 9,
        digestTimezone: 'America/New_York',
      };
      // Monday 28 September 2026, 09:00 in New York is 13:00 UTC (daylight saving time).
      expect(digestDue(newYork, new Date('2026-09-28T13:30:00Z'))).toBe(true);
      expect(digestDue(newYork, new Date('2026-09-28T09:30:00Z'))).toBe(false);
      expect(
        digestDue({ ...newYork, digestEnabled: false }, new Date('2026-09-28T13:30:00Z'))
      ).toBe(false);
      expect(nextDigestAt(newYork, new Date('2026-09-28T13:00:00Z'))?.toISOString()).toBe(
        '2026-10-05T13:00:00.000Z'
      );
      expect(
        nextDigestAt(
          { ...newYork, digestTimezone: 'Asia/Kolkata' },
          new Date('2026-09-27T00:00:00Z')
        )?.toISOString()
      ).toBe('2026-09-28T03:30:00.000Z');
      expect(nextDigestAt({ ...newYork, digestEnabled: false })).toBeNull();
    });
  });
});
