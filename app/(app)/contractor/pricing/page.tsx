// app/(app)/contractor/pricing/page.tsx
//
// Contractor pricing & availability settings page.
// Fetches GET /api/contractor/me to load current pricing.
// Saves via PATCH /api/contractor/me (whitelist: consultationFee, projectMinFee,
// acceptsConsultations, acceptsProjects, consultationDurationMinutes).
//
// Key invariant: all user inputs are in RUPEES (display), but we convert to paise
// before sending to the API (rupeesToPaise) and convert from paise for display
// (paiseToRupees). This matches the pricing page spec.

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    IndianRupee,
    Loader2,
    Save,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';
import { paiseToRupees, rupeesToPaise } from '@/lib/booking/money';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PricingForm {
    consultationFeeRupees: string;     // input value in rupees (string for controlled input)
    projectMinFeeRupees: string;       // input value in rupees (string for controlled input)
    acceptsConsultations: boolean;
    acceptsProjects: boolean;
    consultationDurationMinutes: number;
}

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
const MIN_FEE_RUPEES = 0;
const MAX_FEE_RUPEES = 100_000; // ₹1,00,000

// ── Input field ───────────────────────────────────────────────────────────────

function RupeeInput({
    id,
    label,
    value,
    onChange,
    disabled,
    hint,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    hint?: string;
}) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="text-sm font-medium text-zinc-700 block">
                {label}
            </label>
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                    <IndianRupee className="w-4 h-4" />
                </div>
                <input
                    id={id}
                    type="number"
                    min={MIN_FEE_RUPEES}
                    max={MAX_FEE_RUPEES}
                    step="1"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder="0"
                    className={cn(
                        'w-full pl-9 pr-4 h-10 rounded-lg border border-zinc-200 text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent',
                        'disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed'
                    )}
                />
            </div>
            {hint && <p className="text-xs text-zinc-400">{hint}</p>}
        </div>
    );
}

// ── Toggle row ────────────────────────────────────────────────────────────────

