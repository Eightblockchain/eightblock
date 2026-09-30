'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { Panel } from '@eightblock/ui/components/panel';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@eightblock/ui/components/alert-dialog';
import { Field, FormSection } from '@eightblock/ui/components/field';
import { Input } from '@eightblock/ui/components/input';
import { Eyebrow } from '@eightblock/ui/components/section-header';
import { SwitchField } from '@eightblock/ui/components/switch';
import { useToast } from '@eightblock/ui/hooks/use-toast';
import {
  digestScheduleLabel,
  fetchDigestPreview,
  fetchNewsletterSettings,
  formatHour,
  runDigestNow,
  saveNewsletterSettings,
  WEEKDAYS,
  type NewsletterSettings,
  type NewsletterSettingsInput,
} from '@/lib/services/newsletter-service';
import { cn } from '@eightblock/ui/utils';
import { siteHref } from '@/lib/site-config';

type Form = Omit<NewsletterSettingsInput, 'confirmExpiryDays' | 'digestMaxArticles'> & {
  confirmExpiryDays: string;
  digestMaxArticles: string;
};

const selectClass =
  'h-10 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors [color-scheme:light] focus-visible:border-brand-blue focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:[color-scheme:dark]';

function toForm(s: NewsletterSettings): Form {
  return {
    fromAddress: s.fromAddress ?? '',
    transactionalFrom: s.transactionalFrom ?? '',
    replyTo: s.replyTo ?? '',
    postalAddress: s.postalAddress ?? '',
    doubleOptIn: s.doubleOptIn,
    confirmExpiryDays: String(s.confirmExpiryDays),
    welcomeEmail: s.welcomeEmail,
    accountWelcome: s.accountWelcome,
    articleDrafts: s.articleDrafts,
    digestEnabled: s.digestEnabled,
    digestDay: s.digestDay,
    digestHour: s.digestHour,
    digestTimezone: s.digestTimezone,
    digestMaxArticles: String(s.digestMaxArticles),
  };
}

function toPayload(form: Form): NewsletterSettingsInput {
  return {
    ...form,
    fromAddress: form.fromAddress?.trim() || null,
    transactionalFrom: form.transactionalFrom?.trim() || null,
    replyTo: form.replyTo?.trim() || null,
    postalAddress: form.postalAddress?.trim() || null,
    confirmExpiryDays: Number(form.confirmExpiryDays),
    digestMaxArticles: Number(form.digestMaxArticles),
  };
}

function timezones(current: string) {
  const all = Intl.supportedValuesOf?.('timeZone') ?? [];
  return Array.from(new Set(['UTC', current, ...all]));
}

const formatIn = (iso: string, timeZone?: string) =>
  new Date(iso).toLocaleString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
  });

function StatusRow({ label, on, children }: { label: string; on: boolean; children: string }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{children}</p>
      </div>
      <span
        className={cn(
          'ledger-label shrink-0 rounded-full border px-2 py-0.5',
          on
            ? 'border-brand-blue/40 bg-brand-blue/10 text-foreground'
            : 'border-brand-gold/50 bg-brand-gold/10 text-foreground'
        )}
      >
        {on ? 'Connected' : 'Not set up'}
      </span>
    </div>
  );
}

