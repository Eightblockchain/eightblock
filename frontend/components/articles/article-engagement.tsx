'use client';

import { useState, useEffect } from 'react';
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  // Trigger animation when liked
  useEffect(() => {
    if (userLiked) {
      setIsAnimating(true);
      setShowParticles(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setShowParticles(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [userLiked]);

  const handleLikeClick = () => {
    if (!userLiked) {
      setIsAnimating(true);
      setShowParticles(true);
    }
    onLike();
  };

  return (
    <div className="border-t border-b bg-gray-50">
      <style jsx>{`
        @keyframes heartBounce {
          0% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.3);
          }
          50% {
            transform: scale(0.9);
          }
          75% {
            transform: scale(1.15);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes particleFloat {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) scale(0);
          }
        }

        @keyframes countIncrease {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
            color: rgb(239, 68, 68);
          }
          100% {
            transform: translateY(0);
          }
        }

        .heart-bounce {
          animation: heartBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .count-increase {
          animation: countIncrease 0.4s ease-out;
        }

        .particle {
          position: absolute;
          pointer-events: none;
          animation: particleFloat 0.6s ease-out forwards;
        }
      `}</style>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-4 sm:mb-6 flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-600">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className={`font-medium ${isAnimating ? 'count-increase' : ''}`}>
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
            onClick={handleLikeClick}
            disabled={isLiking}
            size="sm"
            className={`relative overflow-visible flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 text-xs sm:text-sm ${
              userLiked
                ? 'bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/30'
                : 'hover:bg-red-50 hover:text-red-600 hover:border-red-300'
            }`}
          >
            {showParticles && (
              <>
                {[...Array(8)].map((_, i) => {
                  const angle = (i * 45 * Math.PI) / 180;
                  const distance = 30;
                  const tx = Math.cos(angle) * distance;
                  const ty = Math.sin(angle) * distance;
                  return (
                    <div
                      key={i}
                      className="particle"
                      style={
                        {
                          '--tx': `${tx}px`,
                          '--ty': `${ty}px`,
                          left: '50%',
                          top: '50%',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                        } as React.CSSProperties
                      }
                    />
                  );
                })}
              </>
            )}
            {isLiking ? (
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Heart
                className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all duration-300 ${
                  userLiked ? 'fill-current' : ''
                } ${isAnimating ? 'heart-bounce' : ''}`}
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
