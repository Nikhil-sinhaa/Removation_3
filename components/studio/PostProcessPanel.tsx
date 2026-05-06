'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUpCircle, Loader2, Download, Image as ImageIcon, Maximize2, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostProcessPanelProps {
  onGenerate: (settings: any) => void;
  isGenerating: boolean;
  currentImage: string | null;
  processedImage: string | null;
}

type PostMode = 'enhance' | 'background' | 'view-extend' | 'lineart';

const MODES = [
  { id: 'enhance' as PostMode, label: 'Enhance', icon: ArrowUpCircle },
  { id: 'background' as PostMode, label: 'Background', icon: ImageIcon },
  { id: 'view-extend' as PostMode, label: 'Extend', icon: Maximize2 },
  { id: 'lineart' as PostMode, label: 'Lineart', icon: PenLine },
];

const BG_TYPES = [
  { id: 'city', name: 'City Skyline' }, { id: 'garden', name: 'Garden' },
  { id: 'ocean', name: 'Ocean' }, { id: 'mountains', name: 'Mountains' },
  { id: 'night_city', name: 'Night City' }, { id: 'sunset', name: 'Sunset' },
];

const LINEART_TYPES = [
  { id: 'standard', name: 'Standard' }, { id: 'realistic', name: 'Realistic' },
  { id: 'anime', name: 'Anime' }, { id: 'canny', name: 'Canny Edge' },
  { id: 'scribble', name: 'Scribble' },
];

