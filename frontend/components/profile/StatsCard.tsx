import { Card } from '@/components/ui/card';
import { Eye, Heart, Coins, FileText, Users } from 'lucide-react';

interface StatsCardProps {
  articles: Array<any>;
  stats?: {
    views: number;
    uniqueViews?: number;
    likes: number;
    articles: number;
    drafts: number;
  };
}

export function StatsCard({ articles, stats }: StatsCardProps) {
  // Use provided stats or calculate from articles
  const totalViews =
    stats?.views || articles.reduce((sum, article) => sum + (article.viewCount || 0), 0);
  const totalUniqueViews =
    stats?.uniqueViews || articles.reduce((sum, article) => sum + (article.uniqueViews || 0), 0);
  const totalLikes =
    stats?.likes || articles.reduce((sum, article) => sum + (article._count?.likes || 0), 0);
  const publishedCount = stats?.articles || articles.filter((a) => a.status === 'PUBLISHED').length;
  const draftCount = stats?.drafts || articles.filter((a) => a.status === 'DRAFT').length;
  const totalArticles = articles.length;

  const statsData = [
    {
      label: 'Total Views',
      value: totalViews.toLocaleString(),
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      subtitle: `${totalUniqueViews.toLocaleString()} unique`,
    },
    {
      label: 'Total Likes',
      value: totalLikes.toLocaleString(),
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Articles',
      value: `${publishedCount}/${totalArticles}`,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      subtitle: `${draftCount} drafts`,
    },
    {
      label: 'Rewards Earned',
      value: 'Soon',
      icon: Coins,
      color: 'text-[#080808]',
      bgColor: 'bg-gray-100',
      subtitle: 'Coming in V2',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-[#080808]">{stat.value}</p>
                {stat.subtitle && <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>}
              </div>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
