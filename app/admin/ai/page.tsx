// app/admin/ai/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Server,
  Activity,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Thermometer,
  HardDrive,
  Clock,
  Layers,
  TrendingUp,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types (matches /api/health/comfyui response) ─────────────────────────────
interface ComfyHealth {
  status: "online" | "offline" | "degraded" | string;
  comfyui?: {
    running: boolean;
    systemStats?: {
      system?: {
        os?: string;
        embedded_python?: boolean;
      };
      devices?: Array<{
        name: string;
        type: string;
        vram_total: number;
        vram_free: number;
        torch_vram_total: number;
        torch_vram_free: number;
      }>;
    };
    queue?: {
      queue_running: any[];
      queue_pending: any[];
    };
    error?: string;
  };
  timestamp?: string;
  latency?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatBytes = (bytes: number) => {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${bytes} B`;
};

const StatusDot = ({ online }: { online: boolean }) => (
  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${online ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
);

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AIHealthPage() {
  const [health, setHealth]       = useState<ComfyHealth | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/health/comfyui", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setHealth(json);
      setLastRefresh(new Date());
    } catch (e: any) {
      setError(e.message ?? "Failed to reach health endpoint");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchHealth, 15_000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh]);

  const isOnline   = health?.comfyui?.running === true;
  const devices    = health?.comfyui?.systemStats?.devices ?? [];
  const queueRunning = health?.comfyui?.queue?.queue_running?.length ?? 0;
  const queuePending = health?.comfyui?.queue?.queue_pending?.length ?? 0;
  const primaryGpu = devices[0];
  const vramUsedPct = primaryGpu
    ? Math.round(((primaryGpu.vram_total - primaryGpu.vram_free) / primaryGpu.vram_total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Infrastructure</h1>
          <p className="text-sm text-neutral-400 mt-1">
            ComfyUI GPU health, VRAM usage, and queue status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={`border-neutral-700 text-neutral-300 hover:bg-neutral-800 ${autoRefresh ? "border-emerald-500/50 text-emerald-400" : ""}`}
            onClick={() => setAutoRefresh((a) => !a)}
          >
            {autoRefresh ? <Wifi className="w-4 h-4 mr-2" /> : <WifiOff className="w-4 h-4 mr-2" />}
            {autoRefresh ? "Auto-refresh on" : "Auto-refresh off"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            onClick={fetchHealth}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400"
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Cannot reach ComfyUI health endpoint</p>
            <p className="text-xs mt-0.5 text-red-300/80">{error}</p>
          </div>
          <Button variant="ghost" size="sm" className="ml-auto text-red-400 hover:text-red-300" onClick={fetchHealth}>
            Retry
          </Button>
        </motion.div>
      )}

      {/* ── Status cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading && !health ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="border-neutral-800 bg-neutral-900/50">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24 mb-3 bg-neutral-800" />
                <Skeleton className="h-8 w-16 bg-neutral-800" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            {/* ComfyUI status */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}>
              <Card className={`border overflow-hidden ${isOnline ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                <div className={`h-1 w-full ${isOnline ? "bg-emerald-500" : "bg-red-500"}`} />
                <CardContent className="p-5">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">ComfyUI</p>
                  <p className="text-2xl font-bold text-white mt-1 flex items-center">
                    <StatusDot online={isOnline} />
                    {isOnline ? "Online" : "Offline"}
                  </p>
                  {health?.latency && (
                    <p className="text-xs text-neutral-500 mt-1">{health.latency}ms latency</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* VRAM */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} whileHover={{ y: -2 }}>
              <Card className="border-neutral-800 bg-neutral-900/50 overflow-hidden">
                <div className="h-1 w-full bg-violet-500" />
                <CardContent className="p-5">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">VRAM Used</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {primaryGpu ? `${vramUsedPct}%` : "N/A"}
                  </p>
                  {primaryGpu && (
                    <p className="text-xs text-neutral-500 mt-1">
                      {formatBytes(primaryGpu.vram_total - primaryGpu.vram_free)} / {formatBytes(primaryGpu.vram_total)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Queue running */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} whileHover={{ y: -2 }}>
              <Card className="border-neutral-800 bg-neutral-900/50 overflow-hidden">
                <div className="h-1 w-full bg-amber-500" />
                <CardContent className="p-5">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">Queue Running</p>
                  <p className="text-2xl font-bold text-white mt-1">{queueRunning}</p>
                  <p className="text-xs text-neutral-500 mt-1">{queuePending} pending</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* GPU devices */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} whileHover={{ y: -2 }}>
              <Card className="border-neutral-800 bg-neutral-900/50 overflow-hidden">
                <div className="h-1 w-full bg-blue-500" />
                <CardContent className="p-5">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">GPU Devices</p>
                  <p className="text-2xl font-bold text-white mt-1">{devices.length}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {primaryGpu?.type ?? "—"}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* ── GPU detail ── */}
      {!loading && devices.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-neutral-800 bg-neutral-900/50">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-violet-400" />
                GPU Devices
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              {devices.map((dev, i) => {
                const usedVram = dev.vram_total - dev.vram_free;
                const usedPct  = Math.round((usedVram / dev.vram_total) * 100);
                const torchUsed = dev.torch_vram_total - dev.torch_vram_free;
                return (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{dev.name}</p>
                        <p className="text-xs text-neutral-500">{dev.type}</p>
                      </div>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                        Active
                      </Badge>
                    </div>

                    {/* VRAM bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-neutral-500">VRAM</span>
                        <span className="text-white">{formatBytes(usedVram)} / {formatBytes(dev.vram_total)} ({usedPct}%)</span>
                      </div>
                      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${usedPct > 90 ? "bg-red-500" : usedPct > 70 ? "bg-amber-500" : "bg-violet-500"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${usedPct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    {/* Torch VRAM */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="rounded-lg bg-neutral-800/50 p-3">
                        <p className="text-neutral-500">Torch VRAM Total</p>
                        <p className="text-white font-medium mt-1">{formatBytes(dev.torch_vram_total)}</p>
                      </div>
                      <div className="rounded-lg bg-neutral-800/50 p-3">
                        <p className="text-neutral-500">Torch VRAM Free</p>
                        <p className="text-white font-medium mt-1">{formatBytes(dev.torch_vram_free)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Queue detail ── */}
      {!loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-neutral-800 bg-neutral-900/50">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Queue Status
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-neutral-800/50 p-4 text-center">
                  <p className="text-3xl font-bold text-amber-400">{queueRunning}</p>
                  <p className="text-xs text-neutral-500 mt-1">Running</p>
                </div>
                <div className="rounded-lg bg-neutral-800/50 p-4 text-center">
                  <p className="text-3xl font-bold text-blue-400">{queuePending}</p>
                  <p className="text-xs text-neutral-500 mt-1">Pending</p>
                </div>
                <div className="rounded-lg bg-neutral-800/50 p-4 text-center">
                  <p className="text-3xl font-bold text-white">{queueRunning + queuePending}</p>
                  <p className="text-xs text-neutral-500 mt-1">Total</p>
                </div>
              </div>

              {health?.comfyui?.queue?.queue_running && health.comfyui.queue.queue_running.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Running Jobs</p>
                  <div className="space-y-1">
                    {health.comfyui.queue.queue_running.map((job: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-neutral-400 bg-neutral-800/50 rounded px-3 py-2">
                        <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                        <span className="font-mono">{JSON.stringify(job).slice(0, 80)}…</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── System info ── */}
      {!loading && health?.comfyui?.systemStats?.system && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-neutral-800 bg-neutral-900/50">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-400" />
                System Info
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-neutral-800/50 p-3">
                  <p className="text-neutral-500 text-xs">OS</p>
                  <p className="text-white mt-1">{health.comfyui.systemStats.system.os ?? "—"}</p>
                </div>
                <div className="rounded-lg bg-neutral-800/50 p-3">
                  <p className="text-neutral-500 text-xs">Embedded Python</p>
                  <p className="text-white mt-1">{health.comfyui.systemStats.system.embedded_python ? "Yes" : "No"}</p>
                </div>
                {lastRefresh && (
                  <div className="rounded-lg bg-neutral-800/50 p-3">
                    <p className="text-neutral-500 text-xs">Last Refreshed</p>
                    <p className="text-white mt-1">
                      {lastRefresh.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── No-GPU notice ── */}
      {!loading && !error && devices.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          <Cpu className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No GPU devices reported by ComfyUI</p>
          <p className="text-xs mt-1">ComfyUI may be running in CPU-only mode</p>
        </div>
      )}
    </div>
  );
}
