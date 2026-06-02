// app/(app)/vendor/bookings/page.tsx
//
// Vendor inquiry management page.
// Fetches GET /api/vendor/inquiries (all incoming customer inquiries for this vendor).
// Vendor can view and respond to inquiries.

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Store,
  User,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface InquiryCustomer {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface VendorInquiry {
  _id: string;
  customerId: InquiryCustomer | string;
  message: string;
  status: 'pending' | 'responded' | 'closed';
  createdAt: string;
  updatedAt: string;
  phone?: string;
  vendorResponse?: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function customerName(c: InquiryCustomer | string): string {
  if (typeof c === 'string') return 'Customer';
  const full = [c.firstName, c.lastName].filter(Boolean).join(' ');
  return full || c.email;
}

function customerEmail(c: InquiryCustomer | string): string {
  if (typeof c === 'string') return '';
  return c.email;
}

function statusConfig(status: VendorInquiry['status']) {
  switch (status) {
    case 'responded': return { label: 'Responded', cls: 'bg-green-500/20 text-green-400 border-green-500/30', Icon: CheckCircle2 };
    case 'closed':    return { label: 'Closed',    cls: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30', Icon: X };
    default:          return { label: 'Pending',   cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30',   Icon: Clock };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VendorBookingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [inquiries, setInquiries]           = useState<VendorInquiry[]>([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [selected, setSelected]             = useState<VendorInquiry | null>(null);
  const [replyText, setReplyText]           = useState('');
  const [isReplying, setIsReplying]         = useState(false);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);

  // Fetch inquiries
  const fetchInquiries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vendor/inquiries');
      if (!res.ok) {
        if (res.status === 404) { setInquiries([]); return; }
        throw new Error(await res.text());
      }
      const data = await res.json();
      setInquiries(data.inquiries ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) { router.replace('/sign-in'); return; }
      fetchInquiries();
    }
  }, [authLoading, user, router, fetchInquiries]);

  const openReply = (inq: VendorInquiry) => {
    setSelected(inq);
    setReplyText(inq.vendorResponse ?? '');
    setIsReplyDialogOpen(true);
  };

  const submitReply = async () => {
    if (!selected || !replyText.trim()) return;
    setIsReplying(true);
    try {
      const res = await fetch(`/api/vendor/inquiries/${selected._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: replyText, status: 'responded' }),
      });
      if (res.ok) {
        setInquiries(prev => prev.map(i =>
          i._id === selected._id ? { ...i, vendorResponse: replyText, status: 'responded' } : i
        ));
        setIsReplyDialogOpen(false);
      }
    } catch {
      // silently fail
    } finally {
      setIsReplying(false);
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────

  if (authLoading || (isLoading && inquiries.length === 0)) {
    return (
      <div className="min-h-screen bg-neutral-950 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-10 w-64 bg-neutral-800" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 bg-neutral-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Store className="w-8 h-8 text-violet-400" />
              Customer Inquiries
            </h1>
            <p className="text-neutral-400 mt-1">
              {inquiries.length} inquir{inquiries.length === 1 ? 'y' : 'ies'} received
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInquiries}
            disabled={isLoading}
            className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-800/50 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && inquiries.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-neutral-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No inquiries yet</h3>
            <p className="text-neutral-400 max-w-sm">
              When customers send inquiries about your store, they will appear here.
            </p>
          </motion.div>
        )}

        {/* Inquiry list */}
        <AnimatePresence mode="popLayout">
          {inquiries.map(inq => {
            const cfg = statusConfig(inq.status);
            const StatusIcon = cfg.Icon;
            return (
              <motion.div
                key={inq._id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {customerName(inq.customerId)}
                      </p>
                      {customerEmail(inq.customerId) && (
                        <p className="text-sm text-neutral-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {customerEmail(inq.customerId)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={cn('text-xs border', cfg.cls)}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {cfg.label}
                    </Badge>
                  </div>
                </div>

                {/* Message */}
                <p className="text-neutral-300 text-sm bg-neutral-800/50 rounded-lg p-3">
                  {inq.message}
                </p>

                {/* Response preview */}
                {inq.vendorResponse && (
                  <div className="bg-green-900/20 border border-green-800/40 rounded-lg p-3">
                    <p className="text-xs text-green-400 font-medium mb-1">Your response:</p>
                    <p className="text-sm text-neutral-300">{inq.vendorResponse}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(inq.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openReply(inq)}
                    className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-xs h-8"
                  >
                    <MessageSquare className="w-3 h-3 mr-1.5" />
                    {inq.status === 'responded' ? 'Edit response' : 'Reply'}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Reply dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Reply to inquiry</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Your reply will be visible to the customer.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-neutral-800/60 rounded-lg p-3 text-sm text-neutral-300">
                <span className="text-neutral-500 text-xs block mb-1">Customer message:</span>
                {selected.message}
              </div>
              <Textarea
                placeholder="Type your reply…"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 min-h-[100px] resize-none"
              />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsReplyDialogOpen(false)}
              className="text-neutral-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={submitReply}
              disabled={isReplying || !replyText.trim()}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isReplying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Send reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
