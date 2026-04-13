'use client';

import { Eye, Heart, FileText, Users, LucideIcon } from 'lucide-react';

interface PublicProfileStatsProps {
  stats?: {
    articles: number;
    views: number;
    uniqueViews: number;
    likes: number;
  };
  isLoading?: boolean;
}

const numberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

interface StatCard {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
  description: string;
}

export function PublicProfileStats({ stats, isLoading }: PublicProfileStatsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="h-32 rounded-2xl border border-border/20 bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  const statCards: StatCard[] = [
    {
      label: 'Articles',
      value: stats.articles,
      icon: FileText,
      accent: 'border-primary/25 bg-primary/10 text-primary',
      description: 'Stories live on EightBlock',
    },
    {
      label: 'Total views',
      value: stats.views,
      icon: Eye,
      accent: 'border-accent/25 bg-accent/10 text-accent',
      description: `${numberFormatter.format(stats.uniqueViews)} unique readers`,
    },
    {
      label: 'Total likes',
      value: stats.likes,
      icon: Heart,
      accent: 'border-rose-400/25 bg-rose-400/10 text-rose-400',
      description: 'Organic appreciation',
    },
    {
      label: 'Unique readers',
      value: stats.uniqueViews,
      icon: Users,
      accent: 'border-border/40 bg-card/60 text-foreground/50',
      description: 'Reach across the network',
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-2xl border border-border/30 bg-card p-5
              hover:border-border/55 transition-all duration-200"
          >
            <div className="mb-3">
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border ${stat.accent}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-black tabular-nums text-foreground/90">
              {numberFormatter.format(stat.value)}
            </p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground/35">
              {stat.label}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/25">{stat.description}</p>
          </div>
        );
      })}
    </div>
  );
}
