'use client';

import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { LogOut, Edit } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { WalletCard } from '@/components/profile/WalletCard';
import { StatsCard } from '@/components/profile/StatsCard';
import { ArticleCard } from '@/components/profile/ArticleCard';
import { EmptyState } from '@/components/profile/EmptyState';
import { LoadingState } from '@/components/profile/LoadingState';

export default function ProfilePage() {
  const {
    connected,
    connecting,
    address,
    balance,
    copied,
    isChecking,
    articles,
    loading,
    stats,
    pagination,
    copyAddress,
    handleDisconnect,
    refreshArticles,
    goToPage,
    nextPage,
    prevPage,
  } = useProfile();

  // Show loading state while checking wallet connection
  if (isChecking || connecting) {
    return <LoadingState />;
  }

  if (!connected || !address) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header with Wallet Info */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-[#080808]">My Profile</h1>
            <p className="mt-2 text-gray-600">Manage your wallet and articles</p>
          </div>
          <Button
            onClick={handleDisconnect}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        </div>

        <WalletCard
          address={address}
          balance={balance}
          copied={copied}
          onCopyAddress={copyAddress}
        />
      </div>

      {/* Stats Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#080808] mb-4">Your Stats</h2>
        {loading ? (
          <p className="text-gray-600">Loading stats...</p>
        ) : (
          <StatsCard articles={articles} stats={stats} />
        )}
      </div>

      {/* Articles Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#080808]">My Articles</h2>
          <Button className="bg-[#080808] text-white hover:bg-gray-800">
            <Edit className="h-4 w-4 mr-2" />
            New Article
          </Button>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading articles...</p>
        ) : (
          <>
            <div className="space-y-4">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} onDelete={refreshArticles} />
              ))}
            </div>

            {/* Classic Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => pagination.hasPrev && prevPage()}
                        className={!pagination.hasPrev ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>

                    {/* Page Numbers */}
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage =
                        page === 1 ||
                        page === pagination.totalPages ||
                        Math.abs(page - pagination.currentPage) <= 1;

                      if (!showPage) {
                        // Show ellipsis for gaps
                        if (
                          page === pagination.currentPage - 2 ||
                          page === pagination.currentPage + 2
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      }

                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => goToPage(page)}
                            isActive={page === pagination.currentPage}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => pagination.hasNext && nextPage()}
                        className={!pagination.hasNext ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}

        {!loading && articles.length === 0 && <EmptyState />}
      </div>
    </div>
  );
}
