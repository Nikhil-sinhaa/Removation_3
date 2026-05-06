'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, X, Loader2, Search, LayoutGrid } from 'lucide-react';
import { useEditorStore } from '@/stores/editor-store';
import { cn } from '@/lib/utils';

const POSITION_PRESETS = [
  { id: 'center',      label: 'Center',      hint: 'placed centered in the room on the floor, focal point of the space' },
  { id: 'left-wall',  label: 'Left Wall',   hint: 'placed against the left wall, neatly aligned' },
  { id: 'right-wall', label: 'Right Wall',  hint: 'placed against the right wall, neatly aligned' },
  { id: 'corner',     label: 'Corner',      hint: 'placed in the far corner of the room, tucked neatly' },
  { id: 'window',     label: 'By Window',   hint: 'placed near the window, bathed in natural light' },
  { id: 'custom',     label: 'Custom',      hint: '' },
] as const;

type PositionId = typeof POSITION_PRESETS[number]['id'];


interface FurnishPanelProps {
  onGenerate: (settings: any) => void;
  isGenerating: boolean;
  currentImage: string | null;
}

interface FurnishItem {
  id: string;
  file: File;
  preview: string;
  product?: any;
}

export function FurnishPanel({ onGenerate, isGenerating, currentImage }: FurnishPanelProps) {
  const [items, setItems] = useState<FurnishItem[]>([]);
  const [furnitureUrl, setFurnitureUrl] = useState('');
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [position, setPosition] = useState<PositionId>('center');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setItems(prev => [...prev, {
        id: Math.random().toString(),
        file,
        preview: URL.createObjectURL(file)
      }]);
    }
    // reset input
    e.target.value = '';
  };

  const handleScrapeUrl = async () => {
    if (!furnitureUrl) return;
    setIsScrapingUrl(true);
    try {
      const res = await fetch('/api/furniture/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: furnitureUrl }),
      });
      const data = await res.json();
      if (data.item) {
        const product = { name: data.item.title, price: data.item.price, url: data.item.sourceUrl, imageUrl: data.item.imageUrl };
        // Download the product image for placement
        if (data.item.imageUrl) {
          const imgRes = await fetch(data.item.imageUrl);
          const blob = await imgRes.blob();
          const file = new File([blob], 'product.png', { type: blob.type });
          setItems(prev => [...prev, {
            id: Math.random().toString(),
            file,
            preview: URL.createObjectURL(file),
            product
          }]);
          setFurnitureUrl('');
        }
      } else if (data.error) {
        console.error('Scrape error:', data.error, data.message);
        useEditorStore.getState().addError({
          type: 'error',
          code: 'SCRAPE_FAILED',
          message: data.message || data.error || 'Failed to extract furniture details from URL',
        });
      }
    } catch (err: any) {
      console.error('Scrape failed:', err);
      useEditorStore.getState().addError({
        type: 'error',
        code: 'SCRAPE_FAILED',
        message: err.message || 'Failed to extract furniture details. Make sure it is a valid product page.',
      });
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => {
      if (item.id === id) URL.revokeObjectURL(item.preview);
      return item.id !== id;
    }));
  };

  const handleGenerate = () => {
    const preset = POSITION_PRESETS.find(p => p.id === position);
    const placementHint = position === 'custom' ? prompt : preset?.hint || '';
    const fullPrompt = position === 'custom'
      ? prompt
      : [placementHint, prompt].filter(Boolean).join(', ');
    onGenerate({
      tab: 'furnish',
      items,
      prompt: fullPrompt,
      placement: position,
    });
  };

  return (
    <div className="space-y-5 p-1">
      {/* URL Import */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Import from URL
        </Label>
        <div className="flex gap-2">
          <Input
            value={furnitureUrl}
            onChange={(e) => setFurnitureUrl(e.target.value)}
            placeholder="Amazon / Flipkart product URL"
            className="bg-white/5 border-white/10 text-white text-xs placeholder:text-white/20 flex-1"
          />
          <Button variant="outline" size="sm" onClick={handleScrapeUrl} disabled={!furnitureUrl || isScrapingUrl}>
            {isScrapingUrl ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
          </Button>
        </div>
        <div className="flex gap-1">
          <Badge variant="secondary" className="text-[9px]">Amazon</Badge>
          <Badge variant="secondary" className="text-[9px]">Flipkart</Badge>
          <Badge variant="secondary" className="text-[9px]">IKEA</Badge>
          <Badge variant="secondary" className="text-[9px]">Pepperfry</Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Separator className="bg-white/10 flex-1" />
        <span className="text-[10px] text-white/30">or</span>
        <Separator className="bg-white/10 flex-1" />
      </div>

      {/* Direct Upload & List */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">Furniture Items to Place</Label>
        
        {items.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {items.map((item, index) => (
              <div key={item.id} className="relative rounded-lg overflow-hidden border border-white/10 bg-white/5 flex items-center p-2">
                <div className="w-12 h-12 bg-black/40 rounded flex-shrink-0 flex items-center justify-center mr-3">
                  <img src={item.preview} alt="Furniture" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium truncate">{item.product?.name || item.file.name}</p>
                  {item.product?.price && (
                    <p className="text-[10px] text-green-400">₹{item.product.price.toLocaleString()}</p>
                  )}
                </div>
                <button onClick={() => removeItem(item.id)} className="ml-2 p-1.5 text-white/40 hover:text-red-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {items.length < 5 && (
          <label className="flex flex-col items-center gap-2 px-4 py-4 rounded-lg border border-dashed border-white/20 cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-all">
            <ShoppingBag className="w-5 h-5 text-white/30" />
            <span className="text-xs text-white/40">Upload another item</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        )}
      </div>

      <Separator className="bg-white/10" />

      {/* Position Presets */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
          <LayoutGrid className="w-3 h-3" /> Placement Position
        </Label>
        <div className="grid grid-cols-3 gap-1.5">
          {POSITION_PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => setPosition(p.id)}
              className={cn(
                'px-2 py-1.5 rounded-lg text-[10px] font-medium border transition-all',
                position === p.id
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt — only shown for Custom, or as extra notes */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">
          {position === 'custom' ? 'Placement Instructions' : 'Additional Notes (optional)'}
        </Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={position === 'custom'
            ? 'e.g., place sofa in center, coffee table in front...'
            : 'e.g., angled slightly, facing the TV...'}
          className="bg-white/5 border-white/10 text-white text-xs min-h-[52px] resize-none placeholder:text-white/20"
        />
      </div>

      {/* Generate */}
      <Button
        onClick={handleGenerate}
        disabled={!currentImage || items.length === 0 || isGenerating}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold h-11"
      >
        {isGenerating ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Placing...</>
        ) : (
          <><ShoppingBag className="w-4 h-4 mr-2" />Place Furniture</>
        )}
      </Button>

      <p className="text-[10px] text-white/30 text-center">
        IPAdapter + depth-aware compositing for realistic placement
      </p>
    </div>
  );
}