export default function NewsletterSettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['newsletter', 'settings'],
    queryFn: fetchNewsletterSettings,
  });
  const preview = useQuery({
    queryKey: ['newsletter', 'digest-preview'],
    queryFn: fetchDigestPreview,
  });

  const [form, setForm] = useState<Form | null>(null);
  const [confirmRun, setConfirmRun] = useState(false);

  useEffect(() => {
    if (data && form === null) setForm(toForm(data.settings));
  }, [data, form]);

  const zones = useMemo(() => timezones(form?.digestTimezone ?? 'UTC'), [form?.digestTimezone]);

  const save = useMutation({
    mutationFn: (input: NewsletterSettingsInput) => saveNewsletterSettings(input),
    onSuccess: (result) => {
      queryClient.setQueryData(['newsletter', 'settings'], result);
      setForm(toForm(result.settings));
      void queryClient.invalidateQueries({ queryKey: ['newsletter', 'status'] });
      void queryClient.invalidateQueries({ queryKey: ['newsletter', 'digest-preview'] });
      toast({
        title: 'Newsletter settings saved',
        description: 'Changes apply within a few seconds.',
      });
    },
    onError: (err: Error) =>
      toast({
        title: 'Could not save the settings',
        description: err.message,
        variant: 'destructive',
      }),
  });

  const run = useMutation({
    mutationFn: runDigestNow,
    onSuccess: (outcome) => {
      toast({
        title: 'Digest is sending',
        description: `${outcome.articles} article${outcome.articles === 1 ? '' : 's'} going out now. Progress shows on the newsletter page.`,
      });
      void queryClient.invalidateQueries({ queryKey: ['newsletter'] });
    },
    onError: (err: Error) =>
      toast({ title: 'Digest not sent', description: err.message, variant: 'destructive' }),
    onSettled: () => setConfirmRun(false),
  });

  if (error) {
    return (
      <div className="container-page max-w-4xl py-14">
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      </div>
    );
  }

  if (isLoading || !data || !form) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { defaults, settings: saved } = data;
  const update = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => (current ? { ...current, [key]: value } : current));
  const dirty = JSON.stringify(toPayload(form)) !== JSON.stringify(toPayload(toForm(saved)));
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const candidates = preview.data?.articles ?? [];
  const extra = (preview.data?.total ?? 0) - candidates.length;

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    save.mutate(toPayload(form));
  };

  return (
    <div className="container-page max-w-4xl py-14">
      <Link
        href="/newsletter"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Newsletter
      </Link>
      <div className="mt-6">
        <Eyebrow>Newsletter</Eyebrow>
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
          Settings
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Who emails come from, what subscribers receive and when. Changes apply without a redeploy.
        </p>
      </div>

      <form onSubmit={handleSave} className="mt-10">
        <fieldset disabled={save.isPending} className="contents">
          <Panel className="p-6 sm:p-8">
            <FormSection
              title="Senders"
              description="Leave a field blank to use the value from the server environment, shown as the placeholder."
            >
              <Field
                label="Newsletter sender"
                htmlFor="fromAddress"
                hint="Used for campaigns and the weekly digest. The domain must be verified in Resend."
              >
                <Input
                  id="fromAddress"
                  value={form.fromAddress ?? ''}
                  onChange={(e) => update('fromAddress', e.target.value)}
                  placeholder={defaults.fromAddress}
                />
              </Field>
              <Field
                label="Account email sender"
                htmlFor="transactionalFrom"
                hint="Used for confirmation links and welcome emails."
              >
                <Input
                  id="transactionalFrom"
                  value={form.transactionalFrom ?? ''}
                  onChange={(e) => update('transactionalFrom', e.target.value)}
                  placeholder={defaults.transactionalFrom}
                />
              </Field>
              <Field
                label="Reply-to"
                htmlFor="replyTo"
                hint="Where replies go. Without one, replies go to the sender address."
              >
                <Input
                  id="replyTo"
                  value={form.replyTo ?? ''}
                  onChange={(e) => update('replyTo', e.target.value)}
                  placeholder={defaults.replyTo ?? 'Eightblock <hello@eightblock.dev>'}
                />
              </Field>
              <Field
                label="Mailing address"
                htmlFor="postalAddress"
                count={{ value: form.postalAddress?.length ?? 0, max: 300 }}
                hint="Shown in the footer of every email. Anti-spam laws such as CAN-SPAM expect one on newsletters."
              >
                <Input
                  id="postalAddress"
                  value={form.postalAddress ?? ''}
                  maxLength={300}
                  onChange={(e) => update('postalAddress', e.target.value)}
                  placeholder={defaults.postalAddress ?? 'Street, city, country'}
                />
              </Field>
            </FormSection>

            <FormSection
              title="Signups"
              description="What happens when someone subscribes or creates an account."
            >
              <SwitchField
                id="doubleOptIn"
                label="Require confirmation"
                description="New addresses get a confirmation link and receive nothing until they click it. Stops fake and mistyped signups. Signed-in readers subscribing their own Google address skip this step."
                checked={form.doubleOptIn}
                onChange={(value) => update('doubleOptIn', value)}
              />
              <Field
                label="Confirmation link expires after"
                htmlFor="confirmExpiryDays"
                hint="Unconfirmed signups are deleted after this many days (1 to 30)."
              >
                <div className="flex items-center gap-3">
                  <Input
                    id="confirmExpiryDays"
                    type="number"
                    min={1}
                    max={30}
                    className="w-24"
                    value={form.confirmExpiryDays}
                    disabled={!form.doubleOptIn}
                    onChange={(e) => update('confirmExpiryDays', e.target.value)}
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </Field>
              <SwitchField
                id="welcomeEmail"
                label="Subscriber welcome email"
                description="Sent once a subscription is active, with a few recent articles to start with."
                checked={form.welcomeEmail}
                onChange={(value) => update('welcomeEmail', value)}
              />
              <SwitchField
                id="accountWelcome"
                label="Account welcome email"
                description="Sent when someone creates an Eightblock account with Google."
                checked={form.accountWelcome}
                onChange={(value) => update('accountWelcome', value)}
              />
            </FormSection>

            <FormSection title="New articles" description="Newsletters about individual articles.">
              <SwitchField
                id="articleDrafts"
                label="Draft a newsletter on publish"
                description="Publishing an article for the first time adds a ready-made draft on the newsletter page. It is never sent automatically."
                checked={form.articleDrafts}
                onChange={(value) => update('articleDrafts', value)}
              />
            </FormSection>

            <FormSection
              title="Weekly digest"
              description="A roundup of the week's articles that no newsletter has covered yet. Quiet weeks send nothing."
            >
              <SwitchField
                id="digestEnabled"
                label="Send the weekly digest"
                description="Goes to every active subscriber at the time below."
                checked={form.digestEnabled}
                onChange={(value) => update('digestEnabled', value)}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Day" htmlFor="digestDay">
                  <select
                    id="digestDay"
                    className={selectClass}
                    value={form.digestDay}
                    disabled={!form.digestEnabled}
                    onChange={(e) => update('digestDay', Number(e.target.value))}
                  >
                    {WEEKDAYS.map((day, index) => (
                      <option key={day} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Time" htmlFor="digestHour">
                  <select
                    id="digestHour"
                    className={selectClass}
                    value={form.digestHour}
                    disabled={!form.digestEnabled}
                    onChange={(e) => update('digestHour', Number(e.target.value))}
                  >
                    {Array.from({ length: 24 }, (_, hour) => (
                      <option key={hour} value={hour}>
                        {formatHour(hour)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field
                label="Timezone"
                htmlFor="digestTimezone"
                hint={
                  form.digestTimezone !== localZone && (
                    <button
                      type="button"
                      className="underline-offset-4 hover:text-foreground hover:underline"
                      disabled={!form.digestEnabled}
                      onClick={() => update('digestTimezone', localZone)}
                    >
                      Use my timezone ({localZone.replace(/_/g, ' ')})
                    </button>
                  )
                }
              >
                <select
                  id="digestTimezone"
                  className={selectClass}
                  value={form.digestTimezone}
                  disabled={!form.digestEnabled}
                  onChange={(e) => update('digestTimezone', e.target.value)}
                >
                  {zones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Articles per digest"
                htmlFor="digestMaxArticles"
                hint="The newest ones are included first (1 to 10)."
              >
                <Input
                  id="digestMaxArticles"
                  type="number"
                  min={1}
                  max={10}
                  className="w-24"
                  value={form.digestMaxArticles}
                  disabled={!form.digestEnabled}
                  onChange={(e) => update('digestMaxArticles', e.target.value)}
                />
              </Field>

              <div className="border border-border">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div>
                    <p className="ledger-label">Next digest</p>
                    <p className="mt-1 text-sm text-foreground">
                      {!saved.digestEnabled
                        ? 'Off'
                        : data.nextDigestAt
                          ? formatIn(data.nextDigestAt, saved.digestTimezone)
                          : digestScheduleLabel(saved)}
                    </p>
                    {saved.digestEnabled &&
                      data.nextDigestAt &&
                      saved.digestTimezone !== localZone && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatIn(data.nextDigestAt)} your time
                        </p>
                      )}
                    {dirty && (
                      <p className="mt-0.5 text-xs text-brand-blue">
                        Save to apply schedule changes.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-pill-outline h-9 px-4 text-xs"
                    onClick={() => setConfirmRun(true)}
                    disabled={!data.emailConfigured || candidates.length === 0 || run.isPending}
                    title={
                      !data.emailConfigured
                        ? 'Connect an email provider first'
                        : candidates.length === 0
                          ? 'No new articles to include'
                          : 'Send the digest to all subscribers now'
                    }
                  >
                    {run.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Send now
                  </button>
                </div>
                {preview.isLoading ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>
                ) : candidates.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Nothing new this week yet, so the next digest would be skipped.
                  </p>
                ) : (
                  <ol className="divide-y divide-border">
                    {candidates.map((article, index) => (
                      <li
                        key={article.id}
                        className="flex items-baseline gap-3 px-4 py-2.5 text-sm"
                      >
                        <span className="w-6 shrink-0 font-mono text-[11px] text-brand-blue">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <Link
                          href={siteHref(`/articles/${article.slug}`)}
                          target="_blank"
                          className="min-w-0 flex-1 truncate text-foreground hover:underline"
                        >
                          {article.title}
                        </Link>
                        <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                          {new Date(article.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </li>
                    ))}
                    {extra > 0 && (
                      <li className="px-4 py-2.5 text-xs text-muted-foreground">
                        {extra} more wait for a later newsletter because of the per-digest limit.
                      </li>
                    )}
                  </ol>
                )}
              </div>
            </FormSection>

            <FormSection
              title="Delivery"
              description="Secrets stay in the server environment and cannot be changed here."
            >
              <StatusRow label="Email provider" on={data.emailConfigured}>
                {data.emailConfigured
                  ? 'Resend is connected through EMAIL_PROVIDER_API_KEY.'
                  : 'Set EMAIL_PROVIDER_API_KEY in the backend .env. Nothing is sent until then.'}
              </StatusRow>
              <StatusRow label="Bounce and spam webhook" on={data.webhookConfigured}>
                {data.webhookConfigured
                  ? 'Bouncing and complaining addresses are unsubscribed automatically.'
                  : 'Add a Resend webhook for email.bounced and email.complained, then set RESEND_WEBHOOK_SECRET.'}
              </StatusRow>
            </FormSection>
          </Panel>

          <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-4 border-t border-border bg-background py-4">
            <p className="text-xs text-muted-foreground">
              {dirty
                ? 'Unsaved changes'
                : saved.updatedAt
                  ? `Last saved ${new Date(saved.updatedAt).toLocaleString()}`
                  : 'Using the default settings.'}
            </p>
            <div className="flex items-center gap-2">
              {dirty && (
                <button
                  type="button"
                  className="btn-pill-outline"
                  onClick={() => setForm(toForm(saved))}
                >
                  Discard
                </button>
              )}
              <button type="submit" className="btn-pill" disabled={!dirty || save.isPending}>
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save settings
              </button>
            </div>
          </div>
        </fieldset>
      </form>

      <AlertDialog
        open={confirmRun}
        onOpenChange={(open) => !open && !run.isPending && setConfirmRun(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send the digest now?</AlertDialogTitle>
            <AlertDialogDescription>
              {candidates.length} article{candidates.length === 1 ? '' : 's'} go out to every active
              subscriber right away. They will not be repeated in the next scheduled digest. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={run.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={run.isPending}
              onClick={(e) => {
                e.preventDefault();
                run.mutate();
              }}
            >
              {run.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send digest
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
