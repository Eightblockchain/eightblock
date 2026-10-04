import type { EmailTemplate } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { escapeHtml } from './email-template.js';

export const COPY_FIELDS = [
  'subject',
  'preheader',
  'eyebrow',
  'heading',
  'body',
  'buttonLabel',
  'note',
  'articlesLabel',
] as const;
export type CopyField = (typeof COPY_FIELDS)[number];
/** The wording of one email. Fields a template does not use are empty strings. */
export type EmailCopy = Record<CopyField, string>;

/** Rich text from the editor; every other field is plain text. */
export const HTML_FIELDS: ReadonlySet<CopyField> = new Set(['body', 'note']);

export const FIELD_LIMITS: Record<CopyField, number> = {
  subject: 200,
  preheader: 200,
  eyebrow: 60,
  heading: 200,
  body: 50_000,
  buttonLabel: 40,
  note: 20_000,
  articlesLabel: 60,
};

export type VariableValue = string | number | boolean | null | undefined;
export type Variables = Record<string, VariableValue>;

export interface TemplateVariable {
  name: string;
  description: string;
  /** Used for the admin preview and test sends. Booleans only work as sections. */
  sample: string | number | boolean;
}

export const TEMPLATE_KEYS = [
  'subscription-confirm',
  'newsletter-welcome',
  'newsletter-welcome-back',
  'account-welcome',
  'weekly-digest',
  'article-announcement',
] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

export interface TemplateDefinition {
  key: TemplateKey;
  name: string;
  /** When the email goes out, in a sentence. */
  description: string;
  group: 'Newsletter' | 'Account';
  fields: CopyField[];
  required: CopyField[];
  variables: TemplateVariable[];
  defaults: Partial<EmailCopy>;
}

const SITE_URL: TemplateVariable = {
  name: 'siteUrl',
  description: 'The blog address, for links such as {{siteUrl}}/writing',
  sample: 'https://eightblock.dev',
};

const MESSAGE_FIELDS: CopyField[] = [
  'subject',
  'preheader',
  'eyebrow',
  'heading',
  'body',
  'buttonLabel',
];
const MESSAGE_REQUIRED: CopyField[] = ['subject', 'heading', 'body', 'buttonLabel'];

