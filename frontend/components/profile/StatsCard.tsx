import { Eye, Heart, Coins, FileText } from 'lucide-react';

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

  const statTiles = [
    {
      label: 'TOTAL VIEWS',
      value: totalViews.toLocaleString(),
      sub: `${totalUniqueViews.toLocaleString()} unique`,
      icon: Eye,
      valueColor: 'text-primary',
      iconClass: 'border-primary/40 bg-primary/8 text-primary dark:border-primary/25 dark:bg-primary/10',
    },
    {
      label: 'TOTAL LIKES',
      value: totalLikes.toLocaleString(),
      sub: null as string | null,
      icon: Heart,
      valueColor: 'text-accent',
      iconClass: 'border-accent/40 bg-accent/8 text-accent dark:border-accent/25 dark:bg-accent/10',
    },
    {
      label: 'ARTICLES',
      value: publishedCount.toString(),
      sub: `${draftCount} draft${draftCount !== 1 ? 's' : ''}`,
      icon: FileText,
      valueColor: 'text-foreground/80',
      iconClass: 'border-border bg-muted/60 text-foreground/50 dark:border-border/40 dark:bg-card/60',
    },
    {
      label: 'REWARDS',
      value: 'V2',
      sub: 'Coming soon',
      icon: Coins,
      valueColor: 'text-muted-foreground/50 dark:text-muted-foreground/30',
      iconClass: 'border-border/60 bg-muted/40 text-muted-foreground/40 dark:border-border/20 dark:bg-card/30 dark:text-muted-foreground/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {statTiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <div
            key={tile.label}
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 dark:border-border/30"
          >
            <div className="mb-3">
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border ${tile.iconClass}`}
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className={`text-2xl font-black tabular-nums ${tile.valueColor}`}>
              {tile.value}
            </p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground/60 dark:text-muted-foreground/35">
              {tile.label}
            </p>
            {tile.sub && (
              <p className="mt-0.5 text-[11px] text-muted-foreground/50 dark:text-muted-foreground/25">{tile.sub}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
