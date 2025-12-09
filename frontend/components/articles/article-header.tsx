import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { ArrowLeft, Calendar, Clock, Eye, Edit2, Check } from 'lucide-react';
import Image from 'next/image';

interface ArticleHeaderProps {
  article: {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    featured: boolean;
    featuredImage?: string;
    publishedAt: string;
    viewCount: number;
    author: {
      id: string;
      name: string | null;
      avatarUrl?: string | null;
    };
    tags: Array<{
      tag: {
        id: string;
        name: string;
      };
    }>;
  };
  readingTime: number;
  isOwner: boolean;
  onBack: () => void;
  onEdit?: () => void;
  onPublish?: () => void;
}

export function ArticleHeader({
  article,
  readingTime,
  isOwner,
  onBack,
  onEdit,
  onPublish,
}: ArticleHeaderProps) {
  const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="border-b bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={onBack} className="-ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {article.status === 'DRAFT' && isOwner && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={onPublish}
              >
                <Check className="mr-2 h-4 w-4" />
                Publish Now
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{article.category}</Badge>
            {article.status === 'DRAFT' && (
              <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Draft</Badge>
            )}
            {article.featured && (
              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Featured</Badge>
            )}
          </div>

          <h1 className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
            {article.title}
          </h1>

          <p className="text-xl text-gray-600">{article.description}</p>

          {article.featuredImage ? (
            <div className="relative w-full rounded-[2px] overflow-hidden">
              <Image
                src={article.featuredImage}
                alt={article.title}
                width={1200}
                height={630}
                className="w-full h-auto object-cover"
                priority
                unoptimized
              />
            </div>
          ) : (
            <div className="relative w-full aspect-[1200/630] rounded-[2px] overflow-hidden bg-gradient-to-br from-[#080808] via-gray-900 to-black">
              <div className="absolute inset-0 flex items-center justify-center p-12">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center leading-tight">
                  {article.title}
                </h2>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Avatar src={article.author.avatarUrl} name={article.author.name} size="sm" />
              <span>{article.author.name || 'Anonymous'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <time dateTime={article.publishedAt}>{publishedDate}</time>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{readingTime} min read</span>
            </div>
            {article.viewCount > 0 && (
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                <span>{article.viewCount.toLocaleString()} views</span>
              </div>
            )}
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.tags.map((t) => (
                <Badge key={t.tag.id} variant="outline">
                  {t.tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
