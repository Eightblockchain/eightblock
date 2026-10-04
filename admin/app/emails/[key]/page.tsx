'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Copy, FlaskConical, Loader2, RotateCcw } from 'lucide-react';
import { RichTextEditor } from '@eightblock/ui/editor/RichTextEditor';
import { Panel, PanelBar } from '@eightblock/ui/components/panel';
import { Field } from '@eightblock/ui/components/field';
import { Input } from '@eightblock/ui/components/input';
import { Eyebrow } from '@eightblock/ui/components/section-header';
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
import { useToast } from '@eightblock/ui/hooks/use-toast';
import { PreviewPanel, useDebounced } from '@/components/newsletter/email-preview';
import { TemplateStatus } from '@/components/emails/template-status';
import { fetchNewsletterStatus } from '@/lib/services/newsletter-service';
import {
  fetchEmailTemplate,
  previewEmailTemplate,
  resetEmailTemplate,
  saveEmailTemplate,
  sendEmailTemplateTest,
  type CopyField,
  type EmailCopy,
  type EmailTemplateDetail,
} from '@/lib/services/email-template-service';

interface FieldSpec {
  label: string;
  rich?: boolean;
  max: number;
  hint?: string;
}

const FIELDS: Record<CopyField, FieldSpec> = {
  subject: { label: 'Subject', max: 200 },
  preheader: {
    label: 'Preview text',
    max: 200,
    hint: 'The line inboxes show after the subject. Leave it empty to let the inbox pick.',
  },
  eyebrow: { label: 'Label', max: 60, hint: 'Small capitals above the heading.' },
  heading: { label: 'Heading', max: 200 },
  body: { label: 'Message', rich: true, max: 50_000 },
  buttonLabel: { label: 'Button', max: 40 },
  note: {
    label: 'Closing note',
    rich: true,
    max: 20_000,
    hint: 'Shown under the button, below a divider. Leave it empty to drop it.',
  },
  articlesLabel: {
    label: 'Articles heading',
    max: 60,
    hint: 'Above the three latest articles, which are added automatically.',
  },
};

const BUTTON_HINTS: Record<string, string> = {
  'subscription-confirm':
    'Opens the confirmation link. The link is also printed under the button for inboxes that hide buttons.',
  'newsletter-welcome': 'Opens the articles page on the blog.',
  'newsletter-welcome-back': 'Opens the articles page on the blog.',
  'account-welcome': 'Opens the reader’s profile settings.',
};

const BODY_HINTS: Record<string, string> = {
  'weekly-digest': 'Shown above the week’s articles, which are added automatically.',
  'article-announcement':
    'Optional. Shown above the article card in the draft; you can still edit each draft before sending.',
};

const pick = (template: EmailTemplateDetail, copy: EmailCopy) =>
  JSON.stringify(template.fields.map((f) => copy[f]));

const isEmptyHtml = (html: string) => html.replace(/<[^>]+>/g, '').trim() === '';

