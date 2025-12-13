import { useArticleAnalytics } from '@/hooks/useArticleTracking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Clock, MousePointer, Monitor, Globe, TrendingUp } from 'lucide-react';

interface AnalyticsDashboardProps {
  articleId: string;
}

export function AnalyticsDashboard({ articleId }: AnalyticsDashboardProps) {
  const { analytics, loading, error } = useArticleAnalytics(articleId, '7d');

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-500">Failed to load analytics: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const { article, period, metrics, breakdown, topReferrers, viewsByDay } = analytics;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{article.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {period.views} in last {period.days} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{article.totalUniqueViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {period.uniqueVisitors} in last {period.days} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time on Page</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(metrics.avgTimeOnPage / 60)}m {metrics.avgTimeOnPage % 60}s
            </div>
            <p className="text-xs text-muted-foreground">Average reading time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Scroll Depth</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgScrollDepth}%</div>
            <p className="text-xs text-muted-foreground">Of page scrolled</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="browsers">Browsers</TabsTrigger>
          <TabsTrigger value="referrers">Traffic Sources</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Breakdown</CardTitle>
              <CardDescription>Views by device type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(breakdown.devices).map(([device, count]) => {
                  const total = Object.values(breakdown.devices).reduce(
                    (a: number, b: any) => a + Number(b),
                    0
                  );
                  const percentage = Math.round((Number(count) / total) * 100);
                  return (
                    <div key={device} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          {device}
                        </span>
                        <span className="font-medium">
                          {String(count)} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browsers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Browser Breakdown</CardTitle>
              <CardDescription>Views by browser</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(breakdown.browsers)
                  .sort(([, a], [, b]) => Number(b) - Number(a))
                  .slice(0, 5)
                  .map(([browser, count]) => {
                    const total = Object.values(breakdown.browsers).reduce(
                      (a: number, b: any) => a + Number(b),
                      0
                    );
                    const percentage = Math.round((Number(count) / total) * 100);
                    return (
                      <div key={browser} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            {browser}
                          </span>
                          <span className="font-medium">
                            {String(count)} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Referrers</CardTitle>
              <CardDescription>Where your traffic comes from</CardDescription>
            </CardHeader>
            <CardContent>
              {topReferrers.length > 0 ? (
                <div className="space-y-3">
                  {topReferrers.map((ref: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate max-w-[250px]">
                        {ref.referrer}
                      </span>
                      <span className="font-medium">{ref.count} views</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No referrer data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Views Over Time</CardTitle>
              <CardDescription>Daily view count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(viewsByDay)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([date, count]) => (
                    <div key={date} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {new Date(date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="font-medium">{String(count)} views</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
