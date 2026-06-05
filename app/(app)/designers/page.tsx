'use client';
export const dynamic = 'force-dynamic';

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
    Star,
    Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { paiseToRupees } from '@/lib/booking/money';
import { useDebounce } from '@/hooks/useDebounce';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { usePageTour } from '@/hooks/usePageTour';

// ── Specialty configs ────────────────────────────────────────────────────────

const DESIGNER_SPECIALTIES: Record<string, string> = {
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

const CONTRACTOR_SPECIALTIES: Record<string, string> = {
    'painter': 'Painter',
    'carpenter': 'Carpenter',
    'electrician': 'Electrician',
    'plumber': 'Plumber',
    'modular-kitchen-installer': 'Modular Kitchen Installer',
};

const VENDOR_SPECIALTIES: Record<string, string> = {
    'tile-shop': 'Tile Shop',
    'paint-store': 'Paint Store',
    'furniture-seller': 'Furniture Seller',
    'hardware-store': 'Hardware Store',
};

const ALL_SPECIALTIES: Record<string, string> = {
    ...DESIGNER_SPECIALTIES,
    ...CONTRACTOR_SPECIALTIES,
    ...VENDOR_SPECIALTIES,
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Provider {
    _id: string;
    displayName: string;
    bio?: string;
    city: string;
    address?: string;
    storeAddress?: string;
    website?: string;
    specialties: string[];
    portfolioImages: string[];
    yearsOfExperience?: number;
    consultationFee?: { amount: number; currency: string };
    projectMinFee?: { amount: number; currency: string };
    acceptsConsultations?: boolean;
    acceptsProjects?: boolean;
    averageRating?: number;
    totalReviews?: number;
    userId?: {
        _id: string;
        firstName?: string;
        lastName?: string;
        imageUrl?: string;
    };
}

// ── Card Skeleton ─────────────────────────────────────────────────────────────

function ProviderCardSkeleton() {
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
                <ProviderCardSkeleton key={i} />
            ))}
        </div>
    );
}

// ── Inner component ───────────────────────────

