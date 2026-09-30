import Link from 'next/link';
import { Panel, PanelBar } from '@eightblock/ui/components/panel';
import { digestScheduleLabel, type NewsletterStatus } from '@/lib/services/newsletter-service';
import { cn } from '@eightblock/ui/utils';

function Row({
  title,
  state,
  on,
  children,
}: {
  title: string;
  state: string;
  on: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <span
          className={cn(
            'ledger-label shrink-0 rounded-full border px-2 py-0.5',
            on
              ? 'border-brand-blue/40 bg-brand-blue/10 text-foreground'
              : 'border-brand-gold/50 bg-brand-gold/10 text-foreground'
          )}
        >
          {state}
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{children}</p>
    </li>
  );
}

const formatNext = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export function AutomationPanel({ status }: { status: NewsletterStatus }) {
  const { settings } = status;

  return (
    <Panel marks={false}>
      <PanelBar>
        <span>Automation</span>
        <Link
          href="/newsletter/settings"
          className="normal-case tracking-normal text-muted-foreground hover:text-foreground"
        >
          Configure
        </Link>
      </PanelBar>
      <ul className="divide-y divide-border">
        <Row
          title="New articles"
          state={settings.articleDrafts ? 'Draft' : 'Off'}
          on={settings.articleDrafts}
        >
          {settings.articleDrafts
            ? 'Publishing an article adds a draft here. Nothing goes out until you review and send it.'
            : 'Publishing an article does not create a newsletter draft.'}
        </Row>
        <Row
          title="Weekly digest"
          state={settings.digestEnabled ? 'On' : 'Off'}
          on={settings.digestEnabled}
        >
          {settings.digestEnabled
            ? `${digestScheduleLabel(settings)}: up to ${settings.digestMaxArticles} articles from the past week that no newsletter covered yet. Quiet weeks send nothing.`
            : 'No automatic roundup. Articles only go out when you send them.'}
          {settings.digestEnabled && status.nextDigestAt && (
            <> Next check {formatNext(status.nextDigestAt)} your time.</>
          )}
        </Row>
        <Row
          title="Bounces and spam reports"
          state={status.webhookConfigured ? 'On' : 'Not set up'}
          on={status.webhookConfigured}
        >
          {status.webhookConfigured
            ? 'Addresses that bounce or mark an email as spam are unsubscribed automatically.'
            : 'Add a Resend webhook and set RESEND_WEBHOOK_SECRET so bad addresses stop hurting deliverability.'}
        </Row>
        <Row
          title="Double opt-in"
          state={settings.doubleOptIn ? 'On' : 'Off'}
          on={settings.doubleOptIn}
        >
          {settings.doubleOptIn
            ? 'New addresses must click a confirmation link before they receive anything.'
            : 'New addresses are subscribed right away, without a confirmation link.'}
          {status.pendingSubscribers > 0 &&
            ` ${status.pendingSubscribers.toLocaleString()} waiting to confirm; unconfirmed signups are dropped after ${settings.confirmExpiryDays} day${settings.confirmExpiryDays === 1 ? '' : 's'}.`}
        </Row>
      </ul>
    </Panel>
  );
}
