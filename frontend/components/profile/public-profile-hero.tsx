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
      <div className="relative overflow-hidden rounded-[2px] border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-8 md:p-10">
        <Skeleton className="h-12 w-32 mb-6 rounded-[2px]" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-[2px]" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-6 w-1/3 rounded-[2px]" />
            <Skeleton className="h-4 w-1/4 rounded-[2px]" />
            <Skeleton className="h-4 w-2/3 rounded-[2px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[2px] border border-primary-200 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 p-8 md:p-10 text-white shadow-xl">
      <div className="absolute inset-0 opacity-20" aria-hidden>
        <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,_rgba(255,190,13,0.3),_transparent_50%)]" />
      </div>
      <div
        className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"
        aria-hidden
      />
      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <Avatar
            src={profile.avatarUrl}
            name={profile.name}
            size="xl"
            className="ring-4 ring-white/30 shadow-lg"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/90 font-semibold">
              EightBlock Creator
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-2">
              {profile.name || 'Unnamed Creator'}
            </h1>
            <p className="mt-2 text-sm text-white/90 font-mono">
              {formatWallet(profile.walletAddress)}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={onShare} className="gap-2 shadow-md">
            <Share2 className="h-4 w-4" /> Share profile
          </Button>
          <Button
            variant="outline"
            className="border-2 border-white text-white hover:bg-white hover:text-primary"
            onClick={onCopyWallet}
          >
            Copy wallet
          </Button>
        </div>
      </div>
      {profile.bio && (
        <p className="relative z-10 mt-6 max-w-3xl text-base text-white/95 leading-relaxed">
          {profile.bio}
        </p>
      )}
    </section>
  );
}
