// components/ai/DesignerMatchCard.tsx
//
// A compact card that represents a single matched designer in the
// "Make it real" / MakeItReal banner shown after an AI render.
//
// Props:
//   designer   — the raw API doc (populated userId field included)
//   onBook     — called when the user clicks "Book Project"; parent
//                opens BookingModal with initialProjectDescription

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, IndianRupee, Briefcase } from 'lucide-react';
import { paiseToRupees } from '@/lib/booking/money';

// ── Shape of what the match API returns ──────────────────────────────────────
// The userId field is populated: { firstName, lastName, imageUrl }

export interface MatchedDesigner {
    _id: string;
    displayName: string;
    bio?: string;
    city: string;
    specialties: string[];
    yearsOfExperience?: number;
    isVerified: boolean;
    projectMinFee?: { amount: number; currency: string };
    consultationFee?: { amount: number; currency: string };
    acceptsProjects: boolean;
    acceptsConsultations: boolean;
    consultationDurationMinutes?: number;
    averageRating?: number;
    totalReviews?: number;
    userId?: {
        firstName?: string;
        lastName?: string;
        imageUrl?: string;
    };
}

interface DesignerMatchCardProps {
    designer: MatchedDesigner;
    onBook: (designer: MatchedDesigner) => void;
    index?: number; // for stagger animation
}

// ── Specialty label prettifier ────────────────────────────────────────────────
function prettySpecialty(slug: string): string {
    return slug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

// ── Initials fallback avatar ──────────────────────────────────────────────────
function initials(name: string): string {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function DesignerMatchCard({ designer, onBook, index = 0 }: DesignerMatchCardProps) {
    const avatarUrl = designer.userId?.imageUrl;
    const displayName = designer.displayName;
    const feeAmount = designer.projectMinFee?.amount;
    const topSpecialties = designer.specialties.slice(0, 3);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.35 }}
            className="flex flex-col bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
        >
            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-purple-500" />

            <div className="p-4 flex flex-col gap-3 flex-1">
                {/* Avatar + name row */}
                <div className="flex items-center gap-3">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={displayName}
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-violet-100 flex-shrink-0"
                        />
                    ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {initials(displayName)}
                        </div>
                    )}

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-zinc-900 text-sm leading-tight truncate">
                                {displayName}
                            </p>
                            {designer.isVerified && (
                                <span title="Verified designer" className="text-violet-500 flex-shrink-0">
                                    <Star className="w-3.5 h-3.5 fill-violet-400 stroke-violet-500" />
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5 flex-wrap">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{designer.city}</span>
                            {designer.yearsOfExperience != null && (
                                <>
                                    <span className="text-zinc-300">·</span>
                                    <span>{designer.yearsOfExperience}y exp</span>
                                </>
                            )}
                            {designer.averageRating !== undefined && designer.averageRating > 0 && (
                                <>
                                    <span className="text-zinc-300">·</span>
                                    <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                                        <Star className="w-3 h-3 fill-amber-400 stroke-amber-500" />
                                        <span>{designer.averageRating.toFixed(1)}</span>
                                        <span className="text-zinc-400 font-normal">({designer.totalReviews})</span>
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Specialties */}
                {topSpecialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {topSpecialties.map(s => (
                            <Badge
                                key={s}
                                variant="secondary"
                                className="text-[10px] px-2 py-0.5 bg-violet-50 text-violet-700 border-none rounded-full"
                            >
                                {prettySpecialty(s)}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Fee + CTA row */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-50">
                    {feeAmount ? (
                        <div className="flex items-center gap-1 text-sm text-zinc-600">
                            <IndianRupee className="w-3.5 h-3.5 text-zinc-400" />
                            <span>
                                From <span className="font-semibold text-zinc-800">{paiseToRupees(feeAmount)}</span>
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-xs text-zinc-400">
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>Quote on request</span>
                        </div>
                    )}

                    <Button
                        id={`book-designer-${designer._id}`}
                        size="sm"
                        onClick={() => onBook(designer)}
                        className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs px-3 py-1.5 h-auto rounded-xl"
                    >
                        Book Project
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

export default DesignerMatchCard;
