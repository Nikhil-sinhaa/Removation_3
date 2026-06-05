'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  RefreshCw,
  TrendingUp,
  BarChart3,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { StarDisplay } from '@/components/shared/StarDisplay';

interface FeedbackStats {
  overall: {
    totalRatings: number;
    totalRenders: number;
    averageRating: number;
    ratingDistribution: Record<string, number>;
  };
  byFeature: Array<{
    featureType: string;
    count: number;
    avgRating: number;
    positivePercent: number;
  }>;
  topTags: Array<{ tag: string; count: number; percent: number }>;
  recentLowRated: Array<{
    _id: string;
    featureType: string;
    rating: number;
    feedbackTags: string[];
    feedbackComment: string;
    createdAt: string;
    userId: string;
  }>;
  weeklyTrend: Array<{ week: string; avgRating: number; count: number }>;
}

const TAG_LABELS: Record<string, string> = {
  great_quality: '✨ Great quality',
  accurate_style: '🎨 Accurate style',
  realistic_lighting: '💡 Realistic lighting',
  good_colors: '🎨 Good colors',
  loved_it: '❤️ Loved it',
  blurry: '🌫️ Blurry',
  low_quality: '📉 Low quality',
  artifacts: '🔧 Has artifacts',
  wrong_colors: '🎨 Wrong colors',
  wrong_style: '❌ Wrong style',
  ignored_furniture: '🛋️ Ignored furniture',
  lost_room_structure: '🏠 Lost room structure',
  too_much_change: '↕️ Too much change',
  too_little_change: '↕️ Too little change',
  bad_lighting: '💡 Bad lighting',
  unrealistic: '🤔 Unrealistic',
  weird_textures: '🪨 Weird textures',
};

const POSITIVE_TAGS = new Set([
  'great_quality',
  'accurate_style',
  'realistic_lighting',
  'good_colors',
  'loved_it',
]);

const BAR_COLORS: Record<number, string> = {
  5: '#16a34a',
  4: '#22c55e',
  3: '#eab308',
  2: '#f97316',
  1: '#ef4444',
};

