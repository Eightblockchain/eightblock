import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle, Clock, TrendingUp } from 'lucide-react';
import { Article } from '@/hooks/useInfiniteArticles';

interface TrendingArticleCardProps {
  article: Article;
  rank?: number;
  showEngagement?: boolean;
}

const rankBadgeClass: Record<number, string> = {
  1: 'bg-primary text-primary-foreground shadow-primary/40',
  2: 'bg-accent text-accent-foreground shadow-accent/30',
  3: 'bg-muted text-foreground',
};

export function TrendingArticleCard({
  article,
  rank,
  showEngagement = true,
}: TrendingArticleCardProps) {
  const readingTime = Math.ceil((article.content?.split(' ').length || 0) / 200);
  const likes = article._count?.likes || 0;
  const comments = article._count?.comments || 0;
  const authorName = article.author?.name || 'Anonymous';
  const badgeClass = rank ? (rankBadgeClass[rank] ?? 'bg-muted text-foreground') : '';

  return (
    <Link href={`/articles/${article.slug}`} className="group block h-full">
      <article className="relative overflow-hidden rounded-xl h-full min-h-[280px] bg-card border border-border/60 transition-all duration-300 hover:border-primary/30 hover:-translate-y-0.5">
        {/* Image */}
        {article.featuredImage ? (
          <Image
            src={article.featuredImage}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            unoptimized
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="absolute inset-0 grid-bg opacity-40" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Rank badge */}
        {rank && (
          <div
            className={`absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-lg ${badgeClass}`}
          >
            <TrendingUp className="h-3 w-3" />#{rank}
          </div>
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-white/60 mb-1.5">
            {article.category}
          </span>
          <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2">
            {article.title}
          </h3>
          <div className="flex items-center justify-between text-xs text-white/60">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white/80 truncate max-w-[90px]">{authorName}</span>
              <span className="text-white/30">·</span>
              <div className="flex items-center gap-1 text-accent">
                <Clock className="h-3 w-3" />
                <span>{readingTime} min</span>
              </div>
            </div>
            {showEngagement && (likes > 0 || comments > 0) && (
              <div className="flex items-center gap-2">
                {likes > 0 && (
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-rose-400" />
                    {likes}
                  </span>
                )}
                {comments > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3 text-accent" />
                    {comments}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
