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
  isDeletingComment: boolean;
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
  isDeletingComment,
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
    <div id="comments" className="bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <MessageCircle className="h-6 w-6 text-gray-700" />
          <h3 className="text-3xl font-bold text-gray-900">Discussion</h3>
          <span className="text-sm text-gray-500 mt-1">({totalComments})</span>
        </div>

        <div className="space-y-6">
          {/* Comment Input - Only for authenticated users */}
          {!isAuthenticated ? (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-8 text-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-30 -mr-16 -mt-16"></div>
              <MessageCircle className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <p className="text-gray-700 mb-4 font-medium text-lg">Join the conversation</p>
              <p className="text-gray-600 text-sm mb-4 max-w-md mx-auto">
                Connect your wallet to share your thoughts and engage with the community
              </p>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Connect Wallet
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleCommentSubmit}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md focus-within:shadow-md focus-within:border-blue-200"
            >
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full resize-none border-0 p-3 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-0 bg-gray-50 rounded-lg"
                rows={3}
                disabled={isPostingComment}
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCommentText('')}
                  disabled={isPostingComment}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={!commentText.trim() || isPostingComment}>
                  {isPostingComment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Post Comment
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Comments List - Visible to everyone */}
          {totalComments === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600 font-medium mb-1">No comments yet</p>
              <p className="text-sm text-gray-500">
                {isAuthenticated
                  ? 'Be the first to share your thoughts!'
                  : 'Connect your wallet to be the first to comment!'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {comments.map((comment, index) => {
                const isOwner = currentUserId === comment.author.id;
                const isEditing = editingCommentId === comment.id;

                return (
                  <div key={comment.id}>
                    {index > 0 && <div className="border-t border-gray-100 my-6" />}
                    <div className="py-4 px-2 hover:bg-gray-50/50 rounded-lg transition-all group">
                      <div className="flex items-start gap-4">
                        <Avatar
                          src={comment.author.avatarUrl}
                          name={comment.author.name}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-semibold text-gray-900 truncate text-sm">
                                {comment.author.name || 'Anonymous'}
                              </span>
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            {isOwner && !isEditing && (
                              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditComment(comment)}
                                  className="h-8 px-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  disabled={isDeletingComment}
                                  className="h-8 px-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  {isDeletingComment ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="mt-2 space-y-2">
                              <textarea
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                className="w-full resize-none rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                                disabled={isUpdatingComment}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateComment(comment.id)}
                                  disabled={!editingCommentText.trim() || isUpdatingComment}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {isUpdatingComment ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Check className="mr-2 h-4 w-4" />
                                      Save
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  disabled={isUpdatingComment}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words text-[15px]">
                              {comment.body}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {hasMoreComments && (
                <div className="pt-8 text-center border-t border-gray-100 mt-8">
                  <Button
                    variant="ghost"
                    onClick={onLoadMoreComments}
                    disabled={isLoadingMoreComments}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    {isLoadingMoreComments ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading more...
                      </>
                    ) : (
                      'Load more comments'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Comment Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle className="text-xl">Delete Comment</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete this comment?
              <br />
              <br />
              This action cannot be undone. The comment will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingComment}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteComment}
              disabled={isDeletingComment}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeletingComment ? 'Deleting...' : 'Delete Comment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
