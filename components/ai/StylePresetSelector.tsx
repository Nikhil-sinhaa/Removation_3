"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { StylePreset, STYLE_PRESETS } from '@/config/style-presets';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type Category = StylePreset['category'] | 'all';

const CATEGORY_TABS: { id: Category; label: string; labelHi: string }[] = [
  { id: 'all', label: 'All', labelHi: 'सभी' },
  { id: 'minimal', label: 'Minimal', labelHi: 'मिनिमल' },
  { id: 'modern', label: 'Modern', labelHi: 'आधुनिक' },
  { id: 'luxury', label: 'Luxury', labelHi: 'लग्जरी' },
  { id: 'traditional', label: 'Traditional', labelHi: 'पारंपरिक' },
];

interface StylePresetSelectorProps {
  selectedPresetId: string | null;
  onSelectPreset: (preset: StylePreset) => void;
  disabled?: boolean;
}

export function StylePresetSelector({
  selectedPresetId,
  onSelectPreset,
  disabled = false,
}: StylePresetSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const filtered = useMemo(
    () =>
      activeCategory === 'all'
        ? STYLE_PRESETS
        : STYLE_PRESETS.filter(p => p.category === activeCategory),
    [activeCategory]
  );

  return (
    <div className="space-y-3">
      {/* Category tab strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            disabled={disabled}
            className={cn(
              'flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
              activeCategory === tab.id
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Preset cards — horizontal scroll */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-0.5">
        <AnimatePresence mode="popLayout">
          {filtered.map(preset => {
            const isSelected = selectedPresetId === preset.id;
            // Use first reference image as card thumbnail
            const thumb = preset.references[0]?.imageUrl;

            return (
              <motion.button
                key={preset.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                onClick={() => !disabled && onSelectPreset(preset)}
                disabled={disabled}
                className={cn(
                  'relative flex flex-col rounded-xl border-2 overflow-hidden text-left transition-all duration-200 group',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
                  isSelected
                    ? 'border-purple-500 shadow-md shadow-purple-200'
                    : 'border-gray-200 hover:border-purple-300',
                  disabled && 'opacity-60 cursor-not-allowed'
                )}
              >
                {/* Thumbnail */}
                <div className="relative w-full aspect-[16/9] bg-gray-100 overflow-hidden">
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt={preset.label}
                      fill
                      sizes="(max-width: 640px) 50vw, 200px"
                      className={cn(
                        'object-cover transition-transform duration-200',
                        !disabled && 'group-hover:scale-105'
                      )}
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl text-gray-400">🏠</span>
                    </div>
                  )}

                  {/* Category badge */}
                  <div className="absolute top-1.5 left-1.5">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-black/50 text-white capitalize">
                      {preset.category}
                    </span>
                  </div>

                  {/* Checkmark */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center shadow"
                      >
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Card body */}
                <div className={cn(
                  'px-2.5 py-2',
                  isSelected ? 'bg-purple-50' : 'bg-white'
                )}>
                  <p className={cn(
                    'text-xs font-semibold leading-tight',
                    isSelected ? 'text-purple-700' : 'text-gray-800'
                  )}>
                    {preset.label}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                    {preset.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
