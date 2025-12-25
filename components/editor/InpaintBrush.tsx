'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useEditorStore } from '@/stores/editor-store';
import {
  Paintbrush,
  Eraser,
  RotateCcw,
  Minus,
  Plus,
  Eye,
  EyeOff,
} from 'lucide-react';

interface InpaintBrushProps {
  className?: string;
}

export function InpaintBrush({ className }: InpaintBrushProps) {
  const {
    brushSize,
    setBrushSize,
    brushHardness,
    setBrushHardness,
    brushSettings,
    setBrushSettings,
    clearMask,
  } = useEditorStore();

  const [isHovering, setIsHovering] = useState(false);

  const handleBrushSizeChange = useCallback((delta: number) => {
    setBrushSize(Math.max(5, Math.min(200, brushSize + delta)));
  }, [brushSize, setBrushSize]);

  const handleBrushModeChange = (isEraser: boolean) => {
    setBrushSettings({ isEraser });
  };

  const toggleShowMask = () => {
    setBrushSettings({ opacity: brushSettings.opacity > 0 ? 0 : 1 });
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '[') {
        handleBrushSizeChange(-10);
      } else if (e.key === ']') {
        handleBrushSizeChange(10);
      } else if (e.key === 'b' || e.key === 'B') {
        handleBrushModeChange(false);
      } else if (e.key === 'e' || e.key === 'E') {
        handleBrushModeChange(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBrushSizeChange, handleBrushModeChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 bg-[#1a1a1a] rounded-xl border border-white/10 space-y-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paintbrush className="w-4 h-4 text-purple-400" />
          <span className="text-white text-sm font-medium">Brush Settings</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleShowMask}
          className="h-7 px-2 text-white/60 hover:text-white"
        >
          {brushSettings.opacity > 0 ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Brush Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => handleBrushModeChange(false)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all",
            !brushSettings.isEraser
              ? "bg-purple-500 text-white"
              : "bg-white/10 text-white/60 hover:bg-white/15"
          )}
        >
          <Paintbrush className="w-4 h-4" />
          <span className="text-sm font-medium">Brush</span>
          <kbd className="ml-1 px-1 py-0.5 bg-black/20 rounded text-xs">B</kbd>
        </button>
        <button
          onClick={() => handleBrushModeChange(true)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all",
            brushSettings.isEraser
              ? "bg-purple-500 text-white"
              : "bg-white/10 text-white/60 hover:bg-white/15"
          )}
        >
          <Eraser className="w-4 h-4" />
          <span className="text-sm font-medium">Eraser</span>
          <kbd className="ml-1 px-1 py-0.5 bg-black/20 rounded text-xs">E</kbd>
        </button>
      </div>

      {/* Brush Size */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-white/70 text-sm">Brush Size</Label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBrushSizeChange(-10)}
              className="p-1 rounded bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-white/60 text-xs font-mono w-12 text-center">
              {brushSize}px
            </span>
            <button
              onClick={() => handleBrushSizeChange(10)}
              className="p-1 rounded bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
        <Slider
          value={[brushSize]}
          onValueChange={([value]) => setBrushSize(value)}
          min={5}
          max={200}
          step={5}
        />
        <p className="text-white/40 text-xs">
          Use [ and ] keys to adjust quickly
        </p>
      </div>

      {/* Brush Hardness */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-white/70 text-sm">Hardness</Label>
          <span className="text-white/60 text-xs font-mono">
            {Math.round(brushHardness * 100)}%
          </span>
        </div>
        <Slider
          value={[brushHardness]}
          onValueChange={([value]) => setBrushHardness(value)}
          min={0}
          max={1}
          step={0.05}
        />
        <div className="flex justify-between text-xs text-white/40">
          <span>Soft</span>
          <span>Hard</span>
        </div>
      </div>

      {/* Brush Flow */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-white/70 text-sm">Brush Flow</Label>
          <span className="text-white/60 text-xs font-mono">
            {Math.round(brushSettings.flow * 100)}%
          </span>
        </div>
        <Slider
          value={[brushSettings.flow]}
          onValueChange={([value]) => setBrushSettings({ flow: value })}
          min={0.1}
          max={1}
          step={0.1}
        />
      </div>

      {/* Brush Preview */}
      <div 
        className="flex items-center justify-center py-4 bg-white/5 rounded-lg"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <motion.div
          animate={{
            width: brushSize,
            height: brushSize,
            opacity: isHovering ? 0.8 : 0.5,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={cn(
            "rounded-full",
            brushSettings.isEraser ? "bg-red-500" : "bg-purple-500"
          )}
          style={{
            boxShadow: brushHardness < 0.5
              ? `0 0 ${(1 - brushHardness) * 50}px ${(1 - brushHardness) * 25}px ${
                  brushSettings.isEraser 
                    ? 'rgba(239, 68, 68, 0.5)' 
                    : 'rgba(168, 85, 247, 0.5)'
                }`
              : 'none',
            maxWidth: '100px',
            maxHeight: '100px',
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={clearMask}
          className="flex-1 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Clear Mask
        </Button>
      </div>

      {/* Tips */}
      <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <p className="text-blue-200/80 text-xs">
          <strong>Tip:</strong> {brushSettings.isEraser 
            ? 'Use eraser to remove parts of the mask. The AI will preserve these areas.'
            : 'Paint over the areas you want to transform. The AI will only modify painted regions.'
          }
        </p>
      </div>
    </motion.div>
  );
}