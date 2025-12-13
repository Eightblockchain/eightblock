'use client';

import { Eye, Heart, FileText, Users, LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, idx) => (
          <Skeleton key={idx} className="h-32 rounded-[2px]" />
        ))}
      </div>
    );
  }

  const statCards: StatCard[] = [
    {
      label: 'Articles published',
      value: stats.articles,
      icon: FileText,
      accent: 'bg-primary text-white',
      description: 'Stories live on EightBlock',
    },
    {
      label: 'Total views',
      value: stats.views,
      icon: Eye,
      accent: 'bg-secondary text-black',
      description: `${numberFormatter.format(stats.uniqueViews)} unique readers`,
    },
    {
      label: 'Total likes',
      value: stats.likes,
      icon: Heart,
      accent: 'bg-primary-700 text-white',
      description: 'Organic appreciation',
    },
    {
      label: 'Community reach',
      value: stats.uniqueViews,
      icon: Users,
      accent: 'bg-secondary-600 text-black',
      description: 'Reach across the network',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="rounded-[2px] border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-3 text-3xl font-bold text-foreground">
                  {numberFormatter.format(stat.value)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{stat.description}</p>
              </div>
              <div className={`rounded-[2px] p-3 shadow-sm ${stat.accent}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
