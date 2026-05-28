// app/admin/approvals/page.tsx
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
  Building2,
  Store,
  DollarSign,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
interface BasePendingProfile {
  _id: string;
  displayName: string;
  bio?: string;
  phone: string;
  city: string;
  portfolioImages: string[];
  createdAt: string;
  userId?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    imageUrl?: string;
  };
}

interface PendingDesigner extends BasePendingProfile {
  specialties: string[];
  yearsOfExperience?: number;
}

interface PendingContractor extends BasePendingProfile {
  specialties: string[];
  yearsOfExperience?: number;
  consultationFee?: { amount: number; currency: string };
  projectMinFee?: { amount: number; currency: string };
  acceptsConsultations: boolean;
  acceptsProjects: boolean;
}

interface PendingVendor extends BasePendingProfile {
  storeAddress: string;
  specialties: string[];
}

const DESIGNER_SPECIALTIES: Record<string, string> = {
  'modular-kitchen': 'Modular Kitchen', 'bedroom': 'Bedroom', 'living-room': 'Living Room',
  'bathroom': 'Bathroom', 'office': 'Office', 'vastu': 'Vastu', 'luxury': 'Luxury',
  'budget': 'Budget', 'minimalist': 'Minimalist', 'traditional': 'Traditional',
  'contemporary': 'Contemporary', 'kids-room': "Kids' Room", 'renovation': 'Renovation',
  'lighting-design': 'Lighting Design', '3d-visualization': '3D Visualization',
};

const CONTRACTOR_SPECIALTIES: Record<string, string> = {
  'painter': 'Painter',
  'carpenter': 'Carpenter',
  'electrician': 'Electrician',
  'plumber': 'Plumber',
  'modular-kitchen-installer': 'Modular Kitchen Installer',
};

const VENDOR_SPECIALTIES: Record<string, string> = {
  'tile-shop': 'Tile Shop',
  'paint-store': 'Paint Store',
  'furniture-seller': 'Furniture Seller',
  'hardware-store': 'Hardware Store',
};

// Format paise to Rupees
function formatPrice(amount?: number) {
  if (amount === undefined) return '₹0';
  return `₹${(amount / 100).toLocaleString('en-IN')}`;
}

