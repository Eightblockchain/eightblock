'use client';

import { Share2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';

interface PublicProfileHeroProps {
  profile?: {
    name: string | null;
    walletAddress: string;
    avatarUrl: string | null;
    bio: string | null;
  };
  isLoading: boolean;
  onShare: () => void;
  onCopyWallet: () => void;
}

function formatWallet(address?: string | null) {
  if (!address) return '';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

export function PublicProfileHero({
  profile,
  isLoading,
  onShare,
  onCopyWallet,
}: PublicProfileHeroProps) {
  if (!profile || isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-card p-8 md:p-10">
        <div className="h-8 w-24 rounded-xl bg-card/60 animate-pulse mb-6" />
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-2xl bg-card/60 animate-pulse flex-shrink-0" />
          <div className="space-y-3 flex-1">
            <div className="h-6 w-1/3 rounded-xl bg-card/60 animate-pulse" />
            <div className="h-4 w-1/4 rounded-xl bg-card/60 animate-pulse" />
            <div className="h-4 w-2/3 rounded-xl bg-card/60 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/30 bg-card shadow-xl shadow-black/20">
      {/* bg glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_0%_0%,hsl(var(--primary)/0.08),transparent)]" />
      {/* ghost watermark */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 flex items-center overflow-hidden select-none">
        <span className="font-black leading-none text-foreground/[0.03] translate-x-1/4"
          style={{ fontSize: 'clamp(80px, 15vw, 220px)' }}>
          {(profile.name || profile.walletAddress || '').slice(0, 2).toUpperCase()}
        </span>
      </div>

      <div className="relative z-10 p-8 md:p-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-px w-5 bg-primary/50" />
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary/60">
            EightBlock Creator
          </span>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-5">
            <Avatar
              src={profile.avatarUrl}
              name={profile.name}
              size="xl"
              className="ring-2 ring-border/40 rounded-2xl shadow-xl flex-shrink-0"
            />
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground leading-none mb-2">
                {profile.name || 'Unnamed Creator'}
              </h1>
              <p className="font-mono text-[12px] text-muted-foreground/35">
                {formatWallet(profile.walletAddress)}
              </p>
              {profile.bio && (
                <p className="mt-3 text-[14px] text-foreground/55 leading-relaxed max-w-lg line-clamp-2">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={onShare}
              className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/40
                px-3.5 py-2 text-[13px] font-semibold text-foreground/70
                hover:border-border hover:text-foreground hover:bg-card
                transition-all duration-150"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
            <button
              onClick={onCopyWallet}
              className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/40
                px-3.5 py-2 text-[13px] font-semibold text-foreground/70
                hover:border-border hover:text-foreground hover:bg-card
                transition-all duration-150"
            >
              Copy wallet
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
