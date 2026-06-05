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
    MessageSquare,
    Phone,
    Sparkles,
    Star,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { paiseToRupees } from '@/lib/booking/money';
import { BookingModal } from '@/components/booking/BookingModal';
import { useLanguage } from '@/hooks/useLanguage';

// ── Constants ─────────────────────────────────────────────────────────────────

const CONTRACTOR_SPECIALTY_LABELS: Record<string, string> = {
    'painter': 'Painting Services',
    'carpenter': 'Carpentry & Woodwork',
    'electrician': 'Electrical Work',
    'plumber': 'Plumbing Services',
    'modular-kitchen-installer': 'Modular Kitchen Installation',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface MoneyAmount {
    amount: number;
    currency: string;
}

interface Contractor {
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
    averageRating?: number;
    totalReviews?: number;
}

interface ReviewInfo {
    id: string;
    rating: number;
    title?: string;
    comment?: string;
    designerReply?: string;
    designerRepliedAt?: string;
    createdAt: string;
    reviewer: {
        name: string;
        imageUrl: string | null;
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

function ContractorDetailContent() {
    const params = useParams();
    const pathname = usePathname();
    const id = params?.id as string;

    const { t, language } = useLanguage();
    const { user, isLoading: authLoading } = useAuth();

    const [contractor, setContractor] = useState<Contractor | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [bookingOpen, setBookingOpen] = useState(false);

    const fetchContractor = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/contractors/${id}`);
            if (res.status === 404) { setNotFound(true); return; }
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            setContractor(data.contractor);
        } catch {
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchContractor(); }, [fetchContractor]);

    const [reviews, setReviews] = useState<ReviewInfo[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [hasMoreReviews, setHasMoreReviews] = useState(false);
    const [totalReviewsCount, setTotalReviewsCount] = useState(0);

    const fetchReviews = useCallback(async (pageNum: number, append = false) => {
        if (!id) return;
        if (pageNum === 1) setReviewsLoading(true);
        try {
            const res = await fetch(`/api/contractors/${id}/reviews?page=${pageNum}&limit=10`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setReviews(prev => append ? [...prev, ...data.reviews] : data.reviews);
                    setTotalReviewsCount(data.pagination.total);
                    setHasMoreReviews(data.pagination.page < data.pagination.pages);
                    setReviewsPage(data.pagination.page);
                }
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setReviewsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchReviews(1);
    }, [fetchReviews]);

    // ── Lightbox keyboard nav ─────────────────────────────────────────────────
    useEffect(() => {
        if (!lightboxUrl) return;
        function onKey(e: KeyboardEvent) {
            if (!contractor) return;
            const images = contractor.portfolioImages;
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
    }, [lightboxUrl, lightboxIndex, contractor]);

    // Helper to get translated contractor specialty label
    const getContractorSpecialtyLabel = (slug: string) => {
        const key = `specialty_${slug.replace(/-/g, '_')}`;
        const translated = t(key);
        return translated !== key ? translated : (CONTRACTOR_SPECIALTY_LABELS[slug] ?? slug);
    };

    // ── Loading states ────────────────────────────────────────────────────────
    if (loading || authLoading) return <DetailSkeleton />;

    if (notFound || !contractor) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-4 text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Sparkles className="w-8 h-8 text-zinc-400" />
                </div>
                <h1 className="text-xl font-bold text-zinc-900">{t('det_contractor_not_found')}</h1>
                <p className="text-zinc-500 text-sm mt-2">
                    {t('det_contractor_not_found_desc')}
                </p>
                <Button asChild className="mt-6">
                    <Link href="/designers?tab=contractors">{t('det_browse_contractors')}</Link>
                </Button>
            </div>
        );
    }

    // ── Book button state ─────────────────────────────────────────────────────
    const isOwnProfile = !!user && !!contractor.userId && (
        user.id === contractor.userId._id ||
        user._id === contractor.userId._id
    );
    const notAccepting = !contractor.acceptsConsultations && !contractor.acceptsProjects;
    const noFeeSet =
        (!contractor.acceptsConsultations || !contractor.consultationFee?.amount) &&
        (!contractor.acceptsProjects || !contractor.projectMinFee?.amount);

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
                    {t('det_sign_in_to_book')}
                </Link>
            </Button>
        );
    } else if (isOwnProfile) {
        // State 2: own profile
        bookButton = (
            <Badge className="text-sm px-4 py-2 bg-zinc-100 text-zinc-500 border-zinc-200 rounded-2xl font-medium cursor-default">
                {t('det_own_profile')}
            </Badge>
        );
    } else if (notAccepting || noFeeSet) {
        // State 3: not accepting or no fee configured
        bookButton = (
            <Badge className="text-sm px-4 py-2 bg-zinc-100 text-zinc-500 border-zinc-200 rounded-2xl font-medium cursor-default">
                {t('det_not_accepting_bookings')}
            </Badge>
        );
    } else {
        // State 4: open booking modal
        bookButton = (
            <Button
                id="book-contractor-btn"
                size="lg"
                onClick={() => setBookingOpen(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-2xl shadow-lg shadow-violet-500/20 gap-2"
            >
                <Calendar className="w-4 h-4" />
                {t('det_book_contractor')}
            </Button>
        );
    }

    // ── Avatar ────────────────────────────────────────────────────────────────
    const avatarUrl = contractor.userId?.imageUrl;
    const initials = contractor.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const memberSince = new Date(contractor.createdAt).toLocaleDateString(
        language === 'hi' ? 'hi-IN' : 'en-IN',
        {
            month: 'long',
            year: 'numeric',
        }
    );

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* Back link */}
            <Link
                href="/designers?tab=contractors"
                className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-violet-600 mb-7 transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t('det_all_contractors')}
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
                                alt={contractor.displayName}
                                className="w-24 h-24 rounded-2xl object-cover border-2 border-zinc-100 flex-shrink-0"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white text-2xl font-bold shadow-lg shadow-violet-500/20">
                                {initials}
                            </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">{contractor.displayName}</h1>

                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-sm text-zinc-500">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                                    <span className="capitalize">{contractor.city}</span>
                                </span>
                                {contractor.yearsOfExperience !== undefined && (
                                    <span className="flex items-center gap-1.5">
                                        <GraduationCap className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                                        {contractor.yearsOfExperience === 1
                                            ? t('det_years_experience_single')
                                            : t('det_years_experience', { years: String(contractor.yearsOfExperience) })}
                                    </span>
                                )}
                                {contractor.phone && (
                                    <span className="flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                                        {contractor.phone}
                                    </span>
                                )}
                            </div>

                            {contractor.averageRating !== undefined && contractor.totalReviews !== undefined && contractor.totalReviews > 0 && (
                                <div className="flex items-center gap-1.5 mt-2.5 text-sm text-zinc-600">
                                    <div className="flex items-center text-amber-500">
                                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                    </div>
                                    <span className="font-bold text-zinc-900">{contractor.averageRating.toFixed(1)}</span>
                                    <span className="text-zinc-400">•</span>
                                    <span className="font-medium text-violet-600 hover:text-violet-700 hover:underline cursor-pointer" onClick={() => {
                                        document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }}>
                                        {contractor.totalReviews === 1
                                            ? t('dir_review_count_single', { count: String(contractor.totalReviews) })
                                            : t('dir_review_count', { count: String(contractor.totalReviews) })}
                                    </span>
                                </div>
                            )}

                            {contractor.specialties.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-4">
                                    {contractor.specialties.map(slug => (
                                        <Badge
                                            key={slug}
                                            variant="secondary"
                                            className="bg-zinc-50 text-zinc-600 border border-zinc-100 rounded-lg text-xs font-normal"
                                        >
                                            {getContractorSpecialtyLabel(slug)}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            <p className="text-xs text-zinc-400 mt-3">
                                {t('det_member_since', { date: memberSince })}
                            </p>
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
                {contractor.bio && (
                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
                        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                            {t('det_about')}
                        </h2>
                        <p className="text-zinc-700 leading-relaxed whitespace-pre-line text-sm">{contractor.bio}</p>
                    </div>
                )}

                {/* ── Pricing ───────────────────────────────────────────────────────── */}
                {(contractor.acceptsConsultations || contractor.acceptsProjects) && (
                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
                        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                            {t('det_pricing')}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Consultation */}
                            <div className={`rounded-xl p-4 border ${contractor.acceptsConsultations ? 'bg-violet-50 border-violet-100' : 'bg-zinc-50 border-zinc-100 opacity-60'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className={`w-4 h-4 ${contractor.acceptsConsultations ? 'text-violet-600' : 'text-zinc-400'}`} />
                                    <span className="text-sm font-semibold text-zinc-700">{t('det_consultation')}</span>
                                    {!contractor.acceptsConsultations && (
                                        <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-200 ml-auto">{t('det_unavailable')}</Badge>
                                    )}
                                </div>
                                {contractor.acceptsConsultations && contractor.consultationFee?.amount ? (
                                    <>
                                        <p className="text-xl font-extrabold text-violet-900">
                                            {paiseToRupees(contractor.consultationFee.amount)}
                                        </p>
                                        {contractor.consultationDurationMinutes && (
                                            <p className="text-xs text-violet-500 mt-0.5">
                                                {t('det_minute_session', { minutes: String(contractor.consultationDurationMinutes) })}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-zinc-400 italic">{t('det_unavailable')}</p>
                                )}
                            </div>

                            {/* Project */}
                            <div className={`rounded-xl p-4 border ${contractor.acceptsProjects ? 'bg-emerald-50 border-emerald-100' : 'bg-zinc-50 border-zinc-100 opacity-60'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className={`w-4 h-4 ${contractor.acceptsProjects ? 'text-emerald-600' : 'text-zinc-400'}`} />
                                    <span className="text-sm font-semibold text-zinc-700">{t('det_project')}</span>
                                    {!contractor.acceptsProjects && (
                                        <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-200 ml-auto">{t('det_unavailable')}</Badge>
                                    )}
                                </div>
                                {contractor.acceptsProjects && contractor.projectMinFee?.amount ? (
                                    <>
                                        <p className="text-xl font-extrabold text-emerald-900">
                                            {paiseToRupees(contractor.projectMinFee.amount)}
                                        </p>
                                        <p className="text-xs text-emerald-600 mt-0.5">{t('det_minimum_fee')}</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-zinc-400 italic">{t('det_unavailable')}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Portfolio gallery ─────────────────────────────────────────────── */}
                {contractor.portfolioImages.length > 0 && (
                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
                        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                            {t('det_portfolio')}
                            <span className="ml-2 font-normal text-zinc-300 text-xs">
                                ({contractor.portfolioImages.length === 1
                                    ? t('det_images_count_single')
                                    : t('det_images_count', { count: String(contractor.portfolioImages.length) })})
                            </span>
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {contractor.portfolioImages.map((url, i) => (
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
                {contractor.portfolioImages.length === 0 && (
                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-8 text-center">
                        <Sparkles className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                        <p className="text-sm text-zinc-400">{t('det_no_images')}</p>
                    </div>
                )}

                {/* ── Reviews Section ────────────────────────────────────────────────── */}
                <div id="reviews-section" className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-50 pb-4">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-violet-600" />
                            <h2 className="text-lg font-bold text-zinc-900">
                                {t('det_client_reviews', { count: String(totalReviewsCount) })}
                            </h2>
                        </div>
                        {contractor.averageRating !== undefined && contractor.totalReviews !== undefined && contractor.totalReviews > 0 && (
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                <span className="font-extrabold text-zinc-900">{contractor.averageRating.toFixed(1)}</span>
                                <span className="text-zinc-400 text-xs">/ 5</span>
                            </div>
                        )}
                    </div>

                    {reviewsLoading && reviews.length === 0 ? (
                        <div className="space-y-4 py-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-4 items-start animate-pulse">
                                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-zinc-100 rounded w-1/4" />
                                        <div className="h-3 bg-zinc-100 rounded w-full" />
                                        <div className="h-3 bg-zinc-100 rounded w-5/6" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-8">
                            <Star className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                            <p className="text-zinc-500 text-sm">{t('det_no_reviews_yet_contractor')}</p>
                        </div>
                    ) : (
                        <div className="space-y-6 divide-y divide-zinc-100">
                            {reviews.map((review, idx) => {
                                const reviewerInitials = review.reviewer.name
                                    .split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .toUpperCase();

                                const reviewDate = new Date(review.createdAt).toLocaleDateString(
                                    language === 'hi' ? 'hi-IN' : 'en-IN',
                                    {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    }
                                );

                                return (
                                    <div key={review.id} className={`pt-6 ${idx === 0 ? 'pt-0' : ''}`}>
                                        <div className="flex justify-between items-start gap-4">
                                            {/* Reviewer Info */}
                                            <div className="flex gap-3 items-center">
                                                {review.reviewer.imageUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={review.reviewer.imageUrl}
                                                        alt={review.reviewer.name}
                                                        className="w-10 h-10 rounded-full object-cover border border-zinc-100"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-violet-700 flex items-center justify-center font-bold text-sm">
                                                        {reviewerInitials}
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="font-semibold text-sm text-zinc-900">{review.reviewer.name}</h4>
                                                    <span className="text-xs text-zinc-400">
                                                        {reviewDate}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Review Rating stars */}
                                            <div className="flex items-center gap-0.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-3.5 h-3.5 ${
                                                            i < review.rating
                                                                ? 'fill-amber-400 text-amber-400'
                                                                : 'text-zinc-200'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Review text */}
                                        <div className="mt-3 pl-13 space-y-1">
                                            {review.title && (
                                                <h5 className="font-semibold text-sm text-zinc-900">{review.title}</h5>
                                            )}
                                            {review.comment && (
                                                <p className="text-zinc-600 text-sm leading-relaxed whitespace-pre-line">
                                                    {review.comment}
                                                </p>
                                            )}
                                        </div>

                                        {/* Reply from Contractor */}
                                        {review.designerReply && (
                                            <div className="mt-4 ml-4 pl-4 border-l-2 border-violet-200 bg-zinc-50/50 rounded-r-xl p-3 space-y-1">
                                                <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold">
                                                    <Clock className="w-3 h-3 text-violet-500" />
                                                    <span>{t('det_reply_from', { name: contractor.displayName })}</span>
                                                    {review.designerRepliedAt && (
                                                        <span className="text-zinc-400 font-normal">
                                                            {t('det_on_date', {
                                                                date: new Date(review.designerRepliedAt).toLocaleDateString(
                                                                    language === 'hi' ? 'hi-IN' : 'en-IN',
                                                                    {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        year: 'numeric',
                                                                    }
                                                                )
                                                            })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-zinc-700 text-sm italic">
                                                    "{review.designerReply}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Load More Button */}
                    {hasMoreReviews && (
                        <div className="pt-4 text-center border-t border-zinc-50">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={reviewsLoading}
                                onClick={() => fetchReviews(reviewsPage + 1, true)}
                                className="text-xs border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-xl"
                            >
                                {reviewsLoading
                                    ? (language === 'hi' ? 'लोड हो रहा है...' : 'Loading...')
                                    : t('det_load_more_reviews')}
                            </Button>
                        </div>
                    )}
                </div>

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
                        {lightboxIndex + 1} / {contractor.portfolioImages.length}
                    </div>

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={lightboxUrl}
                        alt={`Portfolio image ${lightboxIndex + 1}`}
                        className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />

                    {/* Prev / Next arrows */}
                    {contractor.portfolioImages.length > 1 && (
                        <>
                            <button
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                                onClick={e => {
                                    e.stopPropagation();
                                    const prev = (lightboxIndex - 1 + contractor.portfolioImages.length) % contractor.portfolioImages.length;
                                    setLightboxIndex(prev);
                                    setLightboxUrl(contractor.portfolioImages[prev]);
                                }}
                                aria-label="Previous image"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                                onClick={e => {
                                    e.stopPropagation();
                                    const next = (lightboxIndex + 1) % contractor.portfolioImages.length;
                                    setLightboxIndex(next);
                                    setLightboxUrl(contractor.portfolioImages[next]);
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
                    contractorId: contractor._id,
                    displayName: contractor.displayName,
                    city: contractor.city,
                    consultationFee: contractor.consultationFee,
                    projectMinFee: contractor.projectMinFee,
                    acceptsConsultations: contractor.acceptsConsultations,
                    acceptsProjects: contractor.acceptsProjects,
                    consultationDurationMinutes: contractor.consultationDurationMinutes,
                }}
                onSuccess={() => setBookingOpen(false)}
            />
        </div>
    );
}

export default function ContractorDetailPage() {
    return (
        <Suspense fallback={<DetailSkeleton />}>
            <ContractorDetailContent />
        </Suspense>
    );
}