function MetricCard({
  title,
  value,
  sub,
  color,
  icon: Icon,
}: {
  title: string;
  value: string;
  sub: string;
  color: 'green' | 'yellow' | 'red' | 'blue';
  icon: React.ElementType;
}) {
  const colors = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
  };
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={cn('text-3xl font-bold mt-1', colors[color])}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
          <div className={cn('p-2 rounded-lg bg-muted', colors[color])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminFeedbackPage() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/feedback/stats');
      if (!res.ok) throw new Error('Failed to load feedback stats');
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load feedback stats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
        <p className="text-lg font-medium">{error || 'No data available'}</p>
        <Button onClick={fetchStats} variant="outline" className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const { overall, byFeature, topTags, recentLowRated, weeklyTrend } = stats;
  const positivePercent =
    overall.totalRatings > 0
      ? Math.round(
          ((overall.ratingDistribution[4] + overall.ratingDistribution[5]) /
            overall.totalRatings) *
            100
        )
      : 0;
  const lowRatedPercent =
    overall.totalRatings > 0
      ? Math.round(
          ((overall.ratingDistribution[1] + overall.ratingDistribution[2]) /
            overall.totalRatings) *
            100
        )
      : 0;
  const ratedPercent =
    overall.totalRenders > 0
      ? Math.round((overall.totalRatings / overall.totalRenders) * 100)
      : 0;

  const ratingColor =
    overall.averageRating >= 4.0
      ? 'green'
      : overall.averageRating >= 3.0
      ? 'yellow'
      : 'red';

  const distributionData = [5, 4, 3, 2, 1].map((star) => ({
    star: `${star}★`,
    count: overall.ratingDistribution[star] ?? 0,
    starNum: star,
  }));

  const weeklyData = weeklyTrend.map((w) => ({
    week: w.week.replace(/^\d{4}-W/, 'W'),
    avgRating: w.avgRating,
    count: w.count,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            Feedback Analytics
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            User ratings and feedback across all AI render types
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Section 1 — Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Average Rating"
          value={`${overall.averageRating.toFixed(1)} ★`}
          sub={`across ${overall.totalRatings.toLocaleString()} ratings`}
          color={ratingColor}
          icon={Star}
        />
        <MetricCard
          title="Total Rated Renders"
          value={overall.totalRatings.toLocaleString()}
          sub={`${ratedPercent}% of ${overall.totalRenders.toLocaleString()} renders rated`}
          color="blue"
          icon={BarChart3}
        />
        <MetricCard
          title="Positive Rate"
          value={`${positivePercent}%`}
          sub="Users who rated 4+ stars"
          color="green"
          icon={TrendingUp}
        />
        <MetricCard
          title="Needs Improvement"
          value={`${lowRatedPercent}%`}
          sub="Ratings 1–2 stars"
          color={lowRatedPercent > 15 ? 'red' : 'yellow'}
          icon={AlertTriangle}
        />
      </div>

      {/* Section 2 — Rating distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Rating Distribution
          </CardTitle>
          <CardDescription>How users rated their renders</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={distributionData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="star" width={32} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [
                  `${value} (${overall.totalRatings > 0 ? Math.round((value / overall.totalRatings) * 100) : 0}%)`,
                  'Count',
                ]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {distributionData.map((entry) => (
                  <Cell key={entry.star} fill={BAR_COLORS[entry.starNum] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Section 3 — By feature table */}
      <Card>
        <CardHeader>
          <CardTitle>By Feature Type</CardTitle>
          <CardDescription>Average rating per AI tool</CardDescription>
        </CardHeader>
        <CardContent>
          {byFeature.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No rated renders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">Feature</th>
                    <th className="pb-2 pr-4">Avg Rating</th>
                    <th className="pb-2 pr-4">Rated Count</th>
                    <th className="pb-2">Positive %</th>
                  </tr>
                </thead>
                <tbody>
                  {byFeature.map((row) => (
                    <tr
                      key={row.featureType}
                      className={cn(
                        'border-b last:border-0',
                        row.avgRating < 3.5 && 'bg-red-50 dark:bg-red-950/20'
                      )}
                    >
                      <td className="py-2 pr-4 font-medium capitalize">
                        {row.featureType?.replace(/-/g, ' ') ?? '—'}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <StarDisplay rating={row.avgRating} size="sm" showEmpty />
                          <span className="text-xs text-muted-foreground">{row.avgRating}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-4">{row.count}</td>
                      <td className="py-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            row.positivePercent >= 70
                              ? 'border-green-500 text-green-600'
                              : row.positivePercent >= 50
                              ? 'border-yellow-500 text-yellow-600'
                              : 'border-red-500 text-red-600'
                          )}
                        >
                          {row.positivePercent}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4 — Top feedback tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            What users are saying
          </CardTitle>
          <CardDescription>Top feedback tags by frequency</CardDescription>
        </CardHeader>
        <CardContent>
          {topTags.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No tag feedback yet</p>
          ) : (
            <div className="space-y-2">
              {topTags.map((t) => (
                <div key={t.tag} className="flex items-center gap-3">
                  <span className="w-44 text-sm truncate">
                    {TAG_LABELS[t.tag] ?? t.tag}
                  </span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        POSITIVE_TAGS.has(t.tag) ? 'bg-green-500' : 'bg-orange-500'
                      )}
                      style={{ width: `${Math.min(t.percent, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-20 text-right">
                    {t.count} ({t.percent}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 5 — Recent low-rated renders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Recent Low-Rated Renders
          </CardTitle>
          <CardDescription>Renders rated 1–2 stars — investigate AI quality</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLowRated.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">
              No low-rated renders recently 🎉
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">Feature</th>
                    <th className="pb-2 pr-4">Rating</th>
                    <th className="pb-2 pr-4">Tags</th>
                    <th className="pb-2 pr-4">Comment</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLowRated.map((r) => (
                    <tr key={r._id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 pr-4 capitalize font-medium">
                        {r.featureType?.replace(/-/g, ' ') ?? '—'}
                      </td>
                      <td className="py-2 pr-4">
                        <StarDisplay rating={r.rating} size="sm" showEmpty />
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {r.feedbackTags.length > 0
                            ? r.feedbackTags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                                  {TAG_LABELS[tag]?.replace(/^\S+\s/, '') ?? tag}
                                </Badge>
                              ))
                            : <span className="text-muted-foreground">—</span>}
                        </div>
                      </td>
                      <td className="py-2 pr-4 max-w-[200px]">
                        {r.feedbackComment ? (
                          <span
                            title={r.feedbackComment}
                            className="block truncate text-muted-foreground"
                          >
                            {r.feedbackComment.slice(0, 80)}
                            {r.feedbackComment.length > 80 && '…'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 6 — Weekly trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Weekly Rating Trend
          </CardTitle>
          <CardDescription>Average rating per week (last 8 weeks)</CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyData.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">
              No weekly data yet
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData}>
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [value.toFixed(2), 'Avg Rating']}
                />
                <ReferenceLine
                  y={4.0}
                  stroke="#22c55e"
                  strokeDasharray="4 2"
                  label={{ value: 'Target 4.0', position: 'insideTopRight', fontSize: 11, fill: '#22c55e' }}
                />
                <Line
                  type="monotone"
                  dataKey="avgRating"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
