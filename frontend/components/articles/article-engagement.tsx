'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, Loader2, Check } from 'lucide-react';

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

// Single action pill
function ActionPill({
  onClick,
  disabled = false,
  active = false,
  activeClass = '',
  label,
  icon,
  count,
}: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  activeClass?: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-semibold
        transition-all duration-200 select-none outline-none
        focus-visible:ring-2 focus-visible:ring-primary/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${active
          ? activeClass
          : 'bg-card/30 border-border/35 text-muted-foreground/60 hover:border-border/70 hover:text-foreground/80 hover:bg-card/60'
        }`}
    >
      <span className="relative flex-shrink-0">{icon}</span>
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={`font-mono text-[11px] tabular-nums ml-0.5 ${
            active ? 'opacity-80' : 'text-muted-foreground/40'
          }`}
        >
          {count}
        </span>
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
    <div className="border-t border-b border-border/20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-5">
        <div className="flex flex-wrap items-center gap-2">

          {/* ── Like ── */}
          <motion.div whileTap={{ scale: 0.93 }}>
            <ActionPill
              onClick={onLike}
              disabled={isLiking}
              active={userLiked}
              activeClass="bg-primary/10 border-primary/40 text-primary"
              label={userLiked ? 'Liked' : 'Like'}
              count={likesCount}
              icon={
                isLiking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <motion.div
                    animate={userLiked ? { scale: [1, 1.35, 0.88, 1.1, 1] } : {}}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                  >
                    <Heart
                      className={`h-4 w-4 transition-colors duration-200 ${
                        userLiked ? 'fill-primary stroke-primary' : ''
                      }`}
                    />
                  </motion.div>
                )
              }
            />
          </motion.div>

          {/* ── Comment ── */}
          <motion.div whileTap={{ scale: 0.93 }}>
            <ActionPill
              onClick={onComment}
              label="Comment"
              count={commentsCount}
              icon={<MessageCircle className="h-4 w-4" />}
            />
          </motion.div>

          {/* ── Share ── */}
          <motion.div whileTap={{ scale: 0.93 }}>
            <ActionPill
              onClick={handleShare}
              active={shared}
              activeClass="bg-accent/10 border-accent/35 text-accent"
              label={shared ? 'Copied!' : 'Share'}
              icon={
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={shared ? 'check' : 'share'}
                    initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.18 }}
                  >
                    {shared ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Share2 className="h-4 w-4" />
                    )}
                  </motion.div>
                </AnimatePresence>
              }
            />
          </motion.div>

          {/* ── Save ── */}
          <motion.div whileTap={{ scale: 0.93 }}>
            <ActionPill
              onClick={onBookmark}
              active={bookmarked}
              activeClass="bg-accent/10 border-accent/35 text-accent"
              label={bookmarked ? 'Saved' : 'Save'}
              icon={
                <Bookmark
                  className={`h-4 w-4 transition-all duration-200 ${
                    bookmarked ? 'fill-accent stroke-accent' : ''
                  }`}
                />
              }
            />
          </motion.div>

          {/* ── Divider + stats summary (right side) ── */}
          <div className="hidden sm:flex items-center gap-3 ml-auto text-[12px] text-muted-foreground/25 font-mono">
            <span className="tabular-nums">
              {likesCount} like{likesCount !== 1 ? 's' : ''}
            </span>
            <span className="opacity-40">·</span>
            <span className="tabular-nums">
              {commentsCount} comment{commentsCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}



