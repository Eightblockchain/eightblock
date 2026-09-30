'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FilePlus2, FlaskConical, Loader2, Send, Settings2 } from 'lucide-react';
import { RichTextEditor } from '@eightblock/ui/editor/RichTextEditor';
import { ArticlePicker } from '@/components/newsletter/article-picker';
import { AutomationPanel } from '@/components/newsletter/automation-panel';
import { CampaignList, canResume } from '@/components/newsletter/campaign-list';
import { EmailPreview, hasBody } from '@/components/newsletter/email-preview';
import { SetupNotice } from '@/components/newsletter/setup-notice';
import { Panel, PanelBar } from '@eightblock/ui/components/panel';
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
import { Field } from '@eightblock/ui/components/field';
import { Input } from '@eightblock/ui/components/input';
import { Eyebrow } from '@eightblock/ui/components/section-header';
import { useToast } from '@eightblock/ui/hooks/use-toast';
import { downloadCsv } from '@/lib/analytics';
import {
  deleteCampaign,
  fetchCampaigns,
  fetchNewsletterStatus,
  fetchSubscribers,
  saveCampaign,
  sendCampaign,
  sendTestEmail,
  type Campaign,
  type CampaignInput,
} from '@/lib/services/newsletter-service';

const SUBJECT_MAX = 200;
const PREHEADER_MAX = 150;
const EMPTY: CampaignInput = { subject: '', preheader: '', htmlContent: '', articleIds: [] };

const snapshot = (input: CampaignInput) =>
  JSON.stringify({ ...input, preheader: input.preheader ?? '' });

