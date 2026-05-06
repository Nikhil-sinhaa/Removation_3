'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Wand2, Upload, Loader2, ImageIcon } from 'lucide-react';
import { DESIGN_STYLES } from '@/constants/styles-400';
import { ROOM_TYPES } from '@/constants/room-types';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface RenderPanelProps {
  onGenerate: (settings: any) => void;
  isGenerating: boolean;
  currentImage: string | null;
}

const STYLE_PRESETS = [
  { id: 'modern-minimalist', name: 'Modern Minimalist', color: '#1a1a2e' },
  { id: 'scandinavian', name: 'Scandinavian', color: '#e8dcc8' },
  { id: 'industrial', name: 'Industrial', color: '#4a4a4a' },
  { id: 'bohemian', name: 'Bohemian', color: '#c8956e' },
  { id: 'japandi', name: 'Japandi', color: '#d4c5a9' },
  { id: 'mid-century-modern', name: 'Mid-Century', color: '#b8860b' },
  { id: 'contemporary', name: 'Contemporary', color: '#2c3e50' },
  { id: 'art-deco', name: 'Art Deco', color: '#c9b037' },
  { id: 'tropical', name: 'Tropical', color: '#2d6a4f' },
  { id: 'mediterranean', name: 'Mediterranean', color: '#0077b6' },
  { id: 'rustic', name: 'Rustic', color: '#8b6914' },
  { id: 'coastal', name: 'Coastal', color: '#48cae4' },
];

