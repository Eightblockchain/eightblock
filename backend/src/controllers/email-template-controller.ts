import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import {
  TEMPLATES,
  TEMPLATE_KEYS,
  defaultCopy,
  getCopy,
  isTemplateKey,
  listCopies,
  resetCopy,
  saveCopy,
  validateCopy,
  type EmailCopy,
  type StoredCopy,
  type TemplateKey,
} from '../services/email-copy.js';
import {
  EmailNotConfiguredError,
  previewTemplate,
  sendTestTemplate,
} from '../services/email-service.js';

function templateKey(req: Request, res: Response): TemplateKey | null {
  const { key } = req.params;
  if (isTemplateKey(key)) return key;
  res.status(404).json({ error: 'Email template not found' });
  return null;
}

const describe = (key: TemplateKey, stored: StoredCopy) => {
  const { defaults: _defaults, ...definition } = TEMPLATES[key];
  return { ...definition, ...stored };
};

/** The wording from the request, checked against the template; sends the 400 itself. */
function copyFrom(req: Request, res: Response, key: TemplateKey): EmailCopy | null {
  const result = validateCopy(key, req.body.copy ?? {});
  if ('error' in result) {
    res.status(400).json({ error: result.error });
    return null;
  }
  return { ...defaultCopy(key), ...result.copy };
}

export async function listTemplates(_req: Request, res: Response) {
  const stored = await listCopies();
  return res.json(TEMPLATE_KEYS.map((key) => describe(key, stored[key])));
}

export async function getTemplate(req: Request, res: Response) {
  const key = templateKey(req, res);
  if (!key) return;
  return res.json({ ...describe(key, await getCopy(key)), defaults: defaultCopy(key) });
}

export async function updateTemplate(req: Request, res: Response) {
  const key = templateKey(req, res);
  if (!key) return;
  const result = validateCopy(key, req.body.copy ?? {});
  if ('error' in result) return res.status(400).json({ error: result.error });
  return res.json({
    ...describe(key, await saveCopy(key, result.copy)),
    defaults: defaultCopy(key),
  });
}

export async function resetTemplate(req: Request, res: Response) {
  const key = templateKey(req, res);
  if (!key) return;
  return res.json({ ...describe(key, await resetCopy(key)), defaults: defaultCopy(key) });
}

export async function previewTemplateEmail(req: Request, res: Response) {
  const key = templateKey(req, res);
  if (!key) return;
  const copy = copyFrom(req, res, key);
  if (!copy) return;
  return res.json(await previewTemplate(key, copy));
}

export async function sendTemplateTest(req: Request, res: Response) {
  const key = templateKey(req, res);
  if (!key) return;
  const copy = copyFrom(req, res, key);
  if (!copy) return;
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { email: true, name: true },
  });
  if (!user?.email) {
    return res.status(400).json({ error: 'Your account has no email address to send a test to' });
  }

  try {
    await sendTestTemplate(key, copy, { email: user.email, name: user.name });
  } catch (err) {
    if (err instanceof EmailNotConfiguredError) return res.status(503).json({ error: err.message });
    console.error('[email-templates] test send failed:', err);
    return res.status(502).json({
      error: err instanceof Error ? err.message : 'The email provider rejected the message',
    });
  }
  return res.json({ to: user.email });
}
