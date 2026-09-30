'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Loader2, Check } from 'lucide-react';
import { cn } from '@eightblock/ui/utils';

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

function ActionButton({
  onClick,
  disabled,
  active,
  label,
  icon,
  count,
}: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  label: string;
  icon: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        active
          ? 'border-brand-blue bg-brand-blue text-white'
          : 'border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground'
      )}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="font-mono text-xs tabular-nums opacity-80">{count}</span>
      )}
    </button>
  );
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
  const [shared, setShared] = useState(false);

  const handleShare = () => {
    onShare();
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <div className="container-read">
      <div className="flex flex-col gap-4 border-y border-border py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="ledger-label">Found this useful?</p>
        <div className="flex flex-wrap items-center gap-2">
          <ActionButton
            onClick={onLike}
            disabled={isLiking}
            active={userLiked}
            label={userLiked ? 'Clapped' : 'Clap'}
            count={likesCount}
            icon={
              isLiking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={cn('h-4 w-4', userLiked && 'fill-current')} />
              )
            }
          />
          <ActionButton
            onClick={onComment}
            label="Comment"
            count={commentsCount}
            icon={<MessageCircle className="h-4 w-4" />}
          />
          <ActionButton
            onClick={handleShare}
            active={shared}
            label={shared ? 'Copied' : 'Share'}
            icon={shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          />
          <ActionButton
            onClick={onBookmark}
            active={bookmarked}
            label={bookmarked ? 'Saved' : 'Save'}
            icon={<Bookmark className={cn('h-4 w-4', bookmarked && 'fill-current')} />}
          />
        </div>
      </div>
    </div>
  );
}