export function RenderPanel({ onGenerate, isGenerating, currentImage }: RenderPanelProps) {
  const [renderMode, setRenderMode] = useState<'render' | 'interior-render' | 'exterior-render' | 'landscape'>('render');
  const [roomType, setRoomType] = useState('living-room');
  const [style, setStyle] = useState('modern-minimalist');
  const [strength, setStrength] = useState([0.75]);
  const [cannyStrength, setCannyStrength] = useState([0.85]);
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [refPreview, setRefPreview] = useState<string | null>(null);
  // Exterior-specific
  const [buildingType, setBuildingType] = useState('residential house');
  const [timeOfDay, setTimeOfDay] = useState('day');
  // Landscape-specific
  const [landscapeType, setLandscapeType] = useState('garden');

  const handleRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceImage(file);
      setRefPreview(URL.createObjectURL(file));
    }
  };

  const handleGenerate = () => {
    const base = { style, strength: strength[0], cannyStrength: cannyStrength[0], prompt, referenceImage };
    switch (renderMode) {
      case 'render':
        return onGenerate({ tab: 'render', roomType, ...base });
      case 'interior-render':
        return onGenerate({ tab: 'interior-render', roomType, ...base, strength: 0.85 });
      case 'exterior-render':
        return onGenerate({ tab: 'exterior-render', buildingType, timeOfDay, ...base, strength: 0.80 });
      case 'landscape':
        return onGenerate({ tab: 'landscape', landscapeType, ...base, strength: 0.80 });
    }
  };

  const RENDER_MODES = [
    { id: 'render' as const, label: 'Realistic', desc: 'Photo → styled render' },
    { id: 'interior-render' as const, label: 'Interior AI', desc: 'Sketch → photorealistic' },
    { id: 'exterior-render' as const, label: 'Exterior', desc: 'Building exterior render' },
    { id: 'landscape' as const, label: 'Landscape', desc: 'Garden & outdoor' },
  ];

  return (
    <div className="space-y-5 p-1">
      {/* Render Mode */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">Render Mode</Label>
        <div className="grid grid-cols-4 gap-1">
          {RENDER_MODES.map((m) => (
            <button key={m.id} onClick={() => setRenderMode(m.id)}
              className={cn('px-2 py-1.5 rounded-lg text-[9px] font-medium border transition-all',
                renderMode === m.id ? 'border-purple-500 bg-purple-500/20 text-purple-300' : 'border-white/10 text-white/40 hover:border-white/30')}>
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-white/30 text-center">{RENDER_MODES.find(m => m.id === renderMode)?.desc}</p>
      </div>

      <Separator className="bg-white/10" />

      {/* Room/Building/Landscape Type */}
      {(renderMode === 'render' || renderMode === 'interior-render') && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">Room Type</Label>
          <Select value={roomType} onValueChange={setRoomType}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
            <SelectContent>{ROOM_TYPES.map((room) => (<SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>))}</SelectContent>
          </Select>
        </div>
      )}
      {renderMode === 'exterior-render' && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">Building Type</Label>
          <Select value={buildingType} onValueChange={setBuildingType}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['residential house', 'apartment building', 'villa', 'commercial', 'office building', 'bungalow'].map(b => (<SelectItem key={b} value={b}>{b.replace(/^\w/, c => c.toUpperCase())}</SelectItem>))}
            </SelectContent>
          </Select>
          <Label className="text-xs font-semibold uppercase tracking-wider text-white/50 mt-2">Time of Day</Label>
          <div className="grid grid-cols-5 gap-1">
            {['morning','day','golden_hour','evening','night'].map(t => (
              <button key={t} onClick={() => setTimeOfDay(t)}
                className={cn('px-1.5 py-1 rounded text-[8px] border', timeOfDay === t ? 'border-amber-400 bg-amber-500/20 text-amber-300' : 'border-white/10 text-white/40')}>
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}
      {renderMode === 'landscape' && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">Landscape Type</Label>
          <Select value={landscapeType} onValueChange={setLandscapeType}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['garden', 'backyard', 'pool_area', 'rooftop', 'terrace'].map(l => (<SelectItem key={l} value={l}>{l.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Separator className="bg-white/10" />

      {/* Style Presets */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">Design Style</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {STYLE_PRESETS.map((s) => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={cn(
                'relative px-2 py-2 rounded-lg text-[10px] font-medium transition-all border',
                style === s.id
                  ? 'border-purple-500 bg-purple-500/20 text-white ring-1 ring-purple-500/50'
                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              )}
            >
              <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: s.color }} />
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Strength Controls */}
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-xs text-white/50">Creativity</Label>
            <span className="text-xs text-purple-400">{Math.round(strength[0] * 100)}%</span>
          </div>
          <Slider value={strength} onValueChange={setStrength} min={0.3} max={0.95} step={0.05} />
          <div className="flex justify-between text-[10px] text-white/30">
            <span>Conservative</span><span>Creative</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-xs text-white/50">Structure Lock</Label>
            <span className="text-xs text-cyan-400">{Math.round(cannyStrength[0] * 100)}%</span>
          </div>
          <Slider value={cannyStrength} onValueChange={setCannyStrength} min={0.5} max={1.0} step={0.05} />
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Reference Image */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Style Reference <Badge variant="secondary" className="text-[9px] ml-1">Optional</Badge>
        </Label>
        {refPreview ? (
          <div className="relative rounded-lg overflow-hidden border border-white/10">
            <img src={refPreview} alt="Reference" className="w-full h-24 object-cover" />
            <button onClick={() => { setReferenceImage(null); setRefPreview(null); }}
              className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white/80 hover:text-white">✕</button>
          </div>
        ) : (
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-white/20 cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all">
            <Upload className="w-4 h-4 text-white/40" />
            <span className="text-xs text-white/40">Upload moodboard / style ref</span>
            <input type="file" accept="image/*" onChange={handleRefUpload} className="hidden" />
          </label>
        )}
      </div>

      {/* Custom Prompt */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">Custom Instructions</Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., wooden flooring, warm lighting, green plants..."
          className="bg-white/5 border-white/10 text-white text-xs min-h-[60px] resize-none placeholder:text-white/20"
        />
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!currentImage || isGenerating}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold h-11"
      >
        {isGenerating ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
        ) : (
          <><Wand2 className="w-4 h-4 mr-2" />Generate Design</>
        )}
      </Button>
    </div>
  );
}
