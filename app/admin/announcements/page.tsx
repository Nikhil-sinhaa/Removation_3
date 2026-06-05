'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Megaphone, Plus, Edit3, Trash2, ToggleLeft, ToggleRight,
  RefreshCw, Loader2, Info, AlertTriangle, CheckCircle,
  Zap, Wrench, Eye, BarChart3, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import type { AnnouncementType, AnnouncementTarget } from '@/lib/db/models/Announcement';

interface AnnouncementRow {
  _id:           string;
  title:         string;
  message:       string;
  ctaLabel?:     string;
  ctaUrl?:       string;
  type:          AnnouncementType;
  icon?:         string;
  isDismissable: boolean;
  target:        AnnouncementTarget;
  startsAt:      string;
  endsAt?:       string;
  isActive:      boolean;
  impressions:   number;
  dismissals:    number;
  ctaClicks:     number;
  createdAt:     string;
}

interface Stats {
  total:            number;
  active:           number;
  scheduled:        number;
  expired:          number;
  totalImpressions: number;
}

interface FormState {
  title:         string;
  message:       string;
  type:          AnnouncementType;
  target:        AnnouncementTarget;
  icon:          string;
  ctaLabel:      string;
  ctaUrl:        string;
  startsAt:      string;
  endsAt:        string;
  isDismissable: boolean;
  isActive:      boolean;
}

const TYPE_COLORS: Record<AnnouncementType, { bg: string; text: string; border: string; defaultIcon: string }> = {
  info:        { bg: 'bg-blue-950/80',   text: 'text-blue-100',   border: 'border-blue-800',   defaultIcon: 'ℹ️' },
  warning:     { bg: 'bg-yellow-950/80', text: 'text-yellow-100', border: 'border-yellow-800', defaultIcon: '⚠️' },
  success:     { bg: 'bg-green-950/80',  text: 'text-green-100',  border: 'border-green-800',  defaultIcon: '✅' },
  promotion:   { bg: 'bg-purple-950/80', text: 'text-purple-100', border: 'border-purple-700', defaultIcon: '🎉' },
  maintenance: { bg: 'bg-red-950/80',    text: 'text-red-100',    border: 'border-red-800',    defaultIcon: '🔧' },
};

const TYPE_BADGE: Record<AnnouncementType, string> = {
  info:        'bg-blue-100 text-blue-700',
  warning:     'bg-yellow-100 text-yellow-700',
  success:     'bg-green-100 text-green-700',
  promotion:   'bg-purple-100 text-purple-700',
  maintenance: 'bg-red-100 text-red-700',
};

const TARGET_LABELS: Record<AnnouncementTarget, string> = {
  all:         'All users',
  free:        'Free plan',
  pro:         'Pro plan',
  teams:       'Teams',
  designers:   'Designers',
  contractors: 'Contractors',
  new_users:   'New users (7 days)',
};

function toDatetimeLocal(iso?: string): string {
  if (!iso) return '';
  return iso.slice(0, 16);
}

function getStatus(row: AnnouncementRow): 'active' | 'scheduled' | 'expired' | 'disabled' {
  const now = new Date();
  if (!row.isActive) return 'disabled';
  if (row.endsAt && new Date(row.endsAt) < now) return 'expired';
  if (new Date(row.startsAt) > now) return 'scheduled';
  return 'active';
}

const STATUS_BADGE: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  scheduled: 'bg-blue-100 text-blue-700',
  expired:   'bg-gray-100 text-gray-600',
  disabled:  'bg-gray-100 text-gray-500',
};

const EMPTY_FORM: FormState = {
  title:         '',
  message:       '',
  type:          'info',
  target:        'all',
  icon:          '',
  ctaLabel:      '',
  ctaUrl:        '',
  startsAt:      toDatetimeLocal(new Date().toISOString()),
  endsAt:        '',
  isDismissable: true,
  isActive:      true,
};