export const TEMPLATES: Record<TemplateKey, TemplateDefinition> = {
  'subscription-confirm': {
    key: 'subscription-confirm',
    name: 'Confirm subscription',
    description:
      'Sent when someone enters their address on a newsletter form. Nothing else is sent until they click the button.',
    group: 'Newsletter',
    fields: [...MESSAGE_FIELDS, 'note'],
    required: MESSAGE_REQUIRED,
    variables: [
      { name: 'email', description: 'The address being subscribed', sample: 'ada@example.com' },
      {
        name: 'expiresInDays',
        description: 'Days before the link expires, from the newsletter settings',
        sample: 7,
      },
      SITE_URL,
    ],
    defaults: {
      subject: 'Confirm your Eightblock newsletter subscription',
      preheader: 'Click the button to start receiving new articles.',
      eyebrow: 'One more step',
      heading: 'Confirm your subscription',
      body: "<p>Please confirm that you want the Eightblock newsletter at {{email}}. Until you do, we won't send anything else to this address.</p>",
      buttonLabel: 'Confirm subscription',
      note: "<p>Didn't ask for this? Ignore this email and you won't be subscribed. The link expires in {{expiresInDays}} days.</p>",
    },
  },
  'newsletter-welcome': {
    key: 'newsletter-welcome',
    name: 'Welcome to the newsletter',
    description:
      'Sent once a new subscriber confirms, with the three latest articles below the message.',
    group: 'Newsletter',
    fields: [...MESSAGE_FIELDS, 'articlesLabel'],
    required: [...MESSAGE_REQUIRED, 'articlesLabel'],
    variables: [
      { name: 'email', description: 'The subscriber’s address', sample: 'ada@example.com' },
      SITE_URL,
    ],
    defaults: {
      subject: "You're subscribed to the Eightblock newsletter",
      preheader: 'Your subscription is confirmed. Here is where to start.',
      eyebrow: 'Subscription confirmed',
      heading: "You're on the list",
      body: "<p>Thanks for subscribing to Eightblock. You'll get new articles on Cardano, smart contracts and decentralized systems, written by people who build them, delivered straight to your inbox.</p><p>No noise and no spam. Every email has a one-click unsubscribe link at the bottom.</p>",
      buttonLabel: 'Browse the articles',
      articlesLabel: 'Start with these',
    },
  },
  'newsletter-welcome-back': {
    key: 'newsletter-welcome-back',
    name: 'Welcome back',
    description:
      'Sent instead of the welcome when someone who had unsubscribed confirms again, with the three latest articles.',
    group: 'Newsletter',
    fields: [...MESSAGE_FIELDS, 'articlesLabel'],
    required: [...MESSAGE_REQUIRED, 'articlesLabel'],
    variables: [
      { name: 'email', description: 'The subscriber’s address', sample: 'ada@example.com' },
      SITE_URL,
    ],
    defaults: {
      subject: "You're back on the Eightblock newsletter",
      preheader: 'You are subscribed again. Here is what you missed.',
      eyebrow: 'Subscription renewed',
      heading: 'Welcome back',
      body: "<p>You're subscribed to the Eightblock newsletter again. New articles on Cardano, smart contracts and decentralized systems will reach this inbox again.</p><p>Changed your mind? The unsubscribe link at the bottom of every email works in one click.</p>",
      buttonLabel: 'Browse the articles',
      articlesLabel: 'Catch up on these',
    },
  },
  'account-welcome': {
    key: 'account-welcome',
    name: 'New account',
    description:
      'Sent once, when someone creates an account. The button opens their profile settings.',
    group: 'Account',
    fields: [...MESSAGE_FIELDS, 'note'],
    required: MESSAGE_REQUIRED,
    variables: [
      {
        name: 'firstName',
        description: 'First name, empty when the account has none',
        sample: 'Ada',
      },
      {
        name: 'name',
        description: 'Full name, empty when the account has none',
        sample: 'Ada Lovelace',
      },
      { name: 'email', description: 'The account’s address', sample: 'ada@example.com' },
      {
        name: 'subscribed',
        description: 'Whether the address already gets the newsletter',
        sample: false,
      },
      SITE_URL,
    ],
    defaults: {
      subject: 'Welcome to Eightblock, your account is ready',
      preheader: 'Your account is ready. Here is what you can do with it.',
      eyebrow: 'Account created',
      heading: 'Welcome to Eightblock{{#firstName}}, {{firstName}}{{/firstName}}',
      body: '<p>Your account is ready. You can sign in any time with Google using {{email}}.</p><ul><li><p><strong>Bookmarks</strong>: save articles and pick up where you left off on any device.</p></li><li><p><strong>Claps and comments</strong>: show what helped you and join the discussion under each article.</p></li><li><p><strong>Your profile</strong>: add a name, photo and short bio so other readers know who you are.</p></li></ul>',
      buttonLabel: 'Set up your profile',
      note: '<p>{{#subscribed}}This address is also subscribed to the newsletter, so new articles will keep arriving here.{{/subscribed}}</p><p>{{^subscribed}}Creating an account does not subscribe you to the newsletter. If you would like new articles by email, you can subscribe in one click: <a href="{{siteUrl}}/newsletter">subscribe to the newsletter</a>.{{/subscribed}}</p>',
    },
  },
  'weekly-digest': {
    key: 'weekly-digest',
    name: 'Weekly digest',
    description:
      'The automatic roundup of the week’s articles no newsletter has covered yet. The articles follow the message.',
    group: 'Newsletter',
    fields: ['subject', 'preheader', 'body'],
    required: ['subject'],
    variables: [
      {
        name: 'leadTitle',
        description: 'Title of the newest article',
        sample: 'Plutus validators, step by step',
      },
      { name: 'count', description: 'Number of articles in the digest', sample: 3 },
      { name: 'moreCount', description: 'Articles besides the newest one', sample: 2 },
      {
        name: 'titles',
        description: 'Every title, separated by a dot',
        sample: 'Plutus validators, step by step · Hydra heads explained · Staking pools',
      },
      SITE_URL,
    ],
    defaults: {
      subject:
        'This week on Eightblock: {{leadTitle}}{{#moreCount}} and {{moreCount}} more{{/moreCount}}',
      preheader: '{{titles}}',
      body: "<p>Here's what's new on Eightblock this week.</p>",
    },
  },
  'article-announcement': {
    key: 'article-announcement',
    name: 'New article draft',
    description:
      'The newsletter draft created when an article is first published. It waits on the newsletter page until an admin sends it.',
    group: 'Newsletter',
    fields: ['subject', 'preheader', 'body'],
    required: ['subject'],
    variables: [
      {
        name: 'title',
        description: 'The article’s title',
        sample: 'Plutus validators, step by step',
      },
      {
        name: 'description',
        description: 'The article’s summary',
        sample: 'How on-chain validators decide what a transaction may do.',
      },
      { name: 'author', description: 'The author’s name', sample: 'Mechack' },
      SITE_URL,
    ],
    defaults: { subject: '{{title}}', preheader: '{{description}}', body: '' },
  },
};

