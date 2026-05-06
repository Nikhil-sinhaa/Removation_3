'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Upload, SunMedium, Moon, Sunrise, Sunset, CloudSun, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LightingPanelProps {
  onGenerate: (settings: any) => void;
  isGenerating: boolean;
  currentImage: string | null;
}

const MOODS = [
  { id: 'warm', name: 'Warm', emoji: '🌅', color: 'from-amber-500 to-orange-500' },
  { id: 'cool', name: 'Cool', emoji: '❄️', color: 'from-blue-400 to-cyan-500' },
  { id: 'dramatic', name: 'Dramatic', emoji: '🎭', color: 'from-purple-600 to-red-500' },
  { id: 'natural', name: 'Natural', emoji: '☀️', color: 'from-yellow-400 to-green-400' },
  { id: 'romantic', name: 'Romantic', emoji: '🕯️', color: 'from-pink-400 to-rose-500' },
  { id: 'studio', name: 'Studio', emoji: '📸', color: 'from-gray-400 to-white' },
];

const TIMES = [
  { id: 'morning', name: 'Morning', icon: Sunrise },
  { id: 'day', name: 'Day', icon: SunMedium },
  { id: 'golden_hour', name: 'Golden Hour', icon: Sunset },
  { id: 'evening', name: 'Evening', icon: CloudSun },
  { id: 'night', name: 'Night', icon: Moon },
];

export function LightingPanel({ onGenerate, isGenerating, currentImage }: LightingPanelProps) {
  const [lightMode, setLightMode] = useState<'lighting' | 'style-transfer'>('lighting');
  const [mood, setMood] = useState('warm');
  const [timeOfDay, setTimeOfDay] = useState('day');
  const [intensity, setIntensity] = useState([0.35]);
  const [referenceLight, setReferenceLight] = useState<File | null>(null);
  const [refPreview, setRefPreview] = useState<string | null>(null);
  // Style Transfer
  const [styleWeight, setStyleWeight] = useState([0.75]);
  const [structureStrength, setStructureStrength] = useState([0.90]);

  const handleRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceLight(file);
      setRefPreview(URL.createObjectURL(file));
    }
  };

  const handleGenerate = () => {
    if (lightMode === 'style-transfer') {
      onGenerate({ tab: 'style-transfer', referenceImage: referenceLight, styleWeight: styleWeight[0], structureStrength: structureStrength[0] });
    } else {
      onGenerate({ tab: 'lighting', mood, timeOfDay, intensity: intensity[0], referenceLight });
    }
  };

  return (
    <div className="space-y-5 p-1">
      {/* Mode Selector */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">Mode</Label>
        <div className="grid grid-cols-2 gap-1">
          <button onClick={() => setLightMode('lighting')}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              lightMode === 'lighting' ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-white/10 text-white/40')}>
            🔆 Lighting
          </button>
          <button onClick={() => setLightMode('style-transfer')}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              lightMode === 'style-transfer' ? 'border-pink-500 bg-pink-500/20 text-pink-300' : 'border-white/10 text-white/40')}>
            🎨 Style Transfer
          </button>
        </div>
      </div>

      <Separator className="bg-white/10" />
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">Mood</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMood(m.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all border',
                mood === m.id
                  ? 'border-purple-500 bg-purple-500/20 text-white ring-1 ring-purple-500/50'
                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
              )}
            >
              <span className="text-sm">{m.emoji}</span>
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Time of Day */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">Time of Day</Label>
        <div className="flex gap-1">
          {TIMES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTimeOfDay(t.id)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] transition-all border',
                  timeOfDay === t.id
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                    : 'border-white/10 bg-white/5 text-white/40 hover:text-white/70'
                )}
              >
                <Icon className="w-4 h-4" />
                {t.name}
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Intensity */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs text-white/50">Light Intensity</Label>
          <span className="text-xs text-amber-400">{Math.round(intensity[0] * 100)}%</span>
        </div>
        <Slider value={intensity} onValueChange={setIntensity} min={0.20} max={0.50} step={0.05} />
        <div className="flex justify-between text-[10px] text-white/30">
          <span>Subtle</span><span>Strong</span>
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Reference Light */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Reference <Badge variant="secondary" className="text-[9px] ml-1">{lightMode === 'style-transfer' ? 'Required' : 'Optional'}</Badge>
        </Label>
        {refPreview ? (
          <div className="relative rounded-lg overflow-hidden border border-white/10">
            <img src={refPreview} alt="Light ref" className="w-full h-20 object-cover" />
            <button onClick={() => { setReferenceLight(null); setRefPreview(null); }}
              className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white/80">✕</button>
          </div>
        ) : (
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-white/20 cursor-pointer hover:border-amber-500/50 transition-all">
            <Upload className="w-4 h-4 text-white/40" />
            <span className="text-xs text-white/40">{lightMode === 'style-transfer' ? 'Upload style reference (required)' : 'Upload lighting reference'}</span>
            <input type="file" accept="image/*" onChange={handleRefUpload} className="hidden" />
          </label>
        )}
      </div>

      {/* Style Transfer specific controls */}
      {lightMode === 'style-transfer' && (
        <>
          <Separator className="bg-white/10" />
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs text-white/50">Style Weight</Label>
                <span className="text-xs text-pink-400">{Math.round(styleWeight[0] * 100)}%</span>
              </div>
              <Slider value={styleWeight} onValueChange={setStyleWeight} min={0.3} max={0.95} step={0.05} />
              <div className="flex justify-between text-[10px] text-white/30"><span>Subtle</span><span>Strong</span></div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs text-white/50">Structure Lock</Label>
                <span className="text-xs text-cyan-400">{Math.round(structureStrength[0] * 100)}%</span>
              </div>
              <Slider value={structureStrength} onValueChange={setStructureStrength} min={0.5} max={1.0} step={0.05} />
            </div>
          </div>
        </>
      )}

      {/* Generate */}
      <Button
        onClick={handleGenerate}
        disabled={!currentImage || isGenerating || (lightMode === 'style-transfer' && !referenceLight)}
        className={cn("w-full font-semibold h-11", lightMode === 'style-transfer'
          ? "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
          : "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black")}
      >
        {isGenerating ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{lightMode === 'style-transfer' ? 'Transferring...' : 'Relighting...'}</>
        ) : (
          <><SunMedium className="w-4 h-4 mr-2" />{lightMode === 'style-transfer' ? 'Apply Style' : 'Apply Lighting'}</>
        )}
      </Button>
    </div>
  );
}
