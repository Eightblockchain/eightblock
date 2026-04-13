import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { GitHubContributor } from '@/types/github';

interface ContributorCardProps {
  contributor: GitHubContributor;
}

export const ContributorCard = ({ contributor }: ContributorCardProps) => {
  return (
    <Link
      href={contributor.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center text-center
        rounded-2xl border border-border bg-card dark:border-border/40 p-6
        hover:border-primary/30 dark:hover:border-primary/25
        hover:shadow-lg hover:shadow-primary/5
        transition-all duration-200"
    >
      {/* Avatar */}
      <div className="relative mb-4">
        <div className="rounded-full ring-2 ring-border/60 dark:ring-border/30 overflow-hidden
          group-hover:ring-primary/30 transition-all duration-200">
          <Image
            src={contributor.avatar_url}
            alt={`${contributor.login}'s avatar`}
            width={72}
            height={72}
            className="rounded-full object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        </div>
        {/* contribution badge */}
        <div className="absolute -bottom-1.5 -right-1.5 flex h-6 min-w-6 items-center justify-center
          rounded-full border-2 border-background bg-primary px-1.5
          font-mono text-[10px] font-bold text-primary-foreground shadow-sm">
          {contributor.contributions}
        </div>
      </div>

      {/* Name */}
      <h3 className="font-bold text-[14px] text-foreground mb-0.5
        group-hover:text-primary transition-colors duration-150">
        @{contributor.login}
      </h3>

      {/* Commit count */}
      <p className="font-mono text-[11px] text-muted-foreground/50">
        {contributor.contributions}{' '}
        {contributor.contributions === 1 ? 'commit' : 'commits'}
      </p>

      {/* Hover CTA */}
      <div className="mt-3 inline-flex items-center gap-1
        font-mono text-[10px] text-primary/60
        opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        View profile <ExternalLink className="h-2.5 w-2.5" />
      </div>
    </Link>
  );
};
