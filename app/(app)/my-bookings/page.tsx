// app/(app)/my-bookings/page.tsx
//
// Customer booking history page.
// Fetches GET /api/bookings (paginated, newest first).
// Allows cancellation of pending_designer bookings via POST /api/bookings/[id]/cancel.
// No modifications to existing pages — standalone new page.

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
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
    RefreshCw,
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
import { paiseToRupees } from '@/lib/booking/money';
import { cn } from '@/lib/utils';
import type { BookingStatus } from '@/lib/db/models/Booking';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BookingDesigner {
    _id: string;
    displayName: string;
    city: string;
    portfolioImages: string[];
}

interface Booking {
    _id: string;
    designerId: BookingDesigner | string;
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
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
    BookingStatus,
    { label: string; color: string; icon: React.ReactNode }
> = {
    pending_payment: {
        label: 'Awaiting Payment',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: <Clock className="w-3 h-3" />,
    },
    pending_designer: {
        label: 'Awaiting Designer',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: <Clock className="w-3 h-3" />,
    },
    confirmed: {
        label: 'Confirmed',
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: <CheckCircle2 className="w-3 h-3" />,
    },
    rejected: {
        label: 'Rejected',
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: <XCircle className="w-3 h-3" />,
    },
    cancelled_by_customer: {
        label: 'Cancelled',
        color: 'bg-zinc-100 text-zinc-600 border-zinc-200',
        icon: <X className="w-3 h-3" />,
    },
    expired: {
        label: 'Expired',
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        icon: <AlertCircle className="w-3 h-3" />,
    },
    completed: {
        label: 'Completed',
        color: 'bg-violet-100 text-violet-700 border-violet-200',
        icon: <CheckCircle2 className="w-3 h-3" />,
    },
};

// ── Booking card ──────────────────────────────────────────────────────────────

function BookingCard({
    booking,
    onCancel,
}: {
    booking: Booking;
    onCancel: (id: string) => void;
}) {
    const designer = typeof booking.designerId === 'object' ? booking.designerId : null;
    const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending_payment;
    const canCancel = booking.status === 'pending_designer';

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden"
        >
            {/* Header */}
            <div className="p-5 border-b border-zinc-50 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    {/* Designer avatar */}
                    {designer?.portfolioImages?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={designer.portfolioImages[0]}
                            alt={designer.displayName}
                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-zinc-100"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-lg">
                                {designer?.displayName?.[0]?.toUpperCase() ?? '?'}
                            </span>
                        </div>
                    )}
                    <div>
                        <p className="font-semibold text-zinc-800">
                            {designer?.displayName ?? 'Unknown Designer'}
                        </p>
                        {designer?.city && (
                            <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {designer.city}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Badge className={cn('gap-1 border', status.color)}>
                        {status.icon}
                        {status.label}
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
                        <p className="text-sm font-medium capitalize text-zinc-700">{booking.type}</p>
                        <p className="text-xs text-zinc-400">{paiseToRupees(booking.amount)}</p>
                    </div>
                </div>

                {/* Consultation slot */}
                {booking.type === 'consultation' && booking.consultationSlot && (
                    <div className="text-sm text-zinc-600 bg-zinc-50 rounded-lg px-3 py-2">
                        <span className="text-zinc-400 text-xs block mb-0.5">Slot</span>
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
                        <span className="text-zinc-400 text-xs block mb-0.5">Description</span>
                        <p className="line-clamp-2">{booking.projectDescription}</p>
                    </div>
                )}

                {/* Designer response deadline */}
                {booking.status === 'pending_designer' && booking.designerResponseDeadline && (
                    <div className="flex items-center gap-2 text-xs text-amber-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                            Designer must respond by{' '}
                            {new Date(booking.designerResponseDeadline).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                                timeZone: 'Asia/Kolkata',
                            })}
                        </span>
                    </div>
                )}

                {/* Rejection reason */}
                {booking.status === 'rejected' && booking.designerRejectionReason && (
                    <div className="bg-red-50 rounded-lg px-3 py-2 text-xs text-red-700">
                        <span className="font-medium">Reason: </span>
                        {booking.designerRejectionReason}
                    </div>
                )}

                {/* Refund info */}
                {(booking.status === 'rejected' || booking.status === 'cancelled_by_customer' || booking.status === 'expired') && (
                    <div className="flex items-center gap-2 text-xs">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {booking.refundFailed ? (
                            <span className="text-red-600 font-medium">
                                Refund failed. Please contact support.
                            </span>
                        ) : booking.refundedAt ? (
                            <span className="text-green-600">
                                Refund of {paiseToRupees(booking.amount)} initiated on{' '}
                                {new Date(booking.refundedAt).toLocaleDateString('en-IN')}
                            </span>
                        ) : (
                            <span className="text-zinc-500">Refund processing (2–5 business days)</span>
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
                        Cancel Booking
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

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [fetching, setFetching] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageCount, setPageCount] = useState(1);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Cancel dialog
    const [cancelTarget, setCancelTarget] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);

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
                    <h1 className="text-2xl font-bold text-zinc-900">My Bookings</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        {total} booking{total !== 1 ? 's' : ''}
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
                        <p className="font-medium text-zinc-500">No bookings yet</p>
                        <p className="text-sm mt-1">
                            Browse designers and book a consultation or project.
                        </p>
                        <Button
                            className="mt-5"
                            onClick={() => router.push('/designers')}
                        >
                            Browse Designers
                        </Button>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {bookings.map(b => (
                            <BookingCard
                                key={b._id}
                                booking={b}
                                onCancel={id => { setCancelTarget(id); setCancelError(null); }}
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

            {/* Cancel confirmation dialog */}
            <AlertDialog open={!!cancelTarget} onOpenChange={open => { if (!open) setCancelTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Your payment will be refunded within 2–5 business days.
                            This cannot be undone.
                            {cancelError && (
                                <span className="block mt-2 text-red-600 font-medium">{cancelError}</span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={cancelling}>Keep Booking</AlertDialogCancel>
                        <AlertDialogAction
                            id="confirm-cancel-btn"
                            onClick={handleCancel}
                            disabled={cancelling}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {cancelling ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Cancelling…</>
                            ) : (
                                'Yes, Cancel'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