// ── Skeleton row ───────────────────────────────────────────────────────────────
function ProfileSkeleton() {
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

// ── Portfolio Lightbox Helper ──────────────────────────────────────────────────
function ImageGallery({ images, profileId }: { images: string[]; profileId: string }) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (images.length === 0) {
    return <p className="text-xs text-neutral-600 italic">(no images)</p>;
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {images.map((url, i) => (
        <button
          key={i}
          type="button"
          id={`admin-portfolio-thumb-${profileId}-${i}`}
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
        {images.length}/10
      </span>

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
            alt="Portfolio preview"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// ── Profile Card ───────────────────────────────────────────────────────────────
function ProfileCard({
  type,
  profile,
  onApprove,
  onRejectClick,
  actionLoading,
}: {
  type: 'designer' | 'contractor' | 'vendor';
  profile: any;
  onApprove: (type: 'designer' | 'contractor' | 'vendor', id: string) => void;
  onRejectClick: (type: 'designer' | 'contractor' | 'vendor', profile: any) => void;
  actionLoading: string | null;
}) {
  const isProcessing = actionLoading === profile._id;
  const initials = profile.displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const submittedDate = new Date(profile.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const getSpecialtyLabel = (s: string) => {
    if (type === 'designer') return DESIGNER_SPECIALTIES[s] || s;
    if (type === 'contractor') return CONTRACTOR_SPECIALTIES[s] || s;
    return VENDOR_SPECIALTIES[s] || s;
  };

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
            <AvatarImage src={profile.userId?.imageUrl} />
            <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-600 text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-white truncate">{profile.displayName}</h3>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Pending Review
              </Badge>
            </div>
            {profile.userId?.email && (
              <p className="text-sm text-neutral-400 mt-0.5 truncate">{profile.userId.email}</p>
            )}
            <p className="text-xs text-neutral-500 mt-0.5">Submitted {submittedDate}</p>
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm text-neutral-400 mt-3 line-clamp-2">{profile.bio}</p>
        )}
      </div>

      {/* Details & Specs */}
      <div className="px-5 py-4 space-y-3.5">
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <span className="flex items-center gap-1.5 text-neutral-400">
            <MapPin className="w-3.5 h-3.5 text-neutral-500" />
            {profile.city}
          </span>
          <span className="flex items-center gap-1.5 text-neutral-400">
            <Phone className="w-3.5 h-3.5 text-neutral-500" />
            {profile.phone}
          </span>
          {profile.yearsOfExperience !== undefined && (
            <span className="flex items-center gap-1.5 text-neutral-400">
              <Star className="w-3.5 h-3.5 text-neutral-500" />
              {profile.yearsOfExperience}y exp
            </span>
          )}
        </div>

        {/* Store Address for Vendors */}
        {type === 'vendor' && profile.storeAddress && (
          <div className="text-sm bg-neutral-950 p-3 rounded-lg border border-neutral-800 flex items-start gap-2">
            <Store className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs text-neutral-500 block uppercase font-bold tracking-wider">Store Address</span>
              <span className="text-neutral-300">{profile.storeAddress}</span>
            </div>
          </div>
        )}

        {/* Pricing / Booking Specs for Contractors */}
        {type === 'contractor' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
            <div className="text-sm">
              <span className="text-xs text-neutral-500 block uppercase font-bold tracking-wider">Consultation</span>
              <span className="text-neutral-300">
                {profile.acceptsConsultations ? `${formatPrice(profile.consultationFee?.amount)} (${profile.consultationDurationMinutes || 60}m)` : 'Not accepted'}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-xs text-neutral-500 block uppercase font-bold tracking-wider">Project Min Fee</span>
              <span className="text-neutral-300">
                {profile.acceptsProjects ? formatPrice(profile.projectMinFee?.amount) : 'Not accepted'}
              </span>
            </div>
          </div>
        )}

        {profile.specialties?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.specialties.map((s: string) => (
              <Badge key={s} variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30 text-xs">
                {getSpecialtyLabel(s)}
              </Badge>
            ))}
          </div>
        )}

        <ImageGallery images={profile.portfolioImages} profileId={profile._id} />
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex items-center gap-3">
        <Button
          id={`approve-${profile._id}`}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white gap-2"
          onClick={() => onApprove(type, profile._id)}
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Approve
        </Button>
        <Button
          id={`reject-${profile._id}`}
          size="sm"
          variant="outline"
          className="border-neutral-700 text-neutral-300 hover:border-red-500/50 hover:text-red-400 gap-2"
          onClick={() => onRejectClick(type, profile)}
          disabled={isProcessing}
        >
          <XCircle className="w-3.5 h-3.5" />
          Reject
        </Button>
      </div>
    </motion.div>
  );
}

