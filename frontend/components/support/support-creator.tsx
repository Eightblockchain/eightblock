'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@eightblock/ui/hooks/use-toast';
import { siteConfig } from '@/lib/site-config';
import { cn } from '@eightblock/ui/utils';
import { Panel, PanelBar } from '@eightblock/ui/components/panel';

function truncateAddress(addr: string): string {
  if (addr.length <= 28) return addr;
  return `${addr.slice(0, 14)}…${addr.slice(-10)}`;
}

export function SupportCreator({ className }: { className?: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const { walletAddress, label, note } = siteConfig.support;

  if (!walletAddress) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast({
        title: 'Address copied',
        description: 'Paste into your Cardano wallet to send ADA.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  return (
    <Panel className={className}>
      <PanelBar>
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-brand-gold" aria-hidden="true" />
          Support this work
        </span>
        <span>Cardano · ADA</span>
      </PanelBar>

      <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center">
        <div className="shrink-0 self-start border border-border bg-white p-2.5">
          <QRCodeSVG value={walletAddress} size={104} level="M" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold text-foreground">{label}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            If a post saved you time, a small tip keeps the writing independent.
          </p>

          <div className="mt-4 flex items-center gap-1 rounded-full border border-border bg-background p-1 pl-4">
            <code
              className="min-w-0 flex-1 truncate font-mono text-xs text-foreground/80"
              title={walletAddress}
            >
              {truncateAddress(walletAddress)}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors',
                copied
                  ? 'bg-brand-blue text-white'
                  : 'bg-muted text-foreground hover:bg-foreground hover:text-background'
              )}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {note && <p className="ledger-label mt-3 normal-case tracking-normal">{note}</p>}
        </div>
      </div>
    </Panel>
  );
}
