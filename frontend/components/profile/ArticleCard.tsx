'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
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
  TrendingUp,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { deleteArticle } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  description?: string | null;
  slug: string;
  status: 'PUBLISHED' | 'DRAFT';
  category?: string | null;
  featuredImage?: string | null;
  publishedAt: string;
  updatedAt: string;
  viewCount: number;
  uniqueViews: number;
  tags?: Array<{ tag: { id: string; name: string } }>;
  _count?: {
    likes?: number;
    comments?: number;
  };
}

interface ArticleCardProps {
  article: Article;
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
      toast({ title: 'Article deleted', description: 'Your article has been permanently removed.' });
      if (onDelete) onDelete();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete. Please try again.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatRelativeTime = (date: string) => {
    const diffInSeconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(date);
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  const isPublished = article.status === 'PUBLISHED';

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card
      dark:border-border/40 dark:bg-card
      hover:border-border dark:hover:border-border/60
      transition-all duration-200">

      {/* left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl transition-colors duration-200
        ${isPublished
          ? 'bg-emerald-500/60 group-hover:bg-emerald-500'
          : 'bg-amber-500/50 group-hover:bg-amber-500'
        }`}
      />

      <div className="flex gap-4 p-5 pl-6">

        {/* Featured image */}
        {article.featuredImage && (
          <div className="relative hidden sm:block w-28 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
            <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        {/* No image placeholder */}
        {!article.featuredImage && (
          <div className="hidden sm:flex w-28 h-20 flex-shrink-0 rounded-xl items-center justify-center
            bg-muted/50 dark:bg-card/60 border border-border/60 dark:border-border/20">
            <FileText className="h-7 w-7 text-muted-foreground/20" />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* Top row: status + actions */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status pill */}
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold
                ${isPublished
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {isPublished ? 'Published' : 'Draft'}
              </span>

              {/* Category */}
              {article.category && (
                <span className="rounded-full border border-border/60 dark:border-border/30 bg-muted/60 dark:bg-card/40
                  px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide">
                  {article.category}
                </span>
              )}

              {/* Tags */}
              {article.tags?.slice(0, 2).map((tw: any) => (
                <span key={tw.tag.id}
                  className="rounded-full border border-accent/20 dark:border-accent/15 bg-accent/5 dark:bg-accent/8
                    px-2.5 py-0.5 text-[10px] text-accent/70 dark:text-accent/60">
                  {tw.tag.name}
                </span>
              ))}
              {(article.tags?.length ?? 0) > 2 && (
                <span className="text-[10px] text-muted-foreground/35">+{(article.tags?.length ?? 0) - 2}</span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {isPublished && (
                <Link href={`/articles/${article.slug}`}
                  className="flex h-8 w-8 items-center justify-center rounded-xl
                    text-muted-foreground/40 hover:text-foreground/70 hover:bg-muted dark:hover:bg-muted/30
                    transition-all duration-150"
                  title="View article">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              )}
              <button
                onClick={() => router.push(`/articles/${article.slug}/edit`)}
                className="flex h-8 w-8 items-center justify-center rounded-xl
                  text-muted-foreground/40 hover:text-accent hover:bg-accent/10
                  transition-all duration-150"
                title="Edit"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
              <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogTrigger asChild>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-xl
                      text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10
                      disabled:opacity-40 transition-all duration-150"
                    disabled={isDeleting}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl border border-border bg-card dark:border-border/60">
                  <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20">
                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                      </div>
                      <AlertDialogTitle className="text-lg font-black">Delete Article</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-[14px] text-muted-foreground/70 leading-relaxed">
                      Permanently delete{' '}
                      <span className="font-semibold text-foreground/80">&ldquo;{article.title}&rdquo;</span>?{' '}
                      This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}
                      className="rounded-xl border-border dark:border-border/40">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white border-0"
                    >
                      {isDeleting ? 'Deleting…' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-[15px] font-bold text-foreground mb-1 line-clamp-1
            group-hover:text-primary transition-colors duration-150 leading-snug">
            {article.title}
          </h3>

          {/* Excerpt */}
          {article.description && (
            <p className="text-[13px] text-muted-foreground/60 dark:text-muted-foreground/50
              mb-2.5 line-clamp-1 leading-relaxed">
              {article.description}
            </p>
          )}

          {/* Bottom meta row */}
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground/50 dark:text-muted-foreground/40">
            {isPublished && article.viewCount > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {formatNumber(article.viewCount)}
                {article.uniqueViews > 0 && (
                  <span className="text-muted-foreground/30 dark:text-muted-foreground/25">
                    · {formatNumber(article.uniqueViews)} unique
                  </span>
                )}
              </span>
            )}
            {(article._count?.likes ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {formatNumber(article._count!.likes!)}
              </span>
            )}
            {(article._count?.comments ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" />
                {formatNumber(article._count!.comments!)}
              </span>
            )}
            {(isPublished && article.viewCount > 0) || (article._count?.likes ?? 0) > 0 ? (
              <span className="text-border dark:text-border/40">·</span>
            ) : null}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {isPublished
                ? formatDate(article.publishedAt)
                : `Draft · ${formatRelativeTime(article.updatedAt)}`}
            </span>
            {isPublished && article.updatedAt !== article.publishedAt && (
              <span className="flex items-center gap-1 text-muted-foreground/30 dark:text-muted-foreground/25">
                <TrendingUp className="h-3 w-3" />
                Updated {formatRelativeTime(article.updatedAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
