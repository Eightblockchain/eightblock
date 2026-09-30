'use client';

import { Loader2, Pencil, RotateCw, Trash2 } from 'lucide-react';
import { Panel, PanelBar } from '@eightblock/ui/components/panel';
import type { Campaign, CampaignKind, CampaignStatus } from '@/lib/services/newsletter-service';
import { cn } from '@eightblock/ui/utils';

const KIND: Record<CampaignKind, string | null> = {
  MANUAL: null,
  ARTICLE: 'New article',
  DIGEST: 'Weekly digest',
};

const STATUS: Record<CampaignStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'border-border text-muted-foreground' },
  SENDING: { label: 'Sending', className: 'border-brand-blue/40 bg-brand-blue/10 text-foreground' },
  SENT: { label: 'Sent', className: 'border-emerald-600/30 bg-emerald-600/10 text-foreground' },
  FAILED: { label: 'Failed', className: 'border-red-600/30 bg-red-600/10 text-foreground' },
};

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export const canResume = (c: Campaign) =>
  c.status === 'FAILED' || (c.status === 'SENT' && c.failedCount > 0);

interface CampaignListProps {
  campaigns: Campaign[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  editingId: string | null;
  busyId: string | null;
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
  onResume: (campaign: Campaign) => void;
  /** ARTICLE drafts left unsent are picked up by the next digest when it is on. */
  digestEnabled: boolean;
}

export function CampaignList({
  campaigns,
  loading,
  error,
  onRetry,
  editingId,
  busyId,
  onEdit,
  onDelete,
  onResume,
  digestEnabled,
}: CampaignListProps) {
  return (
    <Panel marks={false}>
      <PanelBar>
        <span>Campaigns</span>
        <span className="normal-case tracking-normal text-muted-foreground">
          {loading || error ? '' : `${campaigns.length} total`}
        </span>
      </PanelBar>
      {loading ? (
        <div className="flex justify-center px-4 py-12">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          <p>{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 text-foreground underline underline-offset-4"
            >
              Try again
            </button>
          )}
        </div>
      ) : campaigns.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-muted-foreground">
          No campaigns yet. Drafts and sent newsletters show up here.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {campaigns.map((c) => {
            const status = STATUS[c.status];
            const progress = c.totalCount
              ? Math.min(1, (c.recipientCount + c.failedCount) / c.totalCount)
              : 0;
            const busy = busyId === c.id;
            return (
              <li key={c.id} className={cn('px-4 py-4', editingId === c.id && 'bg-muted/40')}>
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'ledger-label rounded-full border px-2 py-0.5',
                          status.className
                        )}
                      >
                        {c.status === 'SENDING' && (
                          <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                        )}
                        {status.label}
                      </span>
                      {KIND[c.kind] && (
                        <span className="ledger-label rounded-full border border-border px-2 py-0.5 text-foreground">
                          {KIND[c.kind]}
                        </span>
                      )}
                      <p className="min-w-0 truncate font-medium text-foreground">{c.subject}</p>
                    </div>
                    {c.preheader && (
                      <p className="mt-1 truncate text-sm text-muted-foreground">{c.preheader}</p>
                    )}
                    {c.kind === 'ARTICLE' && c.status === 'DRAFT' && (
                      <p className="mt-1.5 text-xs text-brand-blue">
                        Drafted when the article was published.{' '}
                        {digestEnabled
                          ? 'Send it now, or it goes out with the next weekly digest.'
                          : 'Review it and send it when you are ready.'}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {c.status === 'DRAFT' && `Last edited ${when(c.updatedAt)}`}
                      {c.status === 'SENDING' &&
                        `Delivered to ${c.recipientCount.toLocaleString()} of ${c.totalCount.toLocaleString()}`}
                      {(c.status === 'SENT' || c.status === 'FAILED') && (
                        <>
                          {c.sentAt ? `Sent ${when(c.sentAt)} · ` : ''}
                          Delivered to {c.recipientCount.toLocaleString()}
                          {c.totalCount ? ` of ${c.totalCount.toLocaleString()}` : ''}
                          {c.failedCount > 0 && ` · ${c.failedCount.toLocaleString()} failed`}
                        </>
                      )}
                      {c.articleIds.length > 0 &&
                        ` · ${c.articleIds.length} article${c.articleIds.length === 1 ? '' : 's'}`}
                    </p>
                    {c.status === 'SENDING' && (
                      <div className="mt-2.5 h-1 w-full max-w-sm overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-brand-blue transition-[width]"
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    )}
                    {c.lastError && c.status !== 'SENDING' && (
                      <p className="mt-2 text-xs leading-relaxed text-red-700 dark:text-red-400">
                        {c.lastError}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {c.status === 'DRAFT' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit(c)}
                          className="btn-pill-outline h-8 px-3 text-xs"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {editingId === c.id ? 'Editing' : 'Edit'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(c)}
                          disabled={busy}
                          aria-label="Delete draft"
                          title="Delete draft"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    {canResume(c) && (
                      <button
                        type="button"
                        onClick={() => onResume(c)}
                        disabled={busy}
                        className="btn-pill-outline h-8 px-3 text-xs"
                      >
                        {busy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCw className="h-3.5 w-3.5" />
                        )}
                        {c.status === 'FAILED' ? 'Resume sending' : 'Retry failed'}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
