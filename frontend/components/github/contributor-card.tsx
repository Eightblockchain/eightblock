import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { GitHubContributor } from '@/types/github';

interface ContributorCardProps {
  contributor: GitHubContributor;
}

export const ContributorCard = ({ contributor }: ContributorCardProps) => {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
      <Link
        href={contributor.html_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block group"
      >
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <Image
              src={contributor.avatar_url}
              alt={`${contributor.login}'s avatar`}
              width={96}
              height={96}
              className="rounded-full border-4 border-border group-hover:border-[#080808] dark:group-hover:border-primary transition-colors duration-200"
              unoptimized
            />
            <div className="absolute -bottom-2 -right-2 bg-secondary text-black rounded-full h-8 w-8 flex items-center justify-center text-xs font-bold border-2 border-white shadow-md">
              {contributor.contributions}
            </div>
          </div>

          <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
            @{contributor.login}
          </h3>

          <p className="text-sm text-muted-foreground">
            {contributor.contributions}{' '}
            {contributor.contributions === 1 ? 'contribution' : 'contributions'}
          </p>

          <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            <span>View profile</span>
            <ExternalLink className="h-3 w-3" />
          </div>
        </div>
      </Link>
    </Card>
  );
};
