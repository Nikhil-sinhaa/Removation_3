'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightLeft, Plus, Trash2, RefreshCw, Search,
  CheckCircle2, XCircle, AlertTriangle, Loader2,
  ExternalLink, Edit3, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

// ─── Types ────────────────────────────────────────────────────────────────────

interface IRedirect {
  _id:        string;
  sourceUrl:  string;
  destUrl:    string;
  statusCode: 301 | 302;
  status:     'enabled' | 'disabled';
  hits:       number;
  hitAt?:     string;
  origin:     string;
  comment?:   string;
  createdAt:  string;
}

interface INotFoundLog {
  _id:         string;
  url:         string;
  hits:        number;
  firstSeenAt: string;
  lastSeenAt:  string;
  referrer?:   string;
  resolved:    boolean;
}

interface Stats {
  enabled:       number;
  disabled:      number;
  from404:       number;
  unresolved404s:number;
  totalHits:     number;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'enabled' | 'disabled' }) {
  return status === 'enabled' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
      <CheckCircle2 className="w-3 h-3" />enabled
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-500/10 text-neutral-500 border border-neutral-500/30">
      <XCircle className="w-3 h-3" />disabled
    </span>
  );
}

// ─── Redirect form dialog ─────────────────────────────────────────────────────

function RedirectFormDialog({
  open,
  onClose,
  onSave,
  initial,
  from404Id,
}: {
  open:       boolean;
  onClose:    () => void;
  onSave:     () => void;
  initial?:   Partial<IRedirect> & { from404Id?: string };
  from404Id?: string;
}) {
  const [sourceUrl,  setSourceUrl]  = useState(initial?.sourceUrl || '');
  const [destUrl,    setDestUrl]    = useState(initial?.destUrl || '');
  const [statusCode, setStatusCode] = useState<301 | 302>(initial?.statusCode || 301);
  const [comment,    setComment]    = useState(initial?.comment || '');
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    if (open) {
      setSourceUrl(initial?.sourceUrl || '');
      setDestUrl(initial?.destUrl || '');
      setStatusCode(initial?.statusCode || 301);
      setComment(initial?.comment || '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSave = async () => {
    if (!sourceUrl.trim() || !destUrl.trim()) return;
    setSaving(true);
    try {
      const isEdit = !!initial?._id;
      const url    = isEdit ? `/api/admin/redirects/${initial._id}` : '/api/admin/redirects';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          sourceUrl, destUrl, statusCode, comment,
          from404Id: from404Id || initial?.from404Id,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed');
      }
      toast({ title: isEdit ? 'Redirect updated' : 'Redirect created' });
      onSave();
      onClose();
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
        <DialogHeader>
          <DialogTitle>{initial?._id ? 'Edit Redirect' : 'Create Redirect'}</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Source URL is stored lowercase. Use absolute paths (e.g. /old-page).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-neutral-300">Source URL (from)</Label>
            <Input
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              placeholder="/old-page-url"
              className="bg-neutral-800 border-neutral-700 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-neutral-300">Destination URL (to)</Label>
            <Input
              value={destUrl}
              onChange={e => setDestUrl(e.target.value)}
              placeholder="/new-page-url"
              className="bg-neutral-800 border-neutral-700 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-neutral-300">Redirect Type</Label>
            <div className="flex gap-3">
              {([301, 302] as const).map(code => (
                <button
                  key={code}
                  onClick={() => setStatusCode(code)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    statusCode === code
                      ? 'border-violet-500 bg-violet-500/15 text-violet-300'
                      : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                  }`}
                >
                  {code} {code === 301 ? '— Permanent' : '— Temporary'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-neutral-300">Comment (optional)</Label>
            <Input
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Why this redirect exists..."
              className="bg-neutral-800 border-neutral-700 text-white"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-neutral-700">Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !sourceUrl.trim() || !destUrl.trim()}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Redirect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RedirectsPage() {
  const [tab,          setTab]         = useState<'redirects' | '404s'>('redirects');
  const [redirects,    setRedirects]   = useState<IRedirect[]>([]);
  const [logs,         setLogs]        = useState<INotFoundLog[]>([]);
  const [stats,        setStats]       = useState<Stats | null>(null);
  const [loading,      setLoading]     = useState(true);
  const [total,        setTotal]       = useState(0);
  const [page,         setPage]        = useState(1);
  const [search,       setSearch]      = useState('');
  const [selected,     setSelected]    = useState<Set<string>>(new Set());
  const [formOpen,     setFormOpen]    = useState(false);
  const [editTarget,   setEditTarget]  = useState<IRedirect | undefined>();
  const [from404,      setFrom404]     = useState<INotFoundLog | undefined>();
  const searchRef = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async (tabOverride?: string, pageOverride?: number) => {
    setLoading(true);
    const t = tabOverride ?? tab;
    const p = pageOverride ?? page;
    try {
      const res  = await fetch(`/api/admin/redirects?tab=${t}&page=${p}&q=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (t === '404s') {
        setLogs(data.logs || []);
      } else {
        setRedirects(data.redirects || []);
        if (data.stats) setStats(data.stats);
      }
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [tab, page, search]);

  useEffect(() => { load(); }, [tab, page]);

  // Debounced search
  useEffect(() => {
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => { setPage(1); load(tab, 1); }, 400);
    return () => clearTimeout(searchRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Auto-refresh 404s every 30s
  useEffect(() => {
    if (tab !== '404s') return;
    const interval = setInterval(() => load('404s', page), 30_000);
    return () => clearInterval(interval);
  }, [tab, page, load]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectAll = () => {
    const allIds = tab === '404s' ? logs.map(l => l._id) : redirects.map(r => r._id);
    setSelected(new Set(allIds));
  };

  const bulk = async (action: string) => {
    if (!selected.size) return;
    await fetch('/api/admin/redirects/bulk', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action, ids: Array.from(selected) }),
    });
    setSelected(new Set());
    load();
    toast({ title: `Done: ${action}` });
  };

  const toggle = async (r: IRedirect) => {
    await fetch(`/api/admin/redirects/${r._id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: r.status === 'enabled' ? 'disabled' : 'enabled' }),
    });
    load();
  };

  const deleteRedirect = async (id: string) => {
    if (!confirm('Delete this redirect?')) return;
    await fetch(`/api/admin/redirects/${id}`, { method: 'DELETE' });
    load();
    toast({ title: 'Redirect deleted' });
  };

  const mark404Resolved = async (id: string) => {
    await fetch('/api/admin/redirects/bulk', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'resolve-404s', ids: [id] }),
    });
    load();
    toast({ title: 'Marked as resolved' });
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-violet-400" />
            Redirect Manager
          </h1>
          <p className="text-sm text-neutral-500">
            Manage URL redirects and track broken links
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => load()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-900 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => { setEditTarget(undefined); setFrom404(undefined); setFormOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-sm text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Redirect
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Enabled',        value: stats.enabled,        color: 'text-emerald-400' },
            { label: 'Disabled',       value: stats.disabled,       color: 'text-neutral-500' },
            { label: 'From 404',       value: stats.from404,        color: 'text-blue-400' },
            { label: 'Unresolved 404s',value: stats.unresolved404s, color: 'text-yellow-400' },
            { label: 'Total Hits',     value: stats.totalHits,      color: 'text-violet-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
              <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
              <p className="text-xs text-neutral-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          placeholder={tab === '404s' ? 'Search 404 URLs…' : 'Search redirects…'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500/60"
        />
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/30"
        >
          <span className="text-sm text-violet-300">{selected.size} selected</span>
          {tab === 'redirects' && (
            <>
              <button onClick={() => bulk('enable')}  className="text-sm text-emerald-400 hover:text-emerald-300">Enable</button>
              <button onClick={() => bulk('disable')} className="text-sm text-neutral-400 hover:text-neutral-300">Disable</button>
              <button onClick={() => bulk('delete')}  className="text-sm text-red-400 hover:text-red-300">Delete</button>
            </>
          )}
          {tab === '404s' && (
            <button onClick={() => bulk('resolve-404s')} className="text-sm text-emerald-400 hover:text-emerald-300">Mark Resolved</button>
          )}
          <button onClick={() => setSelected(new Set())} className="ml-auto text-sm text-neutral-500 hover:text-neutral-300">Clear</button>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
        <div className="flex border-b border-neutral-800">
          {(['redirects', '404s'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1); setSelected(new Set()); }}
              className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                tab === t
                  ? 'border-violet-500 text-violet-300'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {t === 'redirects' ? 'Redirects' : '404 Logs'}
              {t === '404s' && stats?.unresolved404s ? (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">{stats.unresolved404s}</span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
            </div>
          ) : tab === 'redirects' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-xs text-neutral-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left w-8">
                    <Checkbox
                      checked={selected.size === redirects.length && redirects.length > 0}
                      onCheckedChange={v => v ? selectAll() : setSelected(new Set())}
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Source URL</th>
                  <th className="px-4 py-3 text-left">Destination</th>
                  <th className="px-4 py-3 text-center">Type</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Hits</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {redirects.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-neutral-600">No redirects found</td></tr>
                ) : redirects.map(r => (
                  <tr key={r._id} className="border-b border-neutral-800/60 hover:bg-neutral-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <Checkbox checked={selected.has(r._id)} onCheckedChange={() => toggleSelect(r._id)} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-300 max-w-[200px] truncate">{r.sourceUrl}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-400 max-w-[200px] truncate">{r.destUrl}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${r.statusCode === 301 ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>
                        {r.statusCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-right text-neutral-400">{r.hits}</td>
                    <td className="px-4 py-3 text-xs text-neutral-600">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditTarget(r); setFrom404(undefined); setFormOpen(true); }} className="text-neutral-500 hover:text-neutral-300 transition-colors" title="Edit">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toggle(r)} className="transition-colors" title={r.status === 'enabled' ? 'Disable' : 'Enable'}>
                          {r.status === 'enabled'
                            ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                            : <ToggleLeft  className="w-4 h-4 text-neutral-500" />}
                        </button>
                        <button onClick={() => deleteRedirect(r._id)} className="text-neutral-600 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-xs text-neutral-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left w-8">
                    <Checkbox
                      checked={selected.size === logs.length && logs.length > 0}
                      onCheckedChange={v => v ? selectAll() : setSelected(new Set())}
                    />
                  </th>
                  <th className="px-4 py-3 text-left">URL</th>
                  <th className="px-4 py-3 text-right">Hits</th>
                  <th className="px-4 py-3 text-left">First Seen</th>
                  <th className="px-4 py-3 text-left">Last Seen</th>
                  <th className="px-4 py-3 text-left">Referrer</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-600">No unresolved 404s — looking good!</td></tr>
                ) : logs.map(log => (
                  <tr key={log._id} className="border-b border-neutral-800/60 hover:bg-neutral-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <Checkbox checked={selected.has(log._id)} onCheckedChange={() => toggleSelect(log._id)} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-yellow-300 max-w-[240px] truncate">{log.url}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-bold ${log.hits > 10 ? 'text-red-400' : log.hits > 3 ? 'text-yellow-400' : 'text-neutral-400'}`}>
                        {log.hits}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600">{new Date(log.firstSeenAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500">{new Date(log.lastSeenAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs text-neutral-600 max-w-[160px] truncate">{log.referrer || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setFrom404(log); setEditTarget({ sourceUrl: log.url } as IRedirect); setFormOpen(true); }}
                          className="text-xs text-violet-400 hover:text-violet-300 transition-colors whitespace-nowrap"
                          title="Create redirect for this URL"
                        >
                          → Create Redirect
                        </button>
                        <button
                          onClick={() => mark404Resolved(log._id)}
                          className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
                          title="Mark as resolved"
                        >
                          ✓
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-800">
            <span className="text-sm text-neutral-500">Page {page} of {totalPages} · {total} total</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-neutral-800 disabled:opacity-30 text-neutral-400 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded hover:bg-neutral-800 disabled:opacity-30 text-neutral-400 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Redirect form dialog */}
      <RedirectFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(undefined); setFrom404(undefined); }}
        onSave={() => { load(); setSelected(new Set()); }}
        initial={editTarget}
        from404Id={from404?._id}
      />
    </div>
  );
}
