'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MessageCircle, Loader2, Send, Edit2, Trash2, X, Check, AlertTriangle } from 'lucide-react';
import type { Comment } from '@/lib/article-api';

interface CommentsSectionProps {
  comments: Comment[];
  totalComments: number;
  hasMoreComments: boolean;
  isLoadingMoreComments: boolean;
  isAuthenticated: boolean;
  currentUserId: string | null;
  isPostingComment: boolean;
  isUpdatingComment: boolean;
  deletingCommentId: string | null;
  onPostComment: (content: string) => void;
  onUpdateComment: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
  onLoadMoreComments: () => void;
}

export function CommentsSection({
  comments,
  totalComments,
  hasMoreComments,
  isLoadingMoreComments,
  isAuthenticated,
  currentUserId,
  isPostingComment,
  isUpdatingComment,
  deletingCommentId,
  onPostComment,
  onUpdateComment,
  onDeleteComment,
  onLoadMoreComments,
}: CommentsSectionProps) {
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onPostComment(commentText.trim());
    setCommentText('');
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.body);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleUpdateComment = (commentId: string) => {
    if (!editingCommentText.trim()) return;
    onUpdateComment(commentId, editingCommentText.trim());
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleDeleteComment = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteComment = () => {
    if (commentToDelete) {
      onDeleteComment(commentToDelete);
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
    }
  };

  return (
    <div id="comments" className="bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-14">

        {/* ── Section header ── */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-px w-6 bg-primary/60" />
            <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-primary/70">
              Community
            </span>
          </div>
          <div className="flex items-end gap-4">
            <h3 className="text-3xl font-black tracking-tight text-foreground leading-none">
              Discussion
            </h3>
            {totalComments > 0 && (
              <span className="mb-0.5 font-mono text-[13px] text-muted-foreground/35 tabular-nums">
                {totalComments}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-8">

          {/* ── Comment input / auth prompt ── */}
          {!isAuthenticated ? (
            <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-card/20 p-8 text-center">
              {/* subtle radial glow */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(var(--primary)/0.06),transparent)]" />
              <MessageCircle className="mx-auto mb-4 h-10 w-10 text-muted-foreground/25" />
              <p className="mb-1.5 font-semibold text-foreground/80 text-[15px]">
                Join the conversation
              </p>
              <p className="mb-6 text-[13px] text-muted-foreground/45 max-w-sm mx-auto leading-relaxed">
                Connect your wallet to share your thoughts and engage with the community
              </p>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 text-[13px]"
                onClick={() => window.dispatchEvent(new CustomEvent('open-wallet-picker'))}
              >
                Connect Wallet
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleCommentSubmit}
              className="rounded-2xl border border-border bg-card p-5 transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15"
            >
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts…"
                className="w-full resize-none bg-transparent border-0 p-0 text-[15px] text-foreground
                  placeholder:text-muted-foreground/50 focus:outline-none leading-relaxed"
                rows={3}
                disabled={isPostingComment}
              />
              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
                <span className="font-mono text-[11px] text-muted-foreground/25 tabular-nums select-none">
                  {commentText.length} chars
                </span>
                <div className="flex gap-2">
                  {commentText.trim() && (
                    <button
                      type="button"
                      onClick={() => setCommentText('')}
                      disabled={isPostingComment}
                      className="text-[12px] font-medium text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!commentText.trim() || isPostingComment}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 text-[13px] font-semibold px-4"
                  >
                    {isPostingComment ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Posting…
                      </>
                    ) : (
                      <>
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* ── Comments list ── */}
          {totalComments === 0 ? (
            <div className="py-16 text-center">
              <MessageCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/15" />
              <p className="text-[14px] font-medium text-muted-foreground/40 mb-1">No comments yet</p>
              <p className="text-[13px] text-muted-foreground/25">
                {isAuthenticated
                  ? 'Be the first to share your thoughts!'
                  : 'Connect your wallet to be the first to comment!'}
              </p>
            </div>
          ) : (
            <div>
              {comments.map((comment, index) => {
                const isOwner = currentUserId === comment.author.id;
                const isEditing = editingCommentId === comment.id;

                return (
                  <div
                    key={comment.id}
                    className={`group py-6 ${
                      index < comments.length - 1
                        ? 'border-b border-border/15'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar
                        src={comment.author.avatarUrl}
                        name={comment.author.name}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        {/* Meta row */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-semibold text-foreground truncate text-[14px]">
                              {comment.author.name || 'Anonymous'}
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground/30 flex-shrink-0 tabular-nums">
                              {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          {isOwner && !isEditing && (
                            <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                              <button
                                onClick={() => handleEditComment(comment)}
                                className="h-7 w-7 flex items-center justify-center rounded-lg
                                  text-muted-foreground/35 hover:text-accent hover:bg-accent/10
                                  transition-all duration-150"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={deletingCommentId === comment.id}
                                className="h-7 w-7 flex items-center justify-center rounded-lg
                                  text-muted-foreground/35 hover:text-rose-400/80 hover:bg-rose-400/8
                                  transition-all duration-150 disabled:opacity-40"
                              >
                                {deletingCommentId === comment.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Body / edit form */}
                        {isEditing ? (
                          <div className="space-y-3">
                            <textarea
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              className="w-full resize-none rounded-xl border border-border/35 bg-card/25
                                p-3 text-[14px] text-foreground/80 leading-relaxed
                                focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15
                                transition-colors"
                              rows={3}
                              disabled={isUpdatingComment}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateComment(comment.id)}
                                disabled={!editingCommentText.trim() || isUpdatingComment}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 text-[13px] font-semibold px-4"
                              >
                                {isUpdatingComment ? (
                                  <>
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    Saving…
                                  </>
                                ) : (
                                  <>
                                    <Check className="mr-1.5 h-3.5 w-3.5" />
                                    Save
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                disabled={isUpdatingComment}
                                className="text-[13px] text-muted-foreground/50 hover:text-foreground/70 hover:bg-card/40"
                              >
                                <X className="mr-1.5 h-3.5 w-3.5" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-foreground/70 leading-[1.75] whitespace-pre-wrap break-words text-[15px]">
                            {comment.body}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Load more */}
              {hasMoreComments && (
                <div className="pt-8 text-center border-t border-border/15 mt-2">
                  <button
                    onClick={onLoadMoreComments}
                    disabled={isLoadingMoreComments}
                    className="inline-flex items-center gap-2 font-mono text-[12px] tracking-wide
                      text-muted-foreground/35 hover:text-muted-foreground/70
                      transition-colors duration-150 disabled:opacity-40"
                  >
                    {isLoadingMoreComments ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading…
                      </>
                    ) : (
                      <>
                        <span>Load more comments</span>
                        <span className="opacity-40">↓</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Delete confirmation dialog ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border/40 text-foreground">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-400/10 border border-rose-400/20">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-400" />
              </div>
              <AlertDialogTitle className="text-[18px] font-black">Delete Comment</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-[14px] text-muted-foreground/55 leading-relaxed">
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deletingCommentId !== null}
              className="border-border/40 text-muted-foreground/60 hover:text-foreground/80 hover:bg-card/60"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteComment}
              disabled={deletingCommentId !== null}
              className="bg-rose-500/90 hover:bg-rose-500 text-white border-0 font-semibold"
            >
              {deletingCommentId !== null ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
