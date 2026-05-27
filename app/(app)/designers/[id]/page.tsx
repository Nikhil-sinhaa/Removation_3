'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Calendar,
    Clock,
    FileText,
    GraduationCap,
    IndianRupee,
    MapPin,
    Maximize2,
    Phone,
    Sparkles,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { paiseToRupees } from '@/lib/booking/money';
import { BookingModal } from '@/components/booking/BookingModal';

// ── Constants ─────────────────────────────────────────────────────────────────

const SPECIALTY_LABELS: Record<string, string> = {
    'modular-kitchen': 'Modular Kitchen',
    'bedroom': 'Bedroom',
    'living-room': 'Living Room',
    'bathroom': 'Bathroom',
    'office': 'Office',
    'vastu': 'Vastu',
    'luxury': 'Luxury',
    'budget': 'Budget',
    'minimalist': 'Minimalist',
    'traditional': 'Traditional',
    'contemporary': 'Contemporary',
    'kids-room': "Kids' Room",
    'renovation': 'Renovation',
    'lighting-design': 'Lighting Design',
    '3d-visualization': '3D Visualization',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface MoneyAmount {
    amount: number;
    currency: string;
}

interface Designer {
    _id: string;
    displayName: string;
    bio?: string;
    city: string;
    phone?: string;
    specialties: string[];
    portfolioImages: string[];
    yearsOfExperience?: number;
    consultationFee?: MoneyAmount;
    projectMinFee?: MoneyAmount;
    acceptsConsultations: boolean;
    acceptsProjects: boolean;
    consultationDurationMinutes?: number;
    createdAt: string;
    userId?: {
        _id: string;
        firstName?: string;
        lastName?: string;
        imageUrl?: string;
    };
}


function DetailSkeleton() {
    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
            <Skeleton className="h-6 w-24 rounded-lg" />
            <div className="flex gap-6 items-start">
                <Skeleton className="w-24 h-24 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-7 w-52" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
            <Skeleton className="h-48 w-full rounded-2xl" />
            <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-square rounded-xl" />)}
            </div>
        </div>
    );
}

// ── Main content ──────────────────────────────────────────────────────────────

