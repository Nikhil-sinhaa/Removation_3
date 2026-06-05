// app/admin/settings/audit-logs/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Search, Filter, Download, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  User, Tag, Globe, Clock, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, AlertTriangle, Activity,
  Users, Paintbrush, Wrench, ShoppingBag, Image, Settings,
  CreditCard, Trash2, Ban, RotateCcw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditLog {
  _id: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  adminIp: string;
  action: string;
  category: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface Stats {
  total: number;
  today: number;
  byCategory: Record<string, number>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['users', 'designers', 'contractors', 'vendors', 'renders', 'subscriptions', 'system', 'auth'];

const CATEGORY_COLORS: Record<string, string> = {
  users:         'bg-blue-500/10 text-blue-400 border-blue-500/30',
  designers:     'bg-violet-500/10 text-violet-400 border-violet-500/30',
  contractors:   'bg-orange-500/10 text-orange-400 border-orange-500/30',
  vendors:       'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  renders:       'bg-pink-500/10 text-pink-400 border-pink-500/30',
  subscriptions: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  system:        'bg-neutral-500/10 text-neutral-400 border-neutral-500/30',
  auth:          'bg-red-500/10 text-red-400 border-red-500/30',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  users:         <Users className="w-3.5 h-3.5" />,
  designers:     <Paintbrush className="w-3.5 h-3.5" />,
  contractors:   <Wrench className="w-3.5 h-3.5" />,
  vendors:       <ShoppingBag className="w-3.5 h-3.5" />,
  renders:       <Image className="w-3.5 h-3.5" />,
  subscriptions: <CreditCard className="w-3.5 h-3.5" />,
  system:        <Settings className="w-3.5 h-3.5" />,
  auth:          <Shield className="w-3.5 h-3.5" />,
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'user.ban':            <Ban className="w-3.5 h-3.5 text-red-400" />,
  'user.unban':          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
  'user.suspend':        <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />,
  'user.delete':         <Trash2 className="w-3.5 h-3.5 text-red-500" />,
  'user.credits.add':    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />,
  'user.credits.deduct': <CreditCard className="w-3.5 h-3.5 text-orange-400" />,
  'user.role.change':    <Shield className="w-3.5 h-3.5 text-violet-400" />,
  'user.plan.change':    <Tag className="w-3.5 h-3.5 text-blue-400" />,
  'designer.approve':    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
  'designer.reject':     <XCircle className="w-3.5 h-3.5 text-red-400" />,
  'contractor.approve':  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
  'contractor.reject':   <XCircle className="w-3.5 h-3.5 text-red-400" />,
  'vendor.approve':      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
  'vendor.reject':       <XCircle className="w-3.5 h-3.5 text-red-400" />,
  'render.delete':       <Trash2 className="w-3.5 h-3.5 text-red-500" />,
  'render.flag':         <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />,
  'render.unflag':       <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />,
  'system.config.change': <Settings className="w-3.5 h-3.5 text-neutral-400" />,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon, color,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="relative rounded-xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm overflow-hidden p-5"
    >
      <div className={`absolute top-0 left-0 w-full h-0.5 ${color}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {sub && <p className="text-xs text-neutral-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${color.replace('bg-gradient', 'bg')} bg-opacity-10`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${color}`}>
      {CATEGORY_ICONS[category]}
      {category}
    </span>
  );
}

function MetadataViewer({ data }: { data: Record<string, unknown> }) {
  return (
    <pre className="text-xs text-neutral-300 bg-neutral-950 rounded-lg p-3 overflow-auto max-h-40 border border-neutral-800">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function LogRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

  return (
    <>
      <tr
        className="border-b border-neutral-800/60 hover:bg-neutral-800/20 transition-colors cursor-pointer"
        onClick={() => hasMetadata && setExpanded(e => !e)}
      >
        {/* Timestamp */}
        <td className="px-4 py-3 text-xs text-neutral-400 whitespace-nowrap">
          {new Date(log.createdAt).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
          })}
        </td>

        {/* Admin */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0">
              {log.adminName?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white truncate">{log.adminName}</p>
              <p className="text-xs text-neutral-500 truncate">{log.adminEmail}</p>
            </div>
          </div>
        </td>

        {/* Action */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 text-sm text-neutral-300">
            {ACTION_ICONS[log.action]}
            <span className="font-mono text-xs bg-neutral-800 px-1.5 py-0.5 rounded">{log.action}</span>
          </div>
        </td>

        {/* Category */}
        <td className="px-4 py-3">
          <CategoryBadge category={log.category} />
        </td>

        {/* Target */}
        <td className="px-4 py-3">
          <p className="text-sm text-neutral-300 truncate max-w-[160px]">{log.targetName ?? '—'}</p>
          {log.targetId && (
            <p className="text-xs text-neutral-600 font-mono truncate">{log.targetId.slice(0, 12)}…</p>
          )}
        </td>

        {/* Description */}
        <td className="px-4 py-3 max-w-xs">
          <p className="text-sm text-neutral-400 truncate">{log.description}</p>
        </td>

        {/* IP */}
        <td className="px-4 py-3 text-xs text-neutral-600 font-mono whitespace-nowrap">
          {log.adminIp}
        </td>

        {/* Expand */}
        <td className="px-4 py-3 text-center">
          {hasMetadata ? (
            <button className="text-neutral-600 hover:text-neutral-300 transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          ) : <span className="text-neutral-800">—</span>}
        </td>
      </tr>

      {/* Expanded Metadata */}
      <AnimatePresence>
        {expanded && hasMetadata && (
          <tr>
            <td colSpan={8} className="bg-neutral-950/50 px-4 pb-3">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pt-2"
              >
                <p className="text-xs text-neutral-500 mb-1.5">Metadata</p>
                <MetadataViewer data={log.metadata!} />
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, byCategory: {} });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 50;

  // Filters
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');
  const [action, setAction]     = useState('');
  const [from, setFrom]         = useState('');
  const [to, setTo]             = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    p.set('page', String(page));
    p.set('limit', String(LIMIT));
    if (search)   p.set('search',   search);
    if (category) p.set('category', category);
    if (action)   p.set('action',   action);
    if (from)     p.set('from',     from);
    if (to)       p.set('to',       to);
    return p.toString();
  }, [page, search, category, action, from, to]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit-logs?${buildParams()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
      setStats(data.stats ?? { total: 0, today: 0, byCategory: {} });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Reset page to 1 when filters change
  useEffect(() => { setPage(1); }, [search, category, action, from, to]);

  const handleExport = () => {
    const p = new URLSearchParams();
    if (search)   p.set('search',   search);
    if (category) p.set('category', category);
    if (action)   p.set('action',   action);
    if (from)     p.set('from',     from);
    if (to)       p.set('to',       to);
    window.location.href = `/api/admin/audit-logs/export?${p.toString()}`;
  };

  const topCategories = Object.entries(stats.byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-violet-400" />
            <h1 className="text-xl font-bold">Audit Logs</h1>
          </div>
          <p className="text-sm text-neutral-500">
            Permanent record of all administrative actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-900 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-violet-500/40 bg-violet-500/10 text-sm text-violet-300 hover:bg-violet-500/20 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Logs"
          value={stats.total}
          icon={<Activity className="w-5 h-5 text-violet-400" />}
          color="bg-gradient-to-r from-violet-600 to-violet-400"
        />
        <StatCard
          label="Today"
          value={stats.today}
          icon={<Clock className="w-5 h-5 text-blue-400" />}
          color="bg-gradient-to-r from-blue-600 to-blue-400"
        />
        {topCategories[0] && (
          <StatCard
            label={`Top: ${topCategories[0][0]}`}
            value={topCategories[0][1]}
            icon={CATEGORY_ICONS[topCategories[0][0]] ?? <Tag className="w-5 h-5 text-emerald-400" />}
            color="bg-gradient-to-r from-emerald-600 to-emerald-400"
          />
        )}
        {topCategories[1] && (
          <StatCard
            label={`Top: ${topCategories[1][0]}`}
            value={topCategories[1][1]}
            icon={CATEGORY_ICONS[topCategories[1][0]] ?? <Tag className="w-5 h-5 text-orange-400" />}
            color="bg-gradient-to-r from-orange-600 to-orange-400"
          />
        )}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search description, admin, target…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500/60 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${
              showFilters
                ? 'border-violet-500/60 bg-violet-500/10 text-violet-300'
                : 'border-neutral-700 bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                {/* Category */}
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-violet-500/60"
                  >
                    <option value="">All categories</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Action */}
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Action</label>
                  <input
                    type="text"
                    placeholder="e.g. user.ban"
                    value={action}
                    onChange={e => setAction(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-violet-500/60"
                  />
                </div>

                {/* From */}
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">From</label>
                  <input
                    type="date"
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-violet-500/60"
                  />
                </div>

                {/* To */}
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">To</label>
                  <input
                    type="date"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-violet-500/60"
                  />
                </div>
              </div>

              {/* Clear */}
              {(category || action || from || to) && (
                <button
                  onClick={() => { setCategory(''); setAction(''); setFrom(''); setTo(''); }}
                  className="mt-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
        {/* Results bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <p className="text-sm text-neutral-500">
            {loading ? 'Loading…' : `${total.toLocaleString()} result${total !== 1 ? 's' : ''}`}
          </p>
          <div className="flex items-center gap-1 text-sm text-neutral-500">
            <Globe className="w-3.5 h-3.5" />
            <span>Page {page} of {totalPages}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800 text-xs text-neutral-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Admin</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Target</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">IP</th>
                <th className="px-4 py-3 text-center">Info</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-800/60">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-neutral-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Shield className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                    <p className="text-neutral-600 text-sm">No audit logs found</p>
                    <p className="text-neutral-700 text-xs mt-1">
                      Admin actions will appear here once performed
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map(log => <LogRow key={log._id} log={log} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-800">
            <p className="text-sm text-neutral-500">
              Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-400 transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-400 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded text-sm transition-colors ${
                      p === page
                        ? 'bg-violet-600 text-white'
                        : 'hover:bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-400 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="p-1.5 rounded hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-400 transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