export default function NewsletterAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<CampaignInput>(EMPTY);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [saved, setSaved] = useState(snapshot(EMPTY));
  const [confirm, setConfirm] = useState<{ campaign?: Campaign } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Campaign | null>(null);

  const status = useQuery({ queryKey: ['newsletter', 'status'], queryFn: fetchNewsletterStatus });
  const subscribers = useQuery({
    queryKey: ['newsletter', 'subscribers'],
    queryFn: fetchSubscribers,
  });
  const campaigns = useQuery({
    queryKey: ['newsletter', 'campaigns'],
    queryFn: fetchCampaigns,
    refetchInterval: (query) =>
      query.state.data?.some((c) => c.status === 'SENDING') ? 2000 : false,
  });

  const active = status.data?.activeSubscribers ?? subscribers.data?.count ?? 0;
  const configured = status.data?.configured ?? false;
  const dirty = snapshot(draft) !== saved;
  const complete = draft.subject.trim().length > 0 && hasBody(draft);
  const payload = { ...draft, preheader: draft.preheader?.trim() || null };

  // Announce when a campaign that was sending finishes.
  const previous = useRef<Record<string, string>>({});
  useEffect(() => {
    for (const c of campaigns.data ?? []) {
      if (previous.current[c.id] === 'SENDING' && c.status !== 'SENDING') {
        toast(
          c.status === 'SENT'
            ? {
                title: `“${c.subject}” was delivered to ${c.recipientCount.toLocaleString()} subscribers`,
              }
            : {
                title: `“${c.subject}” could not be sent`,
                description: c.lastError ?? undefined,
                variant: 'destructive',
              }
        );
      }
    }
    previous.current = Object.fromEntries((campaigns.data ?? []).map((c) => [c.id, c.status]));
  }, [campaigns.data, toast]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['newsletter', 'campaigns'] });
  const fail = (title: string) => (err: Error) =>
    toast({ title, description: err.message, variant: 'destructive' });

  const save = useMutation({
    mutationFn: () => saveCampaign(payload, draftId),
    onSuccess: (campaign) => {
      setDraftId(campaign.id);
      setSaved(snapshot(draft));
      refresh();
    },
  });

  const test = useMutation({
    mutationFn: () => sendTestEmail(payload),
    onSuccess: ({ to }) =>
      toast({
        title: `Test email sent to ${to}`,
        description: 'Check your inbox and spam folder.',
      }),
    onError: fail('Test email not sent'),
  });

  const send = useMutation({
    mutationFn: async (campaign?: Campaign) => {
      if (campaign) return sendCampaign(campaign.id);
      let id = draftId;
      if (dirty || !id) {
        const stored = await saveCampaign(payload, id);
        id = stored.id;
        // Keep the saved draft if sending fails, so a retry does not create a duplicate.
        setDraftId(id);
        setSaved(snapshot(draft));
        refresh();
      }
      return sendCampaign(id);
    },
    onMutate: (campaign) => setBusyId(campaign?.id ?? null),
    onSuccess: (campaign, resumed) => {
      toast({
        title: resumed ? 'Sending resumed' : 'Sending started',
        description: 'Delivery runs in the background. You can leave this page.',
      });
      if (!resumed) startNew();
      queryClient.setQueryData<Campaign[]>(['newsletter', 'campaigns'], (list) =>
        list ? [campaign, ...list.filter((c) => c.id !== campaign.id)] : [campaign]
      );
    },
    onError: fail('Sending did not start'),
    onSettled: () => {
      setBusyId(null);
      setConfirm(null);
      refresh();
    },
  });

  const remove = useMutation({
    mutationFn: (campaign: Campaign) => deleteCampaign(campaign.id),
    onMutate: (campaign) => setBusyId(campaign.id),
    onSuccess: (_, campaign) => {
      if (campaign.id === draftId) startNew();
      toast({ title: 'Draft deleted' });
    },
    onError: fail('Could not delete the draft'),
    onSettled: () => {
      setBusyId(null);
      setPendingDelete(null);
      refresh();
    },
  });

  function startNew() {
    setDraft(EMPTY);
    setDraftId(null);
    setSaved(snapshot(EMPTY));
  }

  function edit(campaign: Campaign) {
    const next = {
      subject: campaign.subject,
      preheader: campaign.preheader ?? '',
      htmlContent: campaign.htmlContent,
      articleIds: campaign.articleIds,
    };
    setDraft(next);
    setDraftId(campaign.id);
    setSaved(snapshot(next));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const recent = subscribers.data?.subscribers ?? [];
  const confirmTarget = confirm?.campaign;
  const confirmSubject = confirmTarget?.subject ?? draft.subject;
  const remaining = confirmTarget
    ? confirmTarget.status === 'FAILED'
      ? Math.max(active - confirmTarget.recipientCount, 0)
      : confirmTarget.failedCount
    : active;
  const editingDraft = useMemo(
    () => campaigns.data?.find((c) => c.id === draftId),
    [campaigns.data, draftId]
  );

  return (
    <div className="container-page py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Newsletter</Eyebrow>
          <h1 className="mt-5 font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            Newsletter
          </h1>
        </div>
        <Link href="/newsletter/settings" className="btn-pill-outline h-9 px-4 text-xs">
          <Settings2 className="h-3.5 w-3.5" />
          Settings
        </Link>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {active.toLocaleString()} active subscriber{active === 1 ? '' : 's'}
        {status.data?.pendingSubscribers ? (
          <>
            <span className="mx-2 text-border">|</span>
            {status.data.pendingSubscribers.toLocaleString()} awaiting confirmation
          </>
        ) : null}
        {status.data && (
          <>
            <span className="mx-2 text-border">|</span>
            Sending as {status.data.from}
          </>
        )}
      </p>

      {status.data && !configured && (
        <div className="mt-8">
          <SetupNotice from={status.data.from} />
        </div>
      )}

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-12">
        <Panel marks={false} className="xl:col-span-7">
          <PanelBar>
            <span>{draftId ? 'Edit draft' : 'New newsletter'}</span>
            <span className="normal-case tracking-normal text-muted-foreground">
              {save.isPending
                ? 'Saving…'
                : dirty
                  ? 'Unsaved changes'
                  : draftId && editingDraft
                    ? `Saved ${new Date(editingDraft.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                    : ''}
            </span>
          </PanelBar>
          <div className="space-y-6 p-5">
            <Field
              label="Subject"
              htmlFor="subject"
              count={{ value: draft.subject.length, max: SUBJECT_MAX }}
            >
              <Input
                id="subject"
                value={draft.subject}
                maxLength={SUBJECT_MAX}
                onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
                placeholder="What’s new on Eightblock this week"
              />
            </Field>
            <Field
              label="Preview text"
              htmlFor="preheader"
              count={{ value: draft.preheader?.length ?? 0, max: PREHEADER_MAX }}
              hint="The line inboxes show after the subject. Use it to say why this email is worth opening."
            >
              <Input
                id="preheader"
                value={draft.preheader ?? ''}
                maxLength={PREHEADER_MAX}
                onChange={(e) => setDraft((d) => ({ ...d, preheader: e.target.value }))}
                placeholder="Three new deep dives on Plutus, Hydra and staking"
              />
            </Field>
            <Field
              label="Message"
              hint="Optional when you feature articles. Links back to the site are tagged so you can see the traffic in Analytics."
            >
              <div className="border border-border">
                <RichTextEditor
                  content={draft.htmlContent}
                  onChange={(html) =>
                    setDraft((d) => ({ ...d, htmlContent: html === '<p></p>' ? '' : html }))
                  }
                  placeholder="Write a short note to your readers…"
                  minHeight="220px"
                />
              </div>
            </Field>
            <Field
              label="Featured articles"
              hint="Shown as cards below the message. The first one is featured with its cover image."
            >
              <ArticlePicker
                value={draft.articleIds}
                onChange={(articleIds) => setDraft((d) => ({ ...d, articleIds }))}
              />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-border p-4">
            <button
              type="button"
              onClick={startNew}
              className="btn-pill-outline h-9 px-4 text-xs"
              disabled={!dirty && !draftId}
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              New
            </button>
            <span className="flex-1" />
            <button
              type="button"
              onClick={() =>
                save.mutate(undefined, {
                  onSuccess: () => toast({ title: 'Draft saved' }),
                  onError: fail('Could not save the draft'),
                })
              }
              disabled={!complete || !dirty || save.isPending}
              className="btn-pill-outline h-9 px-4 text-xs"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={() => test.mutate()}
              disabled={!complete || !configured || test.isPending}
              title={
                configured
                  ? 'Send this email to your own address'
                  : 'Connect an email provider first'
              }
              className="btn-pill-outline h-9 px-4 text-xs"
            >
              {test.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FlaskConical className="h-3.5 w-3.5" />
              )}
              Send test to me
            </button>
            <button
              type="button"
              onClick={() => setConfirm({})}
              disabled={!complete || !configured || active === 0 || send.isPending}
              className="btn-pill h-9 px-4 text-xs"
            >
              <Send className="h-3.5 w-3.5" />
              Send to {active.toLocaleString()}
            </button>
          </div>
        </Panel>

        <div className="xl:sticky xl:top-20 xl:col-span-5">
          <EmailPreview input={draft} from={status.data?.from} />
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <CampaignList
            campaigns={campaigns.data ?? []}
            loading={campaigns.isPending}
            error={campaigns.isError ? campaigns.error.message : null}
            onRetry={() => campaigns.refetch()}
            editingId={draftId}
            busyId={busyId}
            onEdit={edit}
            onDelete={setPendingDelete}
            onResume={(c) => canResume(c) && setConfirm({ campaign: c })}
            digestEnabled={status.data?.settings.digestEnabled ?? false}
          />
        </div>
        <div className="space-y-6 lg:col-span-4">
          {status.data && <AutomationPanel status={status.data} />}
          <Panel marks={false}>
            <PanelBar>
              <span>Subscribers</span>
              <button
                type="button"
                onClick={() =>
                  downloadCsv(
                    `eightblock-subscribers-${new Date().toISOString().slice(0, 10)}.csv`,
                    recent.map((s) => ({
                      email: s.email,
                      topics: s.topics.join(' '),
                      subscribed: s.createdAt,
                    }))
                  )
                }
                disabled={recent.length === 0}
                className="inline-flex items-center gap-1.5 normal-case tracking-normal text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </button>
            </PanelBar>
            {subscribers.isPending ? (
              <div className="flex justify-center px-4 py-12">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : subscribers.isError ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                <p>{subscribers.error.message}</p>
                <button
                  type="button"
                  onClick={() => subscribers.refetch()}
                  className="mt-3 text-foreground underline underline-offset-4"
                >
                  Try again
                </button>
              </div>
            ) : recent.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                Nobody has subscribed yet. The signup form is on every article and on /newsletter.
              </p>
            ) : (
              <ul className="max-h-[420px] divide-y divide-border overflow-y-auto">
                {recent.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                  >
                    <span className="min-w-0 truncate text-foreground">{s.email}</span>
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <AlertDialog
        open={!!confirm}
        onOpenChange={(open) => !open && !send.isPending && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmTarget
                ? 'Send to the remaining subscribers?'
                : `Send to ${active.toLocaleString()} subscribers?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              “{confirmSubject}” goes out to about {remaining.toLocaleString()} subscriber
              {remaining === 1 ? '' : 's'}.
              {confirmTarget
                ? ' People who already received it are skipped.'
                : ' This cannot be undone, so send yourself a test first if you have not.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={send.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={send.isPending}
              onClick={(e) => {
                e.preventDefault();
                send.mutate(confirmTarget);
              }}
            >
              {send.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmTarget ? 'Send' : 'Send newsletter'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && !remove.isPending && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.subject}” will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (pendingDelete) remove.mutate(pendingDelete);
              }}
            >
              {remove.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
