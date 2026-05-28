// components/ai/MakeItReal.tsx
//
// "Make It Real" banner — shown below an AI render result.
// Fetches matched designers via GET /api/designers/match and renders
// DesignerMatchCards. Manages the BookingModal.
//
// Props:
//   roomType   — e.g. "living-room" (hyphens preferred; underscores are
//                normalised by the API). Defaults to "living-room".
//   style      — e.g. "minimalist" (optional)
//   afterImage — URL of the generated render (shown as thumb in the banner)
//
// City source:
//   Calls GET /api/designer/me first. If the user has a designer profile we
//   use their city. Otherwise we fall back to a small inline text input.

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DesignerMatchCard, MatchedDesigner } from '@/components/ai/DesignerMatchCard';
import { BookingModal } from '@/components/booking/BookingModal';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MakeItRealProps {
    /** Room type slug — "living-room", "bedroom", etc. Defaults to "living-room". */
    roomType?: string;
    /** Style slug — "minimalist", "luxury", etc. Optional. */
    style?: string;
    /** URL of the AI-generated render — shown as thumbnail in the heading. */
    afterImage?: string;
}

// ── City resolution ───────────────────────────────────────────────────────────

async function fetchUserCity(): Promise<string | null> {
    try {
        const res = await fetch('/api/designer/me', { credentials: 'include' });
        if (!res.ok) return null;
        const data = await res.json();
        return (data?.designer?.city as string) || null;
    } catch {
        return null;
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildProjectDescription(
    roomType: string,
    style: string | undefined,
    afterImage: string | undefined
): string {
    const roomLabel = roomType
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    const styleLabel = style
        ? style.charAt(0).toUpperCase() + style.slice(1) + ' style '
        : '';
    const imageRef = afterImage ? `\n\nRender reference: ${afterImage}` : '';
    return (
        `I used Removation AI to generate a ${styleLabel}${roomLabel} design ` +
        `and would like a designer to help make it a reality. ` +
        `Please review my render and provide a quote for the full project.` +
        imageRef
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MakeItReal({ roomType = 'living-room', style, afterImage }: MakeItRealProps) {
    const [city, setCity] = useState<string>('');
    const [cityInput, setCityInput] = useState<string>('');
    const [needsCityInput, setNeedsCityInput] = useState(false);
    const [cityResolved, setCityResolved] = useState(false);

    const [designers, setDesigners] = useState<MatchedDesigner[]>([]);
    const [matchedOn, setMatchedOn] = useState<{ city: string; specialties: string[] } | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [isExpanded, setIsExpanded] = useState(true);

    // BookingModal state
    const [bookingTarget, setBookingTarget] = useState<MatchedDesigner | null>(null);
    const [initialDesc, setInitialDesc] = useState('');

    // ── Step 1: resolve city ────────────────────────────────────────────────
    useEffect(() => {
        fetchUserCity().then(c => {
            if (c) {
                setCity(c);
                setCityResolved(true);
            } else {
                setNeedsCityInput(true);
            }
        });
    }, []);

    // ── Step 2: fetch designers once city is known ──────────────────────────
    const fetchDesigners = useCallback(async (resolvedCity: string) => {
        if (!resolvedCity.trim()) return;
        setIsFetching(true);
        setFetchError(null);

        const params = new URLSearchParams({ city: resolvedCity, limit: '3' });
        if (roomType) params.set('roomType', roomType);
        if (style)    params.set('style', style);

        try {
            const res = await fetch(`/api/designers/match?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to fetch designers');
            setDesigners(data.designers ?? []);
            setMatchedOn(data.matchedOn ?? null);
        } catch (err: any) {
            setFetchError(err.message || 'Could not load designers');
        } finally {
            setIsFetching(false);
        }
    }, [roomType, style]);

    useEffect(() => {
        if (cityResolved && city) {
            fetchDesigners(city);
        }
    }, [cityResolved, city, fetchDesigners]);

    // ── City input submit ───────────────────────────────────────────────────
    function handleCitySubmit(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = cityInput.trim();
        if (!trimmed) return;
        setCity(trimmed);
        setCityResolved(true);
        setNeedsCityInput(false);
    }

    // ── Book button ─────────────────────────────────────────────────────────
    function handleBook(designer: MatchedDesigner) {
        setInitialDesc(buildProjectDescription(roomType, style, afterImage));
        setBookingTarget(designer);
    }

    function handleBookingClose() {
        setBookingTarget(null);
    }

    // ── Don't render at all until we've determined whether we need a city ──
    if (!needsCityInput && !cityResolved) {
        return null; // still resolving
    }

    return (
        <>
            <motion.section
                id="make-it-real"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mt-6 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 overflow-hidden"
            >
                {/* ── Header ──────────────────────────────────────────────── */}
                <button
                    type="button"
                    onClick={() => setIsExpanded(v => !v)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                    aria-expanded={isExpanded}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold text-zinc-900 text-sm leading-tight">
                                Make It Real
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Hire a verified designer to execute this render
                            </p>
                        </div>
                    </div>
                    {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-zinc-400" />
                        : <ChevronDown className="w-4 h-4 text-zinc-400" />
                    }
                </button>

                {/* ── Body ────────────────────────────────────────────────── */}
                <AnimatePresence initial={false}>
                    {isExpanded && (
                        <motion.div
                            key="body"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="px-5 pb-5 space-y-4">

                                {/* ── City input (only if no designer profile) ── */}
                                {needsCityInput && !cityResolved && (
                                    <form onSubmit={handleCitySubmit} className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                            <input
                                                id="make-it-real-city"
                                                type="text"
                                                value={cityInput}
                                                onChange={e => setCityInput(e.target.value)}
                                                placeholder="Your city (e.g. Bangalore)"
                                                className="w-full h-10 pl-9 pr-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            size="sm"
                                            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
                                        >
                                            Find Designers
                                        </Button>
                                    </form>
                                )}

                                {/* ── City resolved: show chip + refresh ─────── */}
                                {cityResolved && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                            <MapPin className="w-3.5 h-3.5 text-violet-400" />
                                            <span>Designers near <span className="font-medium text-zinc-700">{city}</span></span>
                                            {matchedOn?.specialties?.length ? (
                                                <span className="text-violet-500">
                                                    · matched on {matchedOn.specialties.length} specialt{matchedOn.specialties.length === 1 ? 'y' : 'ies'}
                                                </span>
                                            ) : null}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCity('');
                                                setCityInput('');
                                                setCityResolved(false);
                                                setNeedsCityInput(true);
                                                setDesigners([]);
                                            }}
                                            className="text-xs text-violet-500 hover:underline"
                                        >
                                            Change city
                                        </button>
                                    </div>
                                )}

                                {/* ── Loading ─────────────────────────────────── */}
                                {isFetching && (
                                    <div className="flex items-center gap-2 text-sm text-zinc-500 py-3">
                                        <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                                        <span>Finding designers in {city}…</span>
                                    </div>
                                )}

                                {/* ── Error ───────────────────────────────────── */}
                                {fetchError && !isFetching && (
                                    <p className="text-sm text-red-500">{fetchError}</p>
                                )}

                                {/* ── Results grid ────────────────────────────── */}
                                {!isFetching && designers.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {designers.map((d, i) => (
                                            <DesignerMatchCard
                                                key={d._id}
                                                designer={d}
                                                onBook={handleBook}
                                                index={i}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* ── Empty state ─────────────────────────────── */}
                                {!isFetching && cityResolved && designers.length === 0 && !fetchError && (
                                    <p className="text-sm text-zinc-500 text-center py-3">
                                        No verified designers found in {city} yet.{' '}
                                        <a href="/designers" className="text-violet-500 hover:underline">
                                            Browse all designers →
                                        </a>
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.section>

            {/* ── BookingModal (portal — lives outside the banner) ─────────── */}
            {bookingTarget && (
                <BookingModal
                    isOpen={!!bookingTarget}
                    onClose={handleBookingClose}
                    designer={{
                        designerId: bookingTarget._id,
                        displayName: bookingTarget.displayName,
                        city: bookingTarget.city,
                        consultationFee: bookingTarget.consultationFee,
                        projectMinFee: bookingTarget.projectMinFee,
                        acceptsConsultations: bookingTarget.acceptsConsultations,
                        acceptsProjects: bookingTarget.acceptsProjects,
                        consultationDurationMinutes: bookingTarget.consultationDurationMinutes,
                    }}
                    initialProjectDescription={initialDesc}
                    onSuccess={(_bookingId) => {
                        handleBookingClose();
                    }}
                />
            )}
        </>
    );
}

export default MakeItReal;
