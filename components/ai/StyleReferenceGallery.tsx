"use client";

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Upload, X, Image as ImageIcon } from 'lucide-react';
import { StylePreset, StyleReference } from '@/config/style-presets';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface StyleReferenceGalleryProps {
  preset: StylePreset;
  selectedReferenceId: string | null;
  onSelectReference: (ref: StyleReference) => void;
  onUploadCustom: (file: File) => void;
  customReferenceUrl?: string | null;
  disabled?: boolean;
}

export function StyleReferenceGallery({
  preset,
  selectedReferenceId,
  onSelectReference,
  onUploadCustom,
  customReferenceUrl,
  disabled = false,
}: StyleReferenceGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    onUploadCustom(file);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  const handleCustomUploadDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    onUploadCustom(file);
  };

  const selectedRef = preset.references.find(r => r.id === selectedReferenceId);
  const isCustomSelected = !selectedReferenceId && !!customReferenceUrl;

  return (
    <div className="space-y-4">
      {/* Gallery header */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800">
          Choose a reference for{' '}
          <span className="text-purple-700">{preset.label}</span>
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          The AI will apply the exact visual style of your chosen photo to your room
        </p>
      </div>

      {/* Reference grid */}
      <div className="grid grid-cols-3 gap-2">
        {preset.references.map((ref) => {
          const isSelected = selectedReferenceId === ref.id;
          return (
            <motion.button
              key={ref.id}
              onClick={() => !disabled && onSelectReference(ref)}
              whileHover={disabled ? {} : { scale: 1.02 }}
              whileTap={disabled ? {} : { scale: 0.98 }}
              disabled={disabled}
              className={cn(
                'relative rounded-xl overflow-hidden border-2 transition-all duration-200 group text-left',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
                isSelected
                  ? 'border-purple-500 shadow-md shadow-purple-200'
                  : 'border-gray-200 hover:border-purple-300',
                disabled && 'opacity-60 cursor-not-allowed'
              )}
              aria-label={ref.label}
            >
              {/* Image */}
              <div className="relative w-full aspect-[4/3] bg-gray-100">
                <Image
                  src={ref.imageUrl}
                  alt={ref.label}
                  fill
                  sizes="(max-width: 768px) 33vw, 200px"
                  className={cn(
                    'object-cover transition-transform duration-200',
                    !disabled && 'group-hover:scale-105'
                  )}
                  unoptimized // Unsplash images; skip Next.js optimization for external
                />

                {/* Selected overlay */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-purple-600/20 flex items-start justify-end p-1.5"
                    >
                      <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center shadow-sm">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hover overlay */}
                {!isSelected && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                )}
              </div>

              {/* Label */}
              <div className={cn(
                'px-2 py-1.5',
                isSelected ? 'bg-purple-50' : 'bg-white'
              )}>
                <p className={cn(
                  'text-xs font-medium leading-tight line-clamp-1',
                  isSelected ? 'text-purple-700' : 'text-gray-700'
                )}>
                  {ref.label}
                </p>
              </div>
            </motion.button>
          );
        })}

        {/* Upload custom reference card */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />
          {customReferenceUrl ? (
            <motion.div
              className={cn(
                'relative rounded-xl overflow-hidden border-2 transition-all duration-200',
                isCustomSelected
                  ? 'border-purple-500 shadow-md shadow-purple-200'
                  : 'border-gray-200'
              )}
            >
              <div className="relative w-full aspect-[4/3] bg-gray-100">
                <Image
                  src={customReferenceUrl}
                  alt="Custom reference"
                  fill
                  sizes="200px"
                  className="object-cover"
                />

                {/* Selected overlay */}
                <AnimatePresence>
                  {isCustomSelected && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-purple-600/20 flex items-start justify-end p-1.5"
                    >
                      <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center shadow-sm">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Remove/change button */}
                <button
                  onClick={() => !disabled && fileInputRef.current?.click()}
                  disabled={disabled}
                  className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  aria-label="Change custom reference"
                >
                  <Upload className="w-3 h-3" />
                </button>
              </div>
              <div className={cn(
                'px-2 py-1.5',
                isCustomSelected ? 'bg-purple-50' : 'bg-white'
              )}>
                <p className={cn(
                  'text-xs font-medium line-clamp-1',
                  isCustomSelected ? 'text-purple-700' : 'text-gray-700'
                )}>
                  Your photo
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              onClick={() => !disabled && fileInputRef.current?.click()}
              onDrop={handleCustomUploadDrop}
              onDragOver={e => e.preventDefault()}
              whileHover={disabled ? {} : { scale: 1.02 }}
              whileTap={disabled ? {} : { scale: 0.98 }}
              role="button"
              tabIndex={disabled ? -1 : 0}
              onKeyDown={e => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) fileInputRef.current?.click(); }}
              className={cn(
                'w-full rounded-xl border-2 border-dashed border-gray-300 text-center',
                'hover:border-purple-400 hover:bg-purple-50/30 transition-all duration-200',
                'flex flex-col items-center justify-center gap-1',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
                disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              )}
              style={{ aspectRatio: '4/3' }}
              aria-label="Upload your own reference photo"
            >
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 font-medium leading-tight px-1">
                Upload your own
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Selected reference info */}
      <AnimatePresence>
        {(selectedRef || isCustomSelected) && (
          <motion.div
            key={selectedRef?.id || 'custom'}
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-purple-50 border border-purple-100 rounded-xl px-3 py-2.5 space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <p className="text-xs font-semibold text-purple-800">
                  {isCustomSelected ? 'Your custom photo selected' : `"${selectedRef!.label}" selected`}
                </p>
              </div>
              {selectedRef && (
                <p className="text-[11px] text-purple-600/80 leading-relaxed line-clamp-2">
                  {selectedRef.prompt.replace(/\s*,\s*\(professional architectural photography.*$/i, '')}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
