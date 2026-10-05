'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Panel } from '@eightblock/ui/components/panel';
import { Eyebrow } from '@eightblock/ui/components/section-header';
import { TemplateStatus } from '@/components/emails/template-status';
import { fetchEmailTemplates, type EmailTemplate } from '@/lib/services/email-template-service';

const GROUPS: { id: EmailTemplate['group']; title: string; hint: string }[] = [
  {
    id: 'Newsletter',
    title: 'Newsletter',
    hint: 'Signup emails, plus the wording of the newsletters Eightblock writes for you.',
  },
  { id: 'Account', title: 'Account', hint: 'Emails about a reader’s own account.' },
];

export default function EmailTemplatesPage() {
  const { data, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['email-templates'],
    queryFn: fetchEmailTemplates,
  });

  return (
    <div className="container-page max-w-4xl py-14">
      <Eyebrow>Newsletter</Eyebrow>
      <h1 className="mt-5 font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
        Emails
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        The wording of every email Eightblock sends on its own. Edit the subject, preview text,
        message and button; the branded layout, footer and unsubscribe link stay the same.
        Newsletters you write yourself live on the{' '}
        <Link href="/newsletter" className="text-link hover:underline">
          newsletter page
        </Link>
        .
      </p>

      {isError && !data && (
        <Panel className="mt-10 p-8 text-center">
          <p className="font-display text-lg font-semibold text-foreground">
            Could not load the emails
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{(error as Error).message}</p>
          <button
            type="button"
            className="btn-pill mt-6"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
            Try again
          </button>
        </Panel>
      )}

      {!data && !isError && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {data &&
        GROUPS.map((group) => {
          const templates = data.filter((t) => t.group === group.id);
          if (templates.length === 0) return null;
          return (
            <section key={group.id} className="mt-12">
              <h2 className="font-display text-lg font-semibold">{group.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{group.hint}</p>
              <div className="mt-5 space-y-3">
                {templates.map((template) => (
                  <Link key={template.key} href={`/emails/${template.key}`} className="group block">
                    <Panel className="flex items-start gap-4 p-5 transition-colors group-hover:border-foreground/40 sm:p-6">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <p className="font-display font-semibold text-foreground">
                            {template.name}
                          </p>
                          <TemplateStatus template={template} />
                        </div>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          {template.description}
                        </p>
                        <p className="mt-3 truncate font-mono text-xs text-muted-foreground">
                          Subject: <span className="text-foreground">{template.copy.subject}</span>
                        </p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                    </Panel>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );
}
