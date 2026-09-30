type Env = Record<string, string | undefined>;

const REQUIRED_IN_PRODUCTION = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SITE_URL',
  'API_URL',
  'ADMIN_URL',
  'ALLOWED_ORIGINS',
] as const;

const RECOMMENDED: Array<[string, string]> = [
  ['GOOGLE_CLIENT_ID', 'Google sign-in is disabled'],
  ['GOOGLE_CLIENT_SECRET', 'Google sign-in is disabled'],
  ['ADMIN_EMAILS', 'nobody is promoted to admin on sign-in'],
  ['EMAIL_PROVIDER_API_KEY', 'welcome emails and newsletters will not be sent'],
  ['RESEND_WEBHOOK_SECRET', 'bounced and spam-reporting addresses keep receiving the newsletter'],
];

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function originOf(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/** Returns blocking problems and non-blocking warnings for the given environment. */
export function checkEnv(env: Env = process.env) {
  const isProduction = env.NODE_ENV === 'production';
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be set and at least 32 characters long');
  }

  if (isProduction) {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!env[key]?.trim() && key !== 'JWT_SECRET') errors.push(`${key} is not set`);
    }
  }

  for (const key of ['SITE_URL', 'API_URL', 'ADMIN_URL'] as const) {
    const value = env[key]?.trim();
    if (value && !isHttpUrl(value)) errors.push(`${key} must be an http(s) URL, got "${value}"`);
    if (value && isProduction && value.startsWith('http://')) {
      warnings.push(`${key} uses http://; auth cookies are Secure in production and need HTTPS`);
    }
  }

  const origins = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  for (const origin of origins) {
    if (originOf(origin) !== origin) {
      errors.push(
        `ALLOWED_ORIGINS entry "${origin}" must be a bare origin like https://example.com`
      );
    }
  }

  const siteOrigin = env.SITE_URL ? originOf(env.SITE_URL.trim()) : null;
  if (isProduction && siteOrigin && origins.length > 0 && !origins.includes(siteOrigin)) {
    errors.push(
      `ALLOWED_ORIGINS must include the SITE_URL origin (${siteOrigin}), otherwise every write from the site is rejected`
    );
  }

  const adminOrigin = env.ADMIN_URL ? originOf(env.ADMIN_URL.trim()) : null;
  if (isProduction && adminOrigin && origins.length > 0 && !origins.includes(adminOrigin)) {
    errors.push(
      `ALLOWED_ORIGINS must include the ADMIN_URL origin (${adminOrigin}), otherwise the admin app cannot call the API`
    );
  }

  if (isProduction) {
    for (const [key, effect] of RECOMMENDED) {
      if (!env[key]?.trim()) warnings.push(`${key} is not set: ${effect}`);
    }
  }

  return { errors, warnings };
}
