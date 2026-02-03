'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useEditorStore } from '@/stores/editor-store';
import {
  Wand2,
  Paintbrush,
  Eraser,
  Replace,
  Home,
  Sparkles,
  Sun,
  Moon,
  Palette,
  TreeDeciduous,
  Building2,
  SlidersHorizontal,
  Check,
  Info,
} from 'lucide-react';

import { TransformationMode } from '@/types/editor';

interface TransformMode {
  id: TransformationMode;
  name: string;
  description: string;
  icon: React.ReactNode;
  credits: number;
  isPro?: boolean;
  settings?: {
    id: string;
    label: string;
    type: 'slider' | 'switch' | 'select';
    defaultValue: number | boolean | string;
    min?: number;
    max?: number;
    options?: string[];
  }[];
}

const transformModes: TransformMode[] = [
  {
    id: 'redesign',
    name: 'Redesign Room',
    description: 'Transform entire room with new style',
    icon: <Wand2 className="w-5 h-5" />,
    credits: 2,
    settings: [
      { id: 'intensity', label: 'Transform Intensity', type: 'slider', defaultValue: 75, min: 0, max: 100 },
      { id: 'keepLayout', label: 'Keep Room Layout', type: 'switch', defaultValue: true },
    ],
  },
  {
    id: 'fill-room',
    name: 'Fill Empty Room',
    description: 'Add furniture to empty spaces',
    icon: <Home className="w-5 h-5" />,
    credits: 2,
    settings: [
      { id: 'density', label: 'Furniture Density', type: 'slider', defaultValue: 50, min: 0, max: 100 },
      { id: 'budget', label: 'Budget Level', type: 'select', defaultValue: 'medium', options: ['budget', 'medium', 'luxury'] },
    ],
  },
  {
    id: 'inpaint',
    name: 'Inpaint Area',
    description: 'Paint over area to transform',
    icon: <Paintbrush className="w-5 h-5" />,
    credits: 1,
    settings: [
      { id: 'brushSize', label: 'Brush Size', type: 'slider', defaultValue: 50, min: 10, max: 200 },
      { id: 'feather', label: 'Edge Feathering', type: 'slider', defaultValue: 10, min: 0, max: 50 },
    ],
  },
  {
    id: 'remove-object',
    name: 'Remove Object',
    description: 'Remove unwanted items seamlessly',
    icon: <Eraser className="w-5 h-5" />,
    credits: 1,
    settings: [
      { id: 'cleanEdges', label: 'Clean Edges', type: 'switch', defaultValue: true },
    ],
  },
  {
    id: 'replace-object',
    name: 'Replace Furniture',
    description: 'Swap furniture with new pieces',
    icon: <Replace className="w-5 h-5" />,
    credits: 2,
    isPro: true,
    settings: [
      { id: 'matchStyle', label: 'Match Room Style', type: 'switch', defaultValue: true },
      { id: 'matchColor', label: 'Match Color Scheme', type: 'switch', defaultValue: true },
    ],
  },
  {
    id: 'enhance',
    name: 'Enhance Quality',
    description: 'Upscale and improve image quality',
    icon: <Sparkles className="w-5 h-5" />,
    credits: 1,
    settings: [
      { id: 'scale', label: 'Upscale Factor', type: 'select', defaultValue: '2x', options: ['2x', '4x'] },
      { id: 'denoise', label: 'Noise Reduction', type: 'slider', defaultValue: 30, min: 0, max: 100 },
    ],
  },
  {
    id: 'lighting',
    name: 'Adjust Lighting',
    description: 'Change time of day or mood',
    icon: <Sun className="w-5 h-5" />,
    credits: 1,
    settings: [
      { id: 'timeOfDay', label: 'Time of Day', type: 'select', defaultValue: 'day', options: ['morning', 'day', 'evening', 'night'] },
      { id: 'warmth', label: 'Color Temperature', type: 'slider', defaultValue: 50, min: 0, max: 100 },
    ],
  },
  {
    id: 'outdoor',
    name: 'Outdoor Design',
    description: 'Transform gardens and patios',
    icon: <TreeDeciduous className="w-5 h-5" />,
    credits: 2,
    isPro: true,
  },
];

