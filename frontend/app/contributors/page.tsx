'use client';

import Link from 'next/link';
import { Github, ExternalLink, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ContributorCard } from '@/components/github/contributor-card';
import { LoadingState } from '@/components/github/loading-state';
import { ErrorState } from '@/components/github/error-state';
import { PageHeader } from '@/components/github/page-header';
import { PageFooter } from '@/components/github/page-footer';
import { useGitHubContributors } from '@/hooks/useGitHubContributors';
import { githubService } from '@/lib/services/github-service';

export default function ContributorsPage() {
  const { data: contributors, isLoading, error } = useGitHubContributors();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PageHeader
          icon={Users}
          title="Contributors"
          description="EightBlock is built by a passionate community of developers, designers, and blockchain enthusiasts. Thank you to everyone who has contributed to making this platform better."
        />

        {isLoading && <LoadingState message="Loading contributors from GitHub..." />}

        {error && (
          <ErrorState
            message="Unable to load contributors from GitHub. Please try again later."
            linkUrl={githubService.getContributorsUrl()}
            linkText="View contributors on GitHub"
          />
        )}

        {!isLoading && !error && contributors && contributors.length > 0 && (
          <>
            <div className="mb-8 flex items-center justify-between">
              <p className="text-muted-foreground">
                {contributors.length} {contributors.length === 1 ? 'contributor' : 'contributors'}{' '}
                and counting
              </p>
              <Link
                href={githubService.getRepositoryUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Github className="h-4 w-4" />
                View on GitHub
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {contributors.map((contributor) => (
                <ContributorCard key={contributor.id} contributor={contributor} />
              ))}
            </div>

            <div className="mt-16 p-8 bg-muted/50 rounded-lg border border-border">
              <h2 className="text-2xl font-bold mb-4">Want to contribute?</h2>
              <p className="text-muted-foreground mb-6">
                We welcome contributions from developers of all skill levels. Whether it&apos;s
                fixing bugs, adding features, improving documentation, or sharing ideas, your
                contribution matters!
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href={githubService.getFileUrl('CONTRIBUTING.md')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-[2px] hover:bg-primary-600 transition-all shadow-sm hover:shadow-md active:scale-95 font-semibold"
                >
                  <Github className="h-5 w-5" />
                  Contribution Guide
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <Link
                  href={githubService.getIssuesUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors font-semibold"
                >
                  View Open Issues
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </>
        )}

        {!isLoading && !error && contributors && contributors.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No contributors found. This might be a new repository or there was an issue loading
              the data.
            </p>
            <Link
              href={githubService.getRepositoryUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Visit GitHub repository
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Card>
        )}

        <PageFooter
          links={[
            { href: '/privacy', label: 'Privacy Policy' },
            { href: '/terms', label: 'Terms of Service' },
            { href: '/github', label: 'GitHub Repository' },
          ]}
        />
      </div>
    </div>
  );
}
