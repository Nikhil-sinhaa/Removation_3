'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Star,
  Crown,
  Palette,
  Wand2,
  Compass,
  Flame,
  Zap,
  Lock,
  Trophy,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { BadgeDefinition } from '@/lib/constants/badges';

// ── Icon lookup ───────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Star,
  Crown,
  Palette,
  Wand2,
  Compass,
  Flame,
  Zap,
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface MergedBadge extends BadgeDefinition {
  unlocked: boolean;
  unlockedAt: string | null;
}

// ── Category config ───────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  milestone: {
    label: 'Milestones',
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    unlockedGlow: 'shadow-violet-200',
  },
  exploration: {
    label: 'Exploration',
    gradient: 'from-orange-500 to-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    unlockedGlow: 'shadow-amber-200',
  },
  engagement: {
    label: 'Engagement',
    gradient: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    unlockedGlow: 'shadow-emerald-200',
  },
} as const;

// ── Badge card with 3D tilt hover ─────────────────────────────────────────────
function BadgeCard({ badge, categoryKey }: { badge: MergedBadge; categoryKey: keyof typeof CATEGORY_CONFIG }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const cfg = CATEGORY_CONFIG[categoryKey];
  const Icon = ICON_MAP[badge.icon] ?? Sparkles;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -10, y: x * 10 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  }, []);

  const unlockedDateStr = badge.unlockedAt
    ? new Date(badge.unlockedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <TooltipTrigger asChild>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'relative flex flex-col items-center gap-2 rounded-2xl border p-4 cursor-default select-none',
          'transition-shadow duration-300',
          badge.unlocked
            ? cn('bg-white', cfg.border, 'shadow-sm hover:shadow-lg', cfg.unlockedGlow)
            : 'bg-gray-50 border-gray-100',
        )}
        style={{
          transform: badge.unlocked && hovered
            ? `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.05)`
            : 'perspective(600px) rotateX(0) rotateY(0) scale(1)',
          transition: hovered ? 'transform 0.05s linear, box-shadow 0.3s ease' : 'transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s ease',
          filter: badge.unlocked ? 'none' : 'grayscale(100%)',
          opacity: badge.unlocked ? 1 : 0.55,
        }}
        aria-label={badge.unlocked ? `${badge.name} — earned on ${unlockedDateStr}` : `${badge.name} — locked`}
      >
        {/* Icon container */}
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            badge.unlocked ? cfg.iconBg : 'bg-gray-100',
          )}
        >
          <Icon className={cn('w-6 h-6', badge.unlocked ? cfg.iconColor : 'text-gray-400')} />
        </div>

        {/* Lock overlay for locked badges */}
        {!badge.unlocked && (
          <div className="absolute top-2 right-2">
            <Lock className="w-3 h-3 text-gray-400" />
          </div>
        )}

        {/* Unlocked sparkle accent */}
        {badge.unlocked && hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-2 right-2"
          >
            <Sparkles className="w-3 h-3 text-yellow-400" />
          </motion.div>
        )}

        {/* Badge name */}
        <span
          className={cn(
            'text-xs font-semibold text-center leading-tight',
            badge.unlocked ? 'text-gray-800' : 'text-gray-400',
          )}
        >
          {badge.name}
        </span>
      </div>
    </TooltipTrigger>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function BadgeGridSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1, 2].map(i => (
        <div key={i}>
          <Skeleton className="h-5 w-28 mb-3" />
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {Array.from({ length: i === 0 ? 5 : i === 1 ? 3 : 2 }).map((_, j) => (
              <div key={j} className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 p-4 bg-gray-50">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BadgeGrid() {
  const [badges, setBadges] = useState<MergedBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard/badges')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setBadges(data.badges ?? []))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <BadgeGridSkeleton />;
  if (error) return null; // silently hide on error — badges are non-critical

  const categories = ['milestone', 'exploration', 'engagement'] as const;
  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <TooltipProvider>
      <div className="space-y-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Achievements</h2>
              <p className="text-xs text-gray-500">
                {unlockedCount} / {badges.length} unlocked
              </p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-6">
          {categories.map(category => {
            const cfg = CATEGORY_CONFIG[category];
            const group = badges.filter(b => b.category === category);
            if (group.length === 0) return null;

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn('h-1 w-5 rounded-full bg-gradient-to-r', cfg.gradient)} />
                  <span className="text-sm font-semibold text-gray-700">{cfg.label}</span>
                  <span className="text-xs text-gray-400">
                    {group.filter(b => b.unlocked).length}/{group.length}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {group.map(badge => (
                    <Tooltip key={badge.id}>
                      <BadgeCard badge={badge} categoryKey={category} />
                      <TooltipContent side="top" className="max-w-[200px] text-center">
                        {badge.unlocked ? (
                          <>
                            <p className="font-semibold">{badge.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{badge.description}</p>
                            {badge.unlockedAt && (
                              <p className="text-xs text-emerald-600 mt-1">
                                Earned{' '}
                                {new Date(badge.unlockedAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-gray-500">{badge.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{badge.criteriaHint}</p>
                          </>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