function BannerPreview({ form }: { form: FormState }) {
  const config = TYPE_COLORS[form.type] ?? TYPE_COLORS.info;
  const isExternal = form.ctaUrl?.startsWith('http') ?? false;

  return (
    <div className={`rounded-lg border ${config.bg} ${config.border} ${config.text} p-3`}>
      <p className="text-xs text-white/50 mb-2 uppercase tracking-wide font-medium">Live preview</p>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-base shrink-0">{form.icon || config.defaultIcon}</span>
        <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
          {form.title && (
            <span className="font-semibold text-sm shrink-0">{form.title}</span>
          )}
          {form.message && (
            <span className="text-sm opacity-90 truncate">{form.message}</span>
          )}
        </div>
        {form.ctaLabel && form.ctaUrl && (
          <span className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 whitespace-nowrap">
            {form.ctaLabel}
          </span>
        )}
        {form.isDismissable && (
          <span className="shrink-0 p-1 rounded-full opacity-60 bg-white/10">
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}

export default function AdminAnnouncementsPage() {
  const [rows,       setRows]       = useState<AnnouncementRow[]>([]);
  const [stats,      setStats]      = useState<Stats>({ total: 0, active: 0, scheduled: 0, expired: 0, totalImpressions: 0 });
  const [loading,    setLoading]    = useState(true);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [form,       setForm]       = useState<FormState>(EMPTY_FORM);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/announcements');
      const data = await res.json();
      setRows(data.announcements || []);
      setStats(data.stats || { total: 0, active: 0, scheduled: 0, expired: 0, totalImpressions: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (row: AnnouncementRow) => {
    setEditId(row._id);
    setForm({
      title:         row.title,
      message:       row.message,
      type:          row.type,
      target:        row.target,
      icon:          row.icon || '',
      ctaLabel:      row.ctaLabel || '',
      ctaUrl:        row.ctaUrl || '',
      startsAt:      toDatetimeLocal(row.startsAt),
      endsAt:        toDatetimeLocal(row.endsAt),
      isDismissable: row.isDismissable,
      isActive:      row.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast({ title: 'Title and message are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : new Date().toISOString(),
        endsAt:   form.endsAt   ? new Date(form.endsAt).toISOString()   : null,
        icon:     form.icon     || undefined,
        ctaLabel: form.ctaLabel || undefined,
        ctaUrl:   form.ctaUrl   || undefined,
      };

      const url    = editId ? `/api/admin/announcements/${editId}` : '/api/admin/announcements';
      const method = editId ? 'PATCH' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast({ title: editId ? 'Announcement updated' : 'Announcement created' });
      setModalOpen(false);
      load();
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (row: AnnouncementRow) => {
    await fetch(`/api/admin/announcements/${row._id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ isActive: !row.isActive }),
    });
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/admin/announcements/${deleteId}`, { method: 'DELETE' });
    toast({ title: 'Announcement deleted' });
    setDeleteId(null);
    load();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-violet-600" />
            Announcements
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create targeted banners shown at the top of the app for users.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate} className="bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="w-4 h-4 mr-1" />
            New Announcement
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total',            value: stats.total,            color: 'text-gray-900' },
          { label: 'Active now',       value: stats.active,           color: 'text-green-600' },
          { label: 'Scheduled',        value: stats.scheduled,        color: 'text-blue-600' },
          { label: 'Expired',          value: stats.expired,          color: 'text-gray-500' },
          { label: 'Total Impressions', value: stats.totalImpressions.toLocaleString(), color: 'text-violet-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Megaphone className="w-12 h-12 text-gray-200" />
            <p className="text-gray-400 text-sm">No announcements yet</p>
            <Button size="sm" onClick={openCreate} variant="outline">
              <Plus className="w-4 h-4 mr-1" /> Create your first announcement
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Type', 'Title', 'Target', 'Schedule', 'Status', 'Impressions', 'Dismissals', 'CTA Clicks', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(row => {
                  const status = getStatus(row);
                  return (
                    <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Badge className={`${TYPE_BADGE[row.type]} text-xs capitalize`}>
                          {row.icon || ''} {row.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[200px]">
                          <p className="font-medium text-gray-900 truncate">{row.title}</p>
                          <p className="text-gray-400 text-xs truncate">{row.message}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {TARGET_LABELS[row.target]}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        <div>
                          {new Date(row.startsAt).toLocaleDateString()}
                          {row.endsAt && (
                            <span className="text-gray-400"> → {new Date(row.endsAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${STATUS_BADGE[status]} text-xs capitalize`}>
                          {status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 font-medium">
                        {row.impressions.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {row.dismissals.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {row.ctaClicks.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => openEdit(row)}
                            className="h-7 px-2 text-gray-500 hover:text-violet-700"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => handleToggle(row)}
                            className={`h-7 px-2 ${row.isActive ? 'text-green-600' : 'text-gray-400'}`}
                            title={row.isActive ? 'Disable' : 'Enable'}
                          >
                            {row.isActive
                              ? <ToggleRight className="w-4 h-4" />
                              : <ToggleLeft className="w-4 h-4" />
                            }
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => setDeleteId(row._id)}
                            className="h-7 px-2 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Preview */}
            <BannerPreview form={form} />

            {/* Title */}
            <div>
              <Label htmlFor="ann-title">Title <span className="text-red-500">*</span></Label>
              <Input
                id="ann-title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. New feature launched!"
                className="mt-1"
              />
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="ann-message">Message <span className="text-red-500">*</span></Label>
              <Textarea
                id="ann-message"
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Describe your announcement..."
                className="mt-1 resize-none"
                rows={2}
              />
            </div>

            {/* Type + Target */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as AnnouncementType }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">ℹ️ Info</SelectItem>
                    <SelectItem value="warning">⚠️ Warning</SelectItem>
                    <SelectItem value="success">✅ Success</SelectItem>
                    <SelectItem value="promotion">🎉 Promotion</SelectItem>
                    <SelectItem value="maintenance">🔧 Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Audience</Label>
                <Select value={form.target} onValueChange={v => setForm(f => ({ ...f, target: v as AnnouncementTarget }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users</SelectItem>
                    <SelectItem value="free">Free plan</SelectItem>
                    <SelectItem value="pro">Pro plan</SelectItem>
                    <SelectItem value="teams">Teams</SelectItem>
                    <SelectItem value="designers">Designers</SelectItem>
                    <SelectItem value="contractors">Contractors</SelectItem>
                    <SelectItem value="new_users">New users (last 7 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Icon */}
            <div>
              <Label htmlFor="ann-icon">Icon (emoji, optional)</Label>
              <Input
                id="ann-icon"
                value={form.icon}
                onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                placeholder="e.g. 🎉 or ⚠️"
                className="mt-1 w-32"
              />
            </div>

            {/* CTA */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ann-cta-label">CTA Button Label</Label>
                <Input
                  id="ann-cta-label"
                  value={form.ctaLabel}
                  onChange={e => setForm(f => ({ ...f, ctaLabel: e.target.value }))}
                  placeholder="e.g. Upgrade Now"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ann-cta-url">CTA Button URL</Label>
                <Input
                  id="ann-cta-url"
                  value={form.ctaUrl}
                  onChange={e => setForm(f => ({ ...f, ctaUrl: e.target.value }))}
                  placeholder="e.g. /billing or https://..."
                  className="mt-1"
                />
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ann-starts">Starts at</Label>
                <Input
                  id="ann-starts"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ann-ends">Ends at (optional)</Label>
                <Input
                  id="ann-ends"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">Leave empty for no end date</p>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Switch
                  id="ann-dismissable"
                  checked={form.isDismissable}
                  onCheckedChange={v => setForm(f => ({ ...f, isDismissable: v }))}
                />
                <Label htmlFor="ann-dismissable" className="cursor-pointer">Dismissable</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="ann-active"
                  checked={form.isActive}
                  onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
                />
                <Label htmlFor="ann-active" className="cursor-pointer">Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              {editId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            This will permanently delete the announcement and all dismissal records.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
