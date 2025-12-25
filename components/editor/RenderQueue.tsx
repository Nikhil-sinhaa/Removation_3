// components/editor/RenderQueue.tsx
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  Trash2,
  MoreVertical,
  Image,
  RefreshCw,
  Sparkles,
  Zap,
  ArrowUp,
  ArrowDown,
  X,
  Eye,
  Download,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type RenderStatus = 
  | "queued" 
  | "processing" 
  | "completed" 
  | "failed" 
  | "paused" 
  | "cancelled";

export interface RenderJob {
  id: string;
  projectId: string;
  projectName: string;
  imageUrl: string;
  outputUrl?: string;
  style: string;
  roomType: string;
  status: RenderStatus;
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTime?: number; // in seconds
  error?: string;
  priority: number;
}

interface RenderQueueProps {
  jobs: RenderJob[];
  onPause?: (jobId: string) => void;
  onResume?: (jobId: string) => void;
  onCancel?: (jobId: string) => void;
  onRetry?: (jobId: string) => void;
  onRemove?: (jobId: string) => void;
  onReorder?: (jobs: RenderJob[]) => void;
  onView?: (job: RenderJob) => void;
  onDownload?: (job: RenderJob) => void;
  onClearCompleted?: () => void;
  maxConcurrent?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const statusConfig: Record<RenderStatus, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  label: string;
}> = {
  queued: {
    icon: <Clock className="w-4 h-4" />,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    label: "Queued",
  },
  processing: {
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    label: "Processing",
  },
  completed: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    label: "Completed",
  },
  failed: {
    icon: <XCircle className="w-4 h-4" />,
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    label: "Failed",
  },
  paused: {
    icon: <Pause className="w-4 h-4" />,
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    label: "Paused",
  },
  cancelled: {
    icon: <X className="w-4 h-4" />,
    color: "text-gray-600",
    bgColor: "bg-gray-100 dark:bg-gray-900/30",
    label: "Cancelled",
  },
};

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  
  if (diffSecs < 60) return "Just now";
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
  if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
  return `${Math.floor(diffSecs / 86400)}d ago`;
}

function RenderJobCard({
  job,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onRemove,
  onView,
  onDownload,
}: {
  job: RenderJob;
  onPause?: (jobId: string) => void;
  onResume?: (jobId: string) => void;
  onCancel?: (jobId: string) => void;
  onRetry?: (jobId: string) => void;
  onRemove?: (jobId: string) => void;
  onView?: (job: RenderJob) => void;
  onDownload?: (job: RenderJob) => void;
}) {
  const config = statusConfig[job.status];
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    if (job.status === "processing" && job.startedAt) {
      const interval = setInterval(() => {
        const elapsed = Math.floor(
          (new Date().getTime() - job.startedAt!.getTime()) / 1000
        );
        setTimeElapsed(elapsed);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [job.status, job.startedAt]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        "flex gap-3 p-3 rounded-lg border transition-colors",
        job.status === "processing" && "border-primary/50 bg-primary/5",
        job.status === "failed" && "border-red-500/50 bg-red-50 dark:bg-red-900/10"
      )}
    >
      {/* Thumbnail */}
      <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
        <img
          src={job.status === "completed" ? job.outputUrl : job.imageUrl}
          alt={job.projectName}
          className="w-full h-full object-cover"
        />
        <div className={cn(
          "absolute inset-0 flex items-center justify-center",
          config.bgColor,
          "bg-opacity-80"
        )}>
          <span className={config.color}>{config.icon}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{job.projectName}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{job.style}</span>
              <span>•</span>
              <span>{job.roomType}</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {job.status === "completed" && (
                <>
                  <DropdownMenuItem onClick={() => onView?.(job)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Result
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDownload?.(job)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {job.status === "processing" && (
                <DropdownMenuItem onClick={() => onPause?.(job.id)}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </DropdownMenuItem>
              )}
              {job.status === "paused" && (
                <DropdownMenuItem onClick={() => onResume?.(job.id)}>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </DropdownMenuItem>
              )}
              {job.status === "failed" && (
                <DropdownMenuItem onClick={() => onRetry?.(job.id)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </DropdownMenuItem>
              )}
              {(job.status === "queued" || job.status === "processing") && (
                <DropdownMenuItem 
                  onClick={() => onCancel?.(job.id)}
                  className="text-destructive"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onRemove?.(job.id)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress */}
        {(job.status === "processing" || job.status === "queued") && (
          <div className="mt-2 space-y-1">
            <Progress value={job.progress} className="h-1.5" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{job.progress}%</span>
              {job.status === "processing" && (
                <span>
                  {job.estimatedTime && job.estimatedTime > timeElapsed
                    ? `~${formatTime(job.estimatedTime - timeElapsed)} left`
                    : formatTime(timeElapsed)
                  }
                </span>
              )}
              {job.status === "queued" && (
                <span>Waiting in queue...</span>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {job.status === "failed" && job.error && (
          <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="w-3 h-3" />
            <span className="truncate">{job.error}</span>
          </div>
        )}

        {/* Completion Time */}
        {job.status === "completed" && job.completedAt && (
          <div className="mt-2 text-xs text-muted-foreground">
            Completed {formatTimeAgo(job.completedAt)}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function RenderQueue({
  jobs,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onRemove,
  onReorder,
  onView,
  onDownload,
  onClearCompleted,
  maxConcurrent = 2,
  isCollapsed = false,
  onToggleCollapse,
}: RenderQueueProps) {
  const processingCount = jobs.filter((j) => j.status === "processing").length;
  const queuedCount = jobs.filter((j) => j.status === "queued").length;
  const completedCount = jobs.filter((j) => j.status === "completed").length;
  const failedCount = jobs.filter((j) => j.status === "failed").length;

  const sortedJobs = [...jobs].sort((a, b) => {
    // Sort by status priority
    const statusOrder: Record<RenderStatus, number> = {
      processing: 0,
      queued: 1,
      paused: 2,
      failed: 3,
      completed: 4,
      cancelled: 5,
    };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">No renders in queue</h3>
        <p className="text-sm text-muted-foreground">
          Start a new render to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Render Queue</h3>
          {processingCount > 0 && (
            <Badge variant="default" className="gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {processingCount}/{maxConcurrent}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Stats */}
          <TooltipProvider>
            <div className="flex items-center gap-1">
              {queuedCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="w-3 h-3" />
                      {queuedCount}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Queued</TooltipContent>
                </Tooltip>
              )}
              {completedCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="gap-1 text-green-600">
                      <CheckCircle2 className="w-3 h-3" />
                      {completedCount}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Completed</TooltipContent>
                </Tooltip>
              )}
              {failedCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="gap-1 text-red-600">
                      <XCircle className="w-3 h-3" />
                      {failedCount}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Failed</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>

          {/* Actions */}
          {completedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearCompleted}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear completed
            </Button>
          )}
        </div>
      </div>

      {/* Queue List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {sortedJobs.map((job) => (
              <RenderJobCard
                key={job.id}
                job={job}
                onPause={onPause}
                onResume={onResume}
                onCancel={onCancel}
                onRetry={onRetry}
                onRemove={onRemove}
                onView={onView}
                onDownload={onDownload}
              />
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-3 border-t bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>
              {processingCount > 0 
                ? `Processing ${processingCount} of ${maxConcurrent} max`
                : "Queue idle"
              }
            </span>
          </div>
          <span>
            {jobs.length} total render{jobs.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}