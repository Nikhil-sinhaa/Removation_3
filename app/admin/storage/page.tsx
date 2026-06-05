// app/admin/storage/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HardDrive,
  Image as ImageIcon,
  Users,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  Upload,
  Database,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ───────────────────────────────────────────────────────────────────
interface StorageBreakdownItem {
  label: string;
  count: number;
  bytes: number;
  formatted: string;
  percentage: number;
  icon: string;
}

interface StorageModeItem {
  mode: string;
  count: number;
  bytes: number;
  formatted: string;
}

interface StorageData {
  summary: {
    totalFiles: number;
    totalBytes: number;
    totalFormatted: string;
    usedPercent: number;
  };
  counts: {
    totalUsers: number;
    usersWithAvatar: number;
    totalRenders: number;
    completedRenders: number;
    failedRenders: number;
    processingRenders: number;
    rendersWithOutput: number;
  };
  breakdown: StorageBreakdownItem[];
  modeStorage: StorageModeItem[];
}

// ─── Icon map ─────────────────────────────────────────────────────────────────
const iconMap: Record<string, React.ReactNode> = {
  avatar:   <Users className="w-5 h-5 text-blue-400" />,
  upload:   <Upload className="w-5 h-5 text-amber-400" />,
  sparkles: <Sparkles className="w-5 h-5 text-violet-400" />,
};

const COLOR_MAP = ["bg-blue-500", "bg-amber-500", "bg-violet-500", "bg-emerald-500"];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StorageAdminPage() {
  const [data,    setData]    = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/storage");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-neutral-800 bg-neutral-900/50">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24 mb-3 bg-neutral-800" />
                <Skeleton className="h-8 w-32 bg-neutral-800" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardContent className="p-6">
            <Skeleton className="h-32 bg-neutral-800" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Storage</h1>
          <p className="text-sm text-neutral-400 mt-1">
            UploadThing file estimates derived from DB records · estimated values
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* ── Error ── */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400"
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <Button variant="ghost" size="sm" className="ml-auto text-red-400 hover:text-red-300" onClick={fetchData}>
            Retry
          </Button>
        </motion.div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "Total Est. Storage",  value: data?.summary.totalFormatted ?? "—",                          icon: <HardDrive className="w-5 h-5 text-violet-400" />,  color: "bg-violet-500" },
          { title: "Total Files",         value: data ? data.summary.totalFiles.toLocaleString() : "—",        icon: <Database className="w-5 h-5 text-blue-400" />,     color: "bg-blue-500" },
          { title: "Completed Renders",   value: data ? data.counts.completedRenders.toLocaleString() : "—",   icon: <ImageIcon className="w-5 h-5 text-emerald-400" />, color: "bg-emerald-500" },
          { title: "Users w/ Avatar",     value: data ? data.counts.usersWithAvatar.toLocaleString() : "—",    icon: <Users className="w-5 h-5 text-amber-400" />,       color: "bg-amber-500" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -2 }}>
            <Card className="border-neutral-800 bg-neutral-900/50 overflow-hidden">
              <div className={`h-1 w-full ${s.color}`} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider">{s.title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-800">{s.icon}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Breakdown pie-like bars ── */}
      {data && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-neutral-800 bg-neutral-900/50">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-violet-400" />
                Storage by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              {data.breakdown.map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      {iconMap[item.icon]}
                      <span className="text-white">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-neutral-300 font-medium">{item.formatted}</span>
                      <span className="text-neutral-500 ml-2 text-xs">({item.percentage}%) · {item.count.toLocaleString()} files</span>
                    </div>
                  </div>
                  <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${COLOR_MAP[i % COLOR_MAP.length]}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 0.9, ease: "easeOut", delay: i * 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── By mode ── */}
      {data && data.modeStorage.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-neutral-800 bg-neutral-900/50">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                Storage by AI Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      {["Mode", "Renders", "Est. Storage"].map((h) => (
                        <th key={h} className="p-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.modeStorage.map((m, i) => (
                      <motion.tr
                        key={m.mode}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-neutral-800 hover:bg-neutral-800/30 transition-colors"
                      >
                        <td className="p-3">
                          <span className="text-sm text-white capitalize">{m.mode.replace(/_/g, " ")}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-neutral-400">{m.count.toLocaleString()}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm font-medium text-violet-400">{m.formatted}</span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── DB counts detail ── */}
      {data && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-neutral-800 bg-neutral-900/50">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                Database Record Counts
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Total Users",       value: data.counts.totalUsers },
                  { label: "Total Renders",     value: data.counts.totalRenders },
                  { label: "Renders w/ Output", value: data.counts.rendersWithOutput },
                  { label: "Failed Renders",    value: data.counts.failedRenders },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-neutral-800/50 p-3 text-center">
                    <p className="text-2xl font-bold text-white">{item.value.toLocaleString()}</p>
                    <p className="text-xs text-neutral-500 mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-neutral-600 mt-3">
                * Storage estimates: ~800 KB/input, ~2 MB/output, ~150 KB/avatar. Actual usage may differ.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