export function PostProcessPanel({ onGenerate, isGenerating, currentImage, processedImage }: PostProcessPanelProps) {
  const [mode, setMode] = useState<PostMode>('enhance');
  // Enhance
  const [upscale4x, setUpscale4x] = useState(true);
  const [sharpen, setSharpen] = useState(true);
  const [colorGrade, setColorGrade] = useState('none');
  // Background
  const [backgroundType, setBackgroundType] = useState('city');
  const [bgPrompt, setBgPrompt] = useState('');
  // View Extend
  const [direction, setDirection] = useState('right');
  const [extendPercent, setExtendPercent] = useState([30]);
  const [extendPrompt, setExtendPrompt] = useState('');
  // Lineart
  const [lineartType, setLineartType] = useState('standard');

  const handleGenerate = () => {
    switch (mode) {
      case 'enhance':
        return onGenerate({ tab: 'postprocess', upscale4x, sharpen, colorGrade });
      case 'background':
        return onGenerate({ tab: 'background', backgroundType, prompt: bgPrompt });
      case 'view-extend':
        return onGenerate({ tab: 'view-extend', direction, extendPercent: extendPercent[0], prompt: extendPrompt });
      case 'lineart':
        return onGenerate({ tab: 'lineart', lineartType });
    }
  };

  const handleDownload = (format: string) => {
    const url = processedImage || currentImage;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url; a.download = `removation-${format}-${Date.now()}.${format}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div className="space-y-4 p-1">
      {/* Mode Selector */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">Tool</Label>
        <div className="grid grid-cols-4 gap-1">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={cn('flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                  mode === m.id ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-white/10 text-white/40 hover:border-white/30')}>
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[9px]">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Enhance controls */}
      {mode === 'enhance' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <div><p className="text-xs text-white font-medium">4× Upscale</p><p className="text-[10px] text-white/40">RealESRGAN → 2048px</p></div>
            <Switch checked={upscale4x} onCheckedChange={setUpscale4x} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <div><p className="text-xs text-white font-medium">Sharpen</p><p className="text-[10px] text-white/40">Crisp edges</p></div>
            <Switch checked={sharpen} onCheckedChange={setSharpen} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Color Grade</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {[{id:'none',name:'None',c:'bg-gray-500'},{id:'warm',name:'Warm',c:'bg-gradient-to-r from-amber-500 to-orange-500'},{id:'cool',name:'Cool',c:'bg-gradient-to-r from-blue-400 to-cyan-500'},{id:'vivid',name:'Vivid',c:'bg-gradient-to-r from-pink-500 to-purple-500'},{id:'matte',name:'Matte',c:'bg-gradient-to-r from-stone-400 to-stone-600'}].map(g => (
                <button key={g.id} onClick={() => setColorGrade(g.id)}
                  className={cn('flex flex-col items-center gap-1 p-1.5 rounded-lg border', colorGrade === g.id ? 'border-purple-500' : 'border-white/10')}>
                  <div className={cn('w-5 h-5 rounded-full', g.c)} /><span className="text-[8px] text-white/60">{g.name}</span>
                </button>))}
            </div>
          </div>
        </div>
      )}

      {/* Background controls */}
      {mode === 'background' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Background Type</Label>
            <Select value={backgroundType} onValueChange={setBackgroundType}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{BG_TYPES.map(b => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Custom Description</Label>
            <Textarea value={bgPrompt} onChange={(e) => setBgPrompt(e.target.value)}
              placeholder="e.g. tropical beach with palm trees..." className="bg-white/5 border-white/10 text-white text-xs min-h-[50px] resize-none placeholder:text-white/20" />
          </div>
        </div>
      )}

      {/* View Extend controls */}
      {mode === 'view-extend' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Direction</Label>
            <div className="grid grid-cols-5 gap-1">
              {['left','right','up','down','all'].map(d => (
                <button key={d} onClick={() => setDirection(d)}
                  className={cn('px-2 py-1 rounded text-[9px] border capitalize', direction === d ? 'border-teal-400 bg-teal-500/20 text-teal-300' : 'border-white/10 text-white/40')}>
                  {d}
                </button>))}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label className="text-xs text-white/50">Extend Amount</Label>
              <span className="text-xs text-teal-400">{extendPercent[0]}%</span>
            </div>
            <Slider value={extendPercent} onValueChange={setExtendPercent} min={10} max={50} step={5} />
          </div>
          <Textarea value={extendPrompt} onChange={(e) => setExtendPrompt(e.target.value)}
            placeholder="What should appear in the extended area..." className="bg-white/5 border-white/10 text-white text-xs min-h-[40px] resize-none placeholder:text-white/20" />
        </div>
      )}

      {/* Lineart controls */}
      {mode === 'lineart' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Line Style</Label>
            <div className="grid grid-cols-3 gap-1">
              {LINEART_TYPES.map(l => (
                <button key={l.id} onClick={() => setLineartType(l.id)}
                  className={cn('px-2 py-1.5 rounded-lg text-[9px] border', lineartType === l.id ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300' : 'border-white/10 text-white/40')}>
                  {l.name}
                </button>))}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white/5 border border-white/10">
            <p className="text-[10px] text-white/40">Converts photo to clean architectural line drawing. No AI model needed — uses preprocessor only (near-zero VRAM).</p>
          </div>
        </div>
      )}

      <Separator className="bg-white/10" />

      {/* Generate Button */}
      <Button onClick={handleGenerate} disabled={!currentImage || isGenerating}
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold h-11">
        {isGenerating ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
        ) : mode === 'lineart' ? (
          <><PenLine className="w-4 h-4 mr-2" />Convert to Lineart</>
        ) : mode === 'background' ? (
          <><ImageIcon className="w-4 h-4 mr-2" />Generate Background</>
        ) : mode === 'view-extend' ? (
          <><Maximize2 className="w-4 h-4 mr-2" />Extend View</>
        ) : (
          <><ArrowUpCircle className="w-4 h-4 mr-2" />Enhance & Upscale</>
        )}
      </Button>

      <Separator className="bg-white/10" />

      {/* Download */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">Download</Label>
        <div className="grid grid-cols-3 gap-2">
          {['png', 'jpg', 'webp'].map(fmt => (
            <Button key={fmt} variant="outline" size="sm" onClick={() => handleDownload(fmt)}
              disabled={!processedImage && !currentImage} className="text-xs uppercase">
              <Download className="w-3 h-3 mr-1" />{fmt}
            </Button>))}
        </div>
      </div>
    </div>
  );
}
