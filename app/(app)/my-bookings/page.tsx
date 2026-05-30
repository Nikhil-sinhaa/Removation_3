// app/(app)/my-bookings/page.tsx
//
// Customer booking history page.
// Fetches GET /api/bookings (paginated, newest first).
// Allows cancellation of pending_designer bookings via POST /api/bookings/[id]/cancel.
// No modifications to existing pages — standalone new page.

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getPusherClient } from '@/lib/pusherClient';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    IndianRupee,
    Loader2,
    MapPin,
    MessageSquare,
    RefreshCw,
    Star,
    X,
    XCircle,
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { paiseToRupees } from '@/lib/booking/money';
import { cn } from '@/lib/utils';
import type { BookingStatus } from '@/lib/db/models/Booking';
import { BookingChat } from '@/components/booking/BookingChat';

// ── Types ─────────────────────────────────────────────────────────────────────

// Shared provider shape (populated designer OR contractor)
interface BookingProvider {
    _id: string;
    displayName: string;
    city: string;
    portfolioImages: string[];
}

interface Booking {
    _id: string;
    designerId?: BookingProvider | string | null;
    contractorId?: BookingProvider | string | null;
    type: 'consultation' | 'project';
    status: BookingStatus;
    amount: number;
    currency: string;
    consultationSlot?: string;
    consultationDurationMinutes?: number;
    projectDescription?: string;
    projectPreferredStartDate?: string | null;
    paidAt?: string | null;
    refundedAt?: string | null;
    refundId?: string | null;
    designerRejectedAt?: string | null;
    designerRejectionReason?: string | null;
    customerCancelledAt?: string | null;
    designerAcceptedAt?: string | null;
    designerResponseDeadline?: string;
    refundFailed?: boolean;
    createdAt: string;
    completedAt?: string | null;
    reviewId?: string | null;
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
    BookingStatus,
    { labelKey: string; color: string; icon: React.ReactNode }
> = {
    pending_payment: {
        labelKey: 'myb_status_pending_payment',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: <Clock className="w-3 h-3" />,
    },
    pending_designer: {
        labelKey: 'myb_status_pending_designer',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: <Clock className="w-3 h-3" />,
    },
    confirmed: {
        labelKey: 'myb_status_confirmed',
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: <CheckCircle2 className="w-3 h-3" />,
    },
    rejected: {
        labelKey: 'myb_status_rejected',
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: <XCircle className="w-3 h-3" />,
    },
    cancelled_by_customer: {
        labelKey: 'myb_status_cancelled',
        color: 'bg-zinc-100 text-zinc-600 border-zinc-200',
        icon: <X className="w-3 h-3" />,
    },
    expired: {
        labelKey: 'myb_status_expired',
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        icon: <AlertCircle className="w-3 h-3" />,
    },
    completed: {
        labelKey: 'myb_status_completed',
        color: 'bg-violet-100 text-violet-700 border-violet-200',
        icon: <CheckCircle2 className="w-3 h-3" />,
    },
};

// ── Booking card ──────────────────────────────────────────────────────────────

const CHAT_STATUSES: BookingStatus[] = ['pending_designer', 'confirmed', 'completed'];

function BookingCard({
    booking,
    onCancel,
    onReview,
    onChat,
    unreadCount = 0,
}: {
    booking: Booking;
    onCancel: (id: string) => void;
    onReview: (booking: Booking) => void;
    onChat: (id: string, providerName: string) => void;
    unreadCount?: number;
}) {
    const { t } = useLanguage();

    // Resolve provider — whichever of the two is populated
    const provider: BookingProvider | null =
        (typeof booking.designerId === 'object' && booking.designerId)
            ? booking.designerId
            : (typeof booking.contractorId === 'object' && booking.contractorId)
                ? booking.contractorId
                : null;
    const isContractor = !booking.designerId && !!booking.contractorId;
    const providerLabel = isContractor ? t('myb_contractor') : t('myb_designer');
    const statusConfig = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending_payment;
    const canCancel = booking.status === 'pending_designer';
    const canChat = CHAT_STATUSES.includes(booking.status);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden"
        >
            {/* Header */}
            <div className="p-5 border-b border-zinc-50 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    {/* Provider avatar */}
                    {provider?.portfolioImages?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={provider.portfolioImages[0]}
                            alt={provider.displayName}
                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-zinc-100"
                        />
                    ) : (
                        <div className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                            isContractor
                                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                : 'bg-gradient-to-br from-violet-500 to-purple-600'
                        )}>
                            <span className="text-white font-bold text-lg">
                                {provider?.displayName?.[0]?.toUpperCase() ?? '?'}
                            </span>
                        </div>
                    )}
                    <div>
                        <p className="font-semibold text-zinc-800">
                            {provider?.displayName ?? t('unknown_provider', { role: providerLabel })}
                        </p>
                        {provider?.city && (
                            <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {provider.city}
                            </p>
                        )}
                        {isContractor && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                                {t('myb_contractor')}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Badge className={cn('gap-1 border', statusConfig.color)}>
                        {statusConfig.icon}
                        {t(statusConfig.labelKey)}
                    </Badge>
                    <span className="text-xs text-zinc-400">
                        {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3">
                {/* Type + amount */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                        {booking.type === 'consultation'
                            ? <Calendar className="w-4 h-4 text-violet-600" />
                            : <FileText className="w-4 h-4 text-violet-600" />}
                    </div>
                    <div>
                        <p className="text-sm font-medium capitalize text-zinc-700">
                            {booking.type === 'consultation' ? t('myb_type_consultation') : t('myb_type_project')}
                        </p>
                        <p className="text-xs text-zinc-400">{paiseToRupees(booking.amount)}</p>
                    </div>
                </div>

                {/* Consultation slot */}
                {booking.type === 'consultation' && booking.consultationSlot && (
                    <div className="text-sm text-zinc-600 bg-zinc-50 rounded-lg px-3 py-2">
                        <span className="text-zinc-400 text-xs block mb-0.5">{t('myb_slot')}</span>
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
                        <span className="text-zinc-400 text-xs block mb-0.5">{t('myb_description')}</span>
                        <p className="line-clamp-2">{booking.projectDescription}</p>
                    </div>
                )}

                {/* Provider response deadline */}
                {booking.status === 'pending_designer' && booking.designerResponseDeadline && (
                    <div className="flex items-center gap-2 text-xs text-amber-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                            {providerLabel} {t('myb_deadline', {
                                date: new Date(booking.designerResponseDeadline).toLocaleString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true,
                                    timeZone: 'Asia/Kolkata',
                                })
                            })}
                        </span>
                    </div>
                )}

                {/* Rejection reason */}
                {booking.status === 'rejected' && booking.designerRejectionReason && (
                    <div className="bg-red-50 rounded-lg px-3 py-2 text-xs text-red-700">
                        <span className="font-medium">{t('myb_rejection_reason')}: </span>
                        {booking.designerRejectionReason}
                    </div>
                )}

                {/* Refund info */}
                {(booking.status === 'rejected' || booking.status === 'cancelled_by_customer' || booking.status === 'expired') && (
                    <div className="flex items-center gap-2 text-xs">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {booking.refundFailed ? (
                            <span className="text-red-600 font-medium">
                                {t('myb_refund_failed')}
                            </span>
                        ) : booking.refundedAt ? (
                            <span className="text-green-600">
                                {t('myb_refund_initiated', {
                                    amount: paiseToRupees(booking.amount),
                                    date: new Date(booking.refundedAt).toLocaleDateString('en-IN')
                                })}
                            </span>
                        ) : (
                            <span className="text-zinc-500">{t('myb_refund_processing')}</span>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            {canCancel && (
                <div className="px-5 pb-5">
                    <Button
                        id={`cancel-booking-${booking._id}`}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => onCancel(booking._id)}
                    >
                        <X className="w-3.5 h-3.5 mr-1.5" />
                        {t('myb_cancel_booking')}
                    </Button>
                </div>
            )}

            {booking.status === 'completed' && !booking.reviewId && (
                <div className="px-5 pb-5">
                    <Button
                        id={`review-booking-${booking._id}`}
                        variant="outline"
                        size="sm"
                        className="text-violet-600 border-violet-200 hover:bg-violet-50"
                        onClick={() => onReview(booking)}
                    >
                        <Star className="w-3.5 h-3.5 mr-1.5 fill-violet-600" />
                        {t('myb_review_btn')}
                    </Button>
                </div>
            )}

            {booking.status === 'completed' && booking.reviewId && (
                <div className="px-5 pb-5 text-xs text-green-600 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('myb_review_submitted')}
                </div>
            )}

            {canChat && (
                <div className="px-5 pb-5">
                    <Button
                        id={`chat-booking-${booking._id}`}
                        variant="outline"
                        size="sm"
                        className="text-violet-600 border-violet-200 hover:bg-violet-50 w-full flex items-center justify-center gap-1.5 relative overflow-hidden"
                        onClick={() => onChat(booking._id, provider?.displayName ?? providerLabel)}
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{t('myb_chat_btn', { name: providerLabel })}</span>
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

export default function MyBookingsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { t } = useLanguage();

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [fetching, setFetching] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageCount, setPageCount] = useState(1);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Chat panel
    const [chatBookingId, setChatBookingId] = useState<string | null>(null);
    const [chatProviderName, setChatProviderName] = useState<string>('');
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const chatBookingIdRef = useRef<string | null>(null);

    useEffect(() => {
        chatBookingIdRef.current = chatBookingId;
    }, [chatBookingId]);

    // Cancel dialog
    const [cancelTarget, setCancelTarget] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);

    // Review dialog
    const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);
    const [rating, setRating] = useState<number>(5);
    const [comment, setComment] = useState<string>('');
    const [reviewing, setReviewing] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);

    const fetchBookings = useCallback(async (p: number = 1) => {
        setFetching(true);
        setFetchError(null);
        try {
            const res = await fetch(`/api/bookings?page=${p}&limit=10`);
            if (!res.ok) throw new Error('Failed to load bookings');
            const data = await res.json();
            setBookings(data.bookings);
            setTotal(data.total);
            setPage(data.page);
            setPageCount(data.pageCount);

            // Fetch initial unread counts
            data.bookings.forEach((b: Booking) => {
                if (CHAT_STATUSES.includes(b.status)) {
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
    }, []);

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
            if (!CHAT_STATUSES.includes(booking.status)) return;

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

    async function handleCancel() {
        if (!cancelTarget) return;
        setCancelling(true);
        setCancelError(null);
        try {
            const res = await fetch(`/api/bookings/${cancelTarget}/cancel`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Cancellation failed');
            setCancelTarget(null);
            // Refresh list
            fetchBookings(page);
        } catch (err: any) {
            setCancelError(err.message);
        } finally {
            setCancelling(false);
        }
    }

    async function handleReviewSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!reviewTarget) return;
        setReviewing(true);
        setReviewError(null);
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: reviewTarget._id,
                    rating,
                    comment,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to submit review');
            setReviewTarget(null);
            setRating(5);
            setComment('');
            fetchBookings(page);
        } catch (err: any) {
            setReviewError(err.message);
        } finally {
            setReviewing(false);
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────

    if (authLoading || fetching) {
        return (
            <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
                <Skeleton className="h-8 w-48 rounded-xl" />
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">{t('myb_title')}</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        {t('myb_total_count', { count: String(total) })}
                    </p>
                </div>
                <Button
                    id="refresh-bookings-btn"
                    variant="outline"
                    size="sm"
                    onClick={() => fetchBookings(page)}
                    disabled={fetching}
                >
                    <RefreshCw className={cn('w-4 h-4', fetching && 'animate-spin')} />
                </Button>
            </motion.div>

            {/* Error */}
            {fetchError && (
                <div className="flex items-center gap-2 text-sm text-red-600 mb-4 bg-red-50 p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4" />
                    {fetchError}
                </div>
            )}

            {/* Bookings list */}
            <AnimatePresence>
                {bookings.length === 0 && !fetching ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20 text-zinc-400"
                    >
                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="font-medium text-zinc-500">{t('myb_no_bookings')}</p>
                        <p className="text-sm mt-1">
                            {t('myb_no_bookings_desc')}
                        </p>
                        <Button
                            className="mt-5"
                            onClick={() => router.push('/designers')}
                        >
                            {t('myb_browse_experts')}
                        </Button>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {bookings.map(b => (
                            <BookingCard
                                key={b._id}
                                booking={b}
                                onCancel={id => { setCancelTarget(id); setCancelError(null); }}
                                onReview={b => {
                                    setReviewTarget(b);
                                    setRating(5);
                                    setComment('');
                                    setReviewError(null);
                                }}
                                onChat={(id, name) => {
                                    setChatBookingId(id);
                                    setChatProviderName(name);
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
                        {t('previous')}
                    </Button>
                    <span className="text-sm text-zinc-500">
                        {t('page_x_of_y', { current: String(page), total: String(pageCount) })}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= pageCount}
                        onClick={() => fetchBookings(page + 1)}
                    >
                        {t('next')}
                    </Button>
                </div>
            )}

            {/* Cancel confirmation dialog */}
            <AlertDialog open={!!cancelTarget} onOpenChange={open => { if (!open) setCancelTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('myb_cancel_confirm_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('myb_cancel_confirm_desc')}
                            {cancelError && (
                                <span className="block mt-2 text-red-600 font-medium">{cancelError}</span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={cancelling}>{t('myb_cancel_keep')}</AlertDialogCancel>
                        <AlertDialogAction
                            id="confirm-cancel-btn"
                            onClick={handleCancel}
                            disabled={cancelling}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {cancelling ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('myb_cancelling')}</>
                            ) : (
                                t('myb_cancel_yes')
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Chat panel */}
            {chatBookingId && user && (
                <BookingChat
                    open={!!chatBookingId}
                    onClose={() => setChatBookingId(null)}
                    bookingId={chatBookingId}
                    currentUserId={user.id || user._id || ''}
                    providerName={chatProviderName}
                />
            )}

            {/* Review Dialog */}
            <Dialog open={!!reviewTarget} onOpenChange={open => { if (!open) setReviewTarget(null); }}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleReviewSubmit}>
                        <DialogHeader>
                            <DialogTitle>{t('rev_title')}</DialogTitle>
                            <DialogDescription>
                                {t('rev_desc', {
                                    name: reviewTarget
                                        ? (typeof reviewTarget.designerId === 'object' && reviewTarget.designerId
                                            ? (reviewTarget.designerId.displayName || '')
                                            : typeof reviewTarget.contractorId === 'object' && reviewTarget.contractorId
                                                ? (reviewTarget.contractorId.displayName || '')
                                                : t('unknown_provider', { role: '' }))
                                        : ''
                                })}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Interactive Star Selector */}
                        <div className="flex flex-col items-center justify-center my-6 gap-2">
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        id={`star-rating-${star}`}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className="p-1 hover:scale-110 active:scale-95 transition-transform"
                                    >
                                        <Star
                                            className={cn(
                                                'w-8 h-8 transition-colors',
                                                star <= rating
                                                    ? 'text-amber-400 fill-amber-400'
                                                    : 'text-zinc-200 fill-transparent'
                                            )}
                                        />
                                    </button>
                                ))}
                            </div>
                            <span className="text-xs font-semibold text-zinc-500 capitalize">
                                {rating === 5 ? t('rev_rating_5') : rating === 4 ? t('rev_rating_4') : rating === 3 ? t('rev_rating_3') : rating === 2 ? t('rev_rating_2') : t('rev_rating_1')}
                            </span>
                        </div>

                        <div className="space-y-2 mb-4">
                            <Label htmlFor="review-comment" className="text-sm font-medium text-zinc-700">
                                {t('rev_feedback_label')}
                            </Label>
                            <Textarea
                                id="review-comment"
                                placeholder={t('rev_feedback_placeholder')}
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                className="min-h-[100px] resize-none"
                                required
                            />
                        </div>

                        {reviewError && (
                            <div className="flex items-center gap-2 text-xs text-red-600 mb-4 bg-red-50 p-2.5 rounded-lg">
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{reviewError}</span>
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setReviewTarget(null)}
                                disabled={reviewing}
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                                id="submit-review-btn"
                                type="submit"
                                disabled={reviewing}
                                className="bg-violet-600 hover:bg-violet-700 text-white"
                            >
                                {reviewing ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('rev_submitting')}</>
                                ) : (
                                    t('rev_submit_btn')
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
