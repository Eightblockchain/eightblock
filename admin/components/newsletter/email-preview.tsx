'use client';

import { useEffect, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Loader2, Monitor, Smartphone, Type } from 'lucide-react';
import { Panel, PanelBar } from '@eightblock/ui/components/panel';
import { previewCampaign, type CampaignInput } from '@/lib/services/newsletter-service';
import { cn } from '@eightblock/ui/utils';

type View = 'desktop' | 'mobile' | 'text';

const VIEWS: { id: View; label: string; icon: typeof Monitor }[] = [
  { id: 'desktop', label: 'Desktop', icon: Monitor },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
  { id: 'text', label: 'Plain text', icon: Type },
];

export const hasBody = (input: CampaignInput) =>
  input.htmlContent.replace(/<[^>]+>/g, '').trim().length > 0 || input.articleIds.length > 0;

export function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

const FRAME_HEIGHT = 720;

/** Lays the email out at a real client width and scales it down to fit the column. */
function ScaledFrame({ html, width }: { html: string; width: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(width);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = Math.min(1, available / width);
  return (
    <div ref={box} className="w-full">
      <div
        className="mx-auto overflow-hidden"
        style={{ width: width * scale, height: FRAME_HEIGHT }}
      >
        <iframe
          title="Email preview"
          srcDoc={html}
          sandbox=""
          className="origin-top-left border border-border bg-white"
          style={{ width, height: FRAME_HEIGHT / scale, transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}

export interface PreviewPanelProps {
  subject: string;
  preheader?: string | null;
  from?: string;
  rendered?: { html: string; text: string };
  fetching: boolean;
  error?: string | null;
  /** Shown instead of the email while there is nothing to render. */
  placeholder?: string | null;
}

/** Inbox line plus the email at desktop or mobile width, or as plain text. */
export function PreviewPanel({
  subject,
  preheader,
  from,
  rendered,
  fetching,
  error,
  placeholder,
}: PreviewPanelProps) {
  const [view, setView] = useState<View>('desktop');
  const senderName = from?.replace(/\s*<.*>$/, '') || 'Eightblock';

  return (
    <Panel marks={false} className="flex flex-col">
      <PanelBar>
        <span className="flex items-center gap-2">
          Preview
          {fetching && <Loader2 className="h-3 w-3 animate-spin" />}
        </span>
        <div
          role="radiogroup"
          aria-label="Preview as"
          className="flex items-center gap-1 normal-case tracking-normal"
        >
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={view === id}
              title={label}
              onClick={() => setView(id)}
              className={cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                view === id
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="sr-only">{label}</span>
            </button>
          ))}
        </div>
      </PanelBar>

      <div className="border-b border-border px-4 py-3">
        <p className="ledger-label">Inbox</p>
        <div className="mt-2 flex items-baseline gap-2 text-sm">
          <span className="shrink-0 font-semibold text-foreground">{senderName}</span>
          <span className="min-w-0 truncate">
            <span className="font-medium text-foreground">{subject.trim() || 'Subject line'}</span>
            <span className="text-muted-foreground">
              {' '}
              &ndash; {preheader?.trim() || 'Preview text appears here in most inboxes'}
            </span>
          </span>
        </div>
      </div>

      <div className="flex flex-1 justify-center bg-muted/40 p-4">
        {placeholder ? (
          <p className="self-center px-6 py-24 text-center text-sm text-muted-foreground">
            {placeholder}
          </p>
        ) : error && !rendered ? (
          <p className="self-center px-6 py-24 text-center text-sm text-muted-foreground">
            {error}
          </p>
        ) : !rendered ? (
          <Loader2 className="my-24 h-5 w-5 animate-spin self-center text-muted-foreground" />
        ) : view === 'text' ? (
          <pre className="h-[720px] w-full overflow-auto whitespace-pre-wrap border border-border bg-card p-5 font-mono text-xs leading-relaxed text-foreground">
            {rendered.text}
          </pre>
        ) : (
          <ScaledFrame html={rendered.html} width={view === 'mobile' ? 375 : 680} />
        )}
      </div>
    </Panel>
  );
}

/** Renders on the server with the same code that sends, so what you see is what subscribers get. */
export function EmailPreview({ input, from }: { input: CampaignInput; from?: string }) {
  const debounced = useDebounced(input, 500);
  const ready = hasBody(debounced);
  const request = { ...debounced, subject: debounced.subject.trim() || 'Untitled newsletter' };

  const preview = useQuery({
    queryKey: ['newsletter', 'preview', request],
    queryFn: () => previewCampaign(request),
    enabled: ready,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });

  return (
    <PreviewPanel
      subject={input.subject}
      preheader={input.preheader}
      from={from}
      rendered={preview.data}
      fetching={preview.isFetching}
      error={preview.isError ? (preview.error as Error).message : null}
      placeholder={ready ? null : 'Start writing or add an article to see the email.'}
    />
  );
}
