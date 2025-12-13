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
import { Edit } from 'lucide-react';
import Link from 'next/link';
import { useProfile } from '@/hooks/useProfile';
import { ArticleCard } from '@/components/profile/ArticleCard';
import { EmptyState } from '@/components/profile/EmptyState';
import { LoadingState } from '@/components/profile/LoadingState';
import { ProfileArticlesSkeleton } from '@/components/profile/profile-skeleton';

export default function MyArticlesPage() {
  const {
    connected,
    connecting,
    isChecking,
    articles,
    loading,
    pagination,
    refreshArticles,
    goToPage,
    nextPage,
    prevPage,
  } = useProfile();

  // Show loading state while checking wallet connection
  if (isChecking || connecting) {
    return <LoadingState />;
  }

  if (!connected) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-[#080808]">My Articles</h1>
            <p className="mt-2 text-gray-600">Manage your published and draft articles</p>
          </div>
          <Link href="/articles/new">
            <Button variant="default">
              <Edit className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </Link>
        </div>
      </div>

      {/* Articles Section */}
      {loading ? (
        <ProfileArticlesSkeleton />
      ) : (
        <>
          <div className="space-y-4">
            {articles.map((article: any) => (
              <ArticleCard key={article.id} article={article} onDelete={refreshArticles} />
            ))}
          </div>

          {articles.length === 0 && <EmptyState />}

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
    </div>
  );
}