// ── Main unified page ──────────────────────────────────────────────────────────
export default function AdminApprovalsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'designer' | 'contractor' | 'vendor'>('designer');

  // Queues
  const [designers, setDesigners] = useState<PendingDesigner[]>([]);
  const [contractors, setContractors] = useState<PendingContractor[]>([]);
  const [vendors, setVendors] = useState<PendingVendor[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Rejection Modal State
  const [rejectTarget, setRejectTarget] = useState<{ type: 'designer' | 'contractor' | 'vendor'; profile: any } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const fetchQueue = useCallback(async (type: 'designer' | 'contractor' | 'vendor') => {
    try {
      const endpoint = `/api/admin/${type}s/pending`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      if (type === 'designer') setDesigners(data.designers || []);
      if (type === 'contractor') setContractors(data.contractors || []);
      if (type === 'vendor') setVendors(data.vendors || []);
    } catch {
      toast({
        title: 'Error',
        description: `Failed to load pending ${type}s`,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchQueue('designer'),
      fetchQueue('contractor'),
      fetchQueue('vendor'),
    ]);
    setLoading(false);
  }, [fetchQueue]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleApprove(type: 'designer' | 'contractor' | 'vendor', id: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/${type}s/${id}/verify`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
      toast({
        title: 'Approved ✓',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} profile approved and is now live!`,
      });

      if (type === 'designer') setDesigners(prev => prev.filter(p => p._id !== id));
      if (type === 'contractor') setContractors(prev => prev.filter(p => p._id !== id));
      if (type === 'vendor') setVendors(prev => prev.filter(p => p._id !== id));
    } catch {
      toast({ title: 'Error', description: 'Could not approve profile. Try again.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectSubmit() {
    if (!rejectTarget) return;
    const { type, profile } = rejectTarget;

    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      setRejectError('Rejection reason must be at least 5 characters.');
      return;
    }
    setRejectError('');
    setActionLoading(profile._id);

    try {
      const res = await fetch(`/api/admin/${type}s/${profile._id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      if (!res.ok) throw new Error();
      toast({
        title: 'Application Rejected',
        description: 'Profile rejection submitted. The user will see this feedback.',
      });

      if (type === 'designer') setDesigners(prev => prev.filter(p => p._id !== profile._id));
      if (type === 'contractor') setContractors(prev => prev.filter(p => p._id !== profile._id));
      if (type === 'vendor') setVendors(prev => prev.filter(p => p._id !== profile._id));

      setRejectTarget(null);
      setRejectReason('');
    } catch {
      toast({ title: 'Error', description: 'Could not reject. Try again.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  }

  // Count pending items
  const counts = {
    designer: designers.length,
    contractor: contractors.length,
    vendor: vendors.length,
  };

  const activeList = activeTab === 'designer' ? designers : activeTab === 'contractor' ? contractors : vendors;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-violet-400" />
            Marketplace Approvals
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Review and approve pending registrations for all professional marketplace roles.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-neutral-700 text-neutral-300"
          onClick={fetchAll}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queues
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
        <TabsList className="bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
          <TabsTrigger
            value="designer"
            className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white text-neutral-400 text-sm gap-2"
          >
            <User className="w-4 h-4" />
            Designers
            {counts.designer > 0 && (
              <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold text-[10px] px-1.5 py-0">
                {counts.designer}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="contractor"
            className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white text-neutral-400 text-sm gap-2"
          >
            <Briefcase className="w-4 h-4" />
            Contractors
            {counts.contractor > 0 && (
              <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold text-[10px] px-1.5 py-0">
                {counts.contractor}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="vendor"
            className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white text-neutral-400 text-sm gap-2"
          >
            <Building2 className="w-4 h-4" />
            Vendors
            {counts.vendor > 0 && (
              <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold text-[10px] px-1.5 py-0">
                {counts.vendor}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <ProfileSkeleton key={i} />)}
            </div>
          ) : activeList.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-neutral-900/50 border border-neutral-800 rounded-xl"
            >
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-white">All caught up!</p>
              <p className="text-neutral-400 text-sm mt-1">
                No pending registrations for {activeTab}s.
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-4">
                {activeList.map(item => (
                  <ProfileCard
                    key={item._id}
                    type={activeTab}
                    profile={item}
                    onApprove={handleApprove}
                    onRejectClick={(type, p) => setRejectTarget({ type, profile: p })}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </Tabs>

      {/* Reject Modal */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={open => {
          if (!open) {
            setRejectTarget(null);
            setRejectReason('');
            setRejectError('');
          }
        }}
      >
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Reject Application
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Provide a clear, detailed reason so they know what to fix before resubmitting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-sm text-neutral-300">
              Applicant: <span className="font-semibold text-white">{rejectTarget?.profile?.displayName}</span>
              <span className="text-xs text-neutral-500 ml-2">({rejectTarget?.type})</span>
            </p>
            <Textarea
              id="reject-reason"
              placeholder="e.g. Portfolio images must showcase actual work. Please upload higher quality photos."
              value={rejectReason}
              onChange={e => {
                setRejectReason(e.target.value);
                setRejectError('');
              }}
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
              onClick={() => {
                setRejectTarget(null);
                setRejectReason('');
                setRejectError('');
              }}
            >
              Cancel
            </Button>
            <Button
              id="confirm-reject"
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
              onClick={handleRejectSubmit}
              disabled={actionLoading === rejectTarget?.profile?._id}
            >
              {actionLoading === rejectTarget?.profile?._id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
