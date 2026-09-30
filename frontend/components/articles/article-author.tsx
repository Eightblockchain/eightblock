import Link from 'next/link';
import { Avatar } from '@eightblock/ui/components/avatar';
import { Panel } from '@eightblock/ui/components/panel';

interface ArticleAuthorProps {
  author: {
    name: string | null;
    username?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
  };
}

export function ArticleAuthor({ author }: ArticleAuthorProps) {
  return (
    <div className="container-read pb-12">
      <Panel className="p-6 sm:p-8">
        <p className="ledger-label">Written by</p>
        <div className="mt-5 flex items-start gap-4">
          <Avatar src={author.avatarUrl} name={author.name} size="lg" />
          <div className="min-w-0 flex-1">
            <Link
              href={author.username ? `/authors/${author.username}` : '/about'}
              className="font-display text-xl font-semibold text-foreground transition-colors hover:text-brand-blue"
            >
              {author.name || 'Eightblock'}
            </Link>
            {author.bio && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{author.bio}</p>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
