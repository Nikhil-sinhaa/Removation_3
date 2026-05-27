// app/admin/designers/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Maximize2,
  Phone,
  RefreshCw,
  User,
  X,
  XCircle,
  AlertCircle,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

// ── Types ──────────────────────────────────────────────────────────────────────
interface PendingDesigner {
  _id: string;
  displayName: string;
  bio?: string;
  phone: string;
  city: string;
  specialties: string[];
  portfolioImages: string[];
  yearsOfExperience?: number;
  createdAt: string;
  userId?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    imageUrl?: string;
  };
}

const SPECIALTY_LABELS: Record<string, string> = {
  'modular-kitchen': 'Modular Kitchen', 'bedroom': 'Bedroom', 'living-room': 'Living Room',
  'bathroom': 'Bathroom', 'office': 'Office', 'vastu': 'Vastu', 'luxury': 'Luxury',
  'budget': 'Budget', 'minimalist': 'Minimalist', 'traditional': 'Traditional',
  'contemporary': 'Contemporary', 'kids-room': "Kids' Room", 'renovation': 'Renovation',
  'lighting-design': 'Lighting Design', '3d-visualization': '3D Visualization',
};

// ── Skeleton row ───────────────────────────────────────────────────────────────
function DesignerSkeleton() {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl bg-neutral-800" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40 bg-neutral-800" />
          <Skeleton className="h-3 w-56 bg-neutral-800" />
        </div>
      </div>
      <Skeleton className="h-3 w-full bg-neutral-800" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24 rounded-lg bg-neutral-800" />
        <Skeleton className="h-8 w-20 rounded-lg bg-neutral-800" />
      </div>
    </div>
  );
}

