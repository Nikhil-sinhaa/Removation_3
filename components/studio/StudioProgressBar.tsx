'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudioProgressBarProps {
  isGenerating: boolean;
  progress: number;
  status: string;
  activeTab: string;
}

const TAB_COLORS: Record<string, string> = {
  render: 'from-purple-500 to-pink-500',
  edit: 'from-blue-500 to-cyan-500',
  furnish: 'from-amber-500 to-orange-500',
  lighting: 'from-yellow-400 to-amber-500',
  postprocess: 'from-emerald-500 to-teal-500',
};

export function StudioProgressBar({ isGenerating, progress, status, activeTab }: StudioProgressBarProps) {
  if (!isGenerating && progress < 100) return null;

  const gradientClass = TAB_COLORS[activeTab] || TAB_COLORS.render;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="px-4 py-2 bg-black/40 backdrop-blur-sm border-t border-white/5"
    >
      <div className="flex items-center gap-3">
        {/* Progress bar */}
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full bg-gradient-to-r', gradientClass)}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 min-w-[180px]">
          {progress >= 100 ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <Loader2 className="w-4 h-4 text-white/60 animate-spin" />
          )}
          <span className={cn(
            'text-xs truncate',
            progress >= 100 ? 'text-green-400' : 'text-white/60'
          )}>
            {status || `${progress}%`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
