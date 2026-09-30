import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CommentsSection } from '@/components/articles/comments-section';
import type { Comment } from '@/lib/article-api';

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: Record<string, unknown>) => <img {...(props as object)} />,
}));

const comments: Comment[] = [
  {
    id: 'c-own',
    body: 'My own reply',
    createdAt: '2026-09-01T10:00:00Z',
    author: { id: 'me', name: 'Me', avatarUrl: null },
  },
  {
    id: 'c-other',
    body: 'Someone else',
    createdAt: '2026-09-02T10:00:00Z',
    author: { id: 'someone', name: 'Someone', avatarUrl: null },
  },
];

function renderSection(props: Partial<ComponentProps<typeof CommentsSection>> = {}) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <CommentsSection
        comments={comments}
        totalComments={comments.length}
        hasMoreComments={false}
        isLoadingMoreComments={false}
        isAuthenticated
        currentUserId="me"
        isPostingComment={false}
        isUpdatingComment={false}
        deletingCommentId={null}
        onPostComment={vi.fn()}
        onUpdateComment={vi.fn()}
        onDeleteComment={vi.fn()}
        onLoadMoreComments={vi.fn()}
        {...props}
      />
    </QueryClientProvider>
  );
}

const commentBlock = (text: string) => screen.getByText(text).closest('.group') as HTMLElement;

describe('CommentsSection', () => {
  it('lets authors edit and delete only their own replies', () => {
    renderSection();
    const own = within(commentBlock('My own reply'));
    expect(own.getByLabelText('Edit reply')).toBeInTheDocument();
    expect(own.getByLabelText('Delete reply')).toBeInTheDocument();

    const other = within(commentBlock('Someone else'));
    expect(other.queryByLabelText('Edit reply')).not.toBeInTheDocument();
    expect(other.queryByLabelText('Delete reply')).not.toBeInTheDocument();
  });

  it('lets moderators delete, but not edit, other replies', () => {
    renderSection({ canModerate: true });
    const other = within(commentBlock('Someone else'));
    expect(other.getByLabelText('Delete reply')).toBeInTheDocument();
    expect(other.queryByLabelText('Edit reply')).not.toBeInTheDocument();
  });

  it('asks signed-out readers to sign in instead of showing the form', () => {
    renderSection({ isAuthenticated: false, currentUserId: null });
    expect(screen.getAllByText(/sign in with google/i).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText('Delete reply')).not.toBeInTheDocument();
  });
});
