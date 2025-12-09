import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import Image from 'next/image';
import { Heart, MessageCircle, TrendingUp } from 'lucide-react';
import { Article } from '@/hooks/useInfiniteArticles';

interface TrendingArticleCardProps {
  article: Article;
  rank?: number;
  showEngagement?: boolean;
}

/**
 * Enhanced article card specifically for trending section
 * Shows engagement metrics and trending indicators
 */
export function TrendingArticleCard({
  article,
  rank,
  showEngagement = true,
}: TrendingArticleCardProps) {
  const readingTime = Math.ceil(article.content.split(' ').length / 200);
  const likesCount = article._count?.likes || 0;
  const commentsCount = article._count?.comments || 0;
  const authorName = article.author?.name || 'Anonymous';
  const authorAvatar = article.author?.avatarUrl || null;

  return (
    <Link href={`/articles/${article.slug}`} className="group">
      <Card className="relative overflow-hidden border-none shadow-none transition-all hover:shadow-lg hover:scale-[1.02] rounded-[2px]">
        {/* Trending Badge */}
        {rank && rank <= 3 && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-[#080808] px-3 py-1 text-xs font-bold text-white shadow-lg">
            <TrendingUp className="h-3 w-3" />#{rank}
          </div>
        )}

        {/* Article Image */}
        <div className="aspect-video w-full overflow-hidden rounded-[2px] relative">
          {article.featuredImage ? (
            <Image
              src={article.featuredImage}
              alt={article.title}
              width={800}
              height={450}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              unoptimized
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#080808] via-gray-900 to-black relative">
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <h3 className="text-lg md:text-xl font-bold text-white text-center leading-tight line-clamp-3">
                  {article.title}
                </h3>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {article.category}
          </p>
          <h3 className="text-xl font-bold text-[#080808] group-hover:underline line-clamp-2">
            {article.title}
          </h3>
          <p className="line-clamp-2 text-sm text-gray-600">{article.description}</p>

          {/* Author and Engagement */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Avatar src={authorAvatar} name={authorName} size="xs" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-700">{authorName}</span>
                <span className="text-xs text-gray-500">{readingTime} min read</span>
              </div>
            </div>

            {showEngagement && (likesCount > 0 || commentsCount > 0) && (
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {likesCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5 fill-red-100 text-red-500" />
                    <span className="font-medium">{likesCount}</span>
                  </div>
                )}
                {commentsCount > 0 && (
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5 fill-blue-100 text-blue-500" />
                    <span className="font-medium">{commentsCount}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
