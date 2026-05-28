// components/booking/BookingModal.tsx
//
// "Book this designer" checkout modal.
//
// Flow:
//   1. Customer selects booking type (consultation or project)
//   2. Customer fills type-specific fields (slot picker or description)
//   3. On submit → POST /api/bookings → get { bookingId, razorpayOrderId, amount, currency, key }
//   4. Open Razorpay checkout (same pattern as CheckoutModal.tsx)
//   5. On Razorpay success → POST /api/bookings/[id]/payment-verify
//   6. On verify success → call onSuccess(bookingId)
//
// This component does NOT manage its own open/close state (controlled by parent).
// It does NOT call /api/payment/* routes — those are subscription-only.

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    FileText,
    Loader2,
    Check,
    X,
    AlertCircle,
    Clock,
    IndianRupee,
    ChevronRight,
    Info,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { paiseToRupees } from '@/lib/booking/money';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DesignerPricingSnapshot {
    designerId?: string;          // Designer document _id
    contractorId?: string;        // Contractor document _id
    displayName: string;
    city: string;
    consultationFee?: { amount: number; currency: string };
    projectMinFee?: { amount: number; currency: string };
    acceptsConsultations: boolean;
    acceptsProjects: boolean;
    consultationDurationMinutes?: number;
}

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    designer: DesignerPricingSnapshot;
    /** Called after payment is verified. bookingId is the Booking._id */
    onSuccess?: (bookingId: string) => void;
    /**
     * Optional pre-filled project description — used when opening the modal
     * directly from an AI render (MakeItReal banner). Seeds the project
     * description textarea so the user only needs to review and pay.
     */
    initialProjectDescription?: string;
}

type BookingType = 'consultation' | 'project';
type ModalStep = 'select-type' | 'details' | 'processing' | 'success' | 'error';

// ── Razorpay script loader ───────────────────────────────────────────────────

function loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window !== 'undefined' && (window as any).Razorpay) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Razorpay script'));
        document.body.appendChild(script);
    });
}

// ── Slot picker helpers ───────────────────────────────────────────────────────

/** Generate 15-minute boundary slots for the next N days */
function generateSlots(daysAhead: number = 14): Date[] {
    const slots: Date[] = [];
    const now = new Date();
    // Round now up to the next 15-min boundary
    const roundedNow = new Date(
        Math.ceil(now.getTime() / (15 * 60 * 1000)) * (15 * 60 * 1000)
    );
    // Add a minimum 1h buffer
    const earliest = new Date(roundedNow.getTime() + 60 * 60 * 1000);

    for (let d = 0; d < daysAhead; d++) {
        const day = new Date(earliest);
        day.setDate(day.getDate() + d);
        // 9:00 to 18:00 (UTC+5:30 IST)
        for (let h = 9; h <= 17; h++) {
            for (let m = 0; m < 60; m += 15) {
                const slot = new Date(day);
                slot.setHours(h, m, 0, 0);
                if (slot > earliest) {
                    slots.push(slot);
                }
            }
        }
    }
    return slots.slice(0, 200); // cap for render performance
}

