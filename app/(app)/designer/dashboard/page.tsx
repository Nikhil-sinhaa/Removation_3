// app/(app)/designer/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Clock,
  Edit3,
  Globe,
  Image as ImageIcon,
  MapPin,
  Phone,
  Sparkles,
  Star,
  Loader2,
  X,
  Maximize2,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface DesignerProfile {
  _id: string;
  displayName: string;
  bio?: string;
  phone: string;
  city: string;
  specialties: string[];
  portfolioImages: string[];
  yearsOfExperience?: number;
  isVerified: boolean;
  verifiedAt?: string;
  rejectionReason?: string | null;
  isActive: boolean;
  createdAt: string;
}

// ── Status Banner ──────────────────────────────────────────────────────────────
function StatusBanner({ designer }: { designer: DesignerProfile }) {
  if (designer.isVerified) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-2xl"
      >
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-green-800">Verified ✓ Listed Publicly</p>
          <p className="text-sm text-green-700 mt-0.5">
            Your profile is live and visible to customers browsing designers.
            {designer.verifiedAt && (
              <> Verified on {new Date(designer.verifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.</>
            )}
          </p>
          <Button asChild size="sm" variant="outline" className="mt-3 border-green-300 text-green-700 hover:bg-green-100">
            <a href="/api/designers" target="_blank" rel="noopener noreferrer">
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              View public listing
            </a>
          </Button>
        </div>
      </motion.div>
    );
  }

  if (designer.rejectionReason) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4 p-4 bg-red-50 border border-red-200 rounded-2xl"
      >
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-red-800">Application Rejected</p>
          <p className="text-sm text-red-700 mt-0.5">
            <span className="font-medium">Reason:</span> {designer.rejectionReason}
          </p>
          <p className="text-sm text-red-600 mt-1">
            You can update your profile and resubmit for review.
          </p>
          <Button asChild size="sm" className="mt-3 bg-red-600 hover:bg-red-700 text-white">
            <Link href="/designer/register">
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              Edit & Resubmit
            </Link>
          </Button>
        </div>
      </motion.div>
    );
  }

  // Pending
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl"
    >
      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <Clock className="w-5 h-5 text-amber-600" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-amber-800">Pending Review</p>
        <p className="text-sm text-amber-700 mt-0.5">
          Your application has been submitted and is under review by our team. This usually takes 24–48 hours.
        </p>
      </div>
    </motion.div>
  );
}

// ── Portfolio grid with lightbox ───────────────────────────────────────────────
function PortfolioGrid({ images }: { images: string[] }) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  return (
    <div className="px-6 pb-6 border-t border-gray-100 pt-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400 uppercase tracking-wider">Portfolio</p>
        <span className="text-xs text-gray-400 tabular-nums">{images.length}/10 images</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {images.map((url, i) => (
          <button
            key={i}
            type="button"
            id={`portfolio-thumb-${i}`}
            className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-zoom-in"
            onClick={() => setLightboxUrl(url)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Portfolio ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => {
                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
            <Maximize2 className="absolute bottom-1.5 right-1.5 w-3 h-3 text-white drop-shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
            onClick={() => setLightboxUrl(null)}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Portfolio image"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// ── Specialty pill ─────────────────────────────────────────────────────────────
const SPECIALTY_LABELS: Record<string, string> = {
  'modular-kitchen': 'Modular Kitchen', 'bedroom': 'Bedroom', 'living-room': 'Living Room',
  'bathroom': 'Bathroom', 'office': 'Office', 'vastu': 'Vastu', 'luxury': 'Luxury',
  'budget': 'Budget', 'minimalist': 'Minimalist', 'traditional': 'Traditional',
  'contemporary': 'Contemporary', 'kids-room': "Kids' Room", 'renovation': 'Renovation',
  'lighting-design': 'Lighting Design', '3d-visualization': '3D Visualization',
};

// ── Main ───────────────────────────────────────────────────────────────────────
export default function DesignerDashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [profile, setProfile] = useState<DesignerProfile | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace('/login'); return; }

    (async () => {
      try {
        const res = await fetch('/api/designer/me');
        if (res.status === 404) {
          // No profile — send to register
          router.replace('/designer/register');
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setProfile(data.designer);
        }
      } finally {
        setFetching(false);
      }
    })();
  }, [user, isLoading, router]);

  if (isLoading || fetching) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/25">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Designer Dashboard</h1>
            <p className="text-sm text-gray-500">Your marketplace profile</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="border-gray-200">
          <Link href="/designer/register">
            <Edit3 className="w-4 h-4 mr-1.5" />
            Edit Profile
          </Link>
        </Button>
      </motion.div>

      {/* Status banner */}
      <div className="mb-6">
        <StatusBanner designer={profile} />
      </div>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        {/* Profile header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">{profile.displayName}</h2>
                {profile.isVerified && (
                  <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
              </div>
              {profile.bio && (
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Phone className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Phone</p>
              <p className="font-medium text-gray-900">{profile.phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">City</p>
              <p className="font-medium text-gray-900">{profile.city}</p>
            </div>
          </div>

          {profile.yearsOfExperience !== undefined && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Experience</p>
                <p className="font-medium text-gray-900">{profile.yearsOfExperience} years</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Applied</p>
              <p className="font-medium text-gray-900">
                {new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Specialties */}
        {profile.specialties.length > 0 && (
          <div className="px-6 pb-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Specialties</p>
            <div className="flex flex-wrap gap-2">
              {profile.specialties.map(s => (
                <Badge key={s} variant="secondary" className="bg-violet-50 text-violet-700 border-violet-100">
                  {SPECIALTY_LABELS[s] || s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio */}
        {profile.portfolioImages.length > 0 && (
          <PortfolioGrid images={profile.portfolioImages} />
        )}
      </motion.div>
    </div>
  );
}
