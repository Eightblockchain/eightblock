import { describe, expect, it } from 'vitest';
import { checkEnv } from '../config/env.js';

const production = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/eightblock',
  JWT_SECRET: 'x'.repeat(40),
  SITE_URL: 'https://eightblock.dev',
  API_URL: 'https://api.eightblock.dev',
  ADMIN_URL: 'https://admin.eightblock.dev',
  ALLOWED_ORIGINS: 'https://eightblock.dev,https://www.eightblock.dev,https://admin.eightblock.dev',
  GOOGLE_CLIENT_ID: 'id',
  GOOGLE_CLIENT_SECRET: 'secret',
  ADMIN_EMAILS: 'me@eightblock.dev',
  EMAIL_PROVIDER_API_KEY: 're_key',
  RESEND_WEBHOOK_SECRET: 'whsec_c2VjcmV0',
};

describe('checkEnv', () => {
  it('accepts a complete production config', () => {
    expect(checkEnv(production)).toEqual({ errors: [], warnings: [] });
  });

  it('lists every missing required variable', () => {
    const { errors } = checkEnv({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(40) });
    expect(errors).toEqual([
      'DATABASE_URL is not set',
      'SITE_URL is not set',
      'API_URL is not set',
      'ADMIN_URL is not set',
      'ALLOWED_ORIGINS is not set',
    ]);
  });

  it('rejects a short JWT secret in any environment', () => {
    expect(checkEnv({ NODE_ENV: 'development', JWT_SECRET: 'short' }).errors).toHaveLength(1);
  });

  it('rejects origins with paths or trailing slashes', () => {
    const { errors } = checkEnv({ ...production, ALLOWED_ORIGINS: 'https://eightblock.dev/' });
    expect(errors.join()).toContain('must be a bare origin');
  });

  it('requires the site origin to be allowed', () => {
    const { errors } = checkEnv({ ...production, ALLOWED_ORIGINS: 'https://other.dev' });
    expect(errors.join()).toContain('must include the SITE_URL origin');
  });

  it('requires the admin origin to be allowed', () => {
    const { errors } = checkEnv({ ...production, ALLOWED_ORIGINS: 'https://eightblock.dev' });
    expect(errors).toEqual([expect.stringContaining('must include the ADMIN_URL origin')]);
  });

  it('requires the admin app URL, so its origin can be checked', () => {
    const { errors } = checkEnv({ ...production, ADMIN_URL: '' });
    expect(errors).toEqual(['ADMIN_URL is not set']);
  });

  it('rejects non-http URLs', () => {
    const { errors } = checkEnv({ ...production, API_URL: 'api.eightblock.dev' });
    expect(errors.join()).toContain('API_URL must be an http(s) URL');
  });

  it('warns about optional integrations and plain http', () => {
    const { errors, warnings } = checkEnv({
      ...production,
      EMAIL_PROVIDER_API_KEY: '',
      API_URL: 'http://api.eightblock.dev',
    });
    expect(errors).toEqual([]);
    expect(warnings.join()).toContain('EMAIL_PROVIDER_API_KEY');
    expect(warnings.join()).toContain('API_URL uses http://');
  });

  it('does not require production variables in development', () => {
    expect(checkEnv({ NODE_ENV: 'development', JWT_SECRET: 'x'.repeat(40) }).errors).toEqual([]);
  });
});
