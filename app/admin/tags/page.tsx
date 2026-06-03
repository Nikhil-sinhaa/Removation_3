'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Tag, Plus, Trash2, RefreshCw, AlertTriangle,
  Hash, BarChart3, Users, Loader2, X, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface GlobalTag {
  _id:        string;
  slug:       string;
  label:      string;
  color:      string;
  category:   string;
  usageCount: number;
  createdAt:  string;
}

interface Stats {
  totalTags:    number;
  totalTaggings: number;
  orphaned:     number;
}

const CATEGORIES = ['room_type','style','project','status','color','custom'];

export default function AdminTagsPage() {
  const [globalTags,    setGlobalTags]    = useState<GlobalTag[]>([]);
  const [stats,         setStats]         = useState<Stats>({ totalTags: 0, totalTaggings: 0, orphaned: 0 });
  const [loading,       setLoading]       = useState(true);
  const [cleaningUp,    setCleaningUp]    = useState(false);
  const [createOpen,    setCreateOpen]    = useState(false);
  const [creating,      setCreating]      = useState(false);
  const [form, setForm] = useState({ label: '', category: 'custom', color: '#8B5CF6' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/tags');
      const data = await res.json();
      setGlobalTags(data.globalTags || []);
      setStats(data.stats || { totalTags: 0, totalTaggings: 0, orphaned: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.label.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/tags', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      toast({ title: 'Tag created' });
      setCreateOpen(false);
      setForm({ label: '', category: 'custom', color: '#8B5CF6' });
      load();
    } catch {
      toast({ title: 'Error', description: 'Failed to create tag', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleCleanup = async () => {
    setCleaningUp(true);
    try {
      const res  = await fetch('/api/admin/tags', { method: 'DELETE' });
      const data = await res.json();
      toast({ title: `Cleaned up ${data.deleted} orphaned tags` });
      load();
    } catch {
      toast({ title: 'Error', description: 'Cleanup failed', variant: 'destructive' });
    } finally {
      setCleaningUp(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="h-6 w-6 text-purple-400" />
            Tags Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the global tag taxonomy available to all users.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Global Tag
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Tags',    value: stats.totalTags,     icon: Hash,     color: 'text-violet-400' },
          { label: 'Total Taggings',value: stats.totalTaggings, icon: BarChart3, color: 'text-blue-400' },
          { label: 'Orphaned Tags', value: stats.orphaned,      icon: AlertTriangle, color: 'text-yellow-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <Icon className={`h-5 w-5 ${color}`} />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cleanup button */}
      {stats.orphaned > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <p className="text-sm text-yellow-700 dark:text-yellow-300 flex-1">
            {stats.orphaned} orphaned user tag{stats.orphaned !== 1 ? 's' : ''} (0 uses, older than 7 days) can be cleaned up.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCleanup}
            disabled={cleaningUp}
            className="border-yellow-400 text-yellow-700 hover:bg-yellow-100"
          >
            {cleaningUp && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Clean Up
          </Button>
        </div>
      )}

      {/* Global Tags Table */}
      <div className="rounded-xl border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <p className="text-sm font-medium">Global Tags ({globalTags.length})</p>
          <p className="text-xs text-muted-foreground">Available to all users</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : globalTags.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No global tags yet. Create one to get started.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tag</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {globalTags.map(tag => (
                <tr key={tag._id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color:           tag.color,
                        border:          `1px solid ${tag.color}40`,
                      }}
                    >
                      {tag.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tag.slug}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded capitalize">
                      {tag.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{tag.usageCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Global Tag</DialogTitle>
            <DialogDescription>
              Global tags are available to all users as suggestions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Master Bedroom"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer border"
                />
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: `${form.color}20`, color: form.color, border: `1px solid ${form.color}40` }}
                >
                  {form.label || 'Preview'}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !form.label.trim()}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
