'use client';

import Link from 'next/link';
import {
  Github, ExternalLink, Users, GitPullRequest, AlertCircle, Loader2, ArrowUpRight,
} from 'lucide-react';
import { ContributorCard } from '@/components/github/contributor-card';
import { useGitHubContributors } from '@/hooks/useGitHubContributors';
import { githubService } from '@/lib/services/github-service';

export default function ContributorsPage() {
  const { data: contributors, isLoading, error } = useGitHubContributors();

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
                Contributors
              </h1>
              <p className="text-[14px] text-muted-foreground/60 max-w-xl leading-relaxed">
                EightBlock is built by a passionate community of developers, designers, and blockchain
                enthusiasts. Thank you to everyone who has contributed.
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

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl
              border border-border bg-card dark:border-border/30">
              <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
            </div>
            <p className="font-mono text-[11px] text-muted-foreground/40 tracking-widest uppercase">
              Loading contributors…
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
              Unable to load contributors from GitHub. Please try again later.
            </p>
            <Link
              href={githubService.getContributorsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary/70 hover:text-primary"
            >
              View on GitHub <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* Contributors grid */}
        {!isLoading && !error && contributors && contributors.length > 0 && (
          <>
            {/* Count bar */}
            <div className="flex items-center justify-between mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25
                bg-accent/8 dark:bg-accent/10 px-3 py-1
                text-[12px] font-semibold text-accent/70">
                <Users className="h-3 w-3" />
                {contributors.length} contributor{contributors.length !== 1 ? 's' : ''} and counting
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {contributors.map((contributor) => (
                <ContributorCard key={contributor.id} contributor={contributor} />
              ))}
            </div>

            {/* CTA section */}
            <div className="mt-14 relative overflow-hidden rounded-2xl border border-border bg-card dark:border-border/40 px-8 py-10">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_0%_50%,hsl(var(--primary)/0.07),transparent)]" />
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <GitPullRequest className="h-4 w-4 text-primary/60" />
                    <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary/60">
                      Join Us
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-foreground mb-2">Want to contribute?</h2>
                  <p className="text-[14px] text-muted-foreground/60 leading-relaxed max-w-xl">
                    We welcome contributions from developers of all skill levels — whether it&apos;s
                    fixing bugs, adding features, improving docs, or sharing ideas. Your work matters.
                  </p>
                </div>
                <div className="flex flex-col sm:items-end gap-2.5">
                  <Link
                    href={githubService.getFileUrl('CONTRIBUTING.md')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-2 overflow-hidden rounded-xl
                      bg-primary px-5 py-2.5 text-[13px] font-bold text-primary-foreground
                      shadow-md shadow-primary/20 hover:brightness-105 active:scale-[0.97]
                      transition-all duration-150"
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full
                      bg-gradient-to-r from-transparent via-white/20 to-transparent
                      group-hover:translate-x-full transition-transform duration-500" />
                    <Github className="h-3.5 w-3.5" />
                    Contribution Guide
                  </Link>
                  <Link
                    href={githubService.getIssuesUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl
                      border border-border/60 dark:border-border/30 bg-muted/30
                      text-[13px] font-semibold text-muted-foreground/70
                      hover:text-foreground hover:border-border transition-all duration-150"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    View Open Issues
                    <ArrowUpRight className="h-3 w-3 opacity-50" />
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Empty */}
        {!isLoading && !error && contributors && contributors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <p className="text-[14px] text-muted-foreground/50">No contributors found.</p>
            <Link
              href={githubService.getRepositoryUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-semibold text-primary/70 hover:text-primary"
            >
              Visit GitHub repository →
            </Link>
          </div>
        )}

        {/* Footer links */}
        <div className="mt-12 pt-8 border-t border-border/50 dark:border-border/25
          flex flex-wrap gap-5 text-[12px] text-muted-foreground/50">
          {[
            { href: '/github', label: 'GitHub Repository' },
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