function ToggleRow({
    id,
    label,
    description,
    value,
    onChange,
    disabled,
}: {
    id: string;
    label: string;
    description: string;
    value: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <div className="flex items-start gap-4 p-4 rounded-xl border border-zinc-100 bg-zinc-50">
            <div className="flex-1">
                <p className="font-medium text-sm text-zinc-800">{label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
            </div>
            <button
                id={id}
                type="button"
                onClick={() => onChange(!value)}
                disabled={disabled}
                aria-pressed={value}
                className="flex-shrink-0 mt-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {value ? (
                    <ToggleRight className="w-8 h-8 text-violet-600" />
                ) : (
                    <ToggleLeft className="w-8 h-8 text-zinc-400" />
                )}
            </button>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ContractorPricingPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    const [form, setForm] = useState<PricingForm>({
        consultationFeeRupees: '0',
        projectMinFeeRupees: '0',
        acceptsConsultations: true,
        acceptsProjects: true,
        consultationDurationMinutes: 60,
    });

    // ── Load current pricing ──────────────────────────────────────────────────

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const res = await fetch('/api/contractor/me');
            if (res.status === 404) {
                router.replace('/contractor/register');
                return;
            }
            if (!res.ok) throw new Error('Failed to load profile');
            const data = await res.json();
            const c = data.contractor;

            // Convert paise → rupees for form display
            setForm({
                consultationFeeRupees: String(
                    c.consultationFee?.amount ? Math.round(c.consultationFee.amount / 100) : 0
                ),
                projectMinFeeRupees: String(
                    c.projectMinFee?.amount ? Math.round(c.projectMinFee.amount / 100) : 0
                ),
                acceptsConsultations: c.acceptsConsultations ?? true,
                acceptsProjects: c.acceptsProjects ?? true,
                consultationDurationMinutes: c.consultationDurationMinutes ?? 60,
            });
        } catch (err: any) {
            setFetchError(err.message);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.replace('/login'); return; }
        loadProfile();
    }, [user, authLoading, router, loadProfile]);

    // ── Validation ────────────────────────────────────────────────────────────

    function validate(): string | null {
        const cfRupees = parseFloat(form.consultationFeeRupees);
        const pmfRupees = parseFloat(form.projectMinFeeRupees);

        if (isNaN(cfRupees) || cfRupees < MIN_FEE_RUPEES || cfRupees > MAX_FEE_RUPEES) {
            return `Consultation fee must be between ₹${MIN_FEE_RUPEES} and ₹${MAX_FEE_RUPEES.toLocaleString('en-IN')}`;
        }
        if (isNaN(pmfRupees) || pmfRupees < MIN_FEE_RUPEES || pmfRupees > MAX_FEE_RUPEES) {
            return `Project minimum fee must be between ₹${MIN_FEE_RUPEES} and ₹${MAX_FEE_RUPEES.toLocaleString('en-IN')}`;
        }
        if (form.acceptsConsultations && cfRupees <= 0) {
            return 'Set a consultation fee before enabling consultations (must be > ₹0)';
        }
        if (form.acceptsProjects && pmfRupees <= 0) {
            return 'Set a project minimum fee before enabling project bookings (must be > ₹0)';
        }
        return null;
    }

    // ── Save ──────────────────────────────────────────────────────────────────

    async function handleSave() {
        const validationError = validate();
        if (validationError) {
            setSaveError(validationError);
            return;
        }

        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            // Convert rupees → paise for API
            const cfPaise = rupeesToPaise(parseFloat(form.consultationFeeRupees));
            const pmfPaise = rupeesToPaise(parseFloat(form.projectMinFeeRupees));

            const res = await fetch('/api/contractor/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    consultationFee: { amount: cfPaise },
                    projectMinFee: { amount: pmfPaise },
                    acceptsConsultations: form.acceptsConsultations,
                    acceptsProjects: form.acceptsProjects,
                    consultationDurationMinutes: form.consultationDurationMinutes,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to save pricing');

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            setSaveError(err.message);
        } finally {
            setSaving(false);
        }
    }

    // ── Derived display values ────────────────────────────────────────────────

    const cfPaisePreview = rupeesToPaise(parseFloat(form.consultationFeeRupees) || 0);
    const pmfPaisePreview = rupeesToPaise(parseFloat(form.projectMinFeeRupees) || 0);

    // ── Render ────────────────────────────────────────────────────────────────

    if (authLoading || loading) {
        return (
            <div className="max-w-xl mx-auto py-8 px-4 space-y-4">
                <Skeleton className="h-8 w-48 rounded-xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto py-8 px-4">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Header */}
                <div className="mb-6 space-y-4">
                    <Link
                        href="/contractor/dashboard"
                        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-800 transition-colors gap-1.5"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">Pricing & Availability</h1>
                        <p className="text-sm text-zinc-500 mt-1">
                            Set your fees and toggle which booking types you accept. Setting valid fees enables customer bookings on your public profile.
                        </p>
                    </div>
                </div>

                {fetchError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 mb-5 bg-red-50 p-3 rounded-xl">
                        <AlertCircle className="w-4 h-4" />
                        {fetchError}
                    </div>
                )}

                <div className="space-y-5">

                    {/* ── Consultation section ───────────────────────────────── */}
                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-violet-600" />
                                <h2 className="font-semibold text-zinc-800">Consultation</h2>
                            </div>
                            {form.acceptsConsultations ? (
                                <Badge className="bg-green-100 text-green-700 border-green-200">Open</Badge>
                            ) : (
                                <Badge className="bg-zinc-100 text-zinc-500 border-zinc-200">Closed</Badge>
                            )}
                        </div>

                        <ToggleRow
                            id="toggle-consultations"
                            label="Accept consultation bookings"
                            description="Customers can book a time slot for a 1:1 call"
                            value={form.acceptsConsultations}
                            onChange={v => setForm(f => ({ ...f, acceptsConsultations: v }))}
                            disabled={saving}
                        />

                        <RupeeInput
                            id="consultation-fee"
                            label="Fee per session (₹)"
                            value={form.consultationFeeRupees}
                            onChange={v => setForm(f => ({ ...f, consultationFeeRupees: v }))}
                            disabled={saving}
                            hint={cfPaisePreview > 0
                                ? `Stored as ${cfPaisePreview.toLocaleString('en-IN')} paise = ${paiseToRupees(cfPaisePreview)}`
                                : 'Enter amount in rupees (e.g. 1500 for ₹1,500)'}
                        />

                        {/* Duration picker */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 block">
                                Session duration
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {DURATION_OPTIONS.map(d => (
                                    <button
                                        key={d}
                                        id={`duration-${d}`}
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, consultationDurationMinutes: d }))}
                                        disabled={saving}
                                        className={cn(
                                            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                                            form.consultationDurationMinutes === d
                                                ? 'bg-violet-600 text-white border-violet-600'
                                                : 'bg-white text-zinc-600 border-zinc-200 hover:border-violet-300 disabled:opacity-50'
                                        )}
                                    >
                                        {d}min
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Project section ────────────────────────────────────── */}
                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <IndianRupee className="w-5 h-5 text-indigo-600" />
                                <h2 className="font-semibold text-zinc-800">Project Engagements</h2>
                            </div>
                            {form.acceptsProjects ? (
                                <Badge className="bg-green-100 text-green-700 border-green-200">Open</Badge>
                            ) : (
                                <Badge className="bg-zinc-100 text-zinc-500 border-zinc-200">Closed</Badge>
                            )}
                        </div>

                        <ToggleRow
                            id="toggle-projects"
                            label="Accept project bookings"
                            description="Customers can submit a project brief for you to review"
                            value={form.acceptsProjects}
                            onChange={v => setForm(f => ({ ...f, acceptsProjects: v }))}
                            disabled={saving}
                        />

                        <RupeeInput
                            id="project-min-fee"
                            label="Minimum project fee (₹)"
                            value={form.projectMinFeeRupees}
                            onChange={v => setForm(f => ({ ...f, projectMinFeeRupees: v }))}
                            disabled={saving}
                            hint={pmfPaisePreview > 0
                                ? `Stored as ${pmfPaisePreview.toLocaleString('en-IN')} paise = ${paiseToRupees(pmfPaisePreview)}`
                                : 'Shown to customers as the starting price for projects'}
                        />
                    </div>

                    {/* ── Save button + feedback ─────────────────────────────── */}
                    {saveError && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {saveError}
                        </div>
                    )}

                    {saveSuccess && (
                        <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-xl"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Pricing saved successfully!
                        </motion.div>
                    )}

                    <Button
                        id="save-pricing-btn"
                        className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                        onClick={handleSave}
                        disabled={saving}
                        size="lg"
                    >
                        {saving ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                        ) : (
                            <><Save className="w-4 h-4 mr-2" />Save Pricing</>
                        )}
                    </Button>

                    <p className="text-xs text-center text-zinc-400">
                        Fees are stored in paise internally (Indian smallest unit, same as Razorpay).
                        Enter amounts in rupees — conversion happens automatically.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
