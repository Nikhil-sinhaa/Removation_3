// app/(app)/designer/bookings/page.tsx
//
// Designer booking queue page.
// Fetches GET /api/designer/bookings (their incoming bookings as the designer).
// Allows accept (POST /api/bookings/[id]/accept) and reject with reason
// (POST /api/bookings/[id]/reject) for pending_designer bookings.

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getPusherClient } from '@/lib/pusherClient';
import { BookingChat } from '@/components/booking/BookingChat';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    IndianRupee,
    Loader2,
    Mail,
    MessageSquare,
    RefreshCw,
    User,
    X,
    XCircle,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { paiseToRupees } from '@/lib/booking/money';
import { cn } from '@/lib/utils';
import type { BookingStatus } from '@/lib/db/models/Booking';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BookingCustomer {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
}

interface DesignerBooking {
    _id: string;
    customerId: BookingCustomer | string;
    type: 'consultation' | 'project';
    status: BookingStatus;
    amount: number;
    currency: string;
    consultationSlot?: string;
    consultationDurationMinutes?: number;
    projectDescription?: string;
    projectPreferredStartDate?: string | null;
    designerResponseDeadline?: string;
    designerAcceptedAt?: string | null;
    designerRejectedAt?: string | null;
    paidAt?: string | null;
    createdAt: string;
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Partial<Record<BookingStatus, { label: string; color: string }>> = {
    pending_designer: { label: 'Action Required', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700 border-green-200' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200' },
    cancelled_by_customer: { label: 'Cancelled', color: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
    expired: { label: 'Expired', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    completed: { label: 'Completed', color: 'bg-violet-100 text-violet-700 border-violet-200' },
    pending_payment: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
};

// ── Reject dialog ─────────────────────────────────────────────────────────────

function RejectDialog({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    error,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    isLoading: boolean;
    error: string | null;
}) {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (!isOpen) setReason('');
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={v => { if (!v) onClose(); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reject Booking</DialogTitle>
                    <DialogDescription>
                        Please provide a reason for the customer. This will be shown to them
                        and stored for audit purposes.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <Textarea
                        id="rejection-reason"
                        placeholder="e.g. I'm fully booked during this period and unable to take on new clients right now."
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        rows={4}
                        className="resize-none"
                    />
                    <p className="text-xs text-zinc-400">
                        {reason.trim().length}/500 characters (min 5)
                    </p>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        id="confirm-reject-btn"
                        variant="destructive"
                        onClick={() => onConfirm(reason)}
                        disabled={isLoading || reason.trim().length < 5}
                    >
                        {isLoading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Rejecting…</>
                        ) : (
                            <>
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject &amp; Refund
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Booking card ──────────────────────────────────────────────────────────────

function DesignerBookingCard({
    booking,
    onAccept,
    onReject,
    onComplete,
    actionLoading,
    onChat,
    unreadCount = 0,
}: {
    booking: DesignerBooking;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
    onComplete: (id: string) => void;
    actionLoading: string | null;
    onChat: (id: string, customerName: string) => void;
    unreadCount?: number;
}) {
    const customer = typeof booking.customerId === 'object' ? booking.customerId : null;
    const status = STATUS_CONFIG[booking.status];
    const isPending = booking.status === 'pending_designer';
    const isThisLoading = actionLoading === booking._id;

    // Deadline countdown display
    let deadlineLabel = '';
    if (isPending && booking.designerResponseDeadline) {
        const msLeft = new Date(booking.designerResponseDeadline).getTime() - Date.now();
        if (msLeft > 0) {
            const hLeft = Math.floor(msLeft / 3600000);
            const mLeft = Math.floor((msLeft % 3600000) / 60000);
            deadlineLabel = `${hLeft}h ${mLeft}m left to respond`;
        } else {
            deadlineLabel = 'Response window expired';
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'bg-white rounded-2xl border shadow-sm overflow-hidden',
                isPending ? 'border-amber-200 ring-1 ring-amber-100' : 'border-zinc-100'
            )}
        >
            {/* Header */}
            <div className="p-5 border-b border-zinc-50 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    {/* Customer avatar */}
                    {customer?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={customer.imageUrl}
                            alt={customer.firstName || 'Customer'}
                            className="w-11 h-11 rounded-xl object-cover flex-shrink-0 border border-zinc-100"
                        />
                    ) : (
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-zinc-500" />
                        </div>
                    )}
                    <div>
                        <p className="font-semibold text-zinc-800">
                            {customer
                                ? `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Customer'
                                : 'Customer'}
                        </p>
                        {customer?.email && (
                            <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3" />
                                {customer.email}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {status && (
                        <Badge className={cn('gap-1 border', status.color)}>
                            {status.label}
                        </Badge>
                    )}
                    <p className="text-xs font-semibold text-zinc-700">
                        {paiseToRupees(booking.amount)}
                    </p>
                </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3">
                {/* Type */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                        {booking.type === 'consultation'
                            ? <Calendar className="w-4 h-4 text-violet-600" />
                            : <FileText className="w-4 h-4 text-violet-600" />}
                    </div>
                    <div>
                        <p className="text-sm font-medium capitalize text-zinc-700">{booking.type}</p>
                        <p className="text-xs text-zinc-400">
                            {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                </div>

                {/* Consultation slot */}
                {booking.type === 'consultation' && booking.consultationSlot && (
                    <div className="text-sm text-zinc-600 bg-zinc-50 rounded-lg px-3 py-2">
                        <span className="text-zinc-400 text-xs block mb-0.5">Requested Slot</span>
                        {new Date(booking.consultationSlot).toLocaleString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: 'Asia/Kolkata',
                        })}
                        {booking.consultationDurationMinutes && (
                            <span className="text-zinc-400"> · {booking.consultationDurationMinutes}min</span>
                        )}
                    </div>
                )}

                {/* Project description */}
                {booking.type === 'project' && booking.projectDescription && (
                    <div className="text-sm text-zinc-600 bg-zinc-50 rounded-lg px-3 py-2">
                        <span className="text-zinc-400 text-xs block mb-0.5">Project Brief</span>
                        <p className="line-clamp-3">{booking.projectDescription}</p>
                    </div>
                )}

                {/* Deadline countdown */}
                {isPending && deadlineLabel && (
                    <div className="flex items-center gap-2 text-xs font-medium text-amber-600">
                        <Clock className="w-3.5 h-3.5" />
                        {deadlineLabel}
                    </div>
                )}
            </div>

            {/* Actions */}
            {isPending && (
                <div className="px-5 pb-5 flex gap-3">
                    <Button
                        id={`accept-booking-${booking._id}`}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => onAccept(booking._id)}
                        disabled={!!actionLoading}
                    >
                        {isThisLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Accept
                    </Button>
                    <Button
                        id={`reject-booking-${booking._id}`}
                        variant="outline"
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => onReject(booking._id)}
                        disabled={!!actionLoading}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                    </Button>
                </div>
            )}

            {booking.status === 'confirmed' && (
                <div className="px-5 pb-5 flex gap-3">
                    <Button
                        id={`complete-booking-${booking._id}`}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                        onClick={() => onComplete(booking._id)}
                        disabled={!!actionLoading}
                    >
                        {isThisLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Mark as Complete
                    </Button>
                </div>
            )}

            {['pending_designer', 'confirmed', 'completed'].includes(booking.status) && (
                <div className="px-5 pb-5">
                    <Button
                        id={`chat-booking-${booking._id}`}
                        variant="outline"
                        size="sm"
                        className="text-violet-600 border-violet-200 hover:bg-violet-50 w-full flex items-center justify-center gap-1.5 relative overflow-hidden"
                        onClick={() => onChat(booking._id, customer ? `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Customer' : 'Customer')}
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat with Customer</span>
                        {unreadCount > 0 && (
                            <span className="ml-1.5 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                    </Button>
                </div>
            )}
        </motion.div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DesignerBookingsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    const [bookings, setBookings] = useState<DesignerBooking[]>([]);
    const [fetching, setFetching] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageCount, setPageCount] = useState(1);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>(''); // '' = default queue

    // Action state
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    // Reject dialog state
    const [rejectTarget, setRejectTarget] = useState<string | null>(null);
    const [rejectLoading, setRejectLoading] = useState(false);
    const [rejectError, setRejectError] = useState<string | null>(null);

    // Chat panel state
    const [chatBookingId, setChatBookingId] = useState<string | null>(null);
    const [chatCustomerName, setChatCustomerName] = useState<string>('');
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const chatBookingIdRef = useRef<string | null>(null);

    useEffect(() => {
        chatBookingIdRef.current = chatBookingId;
    }, [chatBookingId]);

    const fetchBookings = useCallback(async (p: number = 1, status: string = statusFilter) => {
        setFetching(true);
        setFetchError(null);
        try {
            const params = new URLSearchParams({ page: String(p), limit: '10' });
            if (status) params.set('status', status);
            const res = await fetch(`/api/designer/bookings?${params}`);
            if (res.status === 404) {
                router.replace('/designer/register');
                return;
            }
            if (!res.ok) throw new Error('Failed to load bookings');
            const data = await res.json();
            setBookings(data.bookings);
            setTotal(data.total);
            setPage(data.page);
            setPageCount(data.pageCount);

            // Fetch initial unread counts
            data.bookings.forEach((b: DesignerBooking) => {
                if (['pending_designer', 'confirmed', 'completed'].includes(b.status)) {
                    fetch(`/api/bookings/${b._id}/messages/unread-count`)
                        .then(r => r.ok ? r.json() : null)
                        .then(cntData => {
                            if (cntData) {
                                setUnreadCounts(prev => ({ ...prev, [b._id]: cntData.unreadCount }));
                            }
                        })
                        .catch(err => console.error('Error fetching unread count:', err));
                }
            });
        } catch (err: any) {
            setFetchError(err.message);
        } finally {
            setFetching(false);
        }
    }, [statusFilter, router]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.replace('/login'); return; }
        fetchBookings(1);
    }, [user, authLoading, router, fetchBookings]);

    // Pusher channel subscription for booking cards real-time badges
    useEffect(() => {
        if (!bookings.length) return;

        const pusher = getPusherClient();
        if (!pusher) return;

        const activeSubscribedChannels: string[] = [];
        const currentUserId = user?.id || user?._id;

        bookings.forEach(booking => {
            if (!['pending_designer', 'confirmed', 'completed'].includes(booking.status)) return;

            const channelName = `booking-${booking._id}`;
            const channel = pusher.subscribe(channelName);
            activeSubscribedChannels.push(channelName);

            channel.bind('new-message', (data: any) => {
                const senderIdStr = data.senderId && typeof data.senderId === 'object' ? data.senderId._id : data.senderId;
                if (senderIdStr !== currentUserId) {
                    setUnreadCounts(prev => {
                        if (chatBookingIdRef.current === booking._id) {
                            return prev;
                        }
                        return {
                            ...prev,
                            [booking._id]: (prev[booking._id] || 0) + 1
                        };
                    });
                }
            });

            channel.bind('messages-read', (data: any) => {
                if (data.readBy === currentUserId) {
                    setUnreadCounts(prev => ({
                        ...prev,
                        [booking._id]: 0
                    }));
                }
            });
        });

        return () => {
            activeSubscribedChannels.forEach(name => {
                pusher.unsubscribe(name);
            });
        };
    }, [bookings, user]);

    async function handleAccept(id: string) {
        setActionLoading(id);
        setActionError(null);
        try {
            const res = await fetch(`/api/bookings/${id}/accept`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to accept booking');
            fetchBookings(page);
        } catch (err: any) {
            setActionError(err.message);
        } finally {
            setActionLoading(null);
        }
    }

    async function handleComplete(id: string) {
        const confirm = window.confirm("Are you sure you want to mark this booking as complete? This will allow the customer to leave a review.");
        if (!confirm) return;

        setActionLoading(id);
        setActionError(null);
        try {
            const res = await fetch(`/api/bookings/${id}/complete`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to complete booking');
            fetchBookings(page);
        } catch (err: any) {
            setActionError(err.message);
        } finally {
            setActionLoading(null);
        }
    }

    async function handleRejectConfirm(reason: string) {
        if (!rejectTarget) return;
        setRejectLoading(true);
        setRejectError(null);
        try {
            const res = await fetch(`/api/bookings/${rejectTarget}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Rejection failed');
            setRejectTarget(null);
            fetchBookings(page);
        } catch (err: any) {
            setRejectError(err.message);
        } finally {
            setRejectLoading(false);
        }
    }

    const pendingCount = bookings.filter(b => b.status === 'pending_designer').length;

    // ── Render ────────────────────────────────────────────────────────────────

    if (authLoading || fetching) {
        return (
            <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
                <Skeleton className="h-8 w-48 rounded-xl" />
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
            </div>
        );
    }

    const filterOptions = [
        { value: '', label: 'Active Queue' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'cancelled_by_customer', label: 'Cancelled' },
        { value: 'completed', label: 'Completed' },
    ];

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Booking Requests</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        {total} booking{total !== 1 ? 's' : ''}
                        {pendingCount > 0 && (
                            <span className="ml-2 text-amber-600 font-medium">
                                · {pendingCount} need{pendingCount === 1 ? 's' : ''} action
                            </span>
                        )}
                    </p>
                </div>
                <Button
                    id="refresh-designer-bookings-btn"
                    variant="outline"
                    size="sm"
                    onClick={() => fetchBookings(page)}
                    disabled={fetching}
                >
                    <RefreshCw className={cn('w-4 h-4', fetching && 'animate-spin')} />
                </Button>
            </motion.div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap mb-5">
                {filterOptions.map(opt => (
                    <button
                        key={opt.value}
                        id={`filter-${opt.value || 'active'}`}
                        type="button"
                        onClick={() => {
                            setStatusFilter(opt.value);
                            fetchBookings(1, opt.value);
                        }}
                        className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                            statusFilter === opt.value
                                ? 'bg-violet-600 text-white border-violet-600'
                                : 'bg-white text-zinc-600 border-zinc-200 hover:border-violet-300'
                        )}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Action error */}
            {actionError && (
                <div className="flex items-center gap-2 text-sm text-red-600 mb-4 bg-red-50 p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4" />
                    {actionError}
                </div>
            )}

            {/* Fetch error */}
            {fetchError && (
                <div className="flex items-center gap-2 text-sm text-red-600 mb-4 bg-red-50 p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4" />
                    {fetchError}
                </div>
            )}

            {/* Bookings */}
            <AnimatePresence>
                {bookings.length === 0 && !fetching ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20 text-zinc-400"
                    >
                        <IndianRupee className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="font-medium text-zinc-500">No bookings here</p>
                        <p className="text-sm mt-1">
                            When customers book you, they'll appear here.
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {bookings.map(b => (
                            <DesignerBookingCard
                                key={b._id}
                                booking={b}
                                onAccept={handleAccept}
                                onReject={id => { setRejectTarget(id); setRejectError(null); }}
                                onComplete={handleComplete}
                                actionLoading={actionLoading}
                                onChat={(id, name) => {
                                    setChatBookingId(id);
                                    setChatCustomerName(name);
                                    setUnreadCounts(prev => ({ ...prev, [id]: 0 }));
                                }}
                                unreadCount={unreadCounts[b._id] || 0}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Pagination */}
            {pageCount > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => fetchBookings(page - 1)}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-zinc-500">
                        Page {page} of {pageCount}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= pageCount}
                        onClick={() => fetchBookings(page + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Reject dialog */}
            <RejectDialog
                isOpen={!!rejectTarget}
                onClose={() => setRejectTarget(null)}
                onConfirm={handleRejectConfirm}
                isLoading={rejectLoading}
                error={rejectError}
            />

            {/* Chat panel */}
            {chatBookingId && user && (
                <BookingChat
                    open={!!chatBookingId}
                    onClose={() => setChatBookingId(null)}
                    bookingId={chatBookingId}
                    currentUserId={user.id || user._id || ''}
                    providerName={chatCustomerName}
                />
            )}
        </div>
    );
}
