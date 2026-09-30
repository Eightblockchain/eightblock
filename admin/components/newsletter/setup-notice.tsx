import { AlertTriangle } from 'lucide-react';
import { Panel } from '@eightblock/ui/components/panel';

/** Shown to staff while the API has no email provider key, so nothing can be delivered. */
export function SetupNotice({ from }: { from: string }) {
  const domain = /@([^>\s]+)/.exec(from)?.[1] ?? 'your domain';
  return (
    <Panel marks={false} className="border-amber-500/40 p-5">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 text-sm">
          <p className="font-medium text-foreground">Emails are not being sent yet</p>
          <p className="mt-1 leading-relaxed text-muted-foreground">
            You can write drafts and preview them, but welcome emails and newsletters stay
            undelivered until an email provider is connected. It takes about ten minutes:
          </p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 leading-relaxed text-muted-foreground">
            <li>
              Create a free account at{' '}
              <a
                href="https://resend.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline"
              >
                resend.com
              </a>
              .
            </li>
            <li>
              Under <span className="text-foreground">Domains</span>, add{' '}
              <span className="font-mono text-foreground">{domain}</span> and create the DNS records
              it shows (SPF, DKIM and MX) at your domain registrar. Wait until it says Verified.
            </li>
            <li>
              Under <span className="text-foreground">API Keys</span>, create a key with sending
              access.
            </li>
            <li>
              In the API server&apos;s <span className="font-mono text-foreground">.env</span>, set{' '}
              <span className="font-mono text-foreground">EMAIL_PROVIDER_API_KEY</span> to that key
              and <span className="font-mono text-foreground">EMAIL_FROM</span> to an address on the
              verified domain, then restart the API.
            </li>
          </ol>
        </div>
      </div>
    </Panel>
  );
}