function formatSlot(date: Date): string {
    return date.toLocaleString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
    });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BookingModal({
    isOpen,
    onClose,
    designer,
    onSuccess,
    initialProjectDescription,
}: BookingModalProps) {
    const [step, setStep] = useState<ModalStep>('select-type');
    const [bookingType, setBookingType] = useState<BookingType>('consultation');
    const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
    const [projectDescription, setProjectDescription] = useState('');
    const [preferredStartDate, setPreferredStartDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successBookingId, setSuccessBookingId] = useState<string | null>(null);

    const slots = generateSlots(14);

    // Reset when modal opens
    // When initialProjectDescription is provided, jump straight to project details
    useEffect(() => {
        if (isOpen) {
            setStep(initialProjectDescription ? 'details' : 'select-type');
            setBookingType(initialProjectDescription ? 'project' : 'consultation');
            setSelectedSlot(null);
            setProjectDescription(initialProjectDescription ?? '');
            setPreferredStartDate('');
            setError(null);
            setSuccessBookingId(null);
            setIsLoading(false);
        }
    }, [isOpen, initialProjectDescription]);

    // ── Validation ────────────────────────────────────────────────────────────

    function validateDetails(): string | null {
        if (bookingType === 'consultation') {
            if (!selectedSlot) return 'Please select a time slot';
        }
        if (bookingType === 'project') {
            if (projectDescription.trim().length < 20) {
                return 'Project description must be at least 20 characters';
            }
            if (projectDescription.trim().length > 2000) {
                return 'Project description cannot exceed 2000 characters';
            }
        }
        return null;
    }

    // ── Main submit: create booking → open Razorpay ───────────────────────────

    async function handlePay() {
        const validationError = validateDetails();
        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        setIsLoading(true);
        setStep('processing');

        try {
            // 1. Create booking order
            const body: Record<string, unknown> = {
                type: bookingType,
            };
            if (designer.designerId) {
                body.designerId = designer.designerId;
            } else if (designer.contractorId) {
                body.contractorId = designer.contractorId;
            }
            if (bookingType === 'consultation' && selectedSlot) {
                body.consultationSlot = selectedSlot.toISOString();
            }
            if (bookingType === 'project') {
                body.projectDescription = projectDescription.trim();
                if (preferredStartDate) {
                    body.projectPreferredStartDate = new Date(preferredStartDate).toISOString();
                }
            }

            const createRes = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const createData = await createRes.json();

            if (!createRes.ok) {
                throw new Error(createData.message || 'Failed to create booking');
            }

            const { bookingId, razorpayOrderId, amount, currency, key } = createData;

            // 2. Load Razorpay script (idempotent) then open checkout
            await loadRazorpayScript();

            const options = {
                key: key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount,
                currency: currency || 'INR',
                name: 'Removation.ai',
                description: bookingType === 'consultation'
                    ? `Consultation with ${designer.displayName}`
                    : `Project with ${designer.displayName}`,
                order_id: razorpayOrderId,
                handler: async function (rzpResponse: {
                    razorpay_payment_id: string;
                    razorpay_order_id: string;
                    razorpay_signature: string;
                }) {
                    // 3. Verify payment
                    const verifyRes = await fetch(`/api/bookings/${bookingId}/payment-verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpayPaymentId: rzpResponse.razorpay_payment_id,
                            razorpayOrderId: rzpResponse.razorpay_order_id,
                            razorpaySignature: rzpResponse.razorpay_signature,
                        }),
                    });

                    if (verifyRes.ok) {
                        setSuccessBookingId(bookingId);
                        setStep('success');
                        onSuccess?.(bookingId);
                    } else {
                        const vData = await verifyRes.json();
                        throw new Error(vData.message || 'Payment verification failed');
                    }
                },
                prefill: {},
                theme: {
                    color: '#7c3aed',
                },
                modal: {
                    ondismiss: () => {
                        // User closed Razorpay without paying — go back to details
                        setStep('details');
                        setIsLoading(false);
                    },
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                setError(response.error?.description || 'Payment failed. Please try again.');
                setStep('error');
                setIsLoading(false);
            });
            rzp.open();

        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
            setStep('error');
        } finally {
            setIsLoading(false);
        }
    }

    // ── Render helpers ────────────────────────────────────────────────────────

    const feeAmount = bookingType === 'consultation'
        ? designer.consultationFee?.amount
        : designer.projectMinFee?.amount;

    const feeDisplay = feeAmount ? paiseToRupees(feeAmount) : null;

    function renderSelectType() {
        return (
            <motion.div
                key="select-type"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
            >
                <p className="text-sm text-zinc-500">
                    Choose how you'd like to work with <span className="font-medium text-zinc-800">{designer.displayName}</span>
                </p>

                <div className="space-y-3">
                    {designer.acceptsConsultations && designer.consultationFee?.amount ? (
                        <button
                            id="booking-type-consultation"
                            type="button"
                            onClick={() => { setBookingType('consultation'); setStep('details'); }}
                            className={cn(
                                'w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left',
                                'border-zinc-200 hover:border-violet-400 hover:bg-violet-50'
                            )}
                        >
                            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Clock className="w-5 h-5 text-violet-600" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-zinc-800">Consultation</p>
                                    <Badge className="bg-violet-100 text-violet-700 border-none">
                                        {paiseToRupees(designer.consultationFee.amount)}
                                    </Badge>
                                </div>
                                <p className="text-sm text-zinc-500 mt-0.5">
                                    {designer.consultationDurationMinutes || 60}-minute 1:1 session
                                    · Book a specific time slot
                                </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-400 self-center flex-shrink-0" />
                        </button>
                    ) : null}

                    {designer.acceptsProjects && designer.projectMinFee?.amount ? (
                        <button
                            id="booking-type-project"
                            type="button"
                            onClick={() => { setBookingType('project'); setStep('details'); }}
                            className={cn(
                                'w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left',
                                'border-zinc-200 hover:border-violet-400 hover:bg-violet-50'
                            )}
                        >
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-zinc-800">Project</p>
                                    <Badge className="bg-indigo-100 text-indigo-700 border-none">
                                        From {paiseToRupees(designer.projectMinFee.amount)}
                                    </Badge>
                                </div>
                                <p className="text-sm text-zinc-500 mt-0.5">
                                    Full interior design engagement · Designer will review and confirm
                                </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-400 self-center flex-shrink-0" />
                        </button>
                    ) : null}

                    {!designer.acceptsConsultations && !designer.acceptsProjects && (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                This designer is not currently accepting bookings.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </motion.div>
        );
    }

    function renderDetails() {
        return (
            <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
            >
                {/* Booking type badge */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setStep('select-type')}
                        className="text-sm text-violet-600 hover:underline"
                    >
                        ← Back
                    </button>
                    <Badge variant="secondary" className="capitalize">
                        {bookingType} · {feeDisplay}
                    </Badge>
                </div>

                {/* Consultation: slot picker */}
                {bookingType === 'consultation' && (
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-zinc-700">Select a time slot (IST)</p>
                        <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                            {slots.map((slot, i) => (
                                <button
                                    key={i}
                                    id={`slot-${i}`}
                                    type="button"
                                    onClick={() => setSelectedSlot(slot)}
                                    className={cn(
                                        'w-full text-left px-3 py-2 rounded-lg text-sm transition-all border',
                                        selectedSlot?.getTime() === slot.getTime()
                                            ? 'bg-violet-600 text-white border-violet-600 font-medium'
                                            : 'border-zinc-200 hover:border-violet-300 hover:bg-violet-50 text-zinc-700'
                                    )}
                                >
                                    {formatSlot(slot)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Project: description */}
                {bookingType === 'project' && (
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-zinc-700 block mb-1.5">
                                Describe your project *
                            </label>
                            <Textarea
                                id="project-description"
                                placeholder="Tell the designer about your space, style preferences, budget range, and what you'd like to achieve. Include room type, approximate area, and any specific requirements..."
                                value={projectDescription}
                                onChange={e => setProjectDescription(e.target.value)}
                                rows={5}
                                className="resize-none"
                            />
                            <p className="text-xs text-zinc-400 mt-1">
                                {projectDescription.trim().length}/2000 characters (min 20)
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-zinc-700 block mb-1.5">
                                Preferred start date <span className="text-zinc-400 font-normal">(optional)</span>
                            </label>
                            <input
                                id="preferred-start-date"
                                type="date"
                                value={preferredStartDate}
                                onChange={e => setPreferredStartDate(e.target.value)}
                                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                )}

                {/* Fee summary */}
                {feeDisplay && (
                    <div className="flex items-center justify-between p-3 bg-violet-50 rounded-xl">
                        <div className="flex items-center gap-2 text-sm text-violet-700">
                            <IndianRupee className="w-4 h-4" />
                            <span>Payment required upfront</span>
                        </div>
                        <span className="font-bold text-violet-800">{feeDisplay}</span>
                    </div>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Button
                    id="booking-pay-btn"
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                    onClick={handlePay}
                    disabled={isLoading || (bookingType === 'consultation' && !selectedSlot)}
                >
                    <IndianRupee className="w-4 h-4 mr-2" />
                    Pay {feeDisplay} &amp; Book
                </Button>

                <p className="text-xs text-center text-zinc-400">
                    The designer has 48 hours to accept. You'll get a full refund if they decline.
                </p>
            </motion.div>
        );
    }

    function renderProcessing() {
        return (
            <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center"
            >
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-violet-100 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Creating your booking…</h3>
                <p className="text-sm text-zinc-500">Opening payment. Please don't close this window.</p>
            </motion.div>
        );
    }

    function renderSuccess() {
        return (
            <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center"
            >
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Booking Confirmed!</h3>
                <p className="text-sm text-zinc-500 mb-6">
                    Payment received. {designer.displayName} has 48 hours to accept your booking.
                    We'll notify you by email.
                </p>
                <Button
                    id="booking-view-bookings-btn"
                    onClick={() => {
                        onClose();
                        window.location.href = '/my-bookings';
                    }}
                >
                    View My Bookings
                </Button>
            </motion.div>
        );
    }

    function renderError() {
        return (
            <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center"
            >
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
                <p className="text-sm text-zinc-500 mb-6">{error || 'Payment could not be processed.'}</p>
                <Button variant="outline" onClick={() => setStep('details')}>
                    Try Again
                </Button>
            </motion.div>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span>Book {designer.displayName}</span>
                            <p className="text-sm font-normal text-zinc-500">{designer.city}</p>
                        </div>
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Book a designer consultation or project
                    </DialogDescription>
                </DialogHeader>

                <AnimatePresence mode="wait">
                    {step === 'select-type' && renderSelectType()}
                    {step === 'details' && renderDetails()}
                    {step === 'processing' && renderProcessing()}
                    {step === 'success' && renderSuccess()}
                    {step === 'error' && renderError()}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}

export default BookingModal;