function VariablesPanel({ template }: { template: EmailTemplateDetail }) {
  const { toast } = useToast();
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: `Copied ${text}`,
        description: 'Paste it into any field.',
        variant: 'success',
      });
    } catch {
      toast({ title: 'Could not copy', description: text, variant: 'warning' });
    }
  };
  const flag = template.variables.find((v) => typeof v.sample === 'boolean');
  const optional = template.variables.find((v) => v.name === 'firstName') ?? flag;

  return (
    <Panel marks={false}>
      <PanelBar>Variables</PanelBar>
      <div className="space-y-4 p-5 text-sm">
        <p className="text-muted-foreground">
          Replaced with each reader’s details when the email is sent. Click one to copy it.
        </p>
        <ul className="space-y-2.5">
          {template.variables.map((variable) => (
            <li key={variable.name} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <button
                type="button"
                onClick={() =>
                  copy(
                    typeof variable.sample === 'boolean'
                      ? `{{#${variable.name}}}{{/${variable.name}}}`
                      : `{{${variable.name}}}`
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5 font-mono text-xs text-foreground transition-colors hover:border-brand-blue hover:text-brand-blue"
              >
                {typeof variable.sample === 'boolean'
                  ? `{{#${variable.name}}}`
                  : `{{${variable.name}}}`}
                <Copy className="h-3 w-3" />
              </button>
              <span className="text-muted-foreground">{variable.description}</span>
            </li>
          ))}
        </ul>
        {optional && (
          <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
            Wrap text in{' '}
            <code className="font-mono text-foreground">
              {`{{#${optional.name}}}…{{/${optional.name}}}`}
            </code>{' '}
            to show it only when {optional.name} is set, or in{' '}
            <code className="font-mono text-foreground">
              {`{{^${optional.name}}}…{{/${optional.name}}}`}
            </code>{' '}
            to show it only when it is not.
          </p>
        )}
      </div>
    </Panel>
  );
}

export default function EmailTemplateEditor() {
  const { key } = useParams<{ key: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<EmailCopy | null>(null);
  const [saved, setSaved] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const template = useQuery({
    queryKey: ['email-templates', key],
    queryFn: () => fetchEmailTemplate(key),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const status = useQuery({ queryKey: ['newsletter', 'status'], queryFn: fetchNewsletterStatus });

  const data = template.data;
  useEffect(() => {
    if (data && draft === null) {
      setDraft(data.copy);
      setSaved(pick(data, data.copy));
    }
  }, [data, draft]);

  const debounced = useDebounced(draft, 500);
  const preview = useQuery({
    queryKey: ['email-templates', key, 'preview', debounced],
    queryFn: () => previewEmailTemplate(key, debounced!),
    enabled: debounced !== null,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    retry: false,
  });

  const loaded = (next: EmailTemplateDetail) => {
    queryClient.setQueryData(['email-templates', key], next);
    void queryClient.invalidateQueries({ queryKey: ['email-templates'], exact: true });
    setDraft(next.copy);
    setSaved(pick(next, next.copy));
  };

  const save = useMutation({
    mutationFn: () => saveEmailTemplate(key, draft!),
    onSuccess: (next) => {
      loaded(next);
      toast({
        title: 'Email saved',
        description: 'Emails sent from now on use this wording.',
        variant: 'success',
      });
    },
    onError: (err: Error) =>
      toast({ title: 'Email not saved', description: err.message, variant: 'destructive' }),
  });

  const reset = useMutation({
    mutationFn: () => resetEmailTemplate(key),
    onSuccess: (next) => {
      loaded(next);
      setConfirmReset(false);
      toast({ title: 'Back to the default wording', variant: 'success' });
    },
    onError: (err: Error) =>
      toast({
        title: 'Could not reset the email',
        description: err.message,
        variant: 'destructive',
      }),
  });

  const test = useMutation({
    mutationFn: () => sendEmailTemplateTest(key, draft!),
    onSuccess: ({ to }) =>
      toast({
        title: `Test email sent to ${to}`,
        description: 'It uses the wording on screen, saved or not.',
        variant: 'success',
      }),
    onError: (err: Error) =>
      toast({ title: 'Test email not sent', description: err.message, variant: 'destructive' }),
  });

  if (template.isError) {
    return (
      <div className="container-page max-w-3xl py-14">
        <Panel className="p-8 text-center">
          <p className="font-display text-lg font-semibold text-foreground">
            {(template.error as Error).message}
          </p>
          <Link href="/emails" className="btn-pill-outline mt-6">
            All emails
          </Link>
        </Panel>
      </div>
    );
  }

  if (!data || !draft) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const dirty = pick(data, draft) !== saved;
  const configured = status.data?.configured ?? false;
  const busy = save.isPending || reset.isPending;
  const set = (field: CopyField) => (value: string) =>
    setDraft((d) => (d ? { ...d, [field]: value } : d));
  const missing = data.required.filter((f) =>
    FIELDS[f].rich ? isEmptyHtml(draft[f]) : !draft[f].trim()
  );

  return (
    <div className="container-page py-12">
      <Link
        href="/emails"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All emails
      </Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <Eyebrow>{data.group}</Eyebrow>
          <h1 className="mt-5 font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            {data.name}
          </h1>
          <p className="mt-3 text-muted-foreground">{data.description}</p>
        </div>
        <TemplateStatus template={data} />
      </div>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-7">
          <Panel marks={false}>
            <PanelBar>
              <span>Wording</span>
              <span className="normal-case tracking-normal text-muted-foreground">
                {save.isPending ? 'Saving…' : dirty ? 'Unsaved changes' : ''}
              </span>
            </PanelBar>
            <div className="space-y-6 p-5">
              {preview.isError && (
                <p
                  role="alert"
                  className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {(preview.error as Error).message}
                </p>
              )}
              {data.fields.map((field) => {
                const spec = FIELDS[field];
                const hint =
                  (field === 'buttonLabel' && BUTTON_HINTS[data.key]) ||
                  (field === 'body' && BODY_HINTS[data.key]) ||
                  spec.hint;
                return (
                  <Field
                    key={field}
                    label={data.required.includes(field) ? spec.label : `${spec.label} (optional)`}
                    htmlFor={spec.rich ? undefined : `field-${field}`}
                    hint={hint}
                    count={spec.rich ? undefined : { value: draft[field].length, max: spec.max }}
                  >
                    {spec.rich ? (
                      <div className="border border-border">
                        <RichTextEditor
                          content={draft[field]}
                          onChange={(html) => set(field)(isEmptyHtml(html) ? '' : html)}
                          placeholder={
                            field === 'note' ? 'Add a closing note…' : 'Write the message…'
                          }
                          minHeight={field === 'body' ? '200px' : '120px'}
                        />
                      </div>
                    ) : (
                      <Input
                        id={`field-${field}`}
                        value={draft[field]}
                        maxLength={spec.max}
                        onChange={(e) => set(field)(e.target.value)}
                      />
                    )}
                  </Field>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-border p-4">
              <button
                type="button"
                onClick={() => (data.customized ? setConfirmReset(true) : loaded(data))}
                disabled={busy || (!data.customized && !dirty)}
                className="btn-pill-outline h-9 px-4 text-xs"
                title={
                  data.customized
                    ? 'Replace your wording with the built-in one'
                    : 'Undo your unsaved changes'
                }
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {data.customized ? 'Reset to default' : 'Discard changes'}
              </button>
              <span className="flex-1" />
              <button
                type="button"
                onClick={() => test.mutate()}
                disabled={!configured || missing.length > 0 || test.isPending}
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
                onClick={() => save.mutate()}
                disabled={!dirty || missing.length > 0 || busy}
                className="btn-pill h-9 px-4 text-xs"
              >
                {save.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save
              </button>
            </div>
          </Panel>
          <VariablesPanel template={data} />
        </div>

        <div className="xl:sticky xl:top-20 xl:col-span-5">
          <PreviewPanel
            subject={preview.data?.subject ?? draft.subject}
            preheader={preview.data ? preview.data.preheader : draft.preheader}
            from={status.data?.from}
            rendered={preview.data}
            fetching={preview.isFetching}
            error={preview.isError ? (preview.error as Error).message : null}
          />
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Sample values stand in for the variables, and the latest articles fill any article list.
          </p>
        </div>
      </div>

      <AlertDialog open={confirmReset} onOpenChange={(open) => !busy && setConfirmReset(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset “{data.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Your wording is replaced by the built-in one, and emails sent from now on use it. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reset.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                reset.mutate();
              }}
              disabled={reset.isPending}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {reset.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
