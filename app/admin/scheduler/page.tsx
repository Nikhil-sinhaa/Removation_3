'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Edit3,
  ChevronDown,
  ChevronUp,
  Activity,
  Pause,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduledTask {
  _id:              string;
  taskId:           string;
  name:             string;
  description:      string;
  cronExpression:   string;
  enabled:          boolean;
  status:           'idle' | 'running' | 'success' | 'failed' | 'disabled';
  lastRunAt?:       string;
  lastRunResult?:   string;
  lastRunDuration?: number;
  nextRunAt?:       string;
  runCount:         number;
  failCount:        number;
}

interface Stats {
  total:    number;
  enabled:  number;
  disabled: number;
  failed:   number;
  running:  number;
}

// ─── Cron expression → human readable ────────────────────────────────────────

function describeCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return expr;
  const [min, hour, day, month, weekday] = parts;

  if (expr === '* * * * *') return 'Every minute';
  if (min.startsWith('*/') && hour === '*' && day === '*' && month === '*' && weekday === '*') {
    return `Every ${min.slice(2)} minutes`;
  }
  if (min !== '*' && !min.startsWith('*/') && hour !== '*' && !hour.startsWith('*/')) {
    const h = parseInt(hour, 10);
    const m = parseInt(min, 10);
    const timeStr = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    if (day === '1' && month === '*' && weekday === '*') return `1st of every month at ${timeStr}`;
    if (weekday !== '*' && weekday !== '0' && day === '*') return `Every ${days[parseInt(weekday,10)]} at ${timeStr}`;
    if (weekday === '*' && day === '*') return `Every day at ${timeStr}`;
    if (weekday === '0' && day === '*') return `Every Sunday at ${timeStr}`;
    if (weekday === '1' && day === '*') return `Every Monday at ${timeStr}`;
  }
  return expr;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ScheduledTask['status'] }) {
  const map: Record<string, { cls: string; label: string; pulse?: boolean }> = {
    idle:       { cls: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30',  label: 'idle' },
    running:    { cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30',           label: 'running', pulse: true },
    success:    { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',  label: 'success' },
    failed:     { cls: 'bg-red-500/10 text-red-400 border-red-500/30',              label: 'failed' },
    disabled:   { cls: 'bg-neutral-700/20 text-neutral-600 border-neutral-700/30',  label: 'disabled' },
  };
  const s = map[status] ?? map.idle;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
      {s.pulse && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
      {s.label}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon: Icon }: {
  label: string; value: number; color: string; icon: React.ElementType;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 overflow-hidden"
    >
      <div className={`absolute top-0 left-0 w-full h-0.5 ${color}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <Icon className="w-5 h-5 text-neutral-500" />
      </div>
    </motion.div>
  );
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  onToggle,
  onRunNow,
  onEditSchedule,
  runningId,
}: {
  task:           ScheduledTask;
  onToggle:       (taskId: string, enabled: boolean) => void;
  onRunNow:       (taskId: string) => void;
  onEditSchedule: (task: ScheduledTask) => void;
  runningId:      string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const isRunning = runningId === task.taskId || task.status === 'running';

  return (
    <>
      <tr className="border-b border-neutral-800/60 hover:bg-neutral-800/20 transition-colors">
        {/* Name */}
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-white">{task.name}</p>
          <p className="text-xs text-neutral-500 mt-0.5">{task.description}</p>
        </td>

        {/* Schedule */}
        <td className="px-4 py-3">
          <p className="text-xs font-mono text-neutral-300">{task.cronExpression}</p>
          <p className="text-xs text-neutral-600 mt-0.5">{describeCron(task.cronExpression)}</p>
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          <StatusBadge status={task.status} />
        </td>

        {/* Last Run */}
        <td className="px-4 py-3">
          {task.lastRunAt ? (
            <div>
              <p className="text-xs text-neutral-400">
                {new Date(task.lastRunAt).toLocaleString('en-IN', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
                })}
              </p>
              {task.lastRunDuration !== undefined && (
                <p className="text-xs text-neutral-600">
                  {task.lastRunDuration < 1000
                    ? `${task.lastRunDuration}ms`
                    : `${(task.lastRunDuration / 1000).toFixed(1)}s`}
                </p>
              )}
            </div>
          ) : (
            <span className="text-xs text-neutral-700">Never</span>
          )}
        </td>

        {/* Run count */}
        <td className="px-4 py-3 text-center">
          <span className="text-sm text-neutral-400">{task.runCount}</span>
          {task.failCount > 0 && (
            <span className="text-xs text-red-500 ml-1">({task.failCount} failed)</span>
          )}
        </td>

        {/* Next run */}
        <td className="px-4 py-3">
          {task.nextRunAt ? (
            <p className="text-xs text-neutral-500">
              {new Date(task.nextRunAt).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
              })}
            </p>
          ) : (
            <span className="text-xs text-neutral-700">—</span>
          )}
        </td>

        {/* Actions */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRunNow(task.taskId)}
              disabled={isRunning || !task.enabled}
              className="h-7 px-2 text-xs border-neutral-700 hover:border-violet-500/60 hover:bg-violet-500/10 hover:text-violet-300"
            >
              {isRunning
                ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                : <Play className="h-3 w-3 mr-1" />}
              Run Now
            </Button>

            <button
              onClick={() => onToggle(task.taskId, !task.enabled)}
              className={`flex items-center gap-1 text-xs transition-colors ${
                task.enabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title={task.enabled ? 'Disable task' : 'Enable task'}
            >
              {task.enabled
                ? <ToggleRight className="h-5 w-5" />
                : <ToggleLeft className="h-5 w-5" />}
            </button>

            <button
              onClick={() => onEditSchedule(task)}
              className="text-neutral-500 hover:text-neutral-300 transition-colors"
              title="Edit schedule"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>

            {task.lastRunResult && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="text-neutral-600 hover:text-neutral-400 transition-colors"
              >
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded result */}
      <AnimatePresence>
        {expanded && task.lastRunResult && (
          <tr>
            <td colSpan={7} className="bg-neutral-950/50 px-4 pb-3">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pt-2"
              >
                <p className="text-xs text-neutral-500 mb-1">Last result</p>
                <p className={`text-xs px-3 py-2 rounded-lg ${
                  task.status === 'failed'
                    ? 'bg-red-950/30 text-red-300 border border-red-900/40'
                    : 'bg-neutral-900 text-neutral-300 border border-neutral-800'
                }`}>
                  {task.lastRunResult}
                </p>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SchedulerPage() {
  const [tasks, setTasks]     = useState<ScheduledTask[]>([]);
  const [stats, setStats]     = useState<Stats>({ total: 0, enabled: 0, disabled: 0, failed: 0, running: 0 });
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);

  const [editDialog, setEditDialog]   = useState<ScheduledTask | null>(null);
  const [editCron, setEditCron]       = useState('');
  const [editSaving, setEditSaving]   = useState(false);

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/admin/scheduler');
      const data = await res.json();
      setTasks(data.tasks ?? []);
      setStats(data.stats ?? { total: 0, enabled: 0, disabled: 0, failed: 0, running: 0 });
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10_000);
    return () => clearInterval(interval);
  }, [load]);

  const handleRunNow = async (taskId: string) => {
    setRunningId(taskId);
    try {
      const res  = await fetch(`/api/cron/run/${taskId}`, { method: 'POST' });
      const data = await res.json();
      toast({
        title:   data.success ? 'Task completed' : 'Task failed',
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      });
      await load();
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      setRunningId(null);
    }
  };

  const handleToggle = async (taskId: string, enabled: boolean) => {
    try {
      await fetch(`/api/admin/scheduler/${taskId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ enabled }),
      });
      toast({ title: enabled ? 'Task enabled' : 'Task disabled' });
      await load();
    } catch {
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  };

  const handleEditOpen = (task: ScheduledTask) => {
    setEditDialog(task);
    setEditCron(task.cronExpression);
  };

  const handleEditSave = async () => {
    if (!editDialog) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/scheduler/${editDialog.taskId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ cronExpression: editCron }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast({ title: 'Schedule updated', description: describeCron(editCron) });
      setEditDialog(null);
      await load();
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-violet-400" />
            <h1 className="text-xl font-bold">Task Scheduler</h1>
          </div>
          <p className="text-sm text-neutral-500">
            Automated background tasks — enable, disable, and trigger on demand
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-900 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Tasks"  value={stats.total}    color="bg-gradient-to-r from-violet-600 to-violet-400"  icon={Activity} />
        <StatCard label="Enabled"      value={stats.enabled}  color="bg-gradient-to-r from-emerald-600 to-emerald-400" icon={CheckCircle2} />
        <StatCard label="Disabled"     value={stats.disabled} color="bg-gradient-to-r from-neutral-600 to-neutral-400" icon={Pause} />
        <StatCard label="Failed"       value={stats.failed}   color="bg-gradient-to-r from-red-600 to-red-400"         icon={XCircle} />
        <StatCard label="Running Now"  value={stats.running}  color="bg-gradient-to-r from-blue-600 to-blue-400"       icon={Loader2} />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-2">
          <Clock className="w-4 h-4 text-neutral-500" />
          <p className="text-sm text-neutral-400">
            {loading ? 'Loading…' : `${tasks.length} scheduled tasks`}
          </p>
          <span className="text-xs text-neutral-600 ml-auto">Auto-refreshes every 10s</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800 text-xs text-neutral-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Task</th>
                <th className="px-4 py-3 text-left">Schedule</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Last Run</th>
                <th className="px-4 py-3 text-center">Runs</th>
                <th className="px-4 py-3 text-left">Next Run</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-800/60">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-neutral-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Calendar className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                    <p className="text-neutral-600 text-sm">No scheduled tasks found</p>
                    <p className="text-neutral-700 text-xs mt-1">
                      Tasks are seeded on first API call
                    </p>
                  </td>
                </tr>
              ) : (
                tasks.map(task => (
                  <TaskRow
                    key={task._id}
                    task={task}
                    onToggle={handleToggle}
                    onRunNow={handleRunNow}
                    onEditSchedule={handleEditOpen}
                    runningId={runningId}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit schedule dialog */}
      <Dialog open={!!editDialog} onOpenChange={open => !open && setEditDialog(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-violet-400" />
              Edit Schedule — {editDialog?.name}
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Update the cron expression. Uses 5-field format: min hour day month weekday
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="cron-input" className="text-neutral-300">Cron Expression</Label>
              <Input
                id="cron-input"
                value={editCron}
                onChange={e => setEditCron(e.target.value)}
                placeholder="0 3 * * *"
                className="mt-1.5 font-mono bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            {editCron && (
              <p className="text-sm text-violet-300 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {describeCron(editCron)}
              </p>
            )}
            <div className="text-xs text-neutral-600 space-y-1 bg-neutral-800/50 rounded-lg p-3">
              <p className="font-medium text-neutral-500 mb-2">Examples</p>
              <p><code className="text-neutral-400">* * * * *</code> — every minute</p>
              <p><code className="text-neutral-400">*/15 * * * *</code> — every 15 minutes</p>
              <p><code className="text-neutral-400">0 3 * * *</code> — every day at 3:00 AM</p>
              <p><code className="text-neutral-400">0 9 * * 1</code> — every Monday at 9:00 AM</p>
              <p><code className="text-neutral-400">0 4 1 * *</code> — 1st of every month at 4:00 AM</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialog(null)}
              className="border-neutral-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={editSaving || !editCron.trim()}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {editSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
