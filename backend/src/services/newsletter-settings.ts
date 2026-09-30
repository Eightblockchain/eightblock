import { z } from 'zod';
import type { NewsletterSettings } from '@prisma/client';
import { prisma } from '../prisma/client.js';

export type Settings = Omit<NewsletterSettings, 'id' | 'updatedAt'> & { updatedAt: Date | null };

export const SETTINGS_DEFAULTS: Settings = {
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
  updatedAt: null,
};

/** Every API instance re-reads within this window, so a change applies everywhere without a restart. */
const CACHE_MS = 10_000;
let cache: { value: Settings; at: number } | null = null;

export async function getNewsletterSettings(): Promise<Settings> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  const row = await prisma.newsletterSettings.findUnique({ where: { id: 'site' } });
  const value: Settings = row ? { ...SETTINGS_DEFAULTS, ...row } : SETTINGS_DEFAULTS;
  cache = { value, at: Date.now() };
  return value;
}

export function isValidTimezone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** "Name <local@domain>" or a bare address. */
export function isSenderAddress(value: string) {
  const match = /^(?:[^<>@]*<([^<>\s]+)>|([^<>\s]+))$/.exec(value.trim());
  const address = match?.[1] ?? match?.[2];
  return Boolean(address && z.string().email().safeParse(address).success);
}

const optionalSender = z
  .string()
  .trim()
  .max(200)
  .nullish()
  .transform((value) => value || null)
  .refine((value) => value === null || isSenderAddress(value), {
    message: 'Use an address like Eightblock <newsletter@news.eightblock.dev>',
  });

export const settingsSchema = z.object({
  fromAddress: optionalSender,
  transactionalFrom: optionalSender,
  replyTo: optionalSender,
  postalAddress: z
    .string()
    .trim()
    .max(300)
    .nullish()
    .transform((value) => value || null),
  doubleOptIn: z.boolean(),
  confirmExpiryDays: z.number().int().min(1).max(30),
  welcomeEmail: z.boolean(),
  accountWelcome: z.boolean(),
  articleDrafts: z.boolean(),
  digestEnabled: z.boolean(),
  digestDay: z.number().int().min(0).max(6),
  digestHour: z.number().int().min(0).max(23),
  digestTimezone: z.string().refine(isValidTimezone, { message: 'Unknown timezone' }),
  digestMaxArticles: z.number().int().min(1).max(10),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export async function saveNewsletterSettings(input: SettingsInput) {
  await prisma.newsletterSettings.upsert({
    where: { id: 'site' },
    update: input,
    create: { id: 'site', ...input },
  });
  cache = null;
  return getNewsletterSettings();
}

/** Tests change settings between cases. */
export function clearNewsletterSettingsCache() {
  cache = null;
}
