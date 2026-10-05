import { ApiError } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export type CampaignStatus = 'DRAFT' | 'SENDING' | 'SENT' | 'FAILED';
/** ARTICLE drafts are created when an article is first published; DIGEST is the weekly roundup. */
export type CampaignKind = 'MANUAL' | 'ARTICLE' | 'DIGEST';

export interface Campaign {
  id: string;
  subject: string;
  preheader: string | null;
  htmlContent: string;
  articleIds: string[];
  status: CampaignStatus;
  kind: CampaignKind;
  sentAt: string | null;
  recipientCount: number;
  failedCount: number;
  totalCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignInput {
  subject: string;
  preheader?: string | null;
  htmlContent: string;
  articleIds: string[];
}

export interface NewsletterStatus {
  configured: boolean;
  from: string;
  replyTo: string | null;
  siteUrl: string;
  activeSubscribers: number;
  /** Signed up but have not clicked the confirmation link yet. */
  pendingSubscribers: number;
  settings: NewsletterSettings;
  nextDigestAt: string | null;
  /** Bounces and spam complaints unsubscribe addresses automatically. */
  webhookConfigured: boolean;
}

/** Editable on the newsletter settings page; blank senders fall back to the backend .env. */
export interface NewsletterSettings {
  fromAddress: string | null;
  transactionalFrom: string | null;
  replyTo: string | null;
  postalAddress: string | null;
  doubleOptIn: boolean;
  confirmExpiryDays: number;
  welcomeEmail: boolean;
  accountWelcome: boolean;
  articleDrafts: boolean;
  digestEnabled: boolean;
  /** 0 = Sunday … 6 = Saturday. */
  digestDay: number;
  digestHour: number;
  digestTimezone: string;
  digestMaxArticles: number;
  updatedAt: string | null;
}

export type NewsletterSettingsInput = Omit<NewsletterSettings, 'updatedAt'>;

export interface NewsletterSettingsResponse {
  settings: NewsletterSettings;
  /** The .env values used while a sender field is blank. */
  defaults: {
    fromAddress: string;
    transactionalFrom: string;
    replyTo: string | null;
    postalAddress: string | null;
  };
  nextDigestAt: string | null;
  emailConfigured: boolean;
  webhookConfigured: boolean;
}

export interface DigestPreview {
  articles: { id: string; title: string; slug: string; publishedAt: string }[];
  /** Uncovered articles this week, including any beyond the per-digest limit. */
  total: number;
  nextDigestAt: string | null;
}

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const formatHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

/** "Mondays at 09:00 UTC" */
export const digestScheduleLabel = (
  s: Pick<NewsletterSettings, 'digestDay' | 'digestHour' | 'digestTimezone'>
) =>
  `${WEEKDAYS[s.digestDay]}s at ${formatHour(s.digestHour)} ${s.digestTimezone.replace(/_/g, ' ')}`;

export interface PickableArticle {
  id: string;
  title: string;
  slug: string;
  /** Category names, comma separated. Null when uncategorized. */
  category: string | null;
  publishedAt: string;
  featuredImage: string | null;
  author: { name: string | null } | null;
}

export interface Subscriber {
  id: string;
  email: string;
  topics: string[];
  createdAt: string;
}

function csrfHeader(): Record<string, string> {
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
  return match ? { 'X-CSRF-Token': decodeURIComponent(match[1]) } : {};
}

/** Admin API call that throws the server's own message (`{ error }`) when it fails. */
export async function request<T>(
  path: string,
  fallback: string,
  init?: { method?: string; body?: unknown }
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: init?.method ?? 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers:
      init?.body !== undefined
        ? { 'Content-Type': 'application/json', ...csrfHeader() }
        : csrfHeader(),
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(typeof body?.error === 'string' ? body.error : fallback, response.status);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const fetchNewsletterStatus = () =>
  request<NewsletterStatus>('/newsletters/status', 'Could not load the newsletter status');

export const fetchCampaigns = () => request<Campaign[]>('/newsletters', 'Could not load campaigns');

export const fetchNewsletterSettings = () =>
  request<NewsletterSettingsResponse>('/newsletters/settings', 'Could not load the settings');

export const saveNewsletterSettings = (input: NewsletterSettingsInput) =>
  request<NewsletterSettingsResponse>('/newsletters/settings', 'Could not save the settings', {
    method: 'PUT',
    body: input,
  });

export const fetchDigestPreview = () =>
  request<DigestPreview>('/newsletters/digest/preview', 'Could not load the digest preview');

export const runDigestNow = () =>
  request<{ sent: true; campaignId: string; articles: number }>(
    '/newsletters/digest/run',
    'Could not send the digest',
    { method: 'POST' }
  );

export const fetchSubscribers = () =>
  request<{ subscribers: Subscriber[]; count: number }>(
    '/subscriptions',
    'Could not load subscribers'
  );

export const searchArticles = (q: string) =>
  request<PickableArticle[]>(
    `/newsletters/articles?q=${encodeURIComponent(q)}`,
    'Could not load articles'
  );

export const fetchArticlesByIds = (ids: string[]) =>
  request<PickableArticle[]>(
    `/newsletters/articles?ids=${ids.join(',')}`,
    'Could not load articles'
  );

export const previewCampaign = (input: CampaignInput) =>
  request<{ html: string; text: string }>('/newsletters/preview', 'Could not render the preview', {
    method: 'POST',
    body: input,
  });

export const sendTestEmail = (input: CampaignInput) =>
  request<{ to: string }>('/newsletters/test', 'Could not send the test email', {
    method: 'POST',
    body: input,
  });

export const saveCampaign = (input: CampaignInput, id?: string | null) =>
  request<Campaign>(id ? `/newsletters/${id}` : '/newsletters', 'Could not save the draft', {
    method: id ? 'PUT' : 'POST',
    body: input,
  });

export const deleteCampaign = (id: string) =>
  request<void>(`/newsletters/${id}`, 'Could not delete the draft', { method: 'DELETE' });

export const sendCampaign = (id: string) =>
  request<Campaign>(`/newsletters/${id}/send`, 'Could not start sending', { method: 'POST' });
