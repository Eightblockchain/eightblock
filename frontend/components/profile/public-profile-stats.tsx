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
          <Skeleton key={idx} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  const statCards: StatCard[] = [
    {
      label: 'Articles published',
      value: stats.articles,
      icon: FileText,
      accent: 'bg-white text-[#080808]',
      description: 'Stories live on EightBlock',
    },
    {
      label: 'Total views',
      value: stats.views,
      icon: Eye,
      accent: 'bg-blue-50 text-blue-600',
      description: `${numberFormatter.format(stats.uniqueViews)} unique readers`,
    },
    {
      label: 'Total likes',
      value: stats.likes,
      icon: Heart,
      accent: 'bg-red-50 text-red-600',
      description: 'Organic appreciation',
    },
    {
      label: 'Community reach',
      value: stats.uniqueViews,
      icon: Users,
      accent: 'bg-purple-50 text-purple-600',
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
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-[#080808]">
                  {numberFormatter.format(stat.value)}
                </p>
                <p className="mt-1 text-xs text-gray-500">{stat.description}</p>
              </div>
              <div className={`rounded-xl p-3 ${stat.accent}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
