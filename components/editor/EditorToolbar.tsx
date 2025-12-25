'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/editor-store';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Wand2,
  Paintbrush,
  Eraser,
  Scissors,
  Replace,
  SunMedium,
  Sparkles,
  Download,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Layers,
  SlidersHorizontal,
  Square,
  Circle,
  Palette,
  Home,
  TreeDeciduous,
  Building2,
  Eye,
  EyeOff,
  ImageIcon,
} from 'lucide-react';

interface ToolbarItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  action?: () => void;
  active?: boolean;
  disabled?: boolean;
}

interface EditorToolbarProps {
  className?: string;
}

export function EditorToolbar({ className }: EditorToolbarProps) {
  const {
    mode,
    setMode,
    currentImage,
    processedImage,
    showOriginal,
    setShowOriginal,
    undo,
    redo,
    history,
    historyIndex,
    resetEditor,
  } = useEditorStore();

  // Check if we can undo/redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const transformationTools: ToolbarItem[] = [
    {
      id: 'redesign',
      icon: <Wand2 className="w-4 h-4" />,
      label: 'Redesign Room',
      shortcut: '1',
      active: mode === 'redesign',
      action: () => setMode('redesign'),
    },
    {
      id: 'fill-room',
      icon: <Home className="w-4 h-4" />,
      label: 'Fill Empty Room',
      shortcut: '2',
      active: mode === 'fill-room',
      action: () => setMode('fill-room'),
    },
    {
      id: 'inpaint',
      icon: <Paintbrush className="w-4 h-4" />,
      label: 'Inpaint / Edit Area',
      shortcut: '3',
      active: mode === 'inpaint',
      action: () => setMode('inpaint'),
    },
    {
      id: 'remove-object',
      icon: <Eraser className="w-4 h-4" />,
      label: 'Remove Object',
      shortcut: '4',
      active: mode === 'remove-object',
      action: () => setMode('remove-object'),
    },
    {
      id: 'replace-object',
      icon: <Replace className="w-4 h-4" />,
      label: 'Replace Furniture',
      shortcut: '5',
      active: mode === 'replace-object',
      action: () => setMode('replace-object'),
    },
    {
      id: 'outdoor',
      icon: <TreeDeciduous className="w-4 h-4" />,
      label: 'Outdoor / Garden',
      shortcut: '6',
      active: mode === 'outdoor',
      action: () => setMode('outdoor'),
    },
    {
      id: 'sketch-to-render',
      icon: <ImageIcon className="w-4 h-4" />,
      label: 'Sketch to Render',
      shortcut: '7',
      active: mode === 'sketch-to-render',
      action: () => setMode('sketch-to-render'),
    },
  ];

  const enhancementTools: ToolbarItem[] = [
    {
      id: 'enhance',
      icon: <Sparkles className="w-4 h-4" />,
      label: 'Enhance Quality',
      shortcut: 'E',
      active: mode === 'enhance',
      action: () => setMode('enhance'),
    },
    {
      id: 'lighting',
      icon: <SunMedium className="w-4 h-4" />,
      label: 'Adjust Lighting',
      shortcut: 'L',
      active: mode === 'lighting',
      action: () => setMode('lighting'),
    },
    {
      id: 'change-color',
      icon: <Palette className="w-4 h-4" />,
      label: 'Change Color',
      shortcut: 'C',
      active: mode === 'change-color',
      action: () => setMode('change-color'),
    },
    {
      id: 'change-material',
      icon: <Square className="w-4 h-4" />,
      label: 'Change Material',
      shortcut: 'M',
      active: mode === 'change-material',
      action: () => setMode('change-material'),
    },
  ];

  const viewTools: ToolbarItem[] = [
    {
      id: 'compare',
      icon: showOriginal ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />,
      label: showOriginal ? 'Hide Original' : 'Show Original',
      shortcut: 'O',
      active: showOriginal,
      action: () => setShowOriginal(!showOriginal),
      disabled: !currentImage || !processedImage,
    },
  ];

  const historyTools: ToolbarItem[] = [
    {
      id: 'undo',
      icon: <RotateCcw className="w-4 h-4" />,
      label: 'Undo',
      shortcut: '⌘Z',
      action: undo,
      disabled: !canUndo,
    },
    {
      id: 'redo',
      icon: <RotateCw className="w-4 h-4" />,
      label: 'Redo',
      shortcut: '⌘⇧Z',
      action: redo,
      disabled: !canRedo,
    },
    {
      id: 'reset',
      icon: <RotateCcw className="w-4 h-4" />,
      label: 'Reset',
      shortcut: 'R',
      action: resetEditor,
      disabled: !currentImage,
    },
  ];

  const renderToolGroup = (tools: ToolbarItem[], title?: string) => (
    <div className="flex items-center gap-1">
      {title && (
        <span className="text-xs text-white/40 mr-2 hidden lg:inline">{title}</span>
      )}
      {tools.map((tool) => (
        <TooltipProvider key={tool.id} delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={tool.action}
                disabled={tool.disabled}
                className={cn(
                  "relative p-2.5 rounded-lg transition-all duration-200",
                  "hover:bg-white/10",
                  tool.active && "bg-purple-500/20 text-purple-400",
                  tool.disabled && "opacity-40 cursor-not-allowed",
                  !tool.active && !tool.disabled && "text-white/70 hover:text-white"
                )}
              >
                {tool.icon}
                {tool.active && (
                  <motion.div
                    layoutId="activeToolIndicator"
                    className="absolute inset-0 rounded-lg border border-purple-500/50"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex items-center gap-2">
              <span>{tool.label}</span>
              {tool.shortcut && (
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs font-mono">
                  {tool.shortcut}
                </kbd>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );

  const handleExport = () => {
    if (!processedImage?.url) return;
    
    const link = document.createElement('a');
    link.href = processedImage.url;
    link.download = `removation-ai-export-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-between px-4 py-2",
        "bg-black/40 backdrop-blur-sm border-b border-white/5",
        "select-none",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* Transformation Tools */}
        {renderToolGroup(transformationTools)}
        
        <div className="w-px h-6 bg-white/10" />
        
        {/* Enhancement Tools */}
        {renderToolGroup(enhancementTools)}
      </div>

      <div className="flex items-center gap-4">
        {/* View Tools */}
        {renderToolGroup(viewTools)}
        
        <div className="w-px h-6 bg-white/10" />
        
        {/* History Tools */}
        {renderToolGroup(historyTools)}
        
        <div className="w-px h-6 bg-white/10" />
        
        {/* Export Button */}
        <Button
          size="sm"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          onClick={handleExport}
          disabled={!processedImage}
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  );
}