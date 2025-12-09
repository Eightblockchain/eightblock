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
    <Link href={`/articles/${post.slug}`} className="group">
      <Card className="overflow-hidden border-none shadow-none transition-transform hover:scale-[1.02]">
        {/* Article Image */}
        <div className="aspect-video w-full overflow-hidden rounded-lg relative">
          {featuredImage ? (
            <Image
              src={featuredImage}
              alt={post.title}
              width={800}
              height={450}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              unoptimized
              onError={(e) => {
                console.error('Image failed to load:', featuredImage);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#080808] via-gray-900 to-black relative">
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <h3 className="text-lg md:text-xl font-bold text-white text-center leading-tight line-clamp-3">
                  {post.title}
                </h3>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {post.category}
          </p>
          <h3 className="text-xl font-bold text-[#080808] group-hover:underline">{post.title}</h3>
          <p className="line-clamp-2 text-sm text-gray-600">{post.description}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Avatar
              src={typeof post.author === 'object' ? post.author?.avatarUrl : null}
              name={typeof post.author === 'object' ? post.author?.name : post.author}
              size="xs"
            />
            <span>
              {typeof post.author === 'object'
                ? post.author?.name || 'Anonymous'
                : post.author || 'Anonymous'}{' '}
              ·{' '}
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}{' '}
              · {readingTime} min read
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
