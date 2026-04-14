import Link from 'next/link';
import { PenLine, Sparkles } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card dark:border-border/30 px-6 py-16 text-center">
      {/* subtle radial */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,hsl(var(--primary)/0.06),transparent)]" />

      <div className="relative">
        {/* icon */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center
          rounded-2xl border border-border bg-muted dark:border-border/30 dark:bg-card/60">
          <PenLine className="h-7 w-7 text-muted-foreground/40" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="h-px w-8 bg-border dark:bg-border/40" />
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground/40">
            No articles yet
          </span>
          <div className="h-px w-8 bg-border dark:bg-border/40" />
        </div>

        <h3 className="text-xl font-black text-foreground mb-2">
          Start writing your story
        </h3>
        <p className="text-[14px] text-muted-foreground/55 dark:text-muted-foreground/50
          leading-relaxed max-w-xs mx-auto mb-7">
          Share your knowledge with the Cardano community. Your first article is one click away.
        </p>

        <Link
          href="/articles/new"
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl
            bg-primary px-5 py-2.5 text-[13px] font-bold text-primary-foreground
            shadow-md shadow-primary/20 hover:brightness-105 active:scale-[0.97]
            transition-all duration-150"
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-full
            bg-gradient-to-r from-transparent via-white/20 to-transparent
            group-hover:translate-x-full transition-transform duration-500" />
          <Sparkles className="h-3.5 w-3.5" />
          Write your first article
        </Link>
      </div>
    </div>
  );
}

