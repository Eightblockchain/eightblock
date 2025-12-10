'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Github,
  Star,
  GitFork,
  Eye,
  Code,
  ExternalLink,
  Loader2,
  GitPullRequest,
  AlertCircle,
  Users,
  BookOpen,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  language: string;
  license: {
    name: string;
    spdx_id: string;
  } | null;
  topics: string[];
  updated_at: string;
  created_at: string;
}

export default function GitHubRepositoryPage() {
  const [repo, setRepo] = useState<GitHubRepo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const REPO_OWNER = 'Eightblockchain';
  const REPO_NAME = 'eightblock';
  const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;

  useEffect(() => {
    const fetchRepoData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, {
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
          // Cache for 10 minutes
          next: { revalidate: 600 },
        });

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const data: GitHubRepo = await response.json();
        setRepo(data);
      } catch (err) {
        console.error('Error fetching repository data:', err);
        setError('Unable to load repository information from GitHub. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRepoData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
            <Github className="h-8 w-8" />
            <h1 className="text-4xl font-bold">GitHub Repository</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl">
            EightBlock is fully open-source. Explore the code, report issues, submit pull requests,
            or fork the project to create your own version.
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading repository information...</p>
          </div>
        )}

        {error && (
          <Card className="p-8 text-center bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
            <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Link
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              View repository on GitHub
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Card>
        )}

        {!loading && !error && repo && (
          <>
            {/* Repository Header */}
            <Card className="p-8 mb-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{repo.full_name}</h2>
                  <p className="text-muted-foreground text-lg mb-4">{repo.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {repo.topics.map((topic) => (
                      <span
                        key={topic}
                        className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Star className="h-5 w-5 text-[#080808] dark:text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">{repo.stargazers_count}</p>
                    <p className="text-sm text-muted-foreground">Stars</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <GitFork className="h-5 w-5 text-[#080808] dark:text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{repo.forks_count}</p>
                    <p className="text-sm text-muted-foreground">Forks</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Eye className="h-5 w-5 text-[#080808] dark:text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{repo.watchers_count}</p>
                    <p className="text-sm text-muted-foreground">Watchers</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-[#080808] dark:text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{repo.open_issues_count}</p>
                    <p className="text-sm text-muted-foreground">Open Issues</p>
                  </div>
                </div>
              </div>

              {/* Repository Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-6">
                {repo.language && (
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    <span>
                      Primary language: <strong>{repo.language}</strong>
                    </span>
                  </div>
                )}
                {repo.license && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>
                      License: <strong>{repo.license.name}</strong>
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span>
                    Updated: <strong>{formatDate(repo.updated_at)}</strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link href={REPO_URL} target="_blank" rel="noopener noreferrer">
                  <Button className="gap-2 bg-[#080808] hover:bg-[#080808]/90 dark:bg-primary dark:hover:bg-primary/90">
                    <Github className="h-5 w-5" />
                    View on GitHub
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>

                <Link href={`${REPO_URL}/fork`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="gap-2">
                    <GitFork className="h-5 w-5" />
                    Fork Repository
                  </Button>
                </Link>

                <Link href={`${REPO_URL}/issues`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="gap-2">
                    <AlertCircle className="h-5 w-5" />
                    View Issues
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Quick Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <GitPullRequest className="h-8 w-8 text-[#080808] dark:text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Contribute</h3>
                <p className="text-muted-foreground mb-4">
                  Read our contribution guidelines to learn how you can help improve EightBlock.
                </p>
                <Link
                  href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
                >
                  Read Guidelines
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <Users className="h-8 w-8 text-[#080808] dark:text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Contributors</h3>
                <p className="text-muted-foreground mb-4">
                  Meet the amazing people who have contributed to making EightBlock better.
                </p>
                <Link
                  href="/contributors"
                  className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
                >
                  View Contributors
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <BookOpen className="h-8 w-8 text-[#080808] dark:text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Documentation</h3>
                <p className="text-muted-foreground mb-4">
                  Explore detailed documentation on setup, architecture, and API usage.
                </p>
                <Link
                  href={`${REPO_URL}#readme`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
                >
                  Read Docs
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <Code className="h-8 w-8 text-[#080808] dark:text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Code of Conduct</h3>
                <p className="text-muted-foreground mb-4">
                  Our commitment to fostering an inclusive and welcoming community.
                </p>
                <Link
                  href={`${REPO_URL}/blob/main/CODE_OF_CONDUCT.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
                >
                  Read Code of Conduct
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Card>
            </div>

            {/* Getting Started Section */}
            <Card className="p-8 bg-gradient-to-br from-[#080808]/5 to-[#080808]/10 dark:from-primary/5 dark:to-primary/10 border-[#080808]/20 dark:border-primary/20">
              <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
              <p className="text-muted-foreground mb-6">
                Clone the repository and start contributing in minutes:
              </p>
              <div className="bg-background/80 backdrop-blur-sm rounded-lg p-6 font-mono text-sm mb-6 border border-border">
                <div className="mb-2 text-muted-foreground"># Clone the repository</div>
                <div className="mb-4">git clone {repo.html_url}.git</div>
                <div className="mb-2 text-muted-foreground"># Install dependencies</div>
                <div className="mb-4">pnpm install</div>
                <div className="mb-2 text-muted-foreground"># Start development server</div>
                <div>pnpm dev</div>
              </div>
              <p className="text-sm text-muted-foreground">
                For detailed setup instructions, see the{' '}
                <Link
                  href={`${REPO_URL}#getting-started`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  README.md
                </Link>
              </p>
            </Card>
          </>
        )}

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/contributors" className="hover:text-foreground transition-colors">
              Contributors
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
