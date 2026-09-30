import crypto from 'crypto';
import type { CookieOptions, Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { signToken } from '../utils/jwt.js';
import { CSRF_COOKIE_NAME, csrfCookieOptions, generateCsrfToken } from '../utils/csrf.js';
import { logger } from '../utils/logger.js';
import { isConfiguredAdmin } from '../config/admins.js';
import { generateUsername } from '../utils/username.js';
import { sendAccountWelcomeEmail } from '../services/email-service.js';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

const OAUTH_COOKIE = 'oauth_google';
const isProduction = process.env.NODE_ENV === 'production';

const siteUrl = () => (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

const redirectUri = () =>
  process.env.GOOGLE_REDIRECT_URI ||
  `${(process.env.API_URL || 'http://localhost:8080').replace(/\/$/, '')}/api/auth/google/callback`;

// The OAuth round trip is a cross-site top-level navigation, so this cookie must be `lax`.
const oauthCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/api/auth/google',
  maxAge: 10 * 60 * 1000,
};

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
};

const adminUrl = () => (process.env.ADMIN_URL || 'http://localhost:3001').replace(/\/$/, '');

function adminOrigin() {
  try {
    return new URL(adminUrl()).origin;
  } catch {
    return null;
  }
}

/**
 * Where to go after sign-in: a relative path on the site, or an absolute URL on the admin app.
 * Anything else becomes "/" so the callback can't be used as an open redirect.
 */
export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || value.length > 512) return '/';
  if (value.startsWith('/')) {
    return value.startsWith('//') || value.startsWith('/\\') ? '/' : value;
  }
  try {
    const url = new URL(value);
    if (url.origin === adminOrigin()) return url.toString();
  } catch {
    // Not a URL
  }
  return '/';
}

const isAdminTarget = (returnTo: string) => !returnTo.startsWith('/');

function loginErrorRedirect(res: Response, code: string, returnTo = '/') {
  const params = new URLSearchParams({ error: code, returnTo });
  const login = isAdminTarget(returnTo) ? `${adminUrl()}/login` : `${siteUrl()}/auth/login`;
  return res.redirect(`${login}?${params.toString()}`);
}

function base64Url(buffer: Buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function googleStart(req: Request, res: Response) {
  const returnTo = safeReturnTo(req.query.returnTo);
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    logger.error(
      'Google sign-in requested but GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set'
    );
    return loginErrorRedirect(res, 'not_configured', returnTo);
  }

  const state = base64Url(crypto.randomBytes(24));
  const verifier = base64Url(crypto.randomBytes(48));
  const challenge = base64Url(crypto.createHash('sha256').update(verifier).digest());

  res.cookie(OAUTH_COOKIE, JSON.stringify({ state, verifier, returnTo }), oauthCookieOptions);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });

  return res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}

