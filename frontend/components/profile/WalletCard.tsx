import { Wallet, Copy, Check } from 'lucide-react';

interface WalletCardProps {
  address: string;
  balance: string | null;
  copied: boolean;
  onCopyAddress: () => void;
}

export function WalletCard({ address, balance, copied, onCopyAddress }: WalletCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-border/40 dark:shadow-none">
      {/* grid texture */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--border)/0.7) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)/0.7) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          opacity: 0.07,
        }}
      />
      {/* gold corner glow */}
      <div className="pointer-events-none absolute top-0 right-0 h-48 w-48 translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative flex flex-col gap-5">
        {/* header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary/70" />
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground/60 dark:text-muted-foreground/40">
              Cardano Wallet
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/60 dark:border-border/40 dark:bg-background/50 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/60" />
            <span className="font-mono text-[10px] text-emerald-400/80">Mainnet</span>
          </div>
        </div>

        {/* full address */}
        <div>
          <p className="mb-1.5 font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground/50 dark:text-muted-foreground/28">
            Address
          </p>
          <div className="flex items-start gap-3">
            <code className="flex-1 break-all font-mono text-[12px] leading-relaxed text-foreground/60">
              {address}
            </code>
            <button
              onClick={onCopyAddress}
              className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl
                border border-border/60 bg-muted/40 text-muted-foreground/50
                dark:border-border/40 dark:bg-background/50 dark:text-muted-foreground/35
                hover:border-primary/50 hover:text-primary
                transition-all duration-150"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* balance */}
        {balance && (
          <div className="flex items-end justify-between border-t border-border/40 dark:border-border/20 pt-4">
            <div>
              <p className="mb-1 font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground/50 dark:text-muted-foreground/28">
                Balance
              </p>
              <p className="text-2xl font-black tabular-nums text-primary">
                {balance}
                <span className="ml-2 font-mono text-[14px] font-normal text-primary/50">ADA</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
