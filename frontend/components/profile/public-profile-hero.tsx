'use client';

import { Share2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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
      <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8">
        <Skeleton className="h-12 w-32 mb-6" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-2xl" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-[#080808] via-[#111] to-[#1f1f1f] p-8 text-white">
      <div className="absolute inset-0 opacity-30" aria-hidden>
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_55%)]" />
      </div>
      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <Avatar
            src={profile.avatarUrl}
            name={profile.name}
            size="xl"
            className="ring-4 ring-white/20"
          />
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">EightBlock Creator</p>
            <h1 className="text-4xl font-bold text-white mt-2">
              {profile.name || 'Unnamed Creator'}
            </h1>
            <p className="mt-2 text-white/80">{formatWallet(profile.walletAddress)}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={onShare} className="gap-2">
            <Share2 className="h-4 w-4" /> Share profile
          </Button>
          <Button
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
            onClick={onCopyWallet}
          >
            Copy wallet
          </Button>
        </div>
      </div>
      {profile.bio && (
        <p className="relative z-10 mt-6 max-w-3xl text-base text-white/80 leading-relaxed">
          {profile.bio}
        </p>
      )}
    </section>
  );
}
