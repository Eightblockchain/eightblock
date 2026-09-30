import { randomBytes } from 'node:crypto';
import { prisma } from '../prisma/client.js';

export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

// Handles that could pass for the site itself or its staff.
const RESERVED = new Set([
  'admin',
  'administrator',
  'api',
  'eightblock',
  'editor',
  'me',
  'mine',
  'moderator',
  'new',
  'root',
  'settings',
  'staff',
  'support',
  'system',
  'team',
]);

export function isReservedUsername(username: string) {
  return RESERVED.has(username);
}

function toHandle(input: string) {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)
    .replace(/-+$/, '');
}

/** A free handle derived from the user's name or email, e.g. "jane-doe" or "jane-doe-4f2a". */
export async function generateUsername(name?: string | null, email?: string | null) {
  const base = toHandle(name || email?.split('@')[0] || '') || 'writer';
  const candidates = [
    base,
    ...Array.from({ length: 5 }, () => `${base}-${randomBytes(2).toString('hex')}`),
  ];

  for (const candidate of candidates) {
    if (!USERNAME_PATTERN.test(candidate) || isReservedUsername(candidate)) continue;
    const taken = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return `writer-${randomBytes(4).toString('hex')}`;
}
