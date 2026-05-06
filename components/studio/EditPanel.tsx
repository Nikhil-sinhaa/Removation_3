'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Paintbrush, Eraser, Loader2, RotateCcw, Wand2, MousePointer2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditPanelProps {
  onGenerate: (settings: any) => void;
  isGenerating: boolean;
  currentImage: string | null;
}

type EditMode = 'auto-edit' | 'point-edit' | 'empty-room';

const MODES = [
  { id: 'auto-edit' as EditMode, label: 'Auto Edit', icon: Wand2, desc: 'Text-driven object change' },
  { id: 'point-edit' as EditMode, label: 'Point & Edit', icon: MousePointer2, desc: 'Click to select + replace' },
  { id: 'empty-room' as EditMode, label: 'Empty Room', icon: Trash2, desc: 'Remove all furniture' },
];

export function EditPanel({ onGenerate, isGenerating, currentImage }: EditPanelProps) {
  const [mode, setMode] = useState<EditMode>('auto-edit');
  const [objectToEdit, setObjectToEdit] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [denoise, setDenoise] = useState([0.55]);
  const [brushSize, setBrushSize] = useState([30]);
  const [isEraser, setIsEraser] = useState(false);

  const handleGenerate = () => {
    if (mode === 'auto-edit') {
      onGenerate({ tab: 'auto-edit', objectToEdit, editDescription, denoise: denoise[0] });
    } else if (mode === 'point-edit') {
      onGenerate({ tab: 'edit', prompt, denoise: denoise[0] });
    } else if (mode === 'empty-room') {
      onGenerate({ tab: 'empty-room', useLama: true });
    }
  };

  return (
    <div className="space-y-4 p-1">
      {/* Mode Selector */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">Edit Mode</Label>
        <div className="grid grid-cols-3 gap-1">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={cn('flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-center',
                  mode === m.id ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-white/10 text-white/40 hover:border-white/30')}>
                <Icon className="w-4 h-4" />
                <span className="text-[9px] font-medium leading-tight">{m.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-white/30 text-center">{MODES.find(m => m.id === mode)?.desc}</p>
      </div>

      <Separator className="bg-white/10" />

      {/* Auto Edit controls */}
      {mode === 'auto-edit' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">What to change</Label>
            <Input value={objectToEdit} onChange={(e) => setObjectToEdit(e.target.value)}
              placeholder="e.g. sofa, wall, floor, curtains"
              className="bg-white/5 border-white/10 text-white text-xs h-8 placeholder:text-white/20" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Change to</Label>
            <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
              placeholder="e.g. dark brown leather sofa with tufted cushions"
              className="bg-white/5 border-white/10 text-white text-xs min-h-[60px] resize-none placeholder:text-white/20" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label className="text-xs text-white/50">Edit Strength</Label>
              <span className="text-xs text-cyan-400">{Math.round(denoise[0] * 100)}%</span>
            </div>
            <Slider value={denoise} onValueChange={setDenoise} min={0.3} max={0.8} step={0.05} />
            <div className="flex justify-between text-[10px] text-white/30"><span>Subtle</span><span>Strong</span></div>
          </div>
        </div>
      )}

      {/* Point & Edit controls */}
      {mode === 'point-edit' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEraser(false)}
              className={cn('flex-1 gap-2', !isEraser && 'bg-purple-500/20 border-purple-500 text-purple-300')}>
              <Paintbrush className="w-4 h-4" /> Paint
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEraser(true)}
              className={cn('flex-1 gap-2', isEraser && 'bg-red-500/20 border-red-500 text-red-300')}>
              <Eraser className="w-4 h-4" /> Erase
            </Button>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label className="text-xs text-white/50">Brush Size</Label>
              <span className="text-xs text-purple-400">{brushSize[0]}px</span>
            </div>
            <Slider value={brushSize} onValueChange={setBrushSize} min={5} max={100} step={5} />
          </div>
          <Button variant="outline" size="sm" className="w-full text-xs">
            <RotateCcw className="w-3 h-3 mr-1" /> Clear Mask
          </Button>
          <Separator className="bg-white/10" />
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Replacement</Label>
            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what should appear..."
              className="bg-white/5 border-white/10 text-white text-xs min-h-[60px] resize-none placeholder:text-white/20" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label className="text-xs text-white/50">Edit Strength</Label>
              <span className="text-xs text-cyan-400">{Math.round(denoise[0] * 100)}%</span>
            </div>
            <Slider value={denoise} onValueChange={setDenoise} min={0.3} max={0.9} step={0.05} />
          </div>
        </div>
      )}

      {/* Empty Room controls */}
      {mode === 'empty-room' && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-300">This will detect and remove all furniture, leaving a clean empty room. Uses LaMa inpainting for seamless results.</p>
          </div>
        </div>
      )}

      <Separator className="bg-white/10" />

      {/* Generate Button */}
      <Button onClick={handleGenerate}
        disabled={!currentImage || isGenerating || (mode === 'auto-edit' && (!objectToEdit || !editDescription)) || (mode === 'point-edit' && !prompt)}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold h-11">
        {isGenerating ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
        ) : mode === 'empty-room' ? (
          <><Trash2 className="w-4 h-4 mr-2" />Empty Room</>
        ) : (
          <><Wand2 className="w-4 h-4 mr-2" />Apply Edit</>
        )}
      </Button>
    </div>
  );
}