function DesignerDetailContent() {
    const params = useParams();
    const pathname = usePathname();
    const id = params?.id as string;

    const { user, isLoading: authLoading } = useAuth();

    const [designer, setDesigner] = useState<Designer | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [bookingOpen, setBookingOpen] = useState(false);

    const fetchDesigner = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/designers/${id}`);
            if (res.status === 404) { setNotFound(true); return; }
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            setDesigner(data.designer);
        } catch {
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchDesigner(); }, [fetchDesigner]);

    // ── Lightbox keyboard nav ─────────────────────────────────────────────────
    useEffect(() => {
        if (!lightboxUrl) return;
        function onKey(e: KeyboardEvent) {
            if (!designer) return;
            const images = designer.portfolioImages;
            if (e.key === 'Escape') { setLightboxUrl(null); return; }
            if (e.key === 'ArrowRight') {
                const next = (lightboxIndex + 1) % images.length;
                setLightboxIndex(next);
                setLightboxUrl(images[next]);
            }
            if (e.key === 'ArrowLeft') {
                const prev = (lightboxIndex - 1 + images.length) % images.length;
                setLightboxIndex(prev);
                setLightboxUrl(images[prev]);
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [lightboxUrl, lightboxIndex, designer]);

    // ── Loading states ────────────────────────────────────────────────────────
    if (loading || authLoading) return <DetailSkeleton />;

    if (notFound || !designer) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-4 text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Sparkles className="w-8 h-8 text-zinc-400" />
                </div>
                <h1 className="text-xl font-bold text-zinc-900">Designer not found</h1>
                <p className="text-zinc-500 text-sm mt-2">
                    This profile may no longer be available or hasn't been verified yet.
                </p>
                <Button asChild className="mt-6">
                    <Link href="/designers">Browse Designers</Link>
                </Button>
            </div>
        );
    }

    // ── Book button state ─────────────────────────────────────────────────────
    const isOwnProfile = !!user && !!designer.userId && (
        user.id === designer.userId._id ||
        user._id === designer.userId._id
    );
    const notAccepting = !designer.acceptsConsultations && !designer.acceptsProjects;
    const noFeeSet =
        (!designer.acceptsConsultations || !designer.consultationFee?.amount) &&
        (!designer.acceptsProjects || !designer.projectMinFee?.amount);

    let bookButton: React.ReactNode;
    if (!user) {
        // State 1: logged out
        const redirectUrl = encodeURIComponent(pathname);
        bookButton = (
            <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-2xl shadow-lg shadow-violet-500/20 gap-2"
            >
                <Link href={`/sign-in?redirect_url=${redirectUrl}`}>
                    Sign in to Book
                </Link>
            </Button>
        );
    } else if (isOwnProfile) {
        // State 2: own profile
        bookButton = (
            <Badge className="text-sm px-4 py-2 bg-zinc-100 text-zinc-500 border-zinc-200 rounded-2xl font-medium cursor-default">
                This is your profile
            </Badge>
        );
    } else if (notAccepting || noFeeSet) {
        // State 3: not accepting or no fee configured
        bookButton = (
            <Badge className="text-sm px-4 py-2 bg-zinc-100 text-zinc-500 border-zinc-200 rounded-2xl font-medium cursor-default">
                Not accepting bookings
            </Badge>
        );
    } else {
        // State 4: open booking modal
        bookButton = (
            <Button
                id="book-designer-btn"
                size="lg"
                onClick={() => setBookingOpen(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-2xl shadow-lg shadow-violet-500/20 gap-2"
            >
                <Calendar className="w-4 h-4" />
                Book this designer
            </Button>
        );
    }

    // ── Avatar ────────────────────────────────────────────────────────────────
    const avatarUrl = designer.userId?.imageUrl;
    const initials = designer.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const memberSince = new Date(designer.createdAt).toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* Back link */}
            <Link
                href="/designers"
                className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-violet-600 mb-7 transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                All Designers
            </Link>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

                {/* ── Profile header ────────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                        {/* Avatar */}
                        {avatarUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={avatarUrl}
                                alt={designer.displayName}
                                className="w-24 h-24 rounded-2xl object-cover border-2 border-zinc-100 flex-shrink-0"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white text-2xl font-bold shadow-lg shadow-violet-500/20">
                                {initials}
                            </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">{designer.displayName}</h1>

                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-sm text-zinc-500">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                                    <span className="capitalize">{designer.city}</span>
                                </span>
                                {designer.yearsOfExperience !== undefined && (
                                    <span className="flex items-center gap-1.5">
                                        <GraduationCap className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                                        {designer.yearsOfExperience} yr{designer.yearsOfExperience !== 1 ? 's' : ''} experience
                                    </span>
                                )}
                                {designer.phone && (
                                    <span className="flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                                        {designer.phone}
                                    </span>
                                )}
                            </div>

                            {designer.specialties.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-4">
                                    {designer.specialties.map(slug => (
                                        <Badge
                                            key={slug}
                                            variant="secondary"
                                            className="bg-zinc-50 text-zinc-600 border border-zinc-100 rounded-lg text-xs font-normal"
                                        >
                                            {SPECIALTY_LABELS[slug] ?? slug}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            <p className="text-xs text-zinc-400 mt-3">Member since {memberSince}</p>
                        </div>

                        {/* Book button — desktop */}
                        <div className="hidden sm:flex flex-shrink-0">
                            {bookButton}
                        </div>
                    </div>

                    {/* Book button — mobile */}
                    <div className="sm:hidden mt-5 pt-5 border-t border-zinc-50">
                        {bookButton}
                    </div>
                </div>

                {/* ── Bio ──────────────────────────────────────────────────────────── */}
                {designer.bio && (
                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
                        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">About</h2>
                        <p className="text-zinc-700 leading-relaxed whitespace-pre-line text-sm">{designer.bio}</p>
                    </div>
                )}

                {/* ── Pricing ───────────────────────────────────────────────────────── */}
                {(designer.acceptsConsultations || designer.acceptsProjects) && (
                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
                        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Pricing</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Consultation */}
                            <div className={`rounded-xl p-4 border ${designer.acceptsConsultations ? 'bg-violet-50 border-violet-100' : 'bg-zinc-50 border-zinc-100 opacity-60'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className={`w-4 h-4 ${designer.acceptsConsultations ? 'text-violet-600' : 'text-zinc-400'}`} />
                                    <span className="text-sm font-semibold text-zinc-700">Consultation</span>
                                    {!designer.acceptsConsultations && (
                                        <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-200 ml-auto">Unavailable</Badge>
                                    )}
                                </div>
                                {designer.acceptsConsultations && designer.consultationFee?.amount ? (
                                    <>
                                        <p className="text-xl font-extrabold text-violet-900">
                                            {paiseToRupees(designer.consultationFee.amount)}
                                        </p>
                                        {designer.consultationDurationMinutes && (
                                            <p className="text-xs text-violet-500 mt-0.5">
                                                {designer.consultationDurationMinutes} minute session
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-zinc-400 italic">Not available</p>
                                )}
                            </div>

                            {/* Project */}
                            <div className={`rounded-xl p-4 border ${designer.acceptsProjects ? 'bg-emerald-50 border-emerald-100' : 'bg-zinc-50 border-zinc-100 opacity-60'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className={`w-4 h-4 ${designer.acceptsProjects ? 'text-emerald-600' : 'text-zinc-400'}`} />
                                    <span className="text-sm font-semibold text-zinc-700">Project</span>
                                    {!designer.acceptsProjects && (
                                        <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-200 ml-auto">Unavailable</Badge>
                                    )}
                                </div>
                                {designer.acceptsProjects && designer.projectMinFee?.amount ? (
                                    <>
                                        <p className="text-xl font-extrabold text-emerald-900">
                                            {paiseToRupees(designer.projectMinFee.amount)}
                                        </p>
                                        <p className="text-xs text-emerald-600 mt-0.5">minimum fee</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-zinc-400 italic">Not available</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Portfolio gallery ─────────────────────────────────────────────── */}
                {designer.portfolioImages.length > 0 && (
                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
                        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                            Portfolio
                            <span className="ml-2 font-normal text-zinc-300 text-xs">
                                ({designer.portfolioImages.length} image{designer.portfolioImages.length !== 1 ? 's' : ''})
                            </span>
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {designer.portfolioImages.map((url, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    id={`portfolio-thumb-${i}`}
                                    onClick={() => { setLightboxUrl(url); setLightboxIndex(i); }}
                                    className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100 cursor-zoom-in hover:border-violet-200 transition-colors"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={url}
                                        alt={`Portfolio image ${i + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    <Maximize2 className="absolute bottom-2 right-2 w-3.5 h-3.5 text-white drop-shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty portfolio */}
                {designer.portfolioImages.length === 0 && (
                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-8 text-center">
                        <Sparkles className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                        <p className="text-sm text-zinc-400">No portfolio images uploaded yet.</p>
                    </div>
                )}

            </motion.div>

            {/* ── Lightbox ───────────────────────────────────────────────────────── */}
            {lightboxUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
                    onClick={() => setLightboxUrl(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                        onClick={() => setLightboxUrl(null)}
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Image counter */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm select-none">
                        {lightboxIndex + 1} / {designer.portfolioImages.length}
                    </div>

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={lightboxUrl}
                        alt={`Portfolio image ${lightboxIndex + 1}`}
                        className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />

                    {/* Prev / Next arrows */}
                    {designer.portfolioImages.length > 1 && (
                        <>
                            <button
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                                onClick={e => {
                                    e.stopPropagation();
                                    const prev = (lightboxIndex - 1 + designer.portfolioImages.length) % designer.portfolioImages.length;
                                    setLightboxIndex(prev);
                                    setLightboxUrl(designer.portfolioImages[prev]);
                                }}
                                aria-label="Previous image"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                                onClick={e => {
                                    e.stopPropagation();
                                    const next = (lightboxIndex + 1) % designer.portfolioImages.length;
                                    setLightboxIndex(next);
                                    setLightboxUrl(designer.portfolioImages[next]);
                                }}
                                aria-label="Next image"
                            >
                                <ArrowLeft className="w-5 h-5 rotate-180" />
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* ── Booking modal ──────────────────────────────────────────────────── */}
            <BookingModal
                isOpen={bookingOpen}
                onClose={() => setBookingOpen(false)}
                designer={{
                    designerId: designer._id,
                    displayName: designer.displayName,
                    city: designer.city,
                    consultationFee: designer.consultationFee,
                    projectMinFee: designer.projectMinFee,
                    acceptsConsultations: designer.acceptsConsultations,
                    acceptsProjects: designer.acceptsProjects,
                    consultationDurationMinutes: designer.consultationDurationMinutes,
                }}
                onSuccess={() => setBookingOpen(false)}
            />
        </div>
    );
}

// ── Page export — wrapped in Suspense for consistency with Task 1 ─────────────

export default function DesignerDetailPage() {
    return (
        <Suspense fallback={<DetailSkeleton />}>
            <DesignerDetailContent />
        </Suspense>
    );
}