interface TransformPanelProps {
  className?: string;
}

export function TransformPanel({ className }: TransformPanelProps) {
  const { mode, setMode } = useEditorStore();
  const [settings, setSettings] = useState<Record<string, Record<string, any>>>({});

  const selectedMode = transformModes.find((m) => m.id === mode);

  const updateSetting = (modeId: string, settingId: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [modeId]: {
        ...prev[modeId],
        [settingId]: value,
      },
    }));
  };

  const getSetting = (modeId: string, settingId: string, defaultValue: any) => {
    return settings[modeId]?.[settingId] ?? defaultValue;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mode Grid */}
      <div className="grid grid-cols-3 gap-2">
        {transformModes.map((transformMode) => (
          <button
            key={transformMode.id}
            onClick={() => setMode(transformMode.id)}
            className={cn(
              "relative p-3 rounded-xl border transition-all duration-200 text-left",
              mode === transformMode.id
                ? "border-purple-500 bg-purple-500/10"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
            )}
          >
            {transformMode.isPro && (
              <Badge className="absolute -top-1 -right-1 px-1.5 py-0 text-[10px] bg-gradient-to-r from-purple-600 to-pink-600">
                PRO
              </Badge>
            )}
            <div className={cn(
              "mb-2",
              mode === transformMode.id ? "text-purple-400" : "text-white/60"
            )}>
              {transformMode.icon}
            </div>
            <div className="text-white text-xs font-medium truncate">
              {transformMode.name}
            </div>
            <div className="text-white/40 text-[10px] mt-0.5">
              {transformMode.credits} credit{transformMode.credits > 1 ? 's' : ''}
            </div>
            {mode === transformMode.id && (
              <motion.div
                layoutId="selectedModeIndicator"
                className="absolute top-2 right-2"
                initial={false}
              >
                <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              </motion.div>
            )}
          </button>
        ))}
      </div>

      {/* Selected Mode Settings */}
      {selectedMode && selectedMode.settings && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <SlidersHorizontal className="w-4 h-4 text-purple-400" />
            <span className="text-white text-sm font-medium">{selectedMode.name} Settings</span>
          </div>

          {selectedMode.settings.map((setting) => (
            <div key={setting.id} className="space-y-2">
              {setting.type === 'slider' && (
                <>
                  <div className="flex items-center justify-between">
                    <Label className="text-white/70 text-sm">{setting.label}</Label>
                    <span className="text-white/50 text-xs font-mono">
                      {getSetting(selectedMode.id, setting.id, setting.defaultValue)}
                      {setting.id.includes('Size') ? 'px' : '%'}
                    </span>
                  </div>
                  <Slider
                    value={[getSetting(selectedMode.id, setting.id, setting.defaultValue as number)]}
                    onValueChange={([value]) => updateSetting(selectedMode.id, setting.id, value)}
                    min={setting.min}
                    max={setting.max}
                    step={1}
                  />
                </>
              )}

              {setting.type === 'switch' && (
                <div className="flex items-center justify-between">
                  <Label className="text-white/70 text-sm">{setting.label}</Label>
                  <Switch
                    checked={getSetting(selectedMode.id, setting.id, setting.defaultValue as boolean)}
                    onCheckedChange={(checked) => updateSetting(selectedMode.id, setting.id, checked)}
                  />
                </div>
              )}

              {setting.type === 'select' && setting.options && (
                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">{setting.label}</Label>
                  <div className="flex gap-2">
                    {setting.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => updateSetting(selectedMode.id, setting.id, option)}
                        className={cn(
                          "flex-1 py-2 px-3 rounded-lg text-xs font-medium capitalize transition-colors",
                          getSetting(selectedMode.id, setting.id, setting.defaultValue) === option
                            ? "bg-purple-500 text-white"
                            : "bg-white/10 text-white/60 hover:bg-white/15"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* Mode Description */}
      {selectedMode && (
        <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-blue-200/80 text-xs">
            {selectedMode.description}
          </p>
        </div>
      )}
    </div>
  );
}