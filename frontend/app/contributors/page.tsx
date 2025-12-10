'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Github, ExternalLink, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface GitHubContributor {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
}

export default function ContributorsPage() {
  const [contributors, setContributors] = useState<GitHubContributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContributors = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          'https://api.github.com/repos/Eightblockchain/eightblock/contributors?per_page=100',
          {
            headers: {
              Accept: 'application/vnd.github.v3+json',
            },
            // Cache for 5 minutes
            next: { revalidate: 300 },
          }
        );

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const data: GitHubContributor[] = await response.json();

        // Filter out bots and sort by contributions
        const humanContributors = data
          .filter((contributor) => contributor.type === 'User')
          .sort((a, b) => b.contributions - a.contributions);

        setContributors(humanContributors);
      } catch (err) {
        console.error('Error fetching contributors:', err);
        setError('Unable to load contributors from GitHub. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchContributors();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Contributors</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl">
            EightBlock is built by a passionate community of developers, designers, and blockchain
            enthusiasts. Thank you to everyone who has contributed to making this platform better.
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading contributors from GitHub...</p>
          </div>
        )}

        {error && (
          <Card className="p-8 text-center bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Link
              href="https://github.com/Eightblockchain/eightblock/graphs/contributors"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              View contributors on GitHub
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Card>
        )}

        {!loading && !error && contributors.length > 0 && (
          <>
            <div className="mb-8 flex items-center justify-between">
              <p className="text-muted-foreground">
                {contributors.length} {contributors.length === 1 ? 'contributor' : 'contributors'}{' '}
                and counting
              </p>
              <Link
                href="https://github.com/Eightblockchain/eightblock"
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
                <Card
                  key={contributor.id}
                  className="p-6 hover:shadow-lg transition-shadow duration-200"
                >
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
                        <div className="absolute -bottom-2 -right-2 bg-[#080808] dark:bg-primary text-white dark:text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center text-xs font-bold border-2 border-background">
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
                  href="https://github.com/Eightblockchain/eightblock/blob/main/CONTRIBUTING.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#080808] dark:bg-primary text-white dark:text-primary-foreground rounded-md hover:bg-[#080808]/90 dark:hover:bg-primary/90 transition-colors font-semibold"
                >
                  <Github className="h-5 w-5" />
                  Contribution Guide
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <Link
                  href="https://github.com/Eightblockchain/eightblock/issues"
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

        {!loading && !error && contributors.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No contributors found. This might be a new repository or there was an issue loading
              the data.
            </p>
            <Link
              href="https://github.com/Eightblockchain/eightblock"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Visit GitHub repository
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Card>
        )}

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/github" className="hover:text-foreground transition-colors">
              GitHub Repository
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
