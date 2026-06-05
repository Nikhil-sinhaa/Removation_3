'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  RefreshCw,
  Loader2,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

interface QueueStats {
  queueDepth: number;
  currentlyProcessing: string | null;
  totalQueued: number;
  totalCompleted: number;
  totalFailed: number;
}

interface QueuedJob {
  position: number;
  jobId: string;
  featureType: string;
  queuedAt: string | null;
  estimatedDurationSeconds: number;
}

interface RecentJob {
  featureType: string;
  jobStatus: string;
  durationSeconds: number | null;
  completedAt: string | null;
  queuedAt: string | null;
}

interface QueueData {
  stats: QueueStats;
  queuedJobs: QueuedJob[];
  recentJobs: RecentJob[];
  registrySize: number;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function featureLabel(key: string): string {
  const map: Record<string, string> = {
    'room-changer': 'Room Changer',
    'style-transfer': 'Style Transfer',
    'lighting': 'AI Lighting',
    'furniture-remover': 'Furniture Remover',
    'ceiling-changer': 'Ceiling Changer',
    'furniture-placement': 'Furniture Placement',
    'interior-render': 'Interior Render',
    'exterior-render': 'Exterior Render',
    'redesign': 'Redesign',
    'recolor': 'Recolor',
    'remove-object': 'Remove Object',
  };
  return map[key] ?? key;
}

export default function AdminQueuePage() {
  const { toast } = useToast();
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/queue');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('[QueueMonitor] fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + auto-refresh every 5 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAction = async (action: 'flush_stuck_lock' | 'clear_queue') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Action failed');

      toast({
        title: action === 'flush_stuck_lock' ? 'Lock released' : 'Queue cleared',
        description: action === 'clear_queue'
          ? `Cancelled ${json.cancelledCount} jobs.`
          : 'Stuck lock released successfully.',
      });
      await fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const stats = data?.stats;
  const successRate =
    stats && (stats.totalCompleted + stats.totalFailed) > 0
      ? Math.round((stats.totalCompleted / (stats.totalCompleted + stats.totalFailed)) * 100)
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-violet-600" />
            Queue Monitor
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time AI generation queue status. Auto-refreshes every 5s.
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={actionLoading}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>

          {/* Force Release Lock */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={actionLoading} className="text-orange-600 border-orange-200 hover:bg-orange-50">
                <AlertTriangle className="w-4 h-4 mr-1.5" />
                Release Lock
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Release Stuck Lock?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete the Redis worker lock and processing marker. Use only if a job
                  is stuck and no new jobs are processing. The stuck job will need to be resubmitted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleAction('flush_stuck_lock')}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Release Lock
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Clear Queue */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={actionLoading}>
                <Trash2 className="w-4 h-4 mr-1.5" />
                Clear Queue
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Entire Queue?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will cancel ALL waiting jobs and mark them as failed. Currently processing
                  jobs are not affected. Credits will NOT be automatically refunded — users must
                  be refunded manually.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleAction('clear_queue')}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Clear All Jobs
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Queue Depth</p>
              <Clock className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.queueDepth ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">jobs waiting</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Processing</p>
              <Zap className={`w-4 h-4 ${stats?.currentlyProcessing ? 'text-blue-500 animate-pulse' : 'text-gray-300'}`} />
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {stats?.currentlyProcessing ? '1' : '0'}
            </p>
            <p className="text-xs text-gray-400 mt-1 truncate">
              {stats?.currentlyProcessing ? `Job: ${stats.currentlyProcessing.slice(0, 20)}…` : 'idle'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Total Processed</p>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalCompleted ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">{stats?.totalFailed ?? 0} failed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Success Rate</p>
              <Activity className="w-4 h-4 text-violet-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {successRate !== null ? `${successRate}%` : '—'}
            </p>
            <p className="text-xs text-gray-400 mt-1">fn registry: {data?.registrySize ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queued jobs table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Waiting in Queue</CardTitle>
            <CardDescription>Jobs queued but not yet processing</CardDescription>
          </CardHeader>
          <CardContent>
            {!data?.queuedJobs?.length ? (
              <div className="text-center py-8 text-gray-400 text-sm">Queue is empty</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-gray-500 uppercase tracking-wider">
                      <th className="text-left pb-2 pr-3">#</th>
                      <th className="text-left pb-2 pr-3">Feature</th>
                      <th className="text-left pb-2 pr-3">Queued</th>
                      <th className="text-left pb-2">Est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.queuedJobs.map((job) => (
                      <tr key={job.jobId} className="hover:bg-gray-50/50">
                        <td className="py-2 pr-3">
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">{job.position}</Badge>
                        </td>
                        <td className="py-2 pr-3 font-medium text-gray-800">
                          {featureLabel(job.featureType)}
                        </td>
                        <td className="py-2 pr-3 text-gray-500 text-xs">
                          {formatRelative(job.queuedAt)}
                        </td>
                        <td className="py-2 text-gray-500 text-xs">
                          ~{job.estimatedDurationSeconds}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent completed/failed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Jobs</CardTitle>
            <CardDescription>Last 10 completed or failed</CardDescription>
          </CardHeader>
          <CardContent>
            {!data?.recentJobs?.length ? (
              <div className="text-center py-8 text-gray-400 text-sm">No recent jobs</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-gray-500 uppercase tracking-wider">
                      <th className="text-left pb-2 pr-3">Feature</th>
                      <th className="text-left pb-2 pr-3">Status</th>
                      <th className="text-left pb-2 pr-3">Duration</th>
                      <th className="text-left pb-2">Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.recentJobs.map((job, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="py-2 pr-3 font-medium text-gray-800 text-xs">
                          {featureLabel(job.featureType ?? 'unknown')}
                        </td>
                        <td className="py-2 pr-3">
                          {job.jobStatus === 'completed' ? (
                            <Badge className="bg-green-100 text-green-700 text-xs px-1.5 py-0 border-0">
                              <CheckCircle2 className="w-3 h-3 mr-1" />done
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 text-xs px-1.5 py-0 border-0">
                              <XCircle className="w-3 h-3 mr-1" />failed
                            </Badge>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-gray-500 text-xs">
                          {formatDuration(job.durationSeconds)}
                        </td>
                        <td className="py-2 text-gray-500 text-xs">
                          {formatRelative(job.completedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
