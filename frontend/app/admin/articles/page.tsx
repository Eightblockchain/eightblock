'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/wallet-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, Eye, Calendar, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  fetchUserArticles,
  deleteArticle as deleteArticleService,
} from '@/lib/services/user-service';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  createdAt: string;
  updatedAt: string;
  _count: {
    likes: number;
    comments: number;
  };
}

export default function ArticlesPage() {
  const router = useRouter();
  const { connected, address } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');

  // Redirect if not connected
  useEffect(() => {
    if (!connected) {
      router.push('/');
    }
  }, [connected, router]);

  // Fetch user articles using React Query
  const {
    data: articlesData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['user-articles', address],
    queryFn: () => fetchUserArticles(address!, 1, 100),
    enabled: connected && !!address,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Delete article mutation
  const deleteMutation = useMutation({
    mutationFn: deleteArticleService,
    onSuccess: () => {
      toast({
        title: 'Article deleted',
        description: 'The article has been removed',
      });
      // Invalidate and refetch articles
      queryClient.invalidateQueries({ queryKey: ['user-articles', address] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete article',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteArticle = (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }
    deleteMutation.mutate(id);
  };

  const articles = articlesData?.articles || [];

  const filteredArticles = useMemo(() => {
    if (filter === 'ALL') return articles;
    return articles.filter((article) => article.status === filter);
  }, [articles, filter]);

  if (!connected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">My Articles</h1>
              <p className="text-gray-600 mt-2">Manage your published and draft articles</p>
            </div>
            <Link href="/admin/articles/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Article
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(status)}
              >
                {status}
                {status === 'ALL' && ` (${articles.length})`}
                {status === 'PUBLISHED' &&
                  ` (${articles.filter((a) => a.status === 'PUBLISHED').length})`}
                {status === 'DRAFT' && ` (${articles.filter((a) => a.status === 'DRAFT').length})`}
              </Button>
            ))}
          </div>
        </div>

        {/* Articles List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : isError ? (
          <Card className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load articles</h3>
            <p className="text-gray-600 mb-4">{(error as Error)?.message || 'An error occurred'}</p>
            <Button
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ['user-articles', address] })
              }
            >
              Try Again
            </Button>
          </Card>
        ) : filteredArticles.length === 0 ? (
          <Card className="p-12 text-center">
            <PlusCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles yet</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'ALL'
                ? 'Start creating your first article'
                : `No ${filter.toLowerCase()} articles found`}
            </p>
            {filter === 'ALL' && (
              <Link href="/admin/articles/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Article
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <Card key={article.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-gray-900">{article.title}</h2>
                      <Badge variant={article.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                        {article.status}
                      </Badge>
                    </div>
                    {article.excerpt && (
                      <p className="text-gray-600 mb-3 line-clamp-2">{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(article.createdAt).toLocaleDateString()}
                      </span>
                      <span>{article._count.likes} likes</span>
                      <span>{article._count.comments} comments</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/articles/${article.slug}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/articles/${article.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteArticle(article.id, article.title)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