interface GoogleProfile {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

async function fetchGoogleProfile(code: string, verifier: string): Promise<GoogleProfile> {
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: redirectUri(),
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Google token exchange failed (${tokenRes.status}): ${await tokenRes.text()}`);
  }

  const { access_token: accessToken } = (await tokenRes.json()) as { access_token?: string };
  if (!accessToken) throw new Error('Google token response did not include an access token');

  const profileRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) {
    throw new Error(`Google userinfo failed (${profileRes.status})`);
  }

  return (await profileRes.json()) as GoogleProfile;
}

/** Google serves 96px photos by default; ask for a size that stays sharp on the About page. */
function googlePhoto(picture?: string) {
  if (!picture) return null;
  return /=s\d+(-c)?$/.test(picture) ? picture.replace(/=s\d+(-c)?$/, '=s400-c') : picture;
}

async function findOrCreateGoogleUser(profile: GoogleProfile) {
  const email = profile.email?.toLowerCase();
  // Returning users skip the verified-email check below, so promotion checks it itself.
  const isAdmin = profile.email_verified === true && isConfiguredAdmin(email);
  const photo = googlePhoto(profile.picture);

  const identity = await prisma.authIdentity.findUnique({
    where: { provider_providerId: { provider: 'GOOGLE', providerId: profile.sub } },
    include: { user: true },
  });

  let user = identity?.user ?? null;
  let created = false;

  if (!user) {
    if (!email || !profile.email_verified) {
      throw new Error('Google account has no verified email');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.authIdentity.create({
        data: { userId: existing.id, provider: 'GOOGLE', providerId: profile.sub },
      });
      user = existing;
    } else {
      const name = profile.name || email.split('@')[0];
      user = await prisma.user.create({
        data: {
          email,
          name,
          username: await generateUsername(name, email),
          avatarUrl: photo,
          googleAvatarUrl: photo,
          role: isAdmin ? 'ADMIN' : 'READER',
          identities: { create: { provider: 'GOOGLE', providerId: profile.sub } },
        },
      });
      created = true;
    }
  }

  const updates: {
    role?: 'ADMIN';
    name?: string;
    username?: string;
    avatarUrl?: string;
    googleAvatarUrl?: string;
  } = {};
  if (isAdmin && user.email?.toLowerCase() === email && user.role !== 'ADMIN') {
    updates.role = 'ADMIN';
  }
  if (!user.name && profile.name) updates.name = profile.name;
  if (!user.username)
    updates.username = await generateUsername(user.name || profile.name, user.email);
  if (photo && user.googleAvatarUrl !== photo) updates.googleAvatarUrl = photo;
  // Adopt the Google photo on the first Google sign-in, then keep it in sync unless the
  // user has since uploaded their own.
  const usesGooglePhoto =
    !user.avatarUrl ||
    !user.googleAvatarUrl ||
    user.avatarUrl === user.googleAvatarUrl ||
    user.avatarUrl.includes('googleusercontent.com');
  if (photo && usesGooglePhoto && user.avatarUrl !== photo) updates.avatarUrl = photo;

  if (Object.keys(updates).length > 0) {
    user = await prisma.user.update({ where: { id: user.id }, data: updates });
  }

  return { user, created };
}

export async function googleCallback(req: Request, res: Response) {
  let saved: { state?: string; verifier?: string; returnTo?: string } = {};
  try {
    saved = JSON.parse(req.cookies[OAUTH_COOKIE] || '{}');
  } catch {
    saved = {};
  }
  res.clearCookie(OAUTH_COOKIE, { ...oauthCookieOptions, maxAge: undefined });

  const returnTo = safeReturnTo(saved.returnTo);
  const { code, state, error } = req.query;

  if (error === 'access_denied') {
    return loginErrorRedirect(res, 'cancelled', returnTo);
  }

  if (
    typeof code !== 'string' ||
    typeof state !== 'string' ||
    !saved.state ||
    !saved.verifier ||
    state !== saved.state
  ) {
    return loginErrorRedirect(res, 'state', returnTo);
  }

  try {
    const profile = await fetchGoogleProfile(code, saved.verifier);
    const { user, created } = await findOrCreateGoogleUser(profile);
    if (created && user.email) {
      void sendAccountWelcomeEmail({ email: user.email, name: user.name }).catch((err) =>
        logger.error(`Account welcome email failed: ${(err as Error).message}`)
      );
    }

    const token = signToken({ userId: user.id, role: user.role });
    res.cookie('auth_token', token, { ...authCookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie(CSRF_COOKIE_NAME, generateCsrfToken(), csrfCookieOptions);

    return res.redirect(isAdminTarget(returnTo) ? returnTo : `${siteUrl()}${returnTo}`);
  } catch (err) {
    logger.error(`Google sign-in failed: ${(err as Error).message}`);
    return loginErrorRedirect(res, 'failed', returnTo);
  }
}

export function authProviders(_req: Request, res: Response) {
  return res.json({
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  });
}
