import { request } from './newsletter-service';

export type CopyField =
  | 'subject'
  | 'preheader'
  | 'eyebrow'
  | 'heading'
  | 'body'
  | 'buttonLabel'
  | 'note'
  | 'articlesLabel';

export type EmailCopy = Record<CopyField, string>;

export interface TemplateVariable {
  name: string;
  description: string;
  sample: string | number | boolean;
}

export interface EmailTemplate {
  key: string;
  name: string;
  description: string;
  group: 'Newsletter' | 'Account';
  /** The fields this email uses, in display order. */
  fields: CopyField[];
  required: CopyField[];
  variables: TemplateVariable[];
  copy: EmailCopy;
  /** False while the built-in wording is in use. */
  customized: boolean;
  updatedAt: string | null;
}

export interface EmailTemplateDetail extends EmailTemplate {
  defaults: EmailCopy;
}

export interface TemplatePreview {
  subject: string;
  preheader: string | null;
  html: string;
  text: string;
}

const path = (key: string) => `/email-templates/${encodeURIComponent(key)}`;

export const fetchEmailTemplates = () =>
  request<EmailTemplate[]>('/email-templates', 'Could not load the email templates');

export const fetchEmailTemplate = (key: string) =>
  request<EmailTemplateDetail>(path(key), 'Could not load the email template');

export const saveEmailTemplate = (key: string, copy: EmailCopy) =>
  request<EmailTemplateDetail>(path(key), 'Could not save the email', {
    method: 'PUT',
    body: { copy },
  });

export const resetEmailTemplate = (key: string) =>
  request<EmailTemplateDetail>(path(key), 'Could not reset the email', { method: 'DELETE' });

export const previewEmailTemplate = (key: string, copy: EmailCopy) =>
  request<TemplatePreview>(`${path(key)}/preview`, 'Could not render the preview', {
    method: 'POST',
    body: { copy },
  });

export const sendEmailTemplateTest = (key: string, copy: EmailCopy) =>
  request<{ to: string }>(`${path(key)}/test`, 'Could not send the test email', {
    method: 'POST',
    body: { copy },
  });
