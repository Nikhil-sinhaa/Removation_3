// app/(app)/vendor/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit3,
  Globe,
  MapPin,
  Phone,
  Sparkles,
  Store,
  X,
  Maximize2,
  Mail,
  Send,
  MessageSquare,
  Loader2,
} from 'lucide-react';

interface VendorProfile {
  _id: string;
  displayName: string;
  bio?: string;
  phone: string;
  city: string;
  storeAddress: string;
  specialties: string[];
  portfolioImages: string[];
  isVerified: boolean;
  verifiedAt?: string;
  rejectionReason?: string | null;
  isActive: boolean;
  createdAt: string;
}

interface CustomerInfo {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface Inquiry {
  _id: string;
  customerId: CustomerInfo;
  message: string;
  phone?: string;
  email?: string;
  status: 'pending' | 'responded' | 'closed';
  vendorResponse?: string | null;
  respondedAt?: string | null;
  createdAt: string;
}

function StatusBanner({ vendor }: { vendor: VendorProfile }) {
  if (vendor.isVerified) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl"
      >
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-emerald-800">Store Verified ✓ Listed Live</p>
          <p className="text-sm text-emerald-700 mt-0.5">
            Your store is live and visible to customers browsing vendors.
            {vendor.verifiedAt && (
              <> Verified on {new Date(vendor.verifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.</>
            )}
          </p>
          <Button asChild size="sm" variant="outline" className="mt-3 border-emerald-300 text-emerald-700 hover:bg-emerald-100">
            <a href="/api/vendors" target="_blank" rel="noopener noreferrer">
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              View API directory
            </a>
          </Button>
        </div>
      </motion.div>
    );
  }

  if (vendor.rejectionReason) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4 p-4 bg-red-50 border border-red-200 rounded-2xl"
      >
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-red-800">Application Rejected</p>
          <p className="text-sm text-red-700 mt-0.5">
            <span className="font-medium">Reason:</span> {vendor.rejectionReason}
          </p>
          <p className="text-sm text-red-600 mt-1">
            You can update your profile and resubmit for review.
          </p>
          <Button asChild size="sm" className="mt-3 bg-red-600 hover:bg-red-700 text-white">
            <Link href="/vendor/register">
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              Edit & Resubmit
            </Link>
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl"
    >
      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <Clock className="w-5 h-5 text-amber-600" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-amber-800">Pending Review</p>
        <p className="text-sm text-amber-700 mt-0.5">
          Your vendor application has been submitted and is under review. This usually takes 24–48 hours.
        </p>
      </div>
    </motion.div>
  );
}

const SPECIALTY_LABELS: Record<string, string> = {
  'tile-shop': 'Tile Shop',
  'paint-store': 'Paint Store',
  'furniture-seller': 'Furniture Seller',
  'hardware-store': 'Hardware Store',
};

