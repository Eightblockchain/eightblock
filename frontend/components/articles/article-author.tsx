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
    <div className="border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-[2px] border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-foreground border-l-4 border-primary pl-3">
            About the Author
          </h3>
          <div className="flex items-start gap-4">
            <Avatar
              src={author.avatarUrl}
              name={author.name}
              size="lg"
              className="ring-2 ring-primary/10"
            />
            <div className="flex-1">
              <p className="font-bold text-foreground text-lg">
                {author.name || 'Anonymous Author'}
              </p>
              {author.bio && (
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{author.bio}</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground font-mono bg-gray-50 inline-block px-3 py-1 rounded-full">
                {author.walletAddress.substring(0, 20)}...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
