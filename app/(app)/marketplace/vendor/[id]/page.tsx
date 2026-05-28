'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    Mail,
    MapPin,
    Maximize2,
    MessageSquare,
    Phone,
    Send,
    Sparkles,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

// ── Constants ─────────────────────────────────────────────────────────────────

const VENDOR_SPECIALTY_LABELS: Record<string, string> = {
    'tile-shop': 'Tiles & Sanitaryware',
    'paint-store': 'Paints & Wall Finishes',
    'furniture-seller': 'Furniture & Decor Store',
    'hardware-store': 'Hardware & Tools Store',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Vendor {
    _id: string;
    displayName: string;
    bio?: string;
    city: string;
    phone?: string;
    storeAddress: string;
    specialties: string[];
    portfolioImages: string[];
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

function VendorDetailContent() {
    const params = useParams();
    const pathname = usePathname();
    const id = params?.id as string;

    const { user, isLoading: authLoading } = useAuth();

    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // Inquiry form state
    const [inquiryMsg, setInquiryMsg] = useState('');
    const [inquiryPhone, setInquiryPhone] = useState('');
    const [inquiryEmail, setInquiryEmail] = useState('');
    const [submittingInquiry, setSubmittingInquiry] = useState(false);
    const [inquirySuccess, setInquirySuccess] = useState(false);
    const [inquiryError, setInquiryError] = useState<string | null>(null);

    const fetchVendor = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/vendors/${id}`);
            if (res.status === 404) { setNotFound(true); return; }
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            setVendor(data.vendor);
        } catch {
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchVendor(); }, [fetchVendor]);

    // ── Lightbox keyboard nav ─────────────────────────────────────────────────
    useEffect(() => {
        if (!lightboxUrl) return;
        function onKey(e: KeyboardEvent) {
            if (!vendor) return;
            const images = vendor.portfolioImages;
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
    }, [lightboxUrl, lightboxIndex, vendor]);

    const handleInquirySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || submittingInquiry) return;
        setInquiryError(null);

        if (!inquiryMsg.trim() || inquiryMsg.trim().length < 10) {
            setInquiryError('Message must be at least 10 characters long.');
            return;
        }

        setSubmittingInquiry(true);
        try {
            const res = await fetch(`/api/vendors/${id}/inquiry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: inquiryMsg,
                    phone: inquiryPhone || undefined,
                    email: inquiryEmail || undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            setInquirySuccess(true);
            setInquiryMsg('');
            setInquiryPhone('');
            setInquiryEmail('');
        } catch (err: any) {
            setInquiryError(err.message || 'Failed to submit inquiry. Please try again.');
        } finally {
            setSubmittingInquiry(false);
        }
    };

    // ── Loading states ────────────────────────────────────────────────────────
    if (loading || authLoading) return <DetailSkeleton />;

    if (notFound || !vendor) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-4 text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Building2 className="w-8 h-8 text-zinc-400" />
                </div>
                <h1 className="text-xl font-bold text-zinc-900">Vendor storefront not found</h1>
                <p className="text-zinc-500 text-sm mt-2">
                    This store may no longer be listed or hasn’t been verified by our admins.
                </p>
                <Button asChild className="mt-6">
                    <Link href="/designers?tab=vendors">Browse Vendors</Link>
                </Button>
            </div>
        );
    }

    const isOwnStore = !!user && !!vendor.userId && (
        user.id === vendor.userId._id ||
        user._id === vendor.userId._id
    );

    const initials = vendor.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const memberSince = new Date(vendor.createdAt).toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* Back link */}
            <Link
                href="/designers?tab=vendors"
                className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-violet-600 mb-7 transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                All Vendors
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side: details & info */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Header profile info */}
                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                            {/* Icon or store image */}
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0 text-white text-2xl font-bold shadow-lg shadow-indigo-500/20">
                                <Building2 className="w-10 h-10" />
                            </div>

                            {/* Store details */}
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">{vendor.displayName}</h1>

                                <div className="flex flex-col gap-1.5 mt-2.5 text-sm text-zinc-500">
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                                        <span className="font-medium text-zinc-700 capitalize">{vendor.city}</span>
                                    </span>
                                    <span className="text-zinc-600 text-xs pl-5 bg-zinc-50/50 p-2 rounded-xl border border-zinc-100/50 mt-1 max-w-md">
                                        {vendor.storeAddress}
                                    </span>
                                    {vendor.phone && (
                                        <span className="flex items-center gap-1.5 mt-1">
                                            <Phone className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                                            {vendor.phone}
                                        </span>
                                    )}
                                </div>

                                {vendor.specialties.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-4">
                                        {vendor.specialties.map(slug => (
                                            <Badge
                                                key={slug}
                                                variant="secondary"
                                                className="bg-zinc-50 text-zinc-600 border border-zinc-100 rounded-lg text-xs font-normal"
                                            >
                                                {VENDOR_SPECIALTY_LABELS[slug] ?? slug}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                <p className="text-xs text-zinc-400 mt-4">Listed since {memberSince}</p>
                            </div>
                        </div>
                    </div>

                    {/* About Store */}
                    {vendor.bio && (
                        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
                            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">About Store</h2>
                            <p className="text-zinc-700 leading-relaxed whitespace-pre-line text-sm">{vendor.bio}</p>
                        </div>
                    )}

                    {/* Material/Showcase gallery */}
                    {vendor.portfolioImages.length > 0 && (
                        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
                            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                                Store Gallery & materials
                                <span className="ml-2 font-normal text-zinc-300 text-xs">
                                    ({vendor.portfolioImages.length} image{vendor.portfolioImages.length !== 1 ? 's' : ''})
                                </span>
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {vendor.portfolioImages.map((url, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        id={`vendor-thumb-${i}`}
                                        onClick={() => { setLightboxUrl(url); setLightboxIndex(i); }}
                                        className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100 cursor-zoom-in hover:border-indigo-200 transition-colors"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={url}
                                            alt={`Store image ${i + 1}`}
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

                    {vendor.portfolioImages.length === 0 && (
                        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-8 text-center">
                            <Sparkles className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                            <p className="text-sm text-zinc-400">No store/materials showcase photos uploaded yet.</p>
                        </div>
                    )}
                </div>

                {/* Right side: Inquiry Form Widget */}
                <div>
                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 sticky top-8 space-y-6">
                        <div>
                            <h3 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-indigo-500" />
                                Request a Quote / Inquiry
                            </h3>
                            <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                                Need tiles, paints, modular fixtures, or custom hardware pricing? Describe what you need and request a catalog.
                            </p>
                        </div>

                        {inquirySuccess ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-center space-y-3"
                            >
                                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                                <h4 className="font-bold text-emerald-900 text-sm">Inquiry Submitted!</h4>
                                <p className="text-emerald-700 text-xs leading-relaxed">
                                    Your request has been sent to {vendor.displayName}. They will contact you shortly using your preferred details.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setInquirySuccess(false)}
                                    className="text-xs bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50 rounded-xl"
                                >
                                    Send another inquiry
                                </Button>
                            </motion.div>
                        ) : !user ? (
                            <div className="bg-zinc-50 rounded-xl p-5 text-center border border-zinc-100/50">
                                <Sparkles className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
                                <p className="text-zinc-600 text-xs leading-relaxed">
                                    You need to be logged in to request quotes or send direct inquiries to listed stores.
                                </p>
                                <Button asChild className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs h-9">
                                    <Link href={`/sign-in?redirect_url=${encodeURIComponent(pathname)}`}>
                                        Sign in to Inquire
                                    </Link>
                                </Button>
                            </div>
                        ) : isOwnStore ? (
                            <div className="bg-zinc-50 rounded-xl p-5 text-center border border-zinc-100/50 text-zinc-500 text-xs">
                                This is your own vendor storefront. You cannot send inquiries to yourself.
                            </div>
                        ) : (
                            <form onSubmit={handleInquirySubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="inquiry-message" className="block text-xs font-semibold text-zinc-500 uppercase mb-1">
                                        Requirements / Materials List <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="inquiry-message"
                                        rows={4}
                                        value={inquiryMsg}
                                        onChange={e => setInquiryMsg(e.target.value)}
                                        placeholder="Hello, I would like to get a catalog/pricing for ceramic tiles. I require around 800 sq ft for a bedroom remodeling..."
                                        className="w-full text-sm bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-3 outline-none transition-all placeholder:text-zinc-400 text-zinc-800"
                                        required
                                    />
                                    <span className="text-[10px] text-zinc-400 block mt-1">Minimum 10 characters</span>
                                </div>

                                <div>
                                    <label htmlFor="inquiry-phone" className="block text-xs font-semibold text-zinc-500 uppercase mb-1">
                                        Contact Phone (Optional)
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                        <input
                                            id="inquiry-phone"
                                            type="tel"
                                            value={inquiryPhone}
                                            onChange={e => setInquiryPhone(e.target.value)}
                                            placeholder="+91 98765 43210"
                                            className="w-full text-sm bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-3 py-2.5 outline-none transition-all placeholder:text-zinc-400 text-zinc-800"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="inquiry-email" className="block text-xs font-semibold text-zinc-500 uppercase mb-1">
                                        Contact Email (Optional)
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                        <input
                                            id="inquiry-email"
                                            type="email"
                                            value={inquiryEmail}
                                            onChange={e => setInquiryEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full text-sm bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-3 py-2.5 outline-none transition-all placeholder:text-zinc-400 text-zinc-800"
                                        />
                                    </div>
                                </div>

                                {inquiryError && (
                                    <p className="text-red-600 text-xs bg-red-50 p-2.5 rounded-lg border border-red-100">
                                        {inquiryError}
                                    </p>
                                )}

                                <Button
                                    type="submit"
                                    id="submit-inquiry-btn"
                                    disabled={submittingInquiry}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl shadow-md gap-2"
                                >
                                    {submittingInquiry ? (
                                        'Sending...'
                                    ) : (
                                        <>
                                            <Send className="w-3.5 h-3.5" />
                                            Send Inquiry
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

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
                        {lightboxIndex + 1} / {vendor.portfolioImages.length}
                    </div>

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={lightboxUrl}
                        alt={`Portfolio image ${lightboxIndex + 1}`}
                        className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />

                    {/* Prev / Next arrows */}
                    {vendor.portfolioImages.length > 1 && (
                        <>
                            <button
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                                onClick={e => {
                                    e.stopPropagation();
                                    const prev = (lightboxIndex - 1 + vendor.portfolioImages.length) % vendor.portfolioImages.length;
                                    setLightboxIndex(prev);
                                    setLightboxUrl(vendor.portfolioImages[prev]);
                                }}
                                aria-label="Previous image"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                                onClick={e => {
                                    e.stopPropagation();
                                    const next = (lightboxIndex + 1) % vendor.portfolioImages.length;
                                    setLightboxIndex(next);
                                    setLightboxUrl(vendor.portfolioImages[next]);
                                }}
                                aria-label="Next image"
                            >
                                <ArrowLeft className="w-5 h-5 rotate-180" />
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default function VendorDetailPage() {
    return (
        <Suspense fallback={<DetailSkeleton />}>
            <VendorDetailContent />
        </Suspense>
    );
}
