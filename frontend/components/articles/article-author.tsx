import { Avatar } from '@/components/ui/avatar';

interface ArticleAuthorProps {
  author: {
    name: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    walletAddress: string;
  };
}

export function ArticleAuthor({ author }: ArticleAuthorProps) {
  return (
    <div className="border-b bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">About the Author</h3>
        <div className="flex items-start gap-4">
          <Avatar src={author.avatarUrl} name={author.name} size="lg" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{author.name || 'Anonymous Author'}</p>
            {author.bio && <p className="mt-1 text-sm text-gray-600">{author.bio}</p>}
            <p className="mt-1 text-xs text-gray-500 font-mono">
              {author.walletAddress.substring(0, 20)}...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
