import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import type { Role } from '@prisma/client';

const hasDatabase = Boolean(process.env.TEST_DATABASE_URL);
const SITE = 'http://localhost:3000';
const run = randomUUID().slice(0, 8);

type App = typeof import('../app.js').app;
type Db = typeof import('../prisma/client.js').prisma;

describe.skipIf(!hasDatabase)('API against a real database', () => {
  let app: App;
  let prisma: Db;
  const users: Record<
    'admin' | 'editor' | 'writer' | 'other' | 'reader' | 'newcomer' | 'revoked',
    { id: string; cookie: string }
  > = {} as never;
  const createdTagIds: string[] = [];
  let articleId = '';
  let articleSlug = '';

  const as = (who: keyof typeof users) => users[who].cookie;
  const post = (path: string, who?: keyof typeof users) => {
    const req = request(app).post(path).set('Origin', SITE);
    return who ? req.set('Cookie', as(who)) : req;
  };
  const put = (path: string, who: keyof typeof users) =>
    request(app).put(path).set('Origin', SITE).set('Cookie', as(who));
  const del = (path: string, who: keyof typeof users) =>
    request(app).delete(path).set('Origin', SITE).set('Cookie', as(who));
  const get = (path: string, who?: keyof typeof users) => {
    const req = request(app).get(path);
    return who ? req.set('Cookie', as(who)) : req;
  };

  beforeAll(async () => {
    ({ app } = await import('../app.js'));
    ({ prisma } = await import('../prisma/client.js'));
    const { signToken } = await import('../utils/jwt.js');

    const make = async (key: keyof typeof users, role: Role) => {
      const user = await prisma.user.create({
        data: {
          email: `vitest-${run}-${key}@example.invalid`,
          name: `Vitest ${key}`,
          role,
          // The newcomer is created like a legacy account, without a handle.
          username: key === 'newcomer' ? null : `vitest-${run}-${key}`,
        },
      });
      users[key] = { id: user.id, cookie: `auth_token=${signToken({ userId: user.id, role })}` };
    };
    await make('admin', 'ADMIN');
    await make('editor', 'EDITOR');
    await make('writer', 'WRITER');
    await make('other', 'WRITER');
    await make('reader', 'READER');
    await make('newcomer', 'READER');
    await make('revoked', 'READER');
  });

  afterAll(async () => {
    if (!prisma) return;
    const ids = Object.values(users).map((u) => u.id);
    const articles = await prisma.article.findMany({
      where: { authorId: { in: ids } },
      select: { id: true },
    });
    const articleIds = articles.map((a) => a.id);
    await prisma.$transaction([
      prisma.like.deleteMany({
        where: { OR: [{ articleId: { in: articleIds } }, { userId: { in: ids } }] },
      }),
      prisma.comment.deleteMany({
        where: { OR: [{ articleId: { in: articleIds } }, { authorId: { in: ids } }] },
      }),
      prisma.bookmark.deleteMany({
        where: { OR: [{ articleId: { in: articleIds } }, { userId: { in: ids } }] },
      }),
      prisma.pageView.deleteMany({ where: { articleId: { in: articleIds } } }),
      prisma.pageView.deleteMany({ where: { path: { contains: `vitest-${run}` } } }),
      prisma.tagOnArticle.deleteMany({ where: { articleId: { in: articleIds } } }),
      prisma.article.deleteMany({ where: { id: { in: articleIds } } }),
      prisma.tag.deleteMany({
        where: { OR: [{ id: { in: createdTagIds } }, { slug: { startsWith: `vitest-${run}` } }] },
      }),
      prisma.subscription.deleteMany({ where: { email: { startsWith: `vitest-${run}` } } }),
      prisma.user.deleteMany({ where: { id: { in: ids } } }),
    ]);
    await prisma.$disconnect();
    const { closeRedis } = await import('../utils/redis.js');
    await closeRedis();
  });

  it('is ready when the database and Redis are reachable', async () => {
    const res = await get('/readyz');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ database: true, redis: true });
  });

  describe('profile', () => {
    it('returns the signed-in user', async () => {
      const res = await get('/api/users/me', 'reader');
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(`vitest-${run}-reader@example.invalid`);
    });

    it('updates name and bio, storing an empty bio as null', async () => {
      const res = await put('/api/users/me', 'reader').send({ name: 'Renamed Reader', bio: '   ' });
      expect(res.status).toBe(200);
      const user = await prisma.user.findUnique({ where: { id: users.reader.id } });
      expect(user).toMatchObject({ name: 'Renamed Reader', bio: null });
    });

    it('rejects arbitrary avatar URLs', async () => {
      const res = await put('/api/users/me', 'reader').send({
        avatar: 'https://evil.example/x.png',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('article images', () => {
    const uploadsDir = new URL('../../uploads/articles/', import.meta.url);
    const rawLeftovers = async () => {
      const { readdir } = await import('node:fs/promises');
      return (await readdir(uploadsDir)).filter((name) => name.endsWith('.upload'));
    };

    it('re-encodes uploads (WebP included) and discards files that are not images', async () => {
      const { default: sharp } = await import('sharp');
      const webp = await sharp({
        create: { width: 8, height: 8, channels: 3, background: '#1b9dd9' },
      })
        .webp()
        .toBuffer();

      const ok = await post('/api/upload/article-image', 'writer').attach('image', webp, {
        filename: 'photo.webp',
        contentType: 'image/webp',
      });
      expect(ok.status).toBe(200);
      expect(ok.body.imageUrl).toMatch(/\/uploads\/articles\/article-[\w-]+\.webp$/);

      const fake = await post('/api/upload/article-image', 'writer').attach(
        'image',
        Buffer.from('<script>alert(1)</script>'),
        { filename: 'x.html', contentType: 'image/png' }
      );
      expect(fake.status).toBe(500);
      expect(await rawLeftovers()).toEqual([]);

      // Only the owner (or a moderator) can remove an image used in their article.
      await prisma.article.create({
        data: {
          title: 'Illustrated',
          slug: `vitest-${run}-illustrated`,
          description: 'x',
          content: '<p>x</p>',
          category: 'Guide',
          featuredImage: ok.body.imageUrl,
          authorId: users.writer.id,
        },
      });
      const remove = (who: keyof typeof users) =>
        del('/api/upload/article-image', who).send({ imageUrl: ok.body.imageUrl });
      expect((await remove('other')).status).toBe(403);
      expect((await remove('writer')).status).toBe(200);
    });
  });

  describe('articles', () => {
    it('does not let readers publish', async () => {
      const res = await post('/api/articles', 'reader').send({
        title: 'x',
        slug: `vitest-${run}-r`,
        content: 'x',
      });
      expect(res.status).toBe(403);
    });

    it('lets writers publish', async () => {
      articleSlug = `vitest-${run}-article`;
      const res = await post('/api/articles', 'writer').send({
        title: 'Integration article',
        slug: articleSlug,
        content: '<p>Hello</p>',
        excerpt: 'Short',
        tags: ['Cardano'],
        status: 'PUBLISHED',
      });
      expect(res.status).toBe(201);
      articleId = res.body.id;
      expect((await get(`/api/articles/${articleSlug}`)).status).toBe(200);
    });

    it('rejects duplicate slugs and oversized titles', async () => {
      const dup = await post('/api/articles', 'writer').send({
        title: 'Again',
        slug: articleSlug,
        content: 'x',
      });
      expect(dup.status).toBe(400);
      const long = await post('/api/articles', 'writer').send({
        title: 'x'.repeat(201),
        slug: `vitest-${run}-long`,
        content: 'x',
      });
      expect(long.status).toBe(400);
    });

    it('only lets the author edit', async () => {
      expect(
        (await put(`/api/articles/${articleId}`, 'other').send({ title: 'Hijack' })).status
      ).toBe(403);
      const edited = await put(`/api/articles/${articleId}`, 'writer').send({ title: 'Edited' });
      expect(edited.status).toBe(200);
      expect(edited.body.tags.map((t: { tag: { name: string } }) => t.tag.name)).toEqual([
        'Cardano',
      ]);
    });

    it('reuses existing tags regardless of case and ignores duplicates', async () => {
      const res = await post('/api/articles', 'writer').send({
        title: 'Tag casing',
        slug: `vitest-${run}-tag-casing`,
        content: '<p>Tags</p>',
        tags: ['cardano', 'CARDANO', `Vitest ${run} Case`, `vitest ${run} case`, '!!!'],
        status: 'DRAFT',
      });
      expect(res.status).toBe(201);
      const names = res.body.tags.map((t: { tag: { name: string } }) => t.tag.name).sort();
      expect(names).toEqual(['Cardano', `Vitest ${run} Case`].sort());
      expect(res.body.category).toBe('Cardano');
    });

    it('shows drafts to their author only', async () => {
      const draftSlug = `vitest-${run}-draft`;
      const created = await post('/api/articles', 'writer').send({
        title: 'Draft',
        slug: draftSlug,
        content: '<p>Work in progress</p>',
        status: 'DRAFT',
      });
      expect(created.status).toBe(201);
      expect((await get(`/api/articles/${draftSlug}`, 'writer')).status).toBe(200);
      expect((await get(`/api/articles/${draftSlug}`, 'other')).status).toBe(404);
      expect((await get(`/api/articles/${draftSlug}`)).status).toBe(404);
    });

    it('rejects slugs that cannot be routed, with a readable message', async () => {
      const res = await post('/api/articles', 'writer').send({
        title: 'Bad',
        slug: 'Bad Slug/x',
        content: 'x',
      });
      expect(res.status).toBe(400);
      expect(typeof res.body.error).toBe('string');
      expect(res.body.error).toMatch(/^slug: /);
    });

    it('reports a slug taken by another article as 409 on update', async () => {
      const res = await put(`/api/articles/${articleId}`, 'writer').send({
        slug: `vitest-${run}-draft`,
      });
      expect(res.status).toBe(409);
    });

    it('rejects slugs that collide with fixed routes', async () => {
      for (const slug of ['new', 'mine']) {
        const res = await post('/api/articles', 'writer').send({ title: slug, slug, content: 'x' });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/reserved/);
      }
    });

    it("lists the author's own articles with status counts, without bodies", async () => {
      const all = await get('/api/articles/mine?limit=500', 'writer');
      expect(all.status).toBe(200);
      expect(all.body.pagination.limit).toBe(50);
      expect(all.body.counts.ALL).toBe(all.body.pagination.total);
      expect(all.body.counts.DRAFT).toBeGreaterThanOrEqual(1);
      expect(all.body.articles[0]).not.toHaveProperty('content');

      const drafts = await get('/api/articles/mine?status=DRAFT', 'writer');
      expect(drafts.body.articles.length).toBeGreaterThan(0);
      expect(drafts.body.articles.every((a: { status: string }) => a.status === 'DRAFT')).toBe(
        true
      );

      const others = await get('/api/articles/mine', 'other');
      expect(others.body.articles.some((a: { id: string }) => a.id === articleId)).toBe(false);
    });
  });

  describe('roles', () => {
    it('only lets admins list users and change roles', async () => {
      for (const who of ['editor', 'writer', 'reader'] as const) {
        expect((await get('/api/users', who)).status).toBe(403);
        const res = await request(app)
          .patch(`/api/users/${users.newcomer.id}/role`)
          .set('Origin', SITE)
          .set('Cookie', as(who))
          .send({ role: 'WRITER' });
        expect(res.status).toBe(403);
      }
    });

    it('searches users by name or email and reports counts per role', async () => {
      const res = await get(`/api/users?q=vitest-${run}-NEWCOMER`, 'admin');
      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(1);
      expect(res.body.users[0]).toMatchObject({
        id: users.newcomer.id,
        role: 'READER',
        managedByConfig: false,
      });
      expect(res.body.counts.ALL).toBeGreaterThanOrEqual(7);

      const writers = await get('/api/users?role=WRITER&limit=50', 'admin');
      expect(writers.body.users.every((u: { role: string }) => u.role === 'WRITER')).toBe(true);
    });

    it('lets a promoted reader write straight away and stops them once demoted', async () => {
      const patch = (role: string) =>
        request(app)
          .patch(`/api/users/${users.newcomer.id}/role`)
          .set('Origin', SITE)
          .set('Cookie', as('admin'))
          .send({ role });

      const article = {
        title: 'First piece',
        slug: `vitest-${run}-newcomer`,
        content: '<p>Hi</p>',
      };
      expect((await post('/api/articles', 'newcomer').send(article)).status).toBe(403);

      const promoted = await patch('WRITER');
      expect(promoted.status).toBe(200);
      expect(promoted.body.role).toBe('WRITER');
      expect(promoted.body.username).toMatch(/^vitest-newcomer/);

      // Same session cookie: permissions come from the database, not the token.
      const created = await post('/api/articles', 'newcomer').send(article);
      expect(created.status).toBe(201);

      expect((await patch('READER')).status).toBe(200);
      expect(
        (await put(`/api/articles/${created.body.id}`, 'newcomer').send({ title: 'Nope' })).status
      ).toBe(403);
      expect((await get('/api/articles/mine', 'newcomer')).body.counts.ALL).toBe(1);
    });

    it('validates the role and refuses self-changes and unknown users', async () => {
      const patch = (id: string, role: string) =>
        request(app)
          .patch(`/api/users/${id}/role`)
          .set('Origin', SITE)
          .set('Cookie', as('admin'))
          .send({ role });

      expect((await patch(users.newcomer.id, 'OWNER')).status).toBe(400);
      const self = await patch(users.admin.id, 'READER');
      expect(self.status).toBe(400);
      expect(self.body.error).toMatch(/your own role/);
      expect((await patch(randomUUID(), 'WRITER')).status).toBe(404);
    });

    it('refuses to demote admins configured in ADMIN_EMAILS', async () => {
      const previous = process.env.ADMIN_EMAILS;
      process.env.ADMIN_EMAILS = `someone@example.invalid, vitest-${run}-editor@example.invalid`;
      try {
        const res = await request(app)
          .patch(`/api/users/${users.editor.id}/role`)
          .set('Origin', SITE)
          .set('Cookie', as('admin'))
          .send({ role: 'READER' });
        expect(res.status).toBe(409);
        expect(res.body.error).toMatch(/ADMIN_EMAILS/);
      } finally {
        process.env.ADMIN_EMAILS = previous;
      }
    });
  });

  describe('tags', () => {
    it('lets writers create tags but not readers', async () => {
      expect(
        (await post('/api/tags', 'reader').send({ name: 'Nope', slug: `vitest-${run}-nope` }))
          .status
      ).toBe(403);
      const res = await post('/api/tags', 'writer').send({
        name: `Vitest ${run}`,
        slug: `vitest-${run}-tag`,
      });
      expect(res.status).toBe(201);
      createdTagIds.push(res.body.id);
    });

    it('validates slugs and reports duplicates as 409', async () => {
      expect(
        (await post('/api/tags', 'writer').send({ name: 'Bad', slug: 'Bad Slug!' })).status
      ).toBe(400);
      const dup = await post('/api/tags', 'writer').send({
        name: `Vitest ${run}`,
        slug: `vitest-${run}-tag`,
      });
      expect(dup.status).toBe(409);
    });

    it('only lets staff delete tags, even ones in use', async () => {
      const tag = await prisma.tag.findUniqueOrThrow({ where: { slug: 'cardano' } });
      expect((await del(`/api/tags/${tag.id}`, 'writer')).status).toBe(403);

      const [own] = createdTagIds;
      await prisma.tagOnArticle.create({ data: { articleId, tagId: own } });
      expect((await del(`/api/tags/${own}`, 'admin')).status).toBe(204);
      expect((await del(`/api/tags/${own}`, 'admin')).status).toBe(404);
    });
  });

  describe('public author pages', () => {
    const writerHandle = () => `vitest-${run}-writer`;

    it('shows writers publicly, case-insensitively, but not readers without articles', async () => {
      const res = await get(`/api/authors/${writerHandle().toUpperCase()}`);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: users.writer.id,
        username: writerHandle(),
        name: 'Vitest writer',
      });
      expect(res.body.articleCount).toBeGreaterThanOrEqual(1);
      expect(res.body).not.toHaveProperty('email');

      expect((await get(`/api/authors/vitest-${run}-reader`)).status).toBe(404);
      expect((await get('/api/authors/nobody-here-at-all')).status).toBe(404);
    });

    it("lists only the author's published articles", async () => {
      const res = await get(`/api/articles?author=${writerHandle()}&limit=100`);
      expect(res.status).toBe(200);
      expect(res.body.articles.length).toBeGreaterThan(0);
      expect(res.body.pagination.total).toBe(res.body.articles.length);
      for (const article of res.body.articles) {
        expect(article.author).toMatchObject({ id: users.writer.id, username: writerHandle() });
        expect(article.status).toBe('PUBLISHED');
      }
    });

    it('filters by topic through tags or category, however the topic is spelled', async () => {
      const topic = `Vitest ${run} Topic`;
      const created = await post('/api/articles', 'writer').send({
        title: 'Topic piece',
        slug: `vitest-${run}-topic-piece`,
        content: '<p>Topic</p>',
        tags: [topic],
        status: 'PUBLISHED',
      });
      expect(created.status).toBe(201);

      for (const tag of [`vitest-${run}-topic`, topic, topic.toUpperCase()]) {
        const res = await get(`/api/articles?tag=${encodeURIComponent(tag)}`);
        expect(res.body.articles.map((a: { id: string }) => a.id)).toEqual([created.body.id]);
      }

      const combined = await get(
        `/api/articles?author=vitest-${run}-other&tag=vitest-${run}-topic`
      );
      expect(combined.body.articles).toHaveLength(0);
    });

    it('reports topics with counts for an author', async () => {
      const res = await get(`/api/articles/topics?author=${writerHandle()}`);
      expect(res.status).toBe(200);
      const slugs = res.body.map((t: { slug: string }) => t.slug);
      expect(slugs).toContain('cardano');
      expect(slugs).toContain(`vitest-${run}-topic`);
      expect(slugs).not.toContain('general');
      expect(res.body.find((t: { slug: string }) => t.slug === `vitest-${run}-topic`).count).toBe(
        1
      );
    });

    it('lets users change their username with validation', async () => {
      const desired = `vitest-${run}-renamed`;
      const saved = await put('/api/users/me', 'other').send({
        username: `  ${desired.toUpperCase()} `,
      });
      expect(saved.status).toBe(200);
      expect(saved.body.username).toBe(desired);

      expect(
        (await put('/api/users/me', 'other').send({ username: 'no spaces allowed' })).status
      ).toBe(400);
      expect((await put('/api/users/me', 'other').send({ username: '-edge' })).status).toBe(400);
      expect((await put('/api/users/me', 'other').send({ username: 'admin' })).status).toBe(400);
      expect((await put('/api/users/me', 'other').send({ username: writerHandle() })).status).toBe(
        409
      );
      // Saving your own current username is not a conflict.
      expect((await put('/api/users/me', 'other').send({ username: desired })).status).toBe(200);
    });
  });

  describe('comments', () => {
    let readerCommentId = '';

    it('requires a session and a published article', async () => {
      expect(
        (await post(`/api/articles/${articleId}/comments`).send({ body: 'Hello there' })).status
      ).toBe(401);
      const missing = await post(`/api/articles/${randomUUID()}/comments`, 'reader').send({
        body: 'Hello there',
      });
      expect(missing.status).toBe(404);
    });

    it('validates length', async () => {
      const path = `/api/articles/${articleId}/comments`;
      expect((await post(path, 'reader').send({ body: 'hi' })).status).toBe(400);
      expect((await post(path, 'reader').send({ body: 'x'.repeat(5001) })).status).toBe(400);
    });

    it('lets readers comment and edit their own comment', async () => {
      const res = await post(`/api/articles/${articleId}/comments`, 'reader').send({
        body: 'Great article',
      });
      expect(res.status).toBe(201);
      readerCommentId = res.body.id;
      const edit = await put(
        `/api/articles/${articleId}/comments/${readerCommentId}`,
        'reader'
      ).send({
        body: 'Great article, edited',
      });
      expect(edit.status).toBe(200);
    });

    it('hides a comment from the public once a moderator rejects it', async () => {
      const list = () => get(`/api/articles/${articleId}/comments`);
      const before = (await list()).body;
      expect(before.comments.map((c: { id: string }) => c.id)).toContain(readerCommentId);

      const path = `/api/articles/${articleId}/comments/${readerCommentId}/moderate`;
      const patch = (who: keyof typeof users, status: string) =>
        request(app).patch(path).set('Origin', SITE).set('Cookie', as(who)).send({ status });
      expect((await patch('writer', 'REJECTED')).status).toBe(403);
      expect((await patch('editor', 'REJECTED')).status).toBe(200);

      const after = (await list()).body;
      expect(after.comments.map((c: { id: string }) => c.id)).not.toContain(readerCommentId);
      expect(after.totalCount).toBe(before.totalCount - 1);
      expect((await get(`/api/articles/${articleSlug}`)).body._count.comments).toBe(
        after.totalCount
      );

      expect((await patch('editor', 'APPROVED')).status).toBe(200);
    });

    it('lets staff moderate but not other users', async () => {
      const path = `/api/articles/${articleId}/comments/${readerCommentId}`;
      expect((await del(path, 'writer')).status).toBe(403);
      expect((await put(path, 'admin').send({ body: 'Rewritten by admin' })).status).toBe(403);
      expect((await del(path, 'admin')).status).toBe(204);
    });
  });

  describe('claps and bookmarks', () => {
    it('lets anonymous visitors clap once', async () => {
      const agent = request.agent(app);
      const first = await agent.post(`/api/articles/${articleId}/likes`).set('Origin', SITE);
      expect(first.status).toBe(201);
      const again = await agent.post(`/api/articles/${articleId}/likes`).set('Origin', SITE);
      expect(again.status).toBe(200);
      expect((await agent.get(`/api/articles/${articleId}/likes`)).body).toEqual({ liked: true });
    });

    it('bookmarks and still allows deleting a bookmarked article', async () => {
      expect((await post('/api/bookmarks', 'reader').send({ articleId })).status).toBeLessThan(300);
      const ids = await get('/api/bookmarks/ids', 'reader');
      expect(JSON.stringify(ids.body)).toContain(articleId);

      const temp = await post('/api/articles', 'writer').send({
        title: 'To delete',
        slug: `vitest-${run}-delete`,
        content: 'x',
        status: 'PUBLISHED',
      });
      await post('/api/bookmarks', 'reader').send({ articleId: temp.body.id });
      const bookmarked = async () =>
        (await get('/api/bookmarks', 'reader')).body.bookmarks.map(
          (b: { article: { id: string } }) => b.article.id
        );
      expect(await bookmarked()).toContain(temp.body.id);
      await post(`/api/articles/${temp.body.id}/comments`, 'reader').send({
        body: 'Before deletion',
      });
      const unpublished = await put(`/api/articles/${temp.body.id}`, 'writer').send({
        status: 'DRAFT',
      });
      expect(unpublished.status).toBe(200);
      expect(await bookmarked()).not.toContain(temp.body.id);
      expect((await del(`/api/articles/${temp.body.id}`, 'other')).status).toBe(403);
      expect((await del(`/api/articles/${temp.body.id}`, 'writer')).status).toBe(204);
    });
  });

  describe('admin areas', () => {
    it('keeps subscribers and newsletters to admins, as the admin app does', async () => {
      for (const path of ['/api/subscriptions', '/api/newsletters', '/api/newsletters/settings']) {
        expect((await get(path, 'reader')).status).toBe(403);
        expect((await get(path, 'editor')).status).toBe(403);
        expect((await get(path, 'admin')).status).toBe(200);
      }
    });

    it('validates and saves the portfolio', async () => {
      expect((await put('/api/portfolio', 'reader').send({})).status).toBe(403);
      const evil = await put('/api/portfolio', 'admin').send({
        links: { website: 'javascript:alert(1)' },
      });
      expect(evil.status).toBe(400);

      const saved = await put('/api/portfolio', 'admin').send({
        headline: 'Builder',
        focusAreas: ['Cardano'],
        projects: [{ name: 'Eightblock', url: 'https://eightblock.dev' }],
        links: { github: 'https://github.com/example', email: 'me@example.com' },
      });
      expect(saved.status).toBe(200);
      const pub = await get('/api/portfolio');
      expect(pub.body).toMatchObject({ headline: 'Builder', name: 'Vitest admin' });
    });

    it('manages support wallets', async () => {
      const original = await prisma.supportWallet.findMany({ orderBy: { position: 'asc' } });
      try {
        expect((await put('/api/support-wallets', 'reader').send({ wallets: [] })).status).toBe(
          403
        );
        expect((await get('/api/support-wallets/manage', 'reader')).status).toBe(403);
        const bad = await put('/api/support-wallets', 'admin').send({
          wallets: [{ network: 'Cardano', currency: 'ADA', address: 'addr1 <script>' }],
        });
        expect(bad.status).toBe(400);

        const saved = await put('/api/support-wallets', 'admin').send({
          wallets: [
            { network: 'Cardano', currency: 'ADA', address: 'addr1qxyvitest000000' },
            { network: 'Ethereum', currency: 'ETH', address: '0xVitest0000000000', enabled: false },
          ],
        });
        expect(saved.status).toBe(200);
        expect(saved.body.map((w: { position: number }) => w.position)).toEqual([0, 1]);
        expect((await get('/api/support-wallets')).body).toEqual([
          expect.objectContaining({ network: 'Cardano', address: 'addr1qxyvitest000000' }),
        ]);

        // Reorder, enable, and drop the first wallet in one save.
        const [cardano, ethereum] = saved.body;
        const next = await put('/api/support-wallets', 'admin').send({
          wallets: [{ ...ethereum, enabled: true }],
        });
        expect(next.body).toHaveLength(1);
        expect(next.body[0]).toMatchObject({ id: ethereum.id, position: 0, enabled: true });
        expect(await prisma.supportWallet.findUnique({ where: { id: cardano.id } })).toBeNull();
        expect((await get('/api/support-wallets', 'admin')).body[0].network).toBe('Ethereum');
      } finally {
        await prisma.supportWallet.deleteMany();
        if (original.length) await prisma.supportWallet.createMany({ data: original });
      }
    });
  });

  describe('newsletter subscriptions', () => {
    it('confirms new addresses before subscribing them, and unsubscribes by token', async () => {
      const email = `vitest-${run}-sub@example.invalid`;
      const confirm = (token: string | null) => post('/api/subscriptions/confirm').send({ token });

      const res = await post('/api/subscriptions').send({ email: `  ${email.toUpperCase()} ` });
      expect(res.status).toBe(202);
      expect(res.body).toMatchObject({ email, result: 'confirmation_sent', emailSent: false });
      const pending = await prisma.subscription.findUniqueOrThrow({ where: { email } });
      expect(pending.status).toBe('PENDING');

      expect((await confirm(pending.confirmToken)).body).toMatchObject({
        email,
        result: 'subscribed',
      });
      expect((await confirm(pending.confirmToken)).body.result).toBe('already_subscribed');
      expect((await prisma.subscription.findUniqueOrThrow({ where: { email } })).status).toBe(
        'ACTIVE'
      );

      const { unsubscribeToken } = pending;
      expect(
        (await post('/api/subscriptions/unsubscribe').send({ token: unsubscribeToken })).status
      ).toBe(200);
      expect((await post('/api/subscriptions/unsubscribe').send({ token: 'nope' })).status).toBe(
        404
      );
      const left = await prisma.subscription.findUniqueOrThrow({ where: { email } });
      expect(left).toMatchObject({
        status: 'UNSUBSCRIBED',
        unsubscribeReason: 'unsubscribed',
        confirmToken: null,
      });
      expect(left.unsubscribedAt).toBeInstanceOf(Date);
      expect((await confirm(pending.confirmToken)).status).toBe(404);

      const again = await post('/api/subscriptions').send({ email });
      expect(again.body).toMatchObject({ result: 'confirmation_sent' });
      const returning = await prisma.subscription.findUniqueOrThrow({ where: { email } });
      expect(returning.status).toBe('PENDING');
      expect((await confirm(returning.confirmToken)).body.result).toBe('resubscribed');
      const back = await prisma.subscription.findUniqueOrThrow({ where: { email } });
      expect(back.status).toBe('ACTIVE');
      expect(back.unsubscribedAt).toEqual(left.unsubscribedAt);
    });
  });

  describe('analytics', () => {
    const CHROME =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';
    const IPHONE =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    const page = (name: string) => `/vitest-${run}-${name}`;
    const startedAt = new Date(Date.now() - 1000);
    let reader: ReturnType<typeof request.agent>;
    let firstViewId = '';

    const collect = (agent: ReturnType<typeof request.agent>, body: object, ua = CHROME) =>
      agent
        .post('/api/analytics/collect')
        .set('Origin', SITE)
        .set('User-Agent', ua)
        .set('Content-Type', 'text/plain')
        .send(JSON.stringify(body));
    const window = () =>
      `from=${startedAt.toISOString()}&to=${new Date(Date.now() + 60_000).toISOString()}`;

    beforeAll(() => {
      reader = request.agent(app);
    });

    it('records a visit with its source, campaign, country and device', async () => {
      const res = await collect(reader, {
        path: `${page('home')}?utm_source=x&fbclid=123`,
        referrer: 'https://t.co/xyz',
        timezone: 'Africa/Kinshasa',
        utm: { source: 'Twitter', medium: 'social', campaign: `vitest-${run}-launch` },
      });
      expect(res.status).toBe(201);
      firstViewId = res.body.id;

      const second = await collect(reader, {
        path: `/articles/${articleSlug}`,
        referrer: 'https://t.co/other',
      });
      expect(second.status).toBe(201);

      const [entry, next] = await Promise.all([
        prisma.pageView.findUniqueOrThrow({ where: { id: firstViewId } }),
        prisma.pageView.findUniqueOrThrow({ where: { id: second.body.id } }),
      ]);
      expect(entry).toMatchObject({
        path: page('home'),
        isEntry: true,
        referrer: 't.co',
        utmSource: 'twitter',
        country: 'CD',
        device: 'desktop',
        browser: 'Chrome',
      });
      expect(next).toMatchObject({
        sessionId: entry.sessionId,
        isEntry: false,
        referrer: null,
        articleId,
      });
    });

    it('updates engagement only for the visitor who owns the page view', async () => {
      const ping = (agent: ReturnType<typeof request.agent>, body: object) =>
        agent
          .post(`/api/analytics/collect/${firstViewId}`)
          .set('Origin', SITE)
          .set('User-Agent', CHROME)
          .set('Content-Type', 'text/plain')
          .send(JSON.stringify(body));

      expect((await ping(reader, { duration: 95, scrollDepth: 70 })).status).toBe(204);
      expect((await ping(reader, { duration: 20, scrollDepth: 30 })).status).toBe(204);
      expect((await ping(request.agent(app), { duration: 9999, scrollDepth: 100 })).status).toBe(
        204
      );

      const view = await prisma.pageView.findUniqueOrThrow({ where: { id: firstViewId } });
      expect(view).toMatchObject({ duration: 95, scrollDepth: 70 });
    });

    it('ignores bots, dashboard pages and other sites', async () => {
      const agent = request.agent(app);
      expect(
        (
          await collect(
            agent,
            { path: page('bot') },
            'Googlebot/2.1 (+http://www.google.com/bot.html)'
          )
        ).status
      ).toBe(204);
      expect((await collect(agent, { path: '/admin/analytics' })).status).toBe(204);
      const foreign = await agent
        .post('/api/analytics/collect')
        .set('Origin', 'https://evil.example')
        .set('User-Agent', CHROME)
        .set('Content-Type', 'text/plain')
        .send(JSON.stringify({ path: page('evil') }));
      expect(foreign.status).toBe(403);
      expect(
        await prisma.pageView.count({ where: { path: { in: [page('bot'), page('evil')] } } })
      ).toBe(0);
    });

    it('counts an article view once per reader per 30 minutes, never the author or a bot', async () => {
      const counted = await prisma.article.create({
        data: {
          title: 'Counted article',
          slug: `vitest-${run}-counted`,
          description: 'x',
          content: '<p>x</p>',
          category: 'Guide',
          status: 'PUBLISHED',
          authorId: users.writer.id,
        },
      });
      const counts = () =>
        prisma.article.findUniqueOrThrow({
          where: { id: counted.id },
          select: { viewCount: true, uniqueViews: true },
        });
      const read = (agent: ReturnType<typeof request.agent>, ua?: string) =>
        collect(agent, { path: `/articles/${counted.slug}` }, ua);

      const fan = request.agent(app);
      const first = await read(fan);
      expect(first.body).toMatchObject({ counted: true, viewCount: 1 });
      expect((await read(fan)).body).toMatchObject({ counted: false, viewCount: 1 });

      // A reader coming back after the window counts again, but is still one unique reader.
      const { visitorId } = await prisma.pageView.findUniqueOrThrow({
        where: { id: first.body.id },
        select: { visitorId: true },
      });
      await prisma.pageView.updateMany({
        where: { visitorId, articleId: counted.id },
        data: { createdAt: new Date(Date.now() - 31 * 60 * 1000) },
      });
      expect((await read(fan)).body.counted).toBe(true);

      // Simultaneous requests from one browser count once.
      const burst = request.agent(app);
      await collect(burst, { path: page('burst-home') });
      const results = await Promise.all([read(burst), read(burst), read(burst)]);
      expect(results.map((r) => r.status)).toEqual([201, 201, 201]);
      expect(results.filter((r) => r.body.counted)).toHaveLength(1);

      const author = await request(app)
        .post('/api/analytics/collect')
        .set('Origin', SITE)
        .set('Cookie', as('writer'))
        .set('User-Agent', CHROME)
        .set('Content-Type', 'text/plain')
        .send(JSON.stringify({ path: `/articles/${counted.slug}` }));
      expect(author.body.counted).toBe(false);
      expect((await read(request.agent(app), 'Googlebot/2.1')).status).toBe(204);

      expect(await counts()).toEqual({ viewCount: 3, uniqueViews: 2 });
    });

    it('keeps every report admin-only', async () => {
      for (const path of ['overview', 'breakdown', 'content', 'heatmap', 'realtime', 'activity']) {
        expect((await get(`/api/analytics/${path}`)).status).toBe(401);
        expect((await get(`/api/analytics/${path}`, 'editor')).status).toBe(403);
      }
    });

    it('summarises traffic and product activity for a range', async () => {
      const mobile = request.agent(app);
      expect((await collect(mobile, { path: page('home') }, IPHONE)).status).toBe(201);

      const res = await get(`/api/analytics/overview?${window()}&tz=Africa/Kinshasa`, 'admin');
      expect(res.status).toBe(200);
      const { current, series, previousSeries, range } = res.body;
      expect(range).toMatchObject({ interval: 'hour', tz: 'Africa/Kinshasa' });
      expect(current.pageviews).toBeGreaterThanOrEqual(3);
      expect(current.visitors).toBeGreaterThanOrEqual(2);
      expect(current.sessions).toBeGreaterThanOrEqual(2);
      expect(current.subscribers).toBeGreaterThanOrEqual(1);
      expect(current.published).toBeGreaterThanOrEqual(1);
      expect(series.reduce((sum: number, p: { pageviews: number }) => sum + p.pageviews, 0)).toBe(
        current.pageviews
      );
      expect(previousSeries.length).toBeGreaterThan(0);
    });

    it('buckets by the requested interval in the viewer timezone', async () => {
      const q = (extra: string) =>
        get(
          `/api/analytics/overview?from=2026-01-01T00:00:00%2B01:00&to=2026-01-08T00:00:00%2B01:00&tz=Africa/Kinshasa${extra}`,
          'admin'
        );
      const daily = await q('&interval=day');
      expect(daily.body.series.map((p: { bucket: string }) => p.bucket)).toEqual(
        Array.from({ length: 7 }, (_, i) => `2026-01-0${i + 1}T00:00`)
      );
      const hourly = (from: string) =>
        get(`/api/analytics/overview?from=${from}&to=2026-01-01T00:00:00Z&interval=hour`, 'admin');
      expect((await hourly('2025-01-01T00:00:00Z')).body.range.interval).toBe('day');
      expect((await hourly('2024-01-01T00:00:00Z')).body.range.interval).toBe('week');
      expect(
        (
          await get(
            '/api/analytics/overview?from=2026-02-01T00:00:00Z&to=2026-01-01T00:00:00Z',
            'admin'
          )
        ).status
      ).toBe(400);
    });

    it('breaks traffic down by page, source, campaign and device', async () => {
      const res = await get(`/api/analytics/breakdown?${window()}`, 'admin');
      expect(res.status).toBe(200);
      const { pages, sources, campaigns, devices, countries, referrers } = res.body;
      expect(pages.find((p: { path: string }) => p.path === page('home'))).toMatchObject({
        pageviews: 2,
        visitors: 2,
      });
      expect(sources.map((s: { name: string }) => s.name)).toEqual(
        expect.arrayContaining(['X (Twitter)', 'Direct'])
      );
      expect(referrers.map((r: { name: string }) => r.name)).toContain('t.co');
      expect(campaigns).toContainEqual(
        expect.objectContaining({ campaign: `vitest-${run}-launch`, source: 'twitter' })
      );
      expect(devices.map((d: { name: string }) => d.name)).toEqual(
        expect.arrayContaining(['desktop', 'mobile'])
      );
      expect(countries.map((c: { name: string }) => c.name)).toContain('CD');
    });

    it('reports article performance, topics and authors', async () => {
      const res = await get(`/api/analytics/content?${window()}`, 'admin');
      expect(res.status).toBe(200);
      expect(res.body.articles.find((a: { id: string }) => a.id === articleId)).toMatchObject({
        views: 1,
        visitors: 1,
      });
      expect(res.body.authors.map((a: { id: string }) => a.id)).toContain(users.writer.id);
    });

    it('shows when readers are active and who is online now', async () => {
      const heat = await get(`/api/analytics/heatmap?${window()}&tz=UTC`, 'admin');
      const cells: { day: number; hour: number; pageviews: number }[] = heat.body.cells;
      expect(cells.reduce((sum, c) => sum + c.pageviews, 0)).toBeGreaterThanOrEqual(3);
      expect(cells.every((c) => c.day >= 1 && c.day <= 7 && c.hour >= 0 && c.hour <= 23)).toBe(
        true
      );

      const live = await get('/api/analytics/realtime', 'admin');
      expect(live.body.visitors).toBeGreaterThanOrEqual(2);
      expect(live.body.timeline).toHaveLength(30);
    });

    it('lists activity newest first with filters and pagination', async () => {
      const all = await get(`/api/analytics/activity?${window()}&limit=100`, 'admin');
      const kinds = new Set(all.body.items.map((i: { kind: string }) => i.kind));
      for (const kind of ['published', 'clap', 'bookmark', 'subscribe', 'unsubscribe']) {
        expect(kinds).toContain(kind);
      }
      const times = all.body.items.map((i: { at: string }) => Date.parse(i.at));
      expect(times).toEqual([...times].sort((a, b) => b - a));

      const subs = await get(
        `/api/analytics/activity?${window()}&kinds=subscribe&limit=1`,
        'admin'
      );
      expect(subs.body.items).toHaveLength(1);
      expect(subs.body.items[0].kind).toBe('subscribe');

      const first = await get(`/api/analytics/activity?${window()}&limit=1`, 'admin');
      const second = await get(
        `/api/analytics/activity?${window()}&limit=1&before=${encodeURIComponent(first.body.nextCursor)}`,
        'admin'
      );
      expect(second.body.items[0].id).not.toBe(first.body.items[0].id);
      expect(Date.parse(second.body.items[0].at)).toBeLessThanOrEqual(
        Date.parse(first.body.items[0].at)
      );
    });
  });

  describe('sessions', () => {
    it('revokes every session of a user', async () => {
      expect((await get('/api/users/me', 'revoked')).status).toBe(200);
      expect((await post('/api/auth/revoke-all', 'revoked')).status).toBe(200);
      expect((await get('/api/users/me', 'revoked')).status).toBe(401);
    });
  });
});