export default function VendorDashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [fetchingInquiries, setFetchingInquiries] = useState(true);

  // Inquiry Reply Modal State
  const [replyingInquiry, setReplyingInquiry] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const loadInquiries = useCallback(async () => {
    setFetchingInquiries(true);
    try {
      const res = await fetch('/api/vendor/inquiries');
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.inquiries || []);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load inquiries.', variant: 'destructive' });
    } finally {
      setFetchingInquiries(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace('/login'); return; }

    (async () => {
      try {
        const res = await fetch('/api/vendor/me');
        if (res.status === 404) {
          router.replace('/vendor/register');
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setProfile(data.vendor);
          loadInquiries();
        }
      } catch {
        toast({ title: 'Error', description: 'Failed to load profile.', variant: 'destructive' });
      } finally {
        setFetchingProfile(false);
      }
    })();
  }, [user, isLoading, router, loadInquiries, toast]);

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyingInquiry) return;
    if (replyText.trim().length < 5) {
      toast({ title: 'Error', description: 'Reply must be at least 5 characters.', variant: 'destructive' });
      return;
    }

    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/vendor/inquiries/${replyingInquiry._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: replyText.trim(),
          status: 'responded',
        }),
      });

      if (res.ok) {
        toast({ title: 'Success', description: 'Your reply has been sent successfully!' });
        setReplyingInquiry(null);
        setReplyText('');
        loadInquiries();
      } else {
        const errData = await res.json();
        toast({ title: 'Error', description: errData.message || 'Failed to submit reply.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error.', variant: 'destructive' });
    } finally {
      setSubmittingReply(false);
    }
  }

  if (isLoading || fetchingProfile) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/25">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
            <p className="text-sm text-gray-500">Manage your store listing &amp; inquiries</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="border-gray-200">
          <Link href="/vendor/register">
            <Edit3 className="w-4 h-4 mr-1.5" />
            Edit Profile
          </Link>
        </Button>
      </motion.div>

      {/* Status banner */}
      <div className="mb-6">
        <StatusBanner vendor={profile} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Profile info */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4"
          >
            <div>
              <h2 className="text-lg font-bold text-gray-950">{profile.displayName}</h2>
              {profile.bio && <p className="text-sm text-gray-500 mt-1">{profile.bio}</p>}
            </div>

            <hr className="border-gray-100" />

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Phone</p>
                  <p className="text-gray-900">{profile.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Location</p>
                  <p className="text-gray-900">{profile.city}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Store className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Address</p>
                  <p className="text-gray-900 text-xs leading-relaxed">{profile.storeAddress}</p>
                </div>
              </div>
            </div>

            {profile.specialties.length > 0 && (
              <>
                <hr className="border-gray-100" />
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Specialties</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.specialties.map(spec => (
                      <Badge key={spec} variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                        {SPECIALTY_LABELS[spec] || spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Right column: Inquiries list */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-950 flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-600" />
                Customer Inquiries
              </h2>
              <span className="text-xs text-gray-400 tabular-nums">
                {inquiries.length} received
              </span>
            </div>

            {fetchingInquiries ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : inquiries.length === 0 ? (
              <div className="text-center py-12 bg-gray-50/50 border border-dashed border-gray-100 rounded-2xl">
                <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-500">No inquiries yet</p>
                <p className="text-xs text-gray-400 mt-0.5">When customers request quotes, they will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inquiry) => (
                  <div
                    key={inquiry._id}
                    id={`inquiry-card-${inquiry._id}`}
                    className="p-4 rounded-xl border border-gray-100 hover:border-emerald-100 hover:bg-emerald-50/5 transition-all duration-150 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {inquiry.customerId?.firstName || 'Customer'} {inquiry.customerId?.lastName || ''}
                        </p>
                        <p className="text-xs text-gray-400">
                          Received on {new Date(inquiry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <Badge
                        id={`inquiry-status-${inquiry._id}`}
                        className={cn(
                          inquiry.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : inquiry.status === 'responded'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        )}
                      >
                        {inquiry.status.toUpperCase()}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100/50 whitespace-pre-line leading-relaxed">
                      {inquiry.message}
                    </p>

                    {(inquiry.phone || inquiry.email || inquiry.customerId?.email) && (
                      <div className="flex gap-4 flex-wrap text-xs text-gray-500">
                        {inquiry.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {inquiry.phone}
                          </span>
                        )}
                        {(inquiry.email || inquiry.customerId?.email) && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {inquiry.email || inquiry.customerId?.email}
                          </span>
                        )}
                      </div>
                    )}

                    {inquiry.vendorResponse ? (
                      <div className="bg-emerald-50/30 border border-emerald-100/50 p-3 rounded-lg space-y-1">
                        <p className="text-xs font-semibold text-emerald-800">Your Response:</p>
                        <p className="text-xs text-emerald-700 whitespace-pre-line">{inquiry.vendorResponse}</p>
                        {inquiry.respondedAt && (
                          <p className="text-[10px] text-emerald-600/80">
                            Sent on {new Date(inquiry.respondedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        )}
                      </div>
                    ) : (
                      inquiry.status === 'pending' && (
                        <div className="flex justify-end pt-1">
                          <Button
                            id={`reply-btn-${inquiry._id}`}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs rounded-lg"
                            onClick={() => {
                              setReplyingInquiry(inquiry);
                              setReplyText('');
                            }}
                          >
                            <Send className="w-3 h-3" />
                            Send Quote / Reply
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Reply Modal */}
      <AnimatePresence>
        {replyingInquiry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-950">Reply to Inquiry</h3>
                  <p className="text-xs text-gray-400">
                    From {replyingInquiry.customerId?.firstName || 'Customer'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingInquiry(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={submitReply}>
                <div className="p-5 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer Message</label>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100/50 max-h-32 overflow-y-auto leading-relaxed">
                      {replyingInquiry.message}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Your Quote / Response</label>
                    <Textarea
                      id="inquiry-reply-text"
                      required
                      rows={5}
                      placeholder="Enter pricing, product availability, or details to reply to the customer..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      className="border-gray-200 focus-visible:ring-emerald-500 resize-none"
                    />
                    <span className="text-xs text-gray-400 block text-right">
                      Min 5 characters
                    </span>
                  </div>
                </div>

                <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setReplyingInquiry(null)}
                    className="hover:bg-gray-200/50 rounded-lg text-gray-500"
                  >
                    Cancel
                  </Button>
                  <Button
                    id="submit-reply-btn"
                    type="submit"
                    disabled={submittingReply || replyText.trim().length < 5}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1.5"
                  >
                    {submittingReply ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Reply
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
