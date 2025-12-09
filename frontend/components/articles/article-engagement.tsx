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
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            <span>{likesCount} likes</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <span>{commentsCount} comments</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant={userLiked ? 'default' : 'outline'}
            onClick={onLike}
            disabled={isLiking}
            className={`flex items-center gap-2 transition-all ${
              userLiked
                ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                : 'hover:bg-red-50 hover:text-red-600 hover:border-red-300'
            }`}
          >
            {isLiking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart
                className={`h-4 w-4 transition-all ${userLiked ? 'fill-current scale-110' : ''}`}
              />
            )}
            {userLiked ? 'Liked' : 'Like'}
          </Button>

          <Button variant="outline" onClick={onComment} className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Comment
          </Button>

          <Button variant="outline" onClick={onShare} className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>

          <Button
            variant={bookmarked ? 'default' : 'outline'}
            onClick={onBookmark}
            className="flex items-center gap-2"
          >
            <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
            {bookmarked ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