function DesignersListingContent() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initial values from URL
    const urlTab       = searchParams.get('tab')       || 'designers';
    const urlSearch    = searchParams.get('search')    || '';
    const urlCity      = searchParams.get('city')      || '';
    const urlSpecialty = searchParams.get('specialty') || '';
    const urlPage      = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

    // Input state (immediately reflects keystrokes)
    const [activeTab,    setActiveTab]    = useState(urlTab);
    const [searchVal,    setSearchVal]    = useState(urlSearch);
    const [cityVal,      setCityVal]      = useState(urlCity);
    const [specialtyVal, setSpecialtyVal] = useState(urlSpecialty);
    const [pageVal,      setPageVal]      = useState(urlPage);

    // Debounced values
    const debouncedSearch = useDebounce(searchVal, 300);
    const debouncedCity   = useDebounce(cityVal,   300);

    // Data state
    const [providers, setProviders] = useState<Provider[]>([]);
    const [total,     setTotal]     = useState(0);
    const [pageCount, setPageCount] = useState(1);
    const [loading,   setLoading]   = useState(true);

    // Sync inputs when browser back/forward changes URL
    useEffect(() => {
        setActiveTab(urlTab);
        setSearchVal(urlSearch);
        setCityVal(urlCity);
        setSpecialtyVal(urlSpecialty);
        setPageVal(urlPage);
    }, [urlTab, urlSearch, urlCity, urlSpecialty, urlPage]);

    // Redirect to marketplace if contractors or vendors tab is requested
    useEffect(() => {
        if (urlTab === 'contractors' || urlTab === 'vendors') {
            router.replace(`/marketplace?tab=${urlTab}`);
        }
    }, [urlTab, router]);

    // URL sync + pagination reset
    const prevFiltersRef = useRef({ tab: activeTab, search: debouncedSearch, city: debouncedCity, specialty: specialtyVal });

    useEffect(() => {
        const prev = prevFiltersRef.current;
        const filtersChanged =
            prev.tab       !== activeTab       ||
            prev.search    !== debouncedSearch ||
            prev.city      !== debouncedCity   ||
            prev.specialty !== specialtyVal;

        prevFiltersRef.current = { tab: activeTab, search: debouncedSearch, city: debouncedCity, specialty: specialtyVal };

        const effectivePage = filtersChanged ? 1 : pageVal;
        if (filtersChanged && pageVal !== 1) setPageVal(1);

        const params = new URLSearchParams();
        params.set('tab', activeTab);
        if (debouncedSearch.trim()) params.set('search',    debouncedSearch.trim());
        if (debouncedCity.trim())   params.set('city',      debouncedCity.trim());
        if (specialtyVal)           params.set('specialty', specialtyVal);
        if (effectivePage > 1)      params.set('page',      String(effectivePage));

        const qs = params.toString();
        router.replace(`/designers${qs ? `?${qs}` : ''}`);
    }, [activeTab, debouncedSearch, debouncedCity, specialtyVal, pageVal, router]);

    // Fetch whenever URL-derived params change
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

                // Determine endpoint based on tab
                const endpointMap: Record<string, string> = {
                    designers: '/api/designers',
                    contractors: '/api/contractors',
                    vendors: '/api/vendors',
                };
                const endpoint = endpointMap[urlTab] || '/api/designers';

                const res = await fetch(`${endpoint}?${q}`);
                if (res.ok && active) {
                    const data = await res.json();
                    const listKey = urlTab === 'designers' ? 'designers' : (urlTab === 'contractors' ? 'contractors' : 'vendors');
                    setProviders(data[listKey] ?? []);
                    setTotal(data.total ?? 0);
                    setPageCount(data.pageCount ?? 1);
                }
            } catch {
                // network error
            } finally {
                if (active) setLoading(false);
            }
        }

        load();
        return () => { active = false; };
    }, [urlTab, urlSearch, urlCity, urlSpecialty, urlPage]);

    usePageTour({
        tourKey: 'designers_tour',
        completed: !user || user.onboardingCompleted === false || (user.completedTours?.includes('designers_tour') ?? false),
        steps: [
            {
                element: '[data-tour="designers-tabs"]',
                popover: {
                    title: '👩‍🎨 Find the Right Professional',
                    description: 'Switch between interior designers, service contractors, and material vendors to find the right partner for your project.',
                    side: 'bottom',
                    align: 'start'
                }
            },
            {
                element: '[data-tour="designers-filters"]',
                popover: {
                    title: '🔍 Filter and Search',
                    description: 'Search by name, filter by city, or select a specialty like modular kitchen or budget designs to narrow down your options.',
                    side: 'bottom',
                    align: 'center'
                }
            },
            {
                element: '[data-tour="designers-grid"]',
                popover: {
                    title: '📋 Verified Portfolios',
                    description: 'Browse verified professionals, check their reviews, experience, and consultation fees, and click "View Profile" to book a slot.',
                    side: 'top',
                    align: 'center'
                }
            }
        ]
    });

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        setSpecialtyVal(''); // Reset specialty since options change
        setPageVal(1);
    };

    const clearFilters = () => {
        setSearchVal('');
        setCityVal('');
        setSpecialtyVal('');
        setPageVal(1);
    };

    const hasActiveFilters = searchVal || cityVal || specialtyVal;

    // Get list of specialties for the current active tab
    const getSpecialtiesList = () => {
        if (activeTab === 'contractors') return Object.entries(CONTRACTOR_SPECIALTIES);
        if (activeTab === 'vendors') return Object.entries(VENDOR_SPECIALTIES);
        return Object.entries(DESIGNER_SPECIALTIES);
    };

    const providerLabelMap: Record<string, string> = {
        designers: 'Interior Designers',
        contractors: 'Service Contractors',
        vendors: 'Material Vendors',
    };

    const singleLabelMap: Record<string, string> = {
        designers: 'Designer',
        contractors: 'Contractor',
        vendors: 'Vendor',
    };

    const getProviderLabel = (tabId: string) => {
        switch (tabId) {
            case 'designers': return t('dir_tab_designers');
            case 'contractors': return t('dir_tab_contractors');
            case 'vendors': return t('dir_tab_vendors');
            default: return providerLabelMap[tabId] || tabId;
        }
    };

    const getSingleRoleLabel = (tabId: string) => {
        switch (tabId) {
            case 'designers': return t('myb_designer');
            case 'contractors': return t('myb_contractor', { defaultValue: 'Contractor' });
            case 'vendors': return t('dir_vendor', { defaultValue: 'Vendor' });
            default: return singleLabelMap[tabId] || tabId;
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Compass className="w-5 h-5 text-white" />
                        </div>
                        <span>{t('dir_find_pros')}</span>
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">
                        {t('dir_find_pros_desc')}
                    </p>
                </div>
                {!loading && (
                    <Badge
                        variant="outline"
                        className="self-start md:self-center px-3 py-1 bg-violet-50 text-violet-700 border-violet-100 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                        {total === 1 
                            ? t('dir_verified_count_single', { count: String(total), role: getSingleRoleLabel(activeTab) })
                            : t('dir_verified_count', { count: String(total), role: getSingleRoleLabel(activeTab) })}
                    </Badge>
                )}
            </div>

            {/* Role Tab Group */}
            <div className="flex border-b border-zinc-100 mb-6 gap-6" data-tour="designers-tabs">
                {(['designers', 'contractors', 'vendors'] as const).map((tabId) => {
                    const isActive = activeTab === tabId;
                    if (tabId === 'contractors' || tabId === 'vendors') {
                        return (
                            <Link
                                key={tabId}
                                href={`/marketplace?tab=${tabId}`}
                                className="relative py-3.5 text-sm font-semibold transition-colors focus-visible:outline-none text-zinc-500 hover:text-zinc-800"
                            >
                                {getProviderLabel(tabId)}
                            </Link>
                        );
                    }
                    return (
                        <button
                            key={tabId}
                            onClick={() => handleTabChange(tabId)}
                            className="relative py-3.5 text-sm font-semibold transition-colors focus-visible:outline-none"
                            style={{ color: isActive ? 'rgb(109, 40, 217)' : 'rgb(113, 113, 122)' }}
                        >
                            {getProviderLabel(tabId)}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabUnderline"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Filter bar */}
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 mb-8" data-tour="designers-filters">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                        <Input
                            placeholder={t('dir_search_name')}
                            value={searchVal}
                            onChange={(e) => setSearchVal(e.target.value)}
                            className="pl-10 h-11 border-zinc-200 rounded-xl focus-visible:ring-violet-500"
                        />
                    </div>
                    <div className="relative">
                        <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                        <Input
                            placeholder={t('dir_filter_city')}
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
                        <option value="">{t('dir_all_specialties')}</option>
                        {getSpecialtiesList().map(([slug, label]) => (
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
                            {t('dir_clear_all_filters')}
                        </Button>
                    </div>
                )}
            </div>

            {/* Results */}
            {loading ? (
                <GridSkeleton />
            ) : providers.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 bg-white border border-zinc-100 rounded-2xl shadow-sm"
                >
                    <Grid className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
                    <h3 className="text-lg font-semibold text-zinc-900">{t('dir_no_pros_found', { role: getSingleRoleLabel(activeTab) })}</h3>
                    <p className="text-zinc-500 text-sm mt-1 max-w-md mx-auto">
                        {t('dir_no_pros_found_desc')}
                    </p>
                    {hasActiveFilters && (
                        <Button
                            onClick={clearFilters}
                            className="mt-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl"
                        >
                            {t('dir_reset_filters')}
                        </Button>
                    )}
                </motion.div>
            ) : (
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-tour="designers-grid">
                        {providers.map((provider) => {
                            const firstImage          = provider.portfolioImages?.[0] ?? '';
                            const specialtiesToShow   = provider.specialties.slice(0, 2);
                            const hiddenCount         = provider.specialties.length - specialtiesToShow.length;

                            // Custom link path based on tab type
                            const detailsPathMap: Record<string, string> = {
                                designers: `/designers/${provider._id}`,
                                contractors: `/marketplace/contractor/${provider._id}`,
                                vendors: `/marketplace/vendor/${provider._id}`,
                            };
                            const detailsPath = detailsPathMap[activeTab] || `/designers/${provider._id}`;

                            return (
                                <motion.div
                                    key={provider._id}
                                    layout
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden hover:shadow-md hover:border-violet-100 transition-all group flex flex-col h-full"
                                >
                                    {/* Portfolio thumbnail */}
                                    <Link
                                        href={detailsPath}
                                        className="block relative aspect-[4/3] w-full overflow-hidden bg-zinc-50 border-b border-zinc-100"
                                    >
                                        {firstImage ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={firstImage}
                                                alt={provider.displayName}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-violet-400/20 to-purple-400/20 flex items-center justify-center">
                                                <Sparkles className="w-10 h-10 text-violet-400 animate-pulse" />
                                            </div>
                                        )}
                                        {provider.yearsOfExperience !== undefined && (
                                            <Badge className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-zinc-800 border border-zinc-200/50 hover:bg-white rounded-lg flex items-center gap-1">
                                                <GraduationCap className="w-3.5 h-3.5 text-violet-600" />
                                                <span>
                                                    {activeTab === 'vendors' 
                                                        ? t('dir_years_biz_short', { years: String(provider.yearsOfExperience) })
                                                        : t('dir_years_exp_short', { years: String(provider.yearsOfExperience) })}
                                                </span>
                                            </Badge>
                                        )}
                                    </Link>

                                    {/* Card body */}
                                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                        <div className="space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <Link href={detailsPath} className="min-w-0 flex-1">
                                                    <h3 className="font-bold text-zinc-900 text-lg group-hover:text-violet-600 transition-colors truncate">
                                                        {provider.displayName}
                                                    </h3>
                                                </Link>
                                                {provider.averageRating !== undefined && provider.averageRating > 0 && (
                                                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-xs font-semibold flex-shrink-0 mt-0.5">
                                                        <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-500" />
                                                        <span>{provider.averageRating.toFixed(1)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                                                <span className="flex items-center gap-1 capitalize">
                                                    <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                                                    {provider.city}
                                                </span>
                                                {provider.totalReviews !== undefined && provider.totalReviews > 0 && (
                                                    <>
                                                        <span className="text-zinc-300">·</span>
                                                        <span>
                                                            {provider.totalReviews === 1
                                                                ? t('dir_review_count_single', { count: String(provider.totalReviews) })
                                                                : t('dir_review_count', { count: String(provider.totalReviews) })}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {provider.specialties.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {specialtiesToShow.map((slug) => (
                                                    <Badge
                                                        key={slug}
                                                        variant="secondary"
                                                        className="bg-zinc-50 text-zinc-600 border border-zinc-100 font-normal rounded-lg text-xs"
                                                    >
                                                        {ALL_SPECIALTIES[slug] ?? slug}
                                                    </Badge>
                                                ))}
                                                {hiddenCount > 0 && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-zinc-400 border-zinc-100 rounded-lg text-xs font-normal"
                                                    >
                                                        {t('dir_more_specialties', { count: String(hiddenCount) })}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        {/* Pricing or Info row + CTA */}
                                        <div className="pt-3 border-t border-zinc-50 flex items-center justify-between">
                                            {activeTab === 'vendors' ? (
                                                <div className="min-w-0 flex-1 pr-2">
                                                    <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">
                                                        {t('dir_store_address')}
                                                    </span>
                                                    <span className="text-xs text-zinc-600 truncate block">
                                                        {provider.storeAddress || provider.address || t('dir_address_on_file')}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div>
                                                    <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">
                                                        {t('dir_consultation')}
                                                    </span>
                                                    {provider.acceptsConsultations && provider.consultationFee?.amount ? (
                                                        <span className="font-extrabold text-zinc-800 text-sm">
                                                            {paiseToRupees(provider.consultationFee.amount)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-zinc-400 italic">{t('dir_not_available')}</span>
                                                    )}
                                                </div>
                                            )}
                                            <Button
                                                asChild
                                                size="sm"
                                                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl text-xs gap-1.5 shadow-sm shadow-violet-500/10 flex-shrink-0"
                                            >
                                                <Link href={detailsPath}>
                                                    <span>{activeTab === 'vendors' ? t('dir_view_store') : t('dir_view_profile')}</span>
                                                    {activeTab === 'vendors' ? <Store className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
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
                                {t('previous')}
                            </Button>
                            <span className="text-sm font-medium text-zinc-500 px-2 select-none">
                                {t('page_x_of_y', { current: String(pageVal), total: String(pageCount) })}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pageVal >= pageCount || loading}
                                onClick={() => setPageVal((p) => Math.min(pageCount, p + 1))}
                                className="rounded-xl border-zinc-200 text-zinc-600 text-xs"
                            >
                                {t('next')}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

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
