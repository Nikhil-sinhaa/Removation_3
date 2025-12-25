'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/editor-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  RotateCcw,
  RotateCw,
  History,
  Wand2,
  Paintbrush,
  Eraser,
  Upload,
  Trash2,
  Image,
  Palette,
  DollarSign,
  Home,
  Zap,
} from 'lucide-react';

interface UndoRedoStackProps {
  className?: string;
}

export function UndoRedoStack({ className }: UndoRedoStackProps) {
  const {
    history,
    historyIndex,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  } = useEditorStore();

  const getHistoryIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <Upload className="w-3 h-3" />;
      case 'generate':
        return <Wand2 className="w-3 h-3" />;
      case 'mask':
        return <Paintbrush className="w-3 h-3" />;
      case 'transformation':
        return <Zap className="w-3 h-3" />;
      case 'color_change':
        return <Palette className="w-3 h-3" />;
      case 'material_change':
        return <Home className="w-3 h-3" />;
      case 'vastu_adjustment':
        return <Home className="w-3 h-3" />;
      case 'cost_update':
        return <DollarSign className="w-3 h-3" />;
      case 'edit':
        return <Image className="w-3 h-3" />;
      default:
        return <History className="w-3 h-3" />;
    }
  };

  const getHistoryLabel = (entry: typeof history[0]) => {
    if (entry.action) return entry.action;
    
    switch (entry.type) {
      case 'upload':
        return 'Image uploaded';
      case 'generate':
        return 'AI generation';
      case 'mask':
        return 'Mask applied';
      case 'transformation':
        return 'Transformation applied';
      case 'color_change':
        return 'Color changed';
      case 'material_change':
        return 'Material changed';
      case 'vastu_adjustment':
        return 'Vastu adjustment';
      case 'cost_update':
        return 'Cost estimate updated';
      case 'edit':
        return 'Edit applied';
      default:
        return 'Action performed';
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Navigate to specific history index
  const jumpToHistory = (index: number) => {
    if (index < 0 || index >= history.length) return;
    
    // Simulate undo/redo to reach the target index
    const currentIndex = historyIndex;
    if (index < currentIndex) {
      // Need to undo
      const steps = currentIndex - index;
      for (let i = 0; i < steps; i++) {
        undo();
      }
    } else if (index > currentIndex) {
      // Need to redo
      const steps = index - currentIndex;
      for (let i = 0; i < steps; i++) {
        redo();
      }
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-purple-400" />
          <span className="text-white text-sm font-medium">History</span>
          <span className="text-white/40 text-xs">
            ({history.length} states)
          </span>
        </div>
        
        <TooltipProvider delayDuration={0}>
          <div className="flex items-center gap-1">
            {/* Undo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={undo}
                  disabled={!canUndo()}
                  className="h-7 w-7 p-0 text-white/60 hover:text-white disabled:opacity-40"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Undo (⌘Z)</p>
              </TooltipContent>
            </Tooltip>

            {/* Redo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={redo}
                  disabled={!canRedo()}
                  className="h-7 w-7 p-0 text-white/60 hover:text-white disabled:opacity-40"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Redo (⌘⇧Z)</p>
              </TooltipContent>
            </Tooltip>

            {/* Clear */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  disabled={history.length === 0}
                  className="h-7 w-7 p-0 text-white/60 hover:text-red-400 disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Clear history</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* History List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <AnimatePresence>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <History className="w-8 h-8 text-white/20 mb-2" />
                <p className="text-white/40 text-sm">No history yet</p>
                <p className="text-white/30 text-xs">
                  Your actions will appear here
                </p>
              </div>
            ) : (
              [...history].reverse().map((item, index) => {
                const actualIndex = history.length - 1 - index;
                const isCurrent = actualIndex === historyIndex;
                const isPast = actualIndex < historyIndex;

                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => jumpToHistory(actualIndex)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left",
                      isCurrent
                        ? "bg-purple-500/20 border border-purple-500/40"
                        : isPast
                        ? "opacity-50 hover:opacity-80 hover:bg-white/5"
                        : "hover:bg-white/5"
                    )}
                  >
                    {/* Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded flex items-center justify-center",
                      isCurrent ? "bg-purple-500/30" : "bg-white/10"
                    )}>
                      {getHistoryIcon(item.type)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        isCurrent ? "text-purple-300" : "text-white/80"
                      )}>
                        {getHistoryLabel(item)}
                      </p>
                      <p className="text-white/40 text-xs">
                        {formatTime(item.timestamp)}
                      </p>
                    </div>

                    {/* Current Indicator */}
                    {isCurrent && (
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                    )}
                  </motion.button>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Status */}
      <div className="p-2 border-t border-white/10 bg-white/5">
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-xs">
            Current: {historyIndex + 1} of {history.length}
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-white/40 text-xs">Current</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-white/40" />
              <span className="text-white/40 text-xs">Past</span>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="p-3 border-t border-white/10 bg-white/5">
        <p className="text-white/40 text-xs text-center">
          <kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">⌘Z</kbd> Undo
          <span className="mx-2">•</span>
          <kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">⌘⇧Z</kbd> Redo
          <span className="mx-2">•</span>
          <kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">⌘K</kbd> Clear
        </p>
      </div>
    </div>
  );
}