export const isTemplateKey = (key: string): key is TemplateKey =>
  (TEMPLATE_KEYS as readonly string[]).includes(key);

export const sampleVariables = (key: TemplateKey): Variables =>
  Object.fromEntries(TEMPLATES[key].variables.map((v) => [v.name, v.sample]));

const TAG = /\{\{\s*([#^/]?)\s*([^{}]*?)\s*\}\}/g;
/** Innermost sections first, so nested ones resolve from the inside out. */
const SECTION = /\{\{([#^])\s*(\w+)\s*\}\}((?:(?!\{\{[#^])[\s\S])*?)\{\{\/\s*\2\s*\}\}/g;
const VARIABLE = /\{\{\s*(\w+)\s*\}\}/g;

const isOn = (value: VariableValue) =>
  value !== null && value !== undefined && value !== false && value !== '' && value !== 0;

/**
 * Fills {{name}} with its value and keeps {{#name}}…{{/name}} only when the value is set
 * ({{^name}}…{{/name}} only when it is not). `encode` escapes values for HTML fields.
 */
export function fillTemplate(
  template: string,
  variables: Variables,
  encode: (value: string) => string = (value) => value
): string {
  let out = template;
  for (let pass = 0; pass < 10; pass++) {
    const next = out.replace(SECTION, (_m, kind: string, name: string, inner: string) =>
      (kind === '#') === isOn(variables[name]) ? inner : ''
    );
    if (next === out) break;
    out = next;
  }
  return out.replace(VARIABLE, (_m, name: string) => {
    const value = variables[name];
    return value === null || value === undefined || typeof value === 'boolean'
      ? ''
      : encode(String(value));
  });
}

/** A readable problem with the template's variables, or null when it is fine. */
export function checkTemplate(template: string, allowed: string[]): string | null {
  const open: string[] = [];
  for (const [, kind, name] of template.matchAll(TAG)) {
    if (!allowed.includes(name)) {
      const list = allowed.map((n) => `{{${n}}}`).join(', ');
      return name
        ? `{{${kind}${name}}} is not a variable this email knows. You can use ${list}.`
        : 'Remove the empty {{ }}.';
    }
    if (kind === '#' || kind === '^') open.push(name);
    else if (kind === '/') {
      const last = open.pop();
      if (last !== name) {
        return last
          ? `{{/${name}}} closes a section that is not open; close {{#${last}}} first.`
          : `{{/${name}}} has no matching {{#${name}}}.`;
      }
    }
  }
  return open.length
    ? `Close {{#${open[open.length - 1]}}} with {{/${open[open.length - 1]}}}.`
    : null;
}

const FIELD_NAMES: Record<CopyField, string> = {
  subject: 'Subject',
  preheader: 'Preview text',
  eyebrow: 'Label',
  heading: 'Heading',
  body: 'Message',
  buttonLabel: 'Button',
  note: 'Closing note',
  articlesLabel: 'Articles heading',
};

const isBlank = (value: string, html: boolean) =>
  !(html ? value.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ') : value).trim();

/** Keeps the template's own fields, trimmed, and explains the first problem found. */
export function validateCopy(
  key: TemplateKey,
  input: Partial<Record<CopyField, string | null | undefined>>
): { copy: Partial<EmailCopy> } | { error: string } {
  const definition = TEMPLATES[key];
  const allowed = definition.variables.map((v) => v.name);
  const copy: Partial<EmailCopy> = {};
  for (const field of definition.fields) {
    const html = HTML_FIELDS.has(field);
    const value = (input[field] ?? '').trim();
    const label = FIELD_NAMES[field];
    if (definition.required.includes(field) && isBlank(value, html)) {
      return { error: `${label} cannot be empty.` };
    }
    if (value.length > FIELD_LIMITS[field]) {
      return { error: `${label} is too long; keep it under ${FIELD_LIMITS[field]} characters.` };
    }
    const problem = checkTemplate(value, allowed);
    if (problem) return { error: `${label}: ${problem}` };
    copy[field] = html && isBlank(value, true) ? '' : value;
  }
  return { copy };
}

function withDefaults(key: TemplateKey, saved: Partial<Record<CopyField, string | null>> | null) {
  const definition = TEMPLATES[key];
  return Object.fromEntries(
    COPY_FIELDS.map((field) => [
      field,
      definition.fields.includes(field) ? (saved?.[field] ?? definition.defaults[field] ?? '') : '',
    ])
  ) as EmailCopy;
}

export const defaultCopy = (key: TemplateKey) => withDefaults(key, null);

const EMPTY_PARAGRAPH = /<p(?:\s[^>]*)?>\s*<\/p>/gi;

/**
 * Fills every field; values are escaped in the rich text fields only, which also lose the
 * empty paragraphs a hidden section leaves behind.
 */
export function fillCopy(copy: EmailCopy, variables: Variables): EmailCopy {
  return Object.fromEntries(
    COPY_FIELDS.map((field) => {
      const html = HTML_FIELDS.has(field);
      const filled = fillTemplate(copy[field], variables, html ? escapeHtml : undefined);
      return [field, (html ? filled.replace(EMPTY_PARAGRAPH, '') : filled).trim()];
    })
  ) as EmailCopy;
}

export interface StoredCopy {
  copy: EmailCopy;
  customized: boolean;
  updatedAt: Date | null;
}

const toStored = (key: TemplateKey, row: EmailTemplate | null): StoredCopy => ({
  copy: withDefaults(key, row),
  customized: Boolean(row),
  updatedAt: row?.updatedAt ?? null,
});

export async function getCopy(key: TemplateKey): Promise<StoredCopy> {
  return toStored(key, await prisma.emailTemplate.findUnique({ where: { key } }));
}

export async function listCopies(): Promise<Record<TemplateKey, StoredCopy>> {
  const rows = await prisma.emailTemplate.findMany();
  return Object.fromEntries(
    TEMPLATE_KEYS.map((key) => [key, toStored(key, rows.find((r) => r.key === key) ?? null)])
  ) as Record<TemplateKey, StoredCopy>;
}

export async function saveCopy(key: TemplateKey, copy: Partial<EmailCopy>): Promise<StoredCopy> {
  const data = Object.fromEntries(
    COPY_FIELDS.filter((f) => f !== 'subject').map((f) => [f, copy[f] ?? null])
  );
  const row = await prisma.emailTemplate.upsert({
    where: { key },
    create: { key, subject: copy.subject ?? '', ...data },
    update: { subject: copy.subject ?? '', ...data },
  });
  return toStored(key, row);
}

export async function resetCopy(key: TemplateKey): Promise<StoredCopy> {
  await prisma.emailTemplate.deleteMany({ where: { key } });
  return toStored(key, null);
}
