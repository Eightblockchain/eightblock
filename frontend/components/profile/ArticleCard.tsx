'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Heart,
  MessageCircle,
  Calendar,
  Clock,
  TrendingUp,
  ExternalLink,
  Star,
} from 'lucide-react';
import { deleteArticle } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';

interface ArticleCardProps {
  article: any;
  onDelete?: () => void;
}

export function ArticleCard({ article, onDelete }: ArticleCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteArticle(article.id);
      setOpen(false);
      toast({
        title: 'Article deleted',
        description: 'Your article has been successfully deleted.',
      });
      if (onDelete) onDelete();
    } catch (error) {
      console.error('Failed to delete article:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete article. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(date);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
      <div className="flex flex-col md:flex-row gap-4 p-6">
        {/* Featured Image */}
        {article.featuredImage && (
          <div className="relative w-full md:w-48 h-48 md:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {article.featured && (
              <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-900" />
                Featured
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header with Status and Meta */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={article.status === 'PUBLISHED' ? 'default' : 'outline'}
                className={
                  article.status === 'PUBLISHED'
                    ? 'bg-green-500 hover:bg-green-600 text-white font-semibold'
                    : 'border-amber-500 text-amber-600 font-semibold'
                }
              >
                {article.status}
              </Badge>
              {article.category && (
                <Badge variant="secondary" className="text-xs">
                  {article.category}
                </Badge>
              )}
              {article.tags && article.tags.length > 0 && (
                <div className="flex gap-1">
                  {article.tags.slice(0, 2).map((tagWrapper: any) => (
                    <Badge key={tagWrapper.tag.id} variant="outline" className="text-xs">
                      {tagWrapper.tag.name}
                    </Badge>
                  ))}
                  {article.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{article.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              {article.status === 'PUBLISHED' && (
                <Link href={`/articles/${article.slug}`} target="_blank">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-gray-600 hover:text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => router.push(`/articles/${article.slug}/edit`)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <AlertDialogTitle className="text-xl">Delete Article</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-base">
                      Are you sure you want to delete{' '}
                      <span className="font-semibold text-gray-700">
                        &ldquo;{article.title}&rdquo;
                      </span>
                      ?
                      <br />
                      <br />
                      This action cannot be undone. The article and all associated data will be
                      permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Article'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>

          {/* Description */}
          {article.description && (
            <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
              {article.description}
            </p>
          )}

          {/* Stats and Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {/* Views */}
            {article.status === 'PUBLISHED' && (
              <div className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Eye className="h-4 w-4" />
                <span className="font-medium">{formatNumber(article.viewCount || 0)}</span>
                <span className="hidden sm:inline">views</span>
              </div>
            )}

            {/* Unique Views */}
            {article.status === 'PUBLISHED' && article.uniqueViews > 0 && (
              <div className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">{formatNumber(article.uniqueViews)}</span>
                <span className="hidden sm:inline">unique</span>
              </div>
            )}

            {/* Likes */}
            {article._count?.likes > 0 && (
              <div className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                <Heart className="h-4 w-4" />
                <span className="font-medium">{formatNumber(article._count.likes)}</span>
                <span className="hidden sm:inline">likes</span>
              </div>
            )}

            {/* Comments */}
            {article._count?.comments > 0 && (
              <div className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                <MessageCircle className="h-4 w-4" />
                <span className="font-medium">{formatNumber(article._count.comments)}</span>
                <span className="hidden sm:inline">comments</span>
              </div>
            )}

            {/* Divider */}
            <div className="hidden md:block h-4 w-px bg-gray-300" />

            {/* Published/Updated Date */}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>
                {article.status === 'PUBLISHED'
                  ? formatDate(article.publishedAt)
                  : `Draft · ${formatRelativeTime(article.updatedAt)}`}
              </span>
            </div>

            {/* Last Updated (for published) */}
            {article.status === 'PUBLISHED' && article.updatedAt !== article.publishedAt && (
              <div className="flex items-center gap-1.5 text-xs">
                <Clock className="h-3.5 w-3.5" />
                <span>Updated {formatRelativeTime(article.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
