'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@eightblock/ui/hooks/use-toast';
import { cn } from '@eightblock/ui/utils';
import { Panel, PanelBar } from '@eightblock/ui/components/panel';
import { loadSupportWallets, type SupportWallet } from '@/lib/support-wallets';

function truncateAddress(addr: string): string {
  if (addr.length <= 28) return addr;
  return `${addr.slice(0, 14)}…${addr.slice(-10)}`;
}

export function SupportCreator({
  wallets: initialWallets,
  className,
}: {
  wallets: SupportWallet[];
  className?: string;
}) {
  const { toast } = useToast();
  // The server-rendered list comes from cached pages and can miss a recent admin change,
  // so it is only the first paint: the current list is fetched once the page loads.
  const { data: wallets = initialWallets } = useQuery({
    queryKey: ['support-wallets'],
    queryFn: loadSupportWallets,
    initialData: initialWallets,
    initialDataUpdatedAt: 0,
    retry: 1,
  });
  const [selectedId, setSelectedId] = useState(wallets[0]?.id);
  const [copied, setCopied] = useState(false);

  const wallet = wallets.find((w) => w.id === selectedId) ?? wallets[0];
  if (!wallet) return null;

  const select = (id: string) => {
    setSelectedId(id);
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      toast({
        title: 'Address copied',
        description: `Paste into your ${wallet.network} wallet to send ${wallet.currency}.`,
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
        <span>
          {wallet.network} · {wallet.currency}
        </span>
      </PanelBar>

      {wallets.length > 1 && (
        <div
          role="tablist"
          aria-label="Choose a network"
          className="flex flex-wrap gap-2 border-b border-border px-5 py-3"
        >
          {wallets.map((w) => (
            <button
              key={w.id}
              type="button"
              role="tab"
              aria-selected={w.id === wallet.id}
              onClick={() => select(w.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                w.id === wallet.id
                  ? 'border-brand-blue bg-brand-blue text-white'
                  : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
              )}
            >
              {w.network} · {w.currency}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center">
        <div className="shrink-0 self-start border border-border bg-white p-2.5">
          <QRCodeSVG value={wallet.address} size={104} level="M" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold text-foreground">
            {wallet.label || `Support with ${wallet.currency}`}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            If a post saved you time, a small tip keeps the writing independent.
          </p>

          <div className="mt-4 flex items-center gap-1 rounded-full border border-border bg-background p-1 pl-4">
            <code
              className="min-w-0 flex-1 truncate font-mono text-xs text-foreground/80"
              title={wallet.address}
            >
              {truncateAddress(wallet.address)}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              aria-label={`Copy ${wallet.network} address`}
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

          {wallet.note && (
            <p className="ledger-label mt-3 normal-case tracking-normal">{wallet.note}</p>
          )}
        </div>
      </div>
    </Panel>
  );
}