// ── Designer card ──────────────────────────────────────────────────────────────
function DesignerCard({
  designer,
  onApprove,
  onRejectClick,
  actionLoading,
}: {
  designer: PendingDesigner;
  onApprove: (id: string) => void;
  onRejectClick: (designer: PendingDesigner) => void;
  actionLoading: string | null;
}) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const isProcessing = actionLoading === designer._id;
  const initials = designer.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const submittedDate = new Date(designer.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-colors"
    >
      {/* Header */}
      <div className="p-5 border-b border-neutral-800">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12 ring-2 ring-neutral-800">
            <AvatarImage src={designer.userId?.imageUrl} />
            <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-600 text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-white truncate">{designer.displayName}</h3>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Pending
              </Badge>
            </div>
            {designer.userId?.email && (
              <p className="text-sm text-neutral-400 mt-0.5 truncate">{designer.userId.email}</p>
            )}
            <p className="text-xs text-neutral-500 mt-0.5">Submitted {submittedDate}</p>
          </div>
        </div>

        {designer.bio && (
          <p className="text-sm text-neutral-400 mt-3 line-clamp-2">{designer.bio}</p>
        )}
      </div>

      {/* Details */}
      <div className="px-5 py-4 space-y-2.5">
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <span className="flex items-center gap-1.5 text-neutral-400">
            <MapPin className="w-3.5 h-3.5 text-neutral-500" />
            {designer.city}
          </span>
          <span className="flex items-center gap-1.5 text-neutral-400">
            <Phone className="w-3.5 h-3.5 text-neutral-500" />
            {designer.phone}
          </span>
          {designer.yearsOfExperience !== undefined && (
            <span className="flex items-center gap-1.5 text-neutral-400">
              <Star className="w-3.5 h-3.5 text-neutral-500" />
              {designer.yearsOfExperience}y exp
            </span>
          )}
        </div>

        {designer.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {designer.specialties.map(s => (
              <Badge key={s} variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30 text-xs">
                {SPECIALTY_LABELS[s] || s}
              </Badge>
            ))}
          </div>
        )}

        {/* Portfolio thumbnails */}
        {designer.portfolioImages.length === 0 ? (
          <p className="text-xs text-neutral-600 italic">(no images)</p>
        ) : (
          <div className="flex gap-1.5 flex-wrap">
            {designer.portfolioImages.map((url, i) => (
              <button
                key={i}
                type="button"
                id={`admin-portfolio-thumb-${designer._id}-${i}`}
                className="group relative w-16 h-12 rounded-lg overflow-hidden bg-neutral-800 border border-neutral-700 flex-shrink-0 cursor-zoom-in hover:border-violet-500/50 transition-colors"
                onClick={() => setLightboxUrl(url)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Portfolio ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                  onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                />
                <Maximize2 className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 text-white/70 drop-shadow opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
              </button>
            ))}
            <span className="self-center text-xs text-neutral-600 tabular-nums">
              {designer.portfolioImages.length}/10
            </span>
          </div>
        )}

        {/* Lightbox */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
              onClick={() => setLightboxUrl(null)}
              aria-label="Close image"
            >
              <X className="w-5 h-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="Portfolio image"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex items-center gap-3">
        <Button
          id={`approve-${designer._id}`}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white gap-2"
          onClick={() => onApprove(designer._id)}
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Approve
        </Button>
        <Button
          id={`reject-${designer._id}`}
          size="sm"
          variant="outline"
          className="border-neutral-700 text-neutral-300 hover:border-red-500/50 hover:text-red-400 gap-2"
          onClick={() => onRejectClick(designer)}
          disabled={isProcessing}
        >
          <XCircle className="w-3.5 h-3.5" />
          Reject
        </Button>
      </div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminDesignersPage() {
  const { toast } = useToast();
  const [designers, setDesigners] = useState<PendingDesigner[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingDesigner | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/designers/pending');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setDesigners(data.designers || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load pending designers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/designers/${id}/verify`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
      toast({ title: 'Approved ✓', description: 'Designer is now live on the public listing.' });
      setDesigners(prev => prev.filter(d => d._id !== id));
    } catch {
      toast({ title: 'Error', description: 'Could not approve. Try again.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectSubmit() {
    if (!rejectTarget) return;
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      setRejectError('Rejection reason must be at least 5 characters.');
      return;
    }
    setRejectError('');
    setActionLoading(rejectTarget._id);

    try {
      const res = await fetch(`/api/admin/designers/${rejectTarget._id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      if (!res.ok) throw new Error();
      toast({ title: 'Rejected', description: 'Designer has been notified with the reason.' });
      setDesigners(prev => prev.filter(d => d._id !== rejectTarget._id));
      setRejectTarget(null);
      setRejectReason('');
    } catch {
      toast({ title: 'Error', description: 'Could not reject. Try again.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-violet-400" />
            Designer Applications
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Review and approve pending designer registrations
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-neutral-700 text-neutral-300"
          onClick={fetchPending}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pending Review', value: designers.length, color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Clock },
          { label: 'Reviewed Today', value: '—', color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle2 },
          { label: 'Total Designers', value: '—', color: 'text-violet-400', bg: 'bg-violet-500/10', icon: User },
        ].map(stat => (
          <div key={stat.label} className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Designer list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <DesignerSkeleton key={i} />)}
        </div>
      ) : designers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-neutral-900/50 border border-neutral-800 rounded-xl"
        >
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-white">All caught up!</p>
          <p className="text-neutral-400 text-sm mt-1">No pending designer applications.</p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            {designers.map(d => (
              <DesignerCard
                key={d._id}
                designer={d}
                onApprove={handleApprove}
                onRejectClick={setRejectTarget}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Reject modal */}
      <Dialog open={!!rejectTarget} onOpenChange={open => { if (!open) { setRejectTarget(null); setRejectReason(''); setRejectError(''); } }}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Reject Application
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Provide a clear reason so the designer knows what to fix before resubmitting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-sm text-neutral-300">
              Designer: <span className="font-semibold text-white">{rejectTarget?.displayName}</span>
            </p>
            <Textarea
              id="reject-reason"
              placeholder="e.g. Portfolio images are too low quality. Please upload images with at least 800px width."
              value={rejectReason}
              onChange={e => { setRejectReason(e.target.value); setRejectError(''); }}
              rows={4}
              className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 resize-none focus-visible:ring-violet-500"
            />
            {rejectError && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {rejectError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              onClick={() => { setRejectTarget(null); setRejectReason(''); setRejectError(''); }}
            >
              Cancel
            </Button>
            <Button
              id="confirm-reject"
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
              onClick={handleRejectSubmit}
              disabled={actionLoading === rejectTarget?._id}
            >
              {actionLoading === rejectTarget?._id
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <XCircle className="w-4 h-4" />}
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
