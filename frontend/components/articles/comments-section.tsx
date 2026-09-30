'use client';

import { useState } from 'react';
import { Button } from '@eightblock/ui/components/button';
import { Avatar } from '@eightblock/ui/components/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@eightblock/ui/components/alert-dialog';
import { MessageCircle, Loader2, Send, Edit2, Trash2, X, Check, AlertTriangle } from 'lucide-react';
import type { Comment } from '@/lib/article-api';
import { GoogleButton } from '@/components/auth/google-button';

interface CommentsSectionProps {
  comments: Comment[];
  totalComments: number;
  hasMoreComments: boolean;
  isLoadingMoreComments: boolean;
  isAuthenticated: boolean;
  currentUserId: string | null;
  canModerate?: boolean;
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
  canModerate = false,
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
    <div id="comments" className="scroll-mt-20 bg-background">
      <div className="container-read py-14">
        <div className="mb-8 flex items-center gap-4">
          <p className="ledger-label shrink-0">
            Replies
            {totalComments > 0 && <span className="ml-2 text-foreground">{totalComments}</span>}
          </p>
          <span className="h-px flex-1 bg-border" aria-hidden="true" />
        </div>
        <h3 className="-mt-2 mb-8 font-display text-2xl font-semibold tracking-tight text-foreground">
          Discussion
        </h3>

        <div className="space-y-8">
          {!isAuthenticated ? (
            <div className="flex flex-col items-start gap-4 border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">Join the discussion</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Sign in with Google to reply. You will come straight back to this article.
                </p>
              </div>
              <GoogleButton label="Sign in with Google" className="shrink-0" />
            </div>
          ) : (
            <form
              onSubmit={handleCommentSubmit}
              className="border border-border bg-card p-5 transition-colors focus-within:border-brand-blue"
            >
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts…"
                aria-label="Write a comment"
                maxLength={5000}
                className="w-full resize-none bg-transparent border-0 p-0 text-[15px] text-foreground
                  placeholder:text-muted-foreground focus:outline-none leading-relaxed"
                rows={3}
                disabled={isPostingComment}
              />
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="ledger-label select-none normal-case tracking-normal tabular-nums">
                  {commentText.length} characters
                </span>
                <div className="flex gap-2">
                  {commentText.trim() && (
                    <button
                      type="button"
                      onClick={() => setCommentText('')}
                      disabled={isPostingComment}
                      className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!commentText.trim() || isPostingComment}
                    className="btn-pill"
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
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ── Comments list ── */}
          {totalComments === 0 ? (
            <div className="border border-dashed border-border py-12 text-center">
              <MessageCircle className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">No replies yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isAuthenticated
                  ? 'Start the discussion with the first reply.'
                  : 'Sign in with Google to start the discussion.'}
              </p>
            </div>
          ) : (
            <div>
              {comments.map((comment, index) => {
                const isOwner = !!comment.author && currentUserId === comment.author.id;
                const authorName = comment.author?.name || comment.authorName || 'Reader';
                const isEditing = editingCommentId === comment.id;

                return (
                  <div
                    key={comment.id}
                    className={`group py-6 ${
                      index < comments.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar src={comment.author?.avatarUrl} name={authorName} size="md" />
                      <div className="flex-1 min-w-0">
                        {/* Meta row */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="truncate text-sm font-medium text-foreground">
                              {authorName}
                            </span>
                            <span className="ledger-label shrink-0 normal-case tracking-normal tabular-nums">
                              {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          {(isOwner || canModerate) && !isEditing && (
                            <div className="flex shrink-0 items-center gap-0.5 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                              {isOwner && (
                                <button
                                  onClick={() => handleEditComment(comment)}
                                  aria-label="Edit reply"
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={deletingCommentId === comment.id}
                                aria-label="Delete reply"
                                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:opacity-40"
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
                              className="w-full resize-none border border-border bg-card
                                p-3 text-[15px] text-foreground leading-relaxed
                                focus:outline-none focus:border-brand-blue
                                transition-colors"
                              rows={3}
                              disabled={isUpdatingComment}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateComment(comment.id)}
                                disabled={!editingCommentText.trim() || isUpdatingComment}
                                className="rounded-full bg-brand-blue hover:bg-brand-blue/90 text-white h-9 px-4"
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
                                className="h-9 rounded-full px-4 text-muted-foreground hover:bg-muted hover:text-foreground"
                              >
                                <X className="mr-1.5 h-3.5 w-3.5" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.75] text-foreground/85">
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
                <div className="mt-2 border-t border-border pt-8 text-center">
                  <button
                    onClick={onLoadMoreComments}
                    disabled={isLoadingMoreComments}
                    className="btn-pill-outline text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {isLoadingMoreComments ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading…
                      </>
                    ) : (
                      <>Load more replies</>
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
        <AlertDialogContent className="border-border bg-card text-foreground">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <AlertDialogTitle className="font-display text-lg font-semibold">
                Delete reply
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
              This permanently removes your reply from the discussion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deletingCommentId !== null}
              className="h-9 rounded-full border-border px-4 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteComment}
              disabled={deletingCommentId !== null}
              className="h-9 rounded-full border-0 bg-destructive px-4 font-medium text-white hover:bg-destructive/90"
            >
              {deletingCommentId !== null ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
