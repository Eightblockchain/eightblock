import Link from 'next/link';
import { Post } from 'contentlayer/generated';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import Image from 'next/image';
import { Article } from '@/hooks/useInfiniteArticles';

export function ArticleCard({ post }: { post: Post | Article }) {
  // Check if this is an Article from the API (has _count field) vs contentlayer Post
  const isArticle = '_count' in post;
  const readingTime =
    'readingTime' in post
      ? post.readingTime
      : Math.ceil((post.content?.split(' ').length || 0) / 200);

  const featuredImage = isArticle ? (post as Article).featuredImage : null;

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('ArticleCard:', {
      title: post.title,
      isArticle,
      featuredImage,
      hasCount: '_count' in post,
    });
  }

  return (
    <Link href={`/articles/${post.slug}`} className="group block">
      <Card className="overflow-hidden border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
        {/* Article Image */}
        <div className="aspect-video w-full overflow-hidden rounded-[2px] relative flex-shrink-0">
          {featuredImage ? (
            <Image
              src={featuredImage}
              alt={post.title}
              width={800}
              height={450}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              unoptimized
              onError={(e) => {
                console.error('Image failed to load:', featuredImage);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 relative">
              <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-white text-center leading-tight line-clamp-3">
                  {post.title}
                </h3>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 flex-1 flex flex-col">
          <div className="flex items-center gap-2">
            <span className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white bg-primary rounded-full shadow-sm">
              {post.category}
            </span>
          </div>
          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1">
            {post.description}
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2 pt-2 text-[10px] sm:text-xs text-muted-foreground">
            <Avatar
              src={typeof post.author === 'object' ? post.author?.avatarUrl : null}
              name={typeof post.author === 'object' ? post.author?.name : post.author}
              size="xs"
            />
            <span className="truncate">
              {typeof post.author === 'object'
                ? post.author?.name || 'Anonymous'
                : post.author || 'Anonymous'}{' '}
              <span className="hidden xs:inline">
                ·{' '}
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                · {readingTime} min
              </span>
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
