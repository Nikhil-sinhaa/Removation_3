'use client';

/**
 * ToolProgressBar — 2-phase progress indicator for Smart Tab Jobs.
 *
 * Displays:
 *   Phase 1: Scene Analysis (0-40%)  → "🔍 Analyzing scene..."
 *   Phase 2: Tool Processing (40-100%) → "🎨 Generating render..."
 *
 * Uses the editor store's toolPhase + generationProgress.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/editor-store';
import {
  ScanSearch,
  Paintbrush,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ToolProgressBarProps {
  className?: string;
}

const PHASE_CONFIG = {
  scene_analysis: {
    icon: ScanSearch,
    label: 'Scene Analysis',
    description: 'Detecting walls, floor, furniture, and depth...',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    iconColor: 'text-blue-400',
  },
  processing: {
    icon: Paintbrush,
    label: 'Generating',
    description: 'Applying AI to your design...',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400',
    iconColor: 'text-purple-400',
  },
  done: {
    icon: CheckCircle2,
    label: 'Complete',
    description: 'Your design is ready!',
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    iconColor: 'text-emerald-400',
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    description: 'Something went wrong',
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400',
    iconColor: 'text-red-400',
  },
  idle: {
    icon: Loader2,
    label: '',
    description: '',
    color: 'from-gray-500 to-gray-600',
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-400',
    iconColor: 'text-gray-400',
  },
} as const;

export function ToolProgressBar({ className }: ToolProgressBarProps) {
  const {
    toolPhase,
    currentToolTab,
    generationProgress,
    generationStatus,
    sceneAnalysisComplete,
    sceneAnalysisMs,
    isGenerating,
  } = useEditorStore();

  // Don't render when idle
  if (toolPhase === 'idle' && !isGenerating) return null;

  const config = PHASE_CONFIG[toolPhase] || PHASE_CONFIG.idle;
  const Icon = config.icon;

  const tabLabel = currentToolTab
    ? currentToolTab.charAt(0).toUpperCase() + currentToolTab.slice(1).replace('-', ' ')
    : 'Tool';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'flex flex-col gap-2 px-4 py-3 rounded-xl border border-white/10',
          'bg-black/40 backdrop-blur-md',
          className,
        )}
      >
        {/* Header: Phase indicator + tab name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={toolPhase === 'scene_analysis' || toolPhase === 'processing'
                ? { rotate: 360 }
                : {}}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className={cn('flex-shrink-0', config.iconColor)}
            >
              <Icon className="w-4 h-4" />
            </motion.div>
            <span className={cn('text-sm font-medium', config.textColor)}>
              {config.label}: {tabLabel}
            </span>
          </div>

          <span className="text-xs text-white/50 font-mono">
            {generationProgress}%
          </span>
        </div>

        {/* 2-phase progress bar */}
        <div className="relative w-full h-2 rounded-full bg-white/5 overflow-hidden">
          {/* Scene analysis phase (0–40%) */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(generationProgress, 40)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />

          {/* Processing phase (40–100%) */}
          {generationProgress > 40 && (
            <motion.div
              className="absolute inset-y-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
              style={{ left: '40%' }}
              initial={{ width: 0 }}
              animate={{ width: `${generationProgress - 40}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          )}

          {/* Shimmer effect during processing */}
          {(toolPhase === 'scene_analysis' || toolPhase === 'processing') && (
            <motion.div
              className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-80px', '400px'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          )}

          {/* Phase divider at 40% */}
          <div className="absolute top-0 bottom-0 left-[40%] w-px bg-white/20" />
        </div>

        {/* Phase labels */}
        <div className="flex justify-between">
          <div className="flex items-center gap-1.5">
            <div className={cn(
              'w-2 h-2 rounded-full',
              sceneAnalysisComplete ? 'bg-emerald-400' : toolPhase === 'scene_analysis' ? 'bg-blue-400 animate-pulse' : 'bg-white/20',
            )} />
            <span className={cn(
              'text-xs',
              sceneAnalysisComplete ? 'text-emerald-400' : toolPhase === 'scene_analysis' ? 'text-blue-400' : 'text-white/30',
            )}>
              Scene Analysis
              {sceneAnalysisMs > 0 && ` (${(sceneAnalysisMs / 1000).toFixed(1)}s)`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className={cn(
              'w-2 h-2 rounded-full',
              toolPhase === 'done' ? 'bg-emerald-400' : toolPhase === 'processing' ? 'bg-purple-400 animate-pulse' : 'bg-white/20',
            )} />
            <span className={cn(
              'text-xs',
              toolPhase === 'done' ? 'text-emerald-400' : toolPhase === 'processing' ? 'text-purple-400' : 'text-white/30',
            )}>
              {tabLabel}
            </span>
          </div>
        </div>

        {/* Status message */}
        <p className="text-xs text-white/40 truncate">
          {generationStatus}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
