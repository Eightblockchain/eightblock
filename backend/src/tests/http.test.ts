import { describe, expect, it } from 'vitest';
import request from 'supertest';
import express from 'express';
import { app } from '../app.js';
import { createRouter } from '../utils/async-router.js';
import { errorHandler } from '../middleware/error-handler.js';

const SITE = 'http://localhost:3000';

describe('health', () => {
  it('reports liveness', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('keeps /health as an alias for existing monitors', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('returns JSON 404s for unknown routes', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Route not found' });
  });

  it('no longer serves the stale API docs', async () => {
    expect((await request(app).get('/api/docs')).status).toBe(404);
  });
});

describe('security headers', () => {
  it('sets helmet headers', async () => {
    const res = await request(app).get('/healthz');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toContain('max-age=');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
  });
});

describe('authentication', () => {
  it.each([
    ['get', '/api/users/me'],
    ['get', '/api/bookmarks'],
    ['get', '/api/subscriptions'],
    ['get', '/api/newsletters'],
    ['get', '/api/articles/mine'],
    ['put', '/api/portfolio'],
    ['post', '/api/tags'],
    ['delete', '/api/tags/some-id'],
    ['post', '/api/articles'],
    ['post', '/api/upload/article-image'],
    ['post', '/api/articles/some-id/comments'],
  ] as const)('%s %s requires a session', async (method, path) => {
    const res = await request(app)[method](path).set('Origin', SITE);
    expect(res.status).toBe(401);
  });

  it('rejects a forged token', async () => {
    const res = await request(app).get('/api/users/me').set('Cookie', 'auth_token=not-a-jwt');
    expect(res.status).toBe(401);
  });
});

describe('CSRF and CORS', () => {
  it('blocks requests from other sites at the CORS layer', async () => {
    const res = await request(app).post('/api/tags').set('Origin', 'https://evil.example');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Origin not allowed');
  });

  it('blocks writes whose referer is another site', async () => {
    const res = await request(app).post('/api/tags').set('Referer', 'https://evil.example/page');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('CSRF validation failed');
  });

  it('accepts a matching double-submit token', async () => {
    const res = await request(app)
      .post('/api/tags')
      .set('Referer', 'https://evil.example/page')
      .set('Cookie', 'csrf_token=abc123')
      .set('X-CSRF-Token', 'abc123');
    expect(res.status).toBe(401);
  });

  it('rejects a mismatched double-submit token', async () => {
    const res = await request(app)
      .post('/api/tags')
      .set('Referer', 'https://evil.example/page')
      .set('Cookie', 'csrf_token=abc123')
      .set('X-CSRF-Token', 'other');
    expect(res.status).toBe(403);
  });

  it('allows CORS preflight from the site only', async () => {
    const ok = await request(app)
      .options('/api/articles')
      .set('Origin', SITE)
      .set('Access-Control-Request-Method', 'POST');
    expect(ok.status).toBe(204);
    expect(ok.headers['access-control-allow-origin']).toBe(SITE);
    expect(ok.headers['access-control-allow-credentials']).toBe('true');

    const blocked = await request(app)
      .options('/api/articles')
      .set('Origin', 'https://evil.example')
      .set('Access-Control-Request-Method', 'POST');
    expect(blocked.status).toBe(403);
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('issues a CSRF cookie', async () => {
    const res = await request(app).get('/api/nope');
    expect(String(res.headers['set-cookie'])).toContain('csrf_token=');
  });
});

describe('request validation', () => {
  it('answers malformed JSON with 400', async () => {
    const res = await request(app)
      .post('/api/subscriptions')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
  });

  it('rejects invalid subscription emails', async () => {
    const res = await request(app).post('/api/subscriptions').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });
});

describe('createRouter', () => {
  it('turns async errors into 500 responses instead of hanging', async () => {
    const router = createRouter();
    router.get('/boom', async () => {
      throw new Error('database down');
    });
    const probe = express().use(router).use(errorHandler);

    const res = await request(probe).get('/boom').timeout(3000);
    expect(res.status).toBe(500);
    expect(res.body.error).toBeTruthy();
  });

  it('keeps error-handling middleware intact', async () => {
    const router = createRouter();
    router.get('/sync', () => {
      throw new Error('sync failure');
    });
    const probe = express().use(router).use(errorHandler);
    expect((await request(probe).get('/sync')).status).toBe(500);
  });
});

describe('Google sign-in return targets', () => {
  const ADMIN = 'http://localhost:3001';

  it('accepts site paths and admin app URLs, nothing else', async () => {
    const { safeReturnTo } = await import('../controllers/auth-controller.js');
    expect(safeReturnTo('/articles/hello?x=1')).toBe('/articles/hello?x=1');
    expect(safeReturnTo(`${ADMIN}/newsletter`)).toBe(`${ADMIN}/newsletter`);
    for (const evil of [
      '//evil.dev',
      '/\\evil.dev',
      'https://evil.dev',
      'javascript:alert(1)',
      `${ADMIN}.evil.dev/`,
      42,
    ]) {
      expect(safeReturnTo(evil)).toBe('/');
    }
  });

  it('sends admin sign-in errors back to the admin login page', async () => {
    const saved = { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET };
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    try {
      const admin = await request(app)
        .get('/api/auth/google')
        .query({ returnTo: `${ADMIN}/users` });
      expect(admin.status).toBe(302);
      const to = new URL(admin.headers.location);
      expect(`${to.origin}${to.pathname}`).toBe(`${ADMIN}/login`);
      expect(to.searchParams.get('error')).toBe('not_configured');
      expect(to.searchParams.get('returnTo')).toBe(`${ADMIN}/users`);

      const site = await request(app)
        .get('/api/auth/google')
        .query({ returnTo: 'https://evil.dev' });
      expect(site.headers.location).toBe(`${SITE}/auth/login?error=not_configured&returnTo=%2F`);
    } finally {
      if (saved.id !== undefined) process.env.GOOGLE_CLIENT_ID = saved.id;
      if (saved.secret !== undefined) process.env.GOOGLE_CLIENT_SECRET = saved.secret;
    }
  });
});
