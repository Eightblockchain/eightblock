import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Bookmark, Loader2 } from 'lucide-react';

interface ArticleEngagementProps {
  likesCount: number;
  commentsCount: number;
  userLiked: boolean;
  bookmarked: boolean;
  isLiking: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onBookmark: () => void;
}

export function ArticleEngagement({
  likesCount,
  commentsCount,
  userLiked,
  bookmarked,
  isLiking,
  onLike,
  onComment,
  onShare,
  onBookmark,
}: ArticleEngagementProps) {
  return (
    <div className="border-t border-b bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-4 sm:mb-6 flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-600">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-medium">
              {likesCount} <span className="hidden xs:inline">likes</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-medium">
              {commentsCount} <span className="hidden xs:inline">comments</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
          <Button
            variant={userLiked ? 'default' : 'outline'}
            onClick={onLike}
            disabled={isLiking}
            size="sm"
            className={`flex items-center justify-center gap-1.5 sm:gap-2 transition-all text-xs sm:text-sm ${
              userLiked
                ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                : 'hover:bg-red-50 hover:text-red-600 hover:border-red-300'
            }`}
          >
            {isLiking ? (
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Heart
                className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all ${userLiked ? 'fill-current scale-110' : ''}`}
              />
            )}
            <span className="hidden xs:inline">{userLiked ? 'Liked' : 'Like'}</span>
          </Button>

          <Button
            variant="outline"
            onClick={onComment}
            size="sm"
            className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
          >
            <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Comment</span>
          </Button>

          <Button
            variant="outline"
            onClick={onShare}
            size="sm"
            className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
          >
            <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Share</span>
          </Button>

          <Button
            variant={bookmarked ? 'default' : 'outline'}
            onClick={onBookmark}
            size="sm"
            className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
          >
            <Bookmark className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${bookmarked ? 'fill-current' : ''}`} />
            <span className="hidden xs:inline">{bookmarked ? 'Saved' : 'Save'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
