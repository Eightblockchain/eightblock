import Link from 'next/link';
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
    <div className="border-t border-border/20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-12">
        <div className="relative rounded-2xl border border-border/35 bg-card/25 p-6 sm:p-8 overflow-hidden">

          {/* Ghost watermark */}
          <span className="absolute right-5 top-4 font-black leading-none text-foreground/[0.025] pointer-events-none select-none"
            style={{ fontSize: 'clamp(48px, 10vw, 80px)' }}>
            BY
          </span>

          {/* Top rule — gold/blue/muted three-segment */}
          <div className="absolute top-0 left-8 right-8 h-[2px] flex">
            <div className="w-10 bg-primary" />
            <div className="w-7 bg-accent/40" />
            <div className="flex-1 bg-border/25" />
          </div>

          <p className="font-mono text-[9px] uppercase tracking-[0.45em] text-muted-foreground/25 mb-6">
            Written by
          </p>

          <div className="flex items-start gap-5">
            <Link href={`/profile/${author.walletAddress}`} aria-label={`View ${author.name || 'author'}'s profile`} className="flex-shrink-0">
              <Avatar
                src={author.avatarUrl}
                name={author.name}
                size="lg"
                className="ring-1 ring-border/40 hover:ring-primary/40 transition-all duration-150"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/profile/${author.walletAddress}`} className="group">
                <p className="text-xl font-black text-foreground tracking-tight leading-none mb-2 group-hover:text-primary transition-colors duration-150">
                  {author.name || 'Anonymous Author'}
                </p>
              </Link>
              {author.bio && (
                <p className="text-sm text-muted-foreground/60 leading-relaxed mb-4">
                  {author.bio}
                </p>
              )}
              <span className="inline-block font-mono text-[10px] text-muted-foreground/25 bg-card/50 border border-border/30 rounded px-3 py-1 tracking-wider">
                {author.walletAddress.substring(0, 24)}&hellip;
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

