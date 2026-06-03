// app/admin/settings/security/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, RefreshCw, ChevronLeft, ChevronRight,
  Download, Trash2, CheckCircle2, XCircle, Clock,
  AlertTriangle, Loader2, User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrivacyRequest {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'export' | 'delete';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  reason?: string;
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
}

interface ApiResponse {
  requests: PrivacyRequest[];
  total: number;
  pendingCount: number;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PrivacyRequest['status'] }) {
  const map: Record<string, string> = {
    pending:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    processing: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    completed:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    rejected:   'bg-red-500/10 text-red-400 border-red-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] || ''}`}>
      {status}
    </span>
  );
}

// ─── Request table ────────────────────────────────────────────────────────────

function RequestTable({
  requests,
  onApprove,
  onReject,
  processingId,
}: {
  requests: PrivacyRequest[];
  onApprove: (id: string, email: string) => void;
  onReject: (id: string) => void;
  processingId: string | null;
}) {
  if (!requests.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No requests found.</p>;
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Submitted</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reason</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {requests.map(r => (
            <tr key={r._id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm leading-tight">{r.userName}</p>
                    <p className="text-xs text-muted-foreground">{r.userEmail}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                  r.type === 'delete' ? 'text-red-400' : 'text-blue-400'
                }`}>
                  {r.type === 'delete'
                    ? <Trash2 className="h-3 w-3" />
                    : <Download className="h-3 w-3" />}
                  {r.type}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs">
                {new Date(r.createdAt).toLocaleDateString()}{' '}
                {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={r.status} />
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">
                {r.reason || '—'}
              </td>
              <td className="px-4 py-3">
                {r.type === 'delete' && r.status === 'pending' ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onApprove(r._id, r.userEmail)}
                      disabled={processingId === r._id}
                    >
                      {processingId === r._id
                        ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        : <CheckCircle2 className="h-3 w-3 mr-1" />}
                      Approve & Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReject(r._id)}
                      disabled={processingId === r._id}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {r.processedAt ? new Date(r.processedAt).toLocaleDateString() : '—'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PrivacyAdminPage() {
  const [tab, setTab]                   = useState<'delete' | 'export'>('delete');
  const [requests, setRequests]         = useState<PrivacyRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [deleteTotal, setDeleteTotal]   = useState(0);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [approveDialog, setApproveDialog] = useState<{ id: string; email: string } | null>(null);
  const [rejectDialog, setRejectDialog]   = useState<{ id: string } | null>(null);
  const [rejectNotes, setRejectNotes]     = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/privacy?type=${tab}&page=${page}`);
      const data: ApiResponse = await res.json();
      setRequests(data.requests);
      setTotal(data.total);
      setPendingCount(data.pendingCount);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  const loadStats = useCallback(async () => {
    try {
      const [compRes, delRes] = await Promise.all([
        fetch('/api/admin/privacy?status=completed'),
        fetch('/api/admin/privacy?type=delete'),
      ]);
      const [comp, del]: [ApiResponse, ApiResponse] = await Promise.all([compRes.json(), delRes.json()]);
      setCompletedCount(comp.total);
      setDeleteTotal(del.total);
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const handleApproveConfirm = async () => {
    if (!approveDialog) return;
    const { id, email } = approveDialog;
    setProcessingId(id);
    setApproveDialog(null);
    try {
      const res  = await fetch(`/api/admin/privacy/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'approve' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast({ title: 'Account deleted', description: `${email} and all their data has been permanently deleted.` });
      loadRequests();
      loadStats();
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectDialog) return;
    const { id } = rejectDialog;
    setProcessingId(id);
    setRejectDialog(null);
    try {
      const res = await fetch(`/api/admin/privacy/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'reject', adminNotes: rejectNotes }),
      });
      if (!res.ok) throw new Error('Failed');
      setRejectNotes('');
      toast({ title: 'Request rejected' });
      loadRequests();
      loadStats();
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="p-6 max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-400" />
            Privacy Request Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and action data export and account deletion requests (DPDP Act 2023 compliance).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { loadRequests(); loadStats(); }} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending requests', value: pendingCount,    color: 'text-yellow-400', icon: Clock },
          { label: 'Completed total',  value: completedCount,  color: 'text-emerald-400', icon: CheckCircle2 },
          { label: 'Deletion requests', value: deleteTotal,    color: 'text-red-400',    icon: Trash2 },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${color}`} />
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
          <CardDescription>
            Export requests are auto-completed when the user downloads their data.
            Deletion requests require admin approval before any data is removed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={v => { setTab(v as 'delete' | 'export'); setPage(1); }}>
            <TabsList className="mb-4">
              <TabsTrigger value="delete">Deletion Requests</TabsTrigger>
              <TabsTrigger value="export">Export Requests</TabsTrigger>
            </TabsList>

            {(['delete', 'export'] as const).map(t => (
              <TabsContent key={t} value={t}>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <RequestTable
                    requests={requests}
                    onApprove={(id, email) => setApproveDialog({ id, email })}
                    onReject={id => setRejectDialog({ id })}
                    processingId={processingId}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} · {total} total
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve confirmation dialog */}
      <Dialog open={!!approveDialog} onOpenChange={open => !open && setApproveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Confirm Account Deletion
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <span className="block">
                This will permanently delete <strong>ALL data</strong> for:
              </span>
              <code className="block text-sm bg-muted px-2 py-1 rounded">
                {approveDialog?.email}
              </code>
              <span className="block">
                This includes their profile, projects, renders, bookings, reviews, and all other records.
              </span>
              <span className="block font-semibold text-red-500">
                This action cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleApproveConfirm}>
              <Trash2 className="h-4 w-4 mr-2" />
              Yes, Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog
        open={!!rejectDialog}
        onOpenChange={open => { if (!open) { setRejectDialog(null); setRejectNotes(''); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Deletion Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. Stored in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reject-notes">Reason for rejection (shown in admin notes)</Label>
            <Textarea
              id="reject-notes"
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              placeholder="e.g. Active subscription — please cancel before requesting deletion."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog(null); setRejectNotes(''); }}>
              Cancel
            </Button>
            <Button onClick={handleRejectConfirm}>
              <XCircle className="h-4 w-4 mr-2" />
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
