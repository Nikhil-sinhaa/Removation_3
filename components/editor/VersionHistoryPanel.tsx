'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, RotateCcw, Pin, PinOff, Trash2, Save,
  RefreshCw, Loader2, AlertCircle, Zap, Camera, Check,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SnapshotTrigger } from '@/lib/db/models/Snapshot';

interface Snapshot {
  _id:          string;
  version:      number;
  label:        string;
  trigger:      SnapshotTrigger;
  thumbnailUrl?: string;
  isPinned:     boolean;
  sizeBytes?:   number;
  createdAt:    string | Date;
}

const TRIGGER_CONFIG: Record<SnapshotTrigger, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  manual_save:     { icon: Save,      color: 'text-green-500'  },
  auto_save:       { icon: Clock,     color: 'text-blue-500'   },
  render_complete: { icon: Zap,       color: 'text-purple-500' },
  before_generate: { icon: Camera,    color: 'text-orange-500' },
  restore:         { icon: RotateCcw, color: 'text-yellow-500' },
};

interface VersionHistoryPanelProps {
  projectId: string;
}

export function VersionHistoryPanel({ projectId }: VersionHistoryPanelProps) {
  const [snapshots,      setSnapshots]      = useState<Snapshot[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [restoring,      setRestoring]      = useState<string | null>(null);
  const [confirmTarget,  setConfirmTarget]  = useState<Snapshot | null>(null);
  const [savingNow,      setSavingNow]      = useState(false);

  const fetchSnapshots = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/projects/${projectId}/snapshots`);
      const data = await res.json();
      setSnapshots(data.snapshots || []);
      setError(null);
    } catch {
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Initial load
  useEffect(() => { fetchSnapshots(); }, [fetchSnapshots]);

  // Auto-save every 2 minutes
  useEffect(() => {
    if (!projectId) return;
    const interval = setInterval(async () => {
      try {
        await fetch(`/api/projects/${projectId}/snapshots`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ trigger: 'auto_save' }),
        });
        // Refresh snapshot list silently
        const res  = await fetch(`/api/projects/${projectId}/snapshots`);
        const data = await res.json();
        setSnapshots(data.snapshots || []);
      } catch {
        // Non-blocking — auto-save failures are silent
      }
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [projectId]);

  const handleSaveNow = async () => {
    setSavingNow(true);
    try {
      await fetch(`/api/projects/${projectId}/snapshots`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ trigger: 'manual_save' }),
      });
      await fetchSnapshots();
    } catch {
      // Non-blocking
    } finally {
      setSavingNow(false);
    }
  };

  const handleRestore = async (snapshot: Snapshot) => {
    setRestoring(snapshot._id);
    setConfirmTarget(null);
    try {
      const res  = await fetch(
        `/api/projects/${projectId}/snapshots/${snapshot._id}/restore`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (data.success) {
        await fetchSnapshots();
        // Notify the editor page to reload
        window.dispatchEvent(new CustomEvent('project-restored', {
          detail: { projectId, restoredData: data.restoredData }
        }));
      }
    } catch {
      // Non-blocking
    } finally {
      setRestoring(null);
    }
  };

  const handleTogglePin = async (snapshot: Snapshot) => {
    try {
      await fetch(`/api/projects/${projectId}/snapshots/${snapshot._id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ isPinned: !snapshot.isPinned }),
      });
      setSnapshots(prev => prev.map(s =>
        s._id === snapshot._id ? { ...s, isPinned: !s.isPinned } : s
      ));
    } catch {
      // Non-blocking
    }
  };

  const handleDelete = async (snapshot: Snapshot) => {
    try {
      await fetch(`/api/projects/${projectId}/snapshots/${snapshot._id}`, {
        method: 'DELETE',
      });
      setSnapshots(prev => prev.filter(s => s._id !== snapshot._id));
    } catch {
      // Non-blocking
    }
  };

  const formatTime = (date: Date | string) => {
    const d       = new Date(date);
    const diffMs  = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    const diffH   = Math.floor(diffMin  / 60);
    const diffD   = Math.floor(diffH    / 24);
    if (diffMin < 1)  return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffH   < 24) return `${diffH}h ago`;
    if (diffD   <  7) return `${diffD}d ago`;
    return d.toLocaleDateString();
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024)        return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1 py-2">
        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Version History
          {snapshots.length > 0 && (
            <span className="text-xs opacity-60">({snapshots.length})</span>
          )}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchSnapshots}
            className="h-7 w-7"
            title="Refresh"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveNow}
            disabled={savingNow}
            className="h-7 px-2 text-xs"
            title="Save snapshot now"
          >
            {savingNow
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <><Save className="w-3 h-3 mr-1" />Save</>
            }
          </Button>
        </div>
      </div>

      {/* Body */}
      <ScrollArea className="flex-1 -mx-1">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 py-4 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && snapshots.length === 0 && (
          <div className="py-8 text-center">
            <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No history yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-[220px] mx-auto">
              Auto-saves every 2 min. Click Save to capture the current state now.
            </p>
          </div>
        )}

        {!loading && snapshots.length > 0 && (
          <div className="space-y-0.5">
            {snapshots.map((snapshot, idx) => {
              const cfg         = TRIGGER_CONFIG[snapshot.trigger] ?? TRIGGER_CONFIG.manual_save;
              const Icon        = cfg.icon;
              const isRestoring = restoring === snapshot._id;

              return (
                <motion.div
                  key={snapshot._id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="group px-1 py-2 rounded-md hover:bg-accent transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 shrink-0 ${cfg.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-medium truncate">{snapshot.label}</span>
                        {snapshot.isPinned && <Pin className="w-2.5 h-2.5 text-yellow-500 shrink-0" />}
                        {idx === 0 && (
                          <span className="text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1 rounded">
                            Latest
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                        <span>{formatTime(snapshot.createdAt)}</span>
                        {snapshot.sizeBytes ? <span>{formatSize(snapshot.sizeBytes)}</span> : null}
                        <span>v{snapshot.version}</span>
                      </div>
                    </div>

                    {snapshot.thumbnailUrl && (
                      <img
                        src={snapshot.thumbnailUrl}
                        alt=""
                        className="w-10 h-8 rounded object-cover shrink-0 bg-muted"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </div>

                  {/* Actions — appear on hover */}
                  <div className="mt-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmTarget(snapshot)}
                      disabled={!!restoring}
                      className="h-6 px-2 text-xs hover:bg-purple-100 dark:hover:bg-purple-900/40"
                    >
                      {isRestoring
                        ? <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        : <RotateCcw className="w-3 h-3 mr-1" />
                      }
                      Restore
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTogglePin(snapshot)}
                      className="h-6 w-6"
                      title={snapshot.isPinned ? 'Unpin' : 'Pin (keep forever)'}
                    >
                      {snapshot.isPinned
                        ? <PinOff className="w-3 h-3 text-yellow-500" />
                        : <Pin    className="w-3 h-3 text-muted-foreground" />
                      }
                    </Button>

                    {!snapshot.isPinned && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(snapshot)}
                        className="h-6 w-6"
                        title="Delete snapshot"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Restore confirmation dialog */}
      <Dialog open={!!confirmTarget} onOpenChange={open => !open && setConfirmTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore to this version?</DialogTitle>
            <DialogDescription>
              This will revert <strong>{confirmTarget?.label}</strong> onto your project.
              A backup of the current state is saved automatically before restoring.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => confirmTarget && handleRestore(confirmTarget)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default VersionHistoryPanel;
