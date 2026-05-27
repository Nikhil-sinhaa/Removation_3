'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Search,
    MapPin,
    Sparkles,
    ChevronRight,
    Compass,
    GraduationCap,
    Grid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { paiseToRupees } from '@/lib/booking/money';
import { useDebounce } from '@/hooks/useDebounce';

// ── Specialty config ─────────────────────────────────────────────────────────

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

const SPECIALTIES_LIST = Object.entries(SPECIALTY_LABELS);

// ── Types ─────────────────────────────────────────────────────────────────────

interface Designer {
    _id: string;
    displayName: string;
    bio?: string;
    city: string;
    specialties: string[];
    portfolioImages: string[];
    yearsOfExperience?: number;
    consultationFee?: { amount: number; currency: string };
    projectMinFee?: { amount: number; currency: string };
    acceptsConsultations: boolean;
    acceptsProjects: boolean;
    userId?: {
        _id: string;
        firstName?: string;
        lastName?: string;
        imageUrl?: string;
    };
}

// ── Card Skeleton ─────────────────────────────────────────────────────────────

function DesignerCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col h-full">
            <Skeleton className="aspect-[4/3] w-full rounded-t-2xl" />
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="pt-3 border-t border-zinc-50 flex items-center justify-between">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

function GridSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <DesignerCardSkeleton key={i} />
            ))}
        </div>
    );
}

// ── Inner component (uses hooks that need Suspense) ───────────────────────────

function DesignersListingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initial values from URL
    const urlSearch    = searchParams.get('search')    || '';
    const urlCity      = searchParams.get('city')      || '';
    const urlSpecialty = searchParams.get('specialty') || '';
    const urlPage      = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

    // Input state (immediately reflects keystrokes)
    const [searchVal,    setSearchVal]    = useState(urlSearch);
    const [cityVal,      setCityVal]      = useState(urlCity);
    const [specialtyVal, setSpecialtyVal] = useState(urlSpecialty);
    const [pageVal,      setPageVal]      = useState(urlPage);

    // Debounced values (300 ms — limits URL writes on every keystroke)
    const debouncedSearch = useDebounce(searchVal, 300);
    const debouncedCity   = useDebounce(cityVal,   300);

    // Data state
    const [designers, setDesigners] = useState<Designer[]>([]);
    const [total,     setTotal]     = useState(0);
    const [pageCount, setPageCount] = useState(1);
    const [loading,   setLoading]   = useState(true);

    // ── Sync inputs when browser back/forward changes URL ─────────────────────
    useEffect(() => {
        setSearchVal(urlSearch);
        setCityVal(urlCity);
        setSpecialtyVal(urlSpecialty);
        setPageVal(urlPage);
    }, [urlSearch, urlCity, urlSpecialty, urlPage]);

    // ── URL sync + pagination reset in one effect ─────────────────────────────
    // Tracking previous filter values via ref lets us detect a filter change vs
    // a page change without needing a separate reset effect (which would cause two
    // consecutive router.replace calls on filter change).
    const prevFiltersRef = useRef({ search: debouncedSearch, city: debouncedCity, specialty: specialtyVal });

    useEffect(() => {
        const prev = prevFiltersRef.current;
        const filtersChanged =
            prev.search    !== debouncedSearch ||
            prev.city      !== debouncedCity   ||
            prev.specialty !== specialtyVal;

        prevFiltersRef.current = { search: debouncedSearch, city: debouncedCity, specialty: specialtyVal };

        // When filters change, always reset to page 1 and use that for the URL
        const effectivePage = filtersChanged ? 1 : pageVal;
        if (filtersChanged && pageVal !== 1) setPageVal(1);

        const params = new URLSearchParams();
        if (debouncedSearch.trim()) params.set('search',    debouncedSearch.trim());
        if (debouncedCity.trim())   params.set('city',      debouncedCity.trim());
        if (specialtyVal)           params.set('specialty', specialtyVal);
        if (effectivePage > 1)      params.set('page',      String(effectivePage));

        const qs = params.toString();
        router.replace(`/designers${qs ? `?${qs}` : ''}`);
    }, [debouncedSearch, debouncedCity, specialtyVal, pageVal, router]);

    // ── Fetch whenever URL-derived params change ───────────────────────────────
    useEffect(() => {
        let active = true;

        async function load() {
            setLoading(true);
            try {
                const q = new URLSearchParams();
                if (urlSearch.trim())  q.set('search',    urlSearch.trim());
                if (urlCity.trim())    q.set('city',      urlCity.trim());
                if (urlSpecialty)      q.set('specialty', urlSpecialty);
                q.set('page',  String(urlPage));
                q.set('limit', '20');

                const res = await fetch(`/api/designers?${q}`);
                if (res.ok && active) {
                    const data = await res.json();
                    setDesigners(data.designers  ?? []);
                    setTotal(data.total          ?? 0);
                    setPageCount(data.pageCount  ?? 1);
                }
            } catch {
                // network error — leave previous results visible
            } finally {
                if (active) setLoading(false);
            }
        }

        load();
        return () => { active = false; };
    }, [urlSearch, urlCity, urlSpecialty, urlPage]);

    const clearFilters = () => {
        setSearchVal('');
        setCityVal('');
        setSpecialtyVal('');
        setPageVal(1);
    };

    const hasActiveFilters = searchVal || cityVal || specialtyVal;

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Compass className="w-5 h-5 text-white" />
                        </div>
                        <span>Find Professional Designers</span>
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">
                        Connect with verified interior designers, browse portfolios, and book consultations or project engagements.
                    </p>
                </div>
                {!loading && (
                    <Badge
                        variant="outline"
                        className="self-start md:self-center px-3 py-1 bg-violet-50 text-violet-700 border-violet-100 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                        {total} Available Designer{total !== 1 ? 's' : ''}
                    </Badge>
                )}
            </div>

            {/* Filter bar */}
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                        <Input
                            placeholder="Search by designer name..."
                            value={searchVal}
                            onChange={(e) => setSearchVal(e.target.value)}
                            className="pl-10 h-11 border-zinc-200 rounded-xl focus-visible:ring-violet-500"
                        />
                    </div>
                    <div className="relative">
                        <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                        <Input
                            placeholder="Filter by city (e.g. Bangalore)..."
                            value={cityVal}
                            onChange={(e) => setCityVal(e.target.value)}
                            className="pl-10 h-11 border-zinc-200 rounded-xl focus-visible:ring-violet-500"
                        />
                    </div>
                    <select
                        value={specialtyVal}
                        onChange={(e) => setSpecialtyVal(e.target.value)}
                        className="w-full h-11 px-3 border border-zinc-200 rounded-xl bg-white text-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent cursor-pointer"
                    >
                        <option value="">All Specialties</option>
                        {SPECIALTIES_LIST.map(([slug, label]) => (
                            <option key={slug} value={slug}>{label}</option>
                        ))}
                    </select>
                </div>

                {hasActiveFilters && (
                    <div className="mt-4 pt-4 border-t border-zinc-50 flex justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 rounded-lg text-xs"
                        >
                            Clear All Filters
                        </Button>
                    </div>
                )}
            </div>

            {/* Results */}
            {loading ? (
                <GridSkeleton />
            ) : designers.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 bg-white border border-zinc-100 rounded-2xl shadow-sm"
                >
                    <Grid className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
                    <h3 className="text-lg font-semibold text-zinc-900">No designers found</h3>
                    <p className="text-zinc-500 text-sm mt-1 max-w-md mx-auto">
                        Try refining your search terms, removing city filters, or picking a different specialty.
                    </p>
                    {hasActiveFilters && (
                        <Button
                            onClick={clearFilters}
                            className="mt-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl"
                        >
                            Reset Filters
                        </Button>
                    )}
                </motion.div>
            ) : (
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {designers.map((designer) => {
                            const firstImage          = designer.portfolioImages?.[0] ?? '';
                            const specialtiesToShow   = designer.specialties.slice(0, 2);
                            const hiddenCount         = designer.specialties.length - specialtiesToShow.length;

                            return (
                                <motion.div
                                    key={designer._id}
                                    layout
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden hover:shadow-md hover:border-violet-100 transition-all group flex flex-col h-full"
                                >
                                    {/* Portfolio thumbnail */}
                                    <Link
                                        href={`/designers/${designer._id}`}
                                        className="block relative aspect-[4/3] w-full overflow-hidden bg-zinc-50 border-b border-zinc-100"
                                    >
                                        {firstImage ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={firstImage}
                                                alt={designer.displayName}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-violet-400/20 to-purple-400/20 flex items-center justify-center">
                                                <Sparkles className="w-10 h-10 text-violet-400 animate-pulse" />
                                            </div>
                                        )}
                                        {designer.yearsOfExperience !== undefined && (
                                            <Badge className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-zinc-800 border border-zinc-200/50 hover:bg-white rounded-lg flex items-center gap-1">
                                                <GraduationCap className="w-3.5 h-3.5 text-violet-600" />
                                                <span>{designer.yearsOfExperience} yrs exp</span>
                                            </Badge>
                                        )}
                                    </Link>

                                    {/* Card body */}
                                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                        <div className="space-y-1">
                                            <Link href={`/designers/${designer._id}`}>
                                                <h3 className="font-bold text-zinc-900 text-lg group-hover:text-violet-600 transition-colors truncate">
                                                    {designer.displayName}
                                                </h3>
                                            </Link>
                                            <p className="text-xs text-zinc-500 flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                                                <span className="capitalize">{designer.city}</span>
                                            </p>
                                        </div>

                                        {designer.specialties.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {specialtiesToShow.map((slug) => (
                                                    <Badge
                                                        key={slug}
                                                        variant="secondary"
                                                        className="bg-zinc-50 text-zinc-600 border border-zinc-100 font-normal rounded-lg text-xs"
                                                    >
                                                        {SPECIALTY_LABELS[slug] ?? slug}
                                                    </Badge>
                                                ))}
                                                {hiddenCount > 0 && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-zinc-400 border-zinc-100 rounded-lg text-xs font-normal"
                                                    >
                                                        +{hiddenCount} more
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        {/* Pricing row + CTA */}
                                        <div className="pt-3 border-t border-zinc-50 flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">
                                                    Consultation
                                                </span>
                                                {designer.acceptsConsultations && designer.consultationFee?.amount ? (
                                                    <span className="font-extrabold text-zinc-800 text-sm">
                                                        {paiseToRupees(designer.consultationFee.amount)}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-zinc-400 italic">Not available</span>
                                                )}
                                            </div>
                                            <Button
                                                asChild
                                                size="sm"
                                                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl text-xs gap-1.5 shadow-sm shadow-violet-500/10"
                                            >
                                                <Link href={`/designers/${designer._id}`}>
                                                    <span>View Profile</span>
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {pageCount > 1 && (
                        <div className="flex items-center justify-center gap-3 mt-12">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pageVal <= 1 || loading}
                                onClick={() => setPageVal((p) => Math.max(1, p - 1))}
                                className="rounded-xl border-zinc-200 text-zinc-600 text-xs"
                            >
                                Previous
                            </Button>
                            <span className="text-sm font-medium text-zinc-500 px-2 select-none">
                                Page {pageVal} of {pageCount}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pageVal >= pageCount || loading}
                                onClick={() => setPageVal((p) => Math.min(pageCount, p + 1))}
                                className="rounded-xl border-zinc-200 text-zinc-600 text-xs"
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Page export — Suspense required for useSearchParams in Next.js 15 ─────────

export default function DesignersListingPage() {
    return (
        <Suspense fallback={
            <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="h-14 w-80 bg-zinc-100 rounded-xl animate-pulse mb-8" />
                <div className="h-20 w-full bg-zinc-100 rounded-2xl animate-pulse mb-8" />
                <GridSkeleton />
            </div>
        }>
            <DesignersListingContent />
        </Suspense>
    );
}
