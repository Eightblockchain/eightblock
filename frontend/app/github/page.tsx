'use client';

import Link from 'next/link';
import {
  Github, ExternalLink, Star, GitFork, Eye, AlertCircle, Loader2,
  Code, BookOpen, GitPullRequest, Users, ArrowUpRight, Copy, Check,
} from 'lucide-react';
import { useState } from 'react';
import { useGitHubRepository } from '@/hooks/useGitHubRepository';
import { githubService } from '@/lib/services/github-service';

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card dark:border-border/40 px-5 py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/10">
        <Icon className="h-4 w-4 text-primary/70" />
      </div>
      <div>
        <p className="text-xl font-black text-foreground leading-none">{value.toLocaleString()}</p>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function CopyableCommand({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="group flex items-center justify-between gap-4 rounded-xl bg-background/60 dark:bg-background/40 border border-border/50 dark:border-border/20 px-4 py-2.5">
      <code className="font-mono text-[13px] text-foreground/80">{children}</code>
      <button
        onClick={handleCopy}
        className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-lg
          text-muted-foreground/40 hover:text-foreground hover:bg-muted/50
          transition-all duration-150"
        title="Copy"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

const quickLinks = [
  {
    icon: GitPullRequest,
    label: 'Contribute',
    desc: 'Read our contribution guidelines and start contributing.',
    cta: 'Read Guidelines',
    href: githubService.getFileUrl('CONTRIBUTING.md'),
    external: true,
  },
  {
    icon: Users,
    label: 'Contributors',
    desc: 'Meet the people who make EightBlock possible.',
    cta: 'View Contributors',
    href: '/contributors',
    external: false,
  },
  {
    icon: BookOpen,
    label: 'Documentation',
    desc: 'Setup guides, architecture overview, and API reference.',
    cta: 'Read Docs',
    href: githubService.getRepositoryUrl() + '#readme',
    external: true,
  },
  {
    icon: Code,
    label: 'Code of Conduct',
    desc: 'Our commitment to an inclusive and welcoming community.',
    cta: 'Read Conduct',
    href: githubService.getFileUrl('CODE_OF_CONDUCT.md'),
    external: true,
  },
];

export default function GitHubRepositoryPage() {
  const { data: repo, isLoading, error } = useGitHubRepository();

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-border/50 dark:border-border/20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_-10%,hsl(var(--primary)/0.07),transparent)]" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--primary)/0.04) 1px,transparent 1px),linear-gradient(90deg,hsl(var(--primary)/0.04) 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-px w-5 bg-primary/50" />
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary/60">
                  Open Source
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-none mb-3">
                GitHub Repository
              </h1>
              <p className="text-[14px] text-muted-foreground/60 max-w-xl leading-relaxed">
                EightBlock is fully open-source. Explore the code, report issues, submit pull
                requests, or fork the project to build your own.
              </p>
            </div>

            <Link
              href={githubService.getRepositoryUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center gap-2 overflow-hidden rounded-xl
                bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground
                shadow-md shadow-primary/20 hover:brightness-105 active:scale-[0.97]
                transition-all duration-150 self-start sm:self-auto flex-shrink-0"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full
                bg-gradient-to-r from-transparent via-white/20 to-transparent
                group-hover:translate-x-full transition-transform duration-500" />
              <Github className="h-3.5 w-3.5" />
              View on GitHub
              <ExternalLink className="h-3 w-3 opacity-70" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-8">

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl
              border border-border bg-card dark:border-border/30">
              <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
            </div>
            <p className="font-mono text-[11px] text-muted-foreground/40 tracking-widest uppercase">
              Loading repository…
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl
              border border-rose-500/20 bg-rose-500/5">
              <AlertCircle className="h-6 w-6 text-rose-500/60" />
            </div>
            <p className="text-[14px] text-muted-foreground/60 max-w-sm">
              Unable to load repository information. Please try again later.
            </p>
            <Link
              href={githubService.getRepositoryUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary/70 hover:text-primary"
            >
              View on GitHub <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}

        {!isLoading && !error && repo && (
          <>
            {/* Repository header */}
            <div className="rounded-2xl border border-border bg-card dark:border-border/40 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Github className="h-4 w-4 text-muted-foreground/40" />
                    <h2 className="text-xl font-black text-foreground">{repo.full_name}</h2>
                  </div>
                  {repo.description && (
                    <p className="text-[14px] text-muted-foreground/70 leading-relaxed mb-4">
                      {repo.description}
                    </p>
                  )}
                  {repo.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {repo.topics.map((topic) => (
                        <span
                          key={topic}
                          className="inline-flex items-center rounded-full border border-border/60 dark:border-border/30
                            bg-muted/40 px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground/60"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap gap-4 text-[12px] text-muted-foreground/50 pt-4 border-t border-border/50 dark:border-border/25">
                {repo.language && (
                  <span className="flex items-center gap-1.5">
                    <Code className="h-3.5 w-3.5" />
                    {repo.language}
                  </span>
                )}
                {repo.license && (
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    {repo.license.name}
                  </span>
                )}
                <span>
                  Updated{' '}
                  {new Date(repo.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={Star} label="Stars" value={repo.stargazers_count} />
              <StatCard icon={GitFork} label="Forks" value={repo.forks_count} />
              <StatCard icon={Eye} label="Watchers" value={repo.watchers_count} />
              <StatCard icon={AlertCircle} label="Open Issues" value={repo.open_issues_count} />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <Link
                href={githubService.getRepositoryUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-2 overflow-hidden rounded-xl
                  bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground
                  shadow-md shadow-primary/20 hover:brightness-105 active:scale-[0.97]
                  transition-all duration-150"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full
                  bg-gradient-to-r from-transparent via-white/20 to-transparent
                  group-hover:translate-x-full transition-transform duration-500" />
                <Github className="h-3.5 w-3.5" />
                View on GitHub
              </Link>
              <Link
                href={githubService.getForkUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-border/60 dark:border-border/30
                  bg-muted/30 px-4 py-2.5 text-[13px] font-semibold
                  text-muted-foreground/70 hover:text-foreground hover:border-border
                  transition-all duration-150"
              >
                <GitFork className="h-3.5 w-3.5" />
                Fork Repository
              </Link>
              <Link
                href={githubService.getIssuesUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-border/60 dark:border-border/30
                  bg-muted/30 px-4 py-2.5 text-[13px] font-semibold
                  text-muted-foreground/70 hover:text-foreground hover:border-border
                  transition-all duration-150"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                View Issues
              </Link>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickLinks.map(({ icon: Icon, label, desc, cta, href, external }) => (
                <div key={label}
                  className="rounded-2xl border border-border bg-card dark:border-border/40 p-6
                    hover:border-primary/25 transition-colors duration-200">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl
                    border border-border/60 dark:border-border/30 bg-muted/40 mb-4">
                    <Icon className="h-4 w-4 text-primary/60" />
                  </div>
                  <h3 className="text-[15px] font-bold text-foreground mb-1.5">{label}</h3>
                  <p className="text-[13px] text-muted-foreground/60 mb-4 leading-relaxed">{desc}</p>
                  {external ? (
                    <Link
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary/70 hover:text-primary"
                    >
                      {cta} <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <Link href={href}
                      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary/70 hover:text-primary">
                      {cta} <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Getting started */}
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 dark:border-primary/15 bg-card px-8 py-8">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_100%_50%,hsl(var(--primary)/0.06),transparent)]" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4 text-primary/60" />
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary/60">
                    Quick Start
                  </span>
                </div>
                <h2 className="text-xl font-black text-foreground mb-1.5">Getting Started</h2>
                <p className="text-[14px] text-muted-foreground/60 mb-6">
                  Clone and run EightBlock in minutes.
                </p>

                <div className="space-y-2">
                  <p className="font-mono text-[11px] text-muted-foreground/40 px-1"># Clone the repository</p>
                  <CopyableCommand>{`git clone ${repo.html_url}.git`}</CopyableCommand>
                  <p className="font-mono text-[11px] text-muted-foreground/40 px-1 pt-1"># Install dependencies</p>
                  <CopyableCommand>pnpm install</CopyableCommand>
                  <p className="font-mono text-[11px] text-muted-foreground/40 px-1 pt-1"># Start dev server</p>
                  <CopyableCommand>pnpm dev</CopyableCommand>
                </div>

                <p className="mt-5 text-[13px] text-muted-foreground/50">
                  For full setup instructions, see the{' '}
                  <Link
                    href={`${repo.html_url}#readme`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary/70 hover:text-primary"
                  >
                    README.md
                  </Link>
                </p>
              </div>
            </div>
          </>
        )}

        {/* Footer links */}
        <div className="pt-4 border-t border-border/50 dark:border-border/25
          flex flex-wrap gap-5 text-[12px] text-muted-foreground/50">
          {[
            { href: '/contributors', label: 'Contributors' },
            { href: '/privacy', label: 'Privacy Policy' },
            { href: '/terms', label: 'Terms of Service' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="hover:text-foreground transition-colors">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
