'use client';

import { useParams } from 'next/navigation';
import { PublicProfileHero } from '@/components/profile/public-profile-hero';
import { PublicProfileStats } from '@/components/profile/public-profile-stats';
import { PublicProfileArticles } from '@/components/profile/public-profile-articles';
import { usePublicProfile } from '@/hooks/usePublicProfile';
import { useProfileSharing } from '@/hooks/useProfileSharing';

export default function PublicProfilePage() {
  const params = useParams<{ walletAddress: string }>();
  const walletAddress = decodeURIComponent(params?.walletAddress || '');

  const {
    profile,
    stats,
    articles,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePublicProfile(walletAddress);

  const { shareProfile, copyWalletAddress } = useProfileSharing({
    walletAddress: profile?.walletAddress,
    profileName: profile?.name,
  });

  if (!walletAddress) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-center">
        <div>
          <p className="text-lg text-gray-600">No wallet address provided.</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-center">
        <div className="max-w-md">
          <p className="text-xl font-semibold text-[#080808] mb-2">Profile unavailable</p>
          <p className="text-gray-600">
            {error instanceof Error ? error.message : 'Unable to load this profile right now.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-12">
      <PublicProfileHero
        profile={profile}
        isLoading={isLoading}
        onShare={shareProfile}
        onCopyWallet={copyWalletAddress}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Metrics</p>
            <h2 className="text-2xl font-bold text-[#080808]">Impact snapshot</h2>
          </div>
        </div>
        <PublicProfileStats stats={stats} isLoading={isLoading} />
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Library</p>
          <h2 className="text-2xl font-bold text-[#080808]">
            Published articles ({stats?.articles ?? articles.length})
          </h2>
          <p className="text-gray-600">
            Explore {profile?.name || 'this creator'}'s published work across the EightBlock
            network.
          </p>
        </div>
        <PublicProfileArticles
          articles={articles}
          isLoading={isLoading}
          hasMore={hasNextPage}
          isFetchingMore={isFetchingNextPage}
          onLoadMore={fetchNextPage}
          creatorName={profile?.name}
        />
      </section>
    </div>
  );
}
