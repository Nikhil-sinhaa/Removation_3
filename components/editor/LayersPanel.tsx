'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/editor-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  MoreHorizontal,
  Plus,
  Image as ImageIcon,
  Type,
  Square,
  ChevronUp,
  ChevronDown,
  Blend,
} from 'lucide-react';

interface Layer {
  id: string;
  name: string;
  type: 'image' | 'mask' | 'text' | 'shape';
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
  thumbnail?: string;
}

interface LayersPanelProps {
  className?: string;
}

export function LayersPanel({ className }: LayersPanelProps) {
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: '1',
      name: 'Original Image',
      type: 'image',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
    },
    {
      id: '2',
      name: 'Transformed Layer',
      type: 'image',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
    },
    {
      id: '3',
      name: 'Inpaint Mask',
      type: 'mask',
      visible: false,
      locked: false,
      opacity: 50,
      blendMode: 'normal',
    },
  ]);

  const [selectedLayer, setSelectedLayer] = useState<string>('2');
  const [editingName, setEditingName] = useState<string | null>(null);

  const getLayerIcon = (type: Layer['type']) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'mask':
        return <Square className="w-4 h-4 text-purple-400" />;
      case 'text':
        return <Type className="w-4 h-4" />;
      case 'shape':
        return <Square className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  const toggleVisibility = (id: string) => {
    setLayers(layers.map(l => 
      l.id === id ? { ...l, visible: !l.visible } : l
    ));
  };

  const toggleLock = (id: string) => {
    setLayers(layers.map(l => 
      l.id === id ? { ...l, locked: !l.locked } : l
    ));
  };

  const updateOpacity = (id: string, opacity: number) => {
    setLayers(layers.map(l => 
      l.id === id ? { ...l, opacity } : l
    ));
  };

  const deleteLayer = (id: string) => {
    setLayers(layers.filter(l => l.id !== id));
    if (selectedLayer === id) {
      setSelectedLayer(layers[0]?.id || '');
    }
  };

  const duplicateLayer = (id: string) => {
    const layer = layers.find(l => l.id === id);
    if (layer) {
      const newLayer = {
        ...layer,
        id: `${Date.now()}`,
        name: `${layer.name} (Copy)`,
      };
      const index = layers.findIndex(l => l.id === id);
      const newLayers = [...layers];
      newLayers.splice(index + 1, 0, newLayer);
      setLayers(newLayers);
    }
  };

  const updateName = (id: string, name: string) => {
    setLayers(layers.map(l => 
      l.id === id ? { ...l, name } : l
    ));
    setEditingName(null);
  };

  const moveLayer = (id: string, direction: 'up' | 'down') => {
    const index = layers.findIndex(l => l.id === id);
    if (direction === 'up' && index > 0) {
      const newLayers = [...layers];
      [newLayers[index - 1], newLayers[index]] = [newLayers[index], newLayers[index - 1]];
      setLayers(newLayers);
    } else if (direction === 'down' && index < layers.length - 1) {
      const newLayers = [...layers];
      [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      setLayers(newLayers);
    }
  };

  const selectedLayerData = layers.find(l => l.id === selectedLayer);

  return (
    <div className={cn("flex flex-col h-full bg-[#0c0c0c]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span className="text-white text-sm font-medium">Layers</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-white/60 hover:text-white"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Layers List */}
      <ScrollArea className="flex-1">
        <Reorder.Group
          axis="y"
          values={layers}
          onReorder={setLayers}
          className="p-2 space-y-1"
        >
          <AnimatePresence>
            {layers.map((layer) => (
              <Reorder.Item
                key={layer.id}
                value={layer}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer",
                  selectedLayer === layer.id
                    ? "bg-purple-500/20 border border-purple-500/40"
                    : "hover:bg-white/5"
                )}
                onClick={() => setSelectedLayer(layer.id)}
              >
                {/* Visibility Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisibility(layer.id);
                  }}
                  className={cn(
                    "p-1 rounded hover:bg-white/10 transition-colors",
                    layer.visible ? "text-white/60" : "text-white/30"
                  )}
                >
                  {layer.visible ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Layer Type Icon */}
                <div className={cn(
                  "w-8 h-8 rounded flex items-center justify-center flex-shrink-0",
                  layer.visible ? "text-white/60" : "text-white/30",
                  layer.type === 'mask' && "bg-purple-500/20"
                )}>
                  {layer.thumbnail ? (
                    <img src={layer.thumbnail} alt="" className="w-full h-full rounded object-cover" />
                  ) : (
                    getLayerIcon(layer.type)
                  )}
                </div>

                {/* Layer Name */}
                <div className="flex-1 min-w-0">
                  {editingName === layer.id ? (
                    <Input
                      value={layer.name}
                      onChange={(e) => updateName(layer.id, e.target.value)}
                      onBlur={() => setEditingName(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingName(null)}
                      autoFocus
                      className="h-6 text-xs bg-white/10 border-white/20"
                    />
                  ) : (
                    <p
                      className={cn(
                        "text-xs truncate",
                        layer.visible ? "text-white/80" : "text-white/40"
                      )}
                      onDoubleClick={() => setEditingName(layer.id)}
                    >
                      {layer.name}
                    </p>
                  )}
                </div>

                {/* Lock Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLock(layer.id);
                  }}
                  className={cn(
                    "p-1 rounded hover:bg-white/10 transition-colors",
                    layer.locked ? "text-yellow-500" : "text-white/30"
                  )}
                >
                  {layer.locked ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* More Options */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                    <DropdownMenuItem onClick={() => duplicateLayer(layer.id)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => moveLayer(layer.id, 'up')}>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Move Up
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => moveLayer(layer.id, 'down')}>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Move Down
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem 
                      onClick={() => deleteLayer(layer.id)}
                      className="text-red-400 focus:text-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </ScrollArea>

      {/* Selected Layer Properties */}
      {selectedLayerData && (
        <div className="p-3 border-t border-white/10 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-xs">Opacity</span>
              <span className="text-white/40 text-xs font-mono">
                {selectedLayerData.opacity}%
              </span>
            </div>
            <Slider
              value={[selectedLayerData.opacity]}
              onValueChange={([value]) => updateOpacity(selectedLayerData.id, value)}
              min={0}
              max={100}
              step={1}
              disabled={selectedLayerData.locked}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs flex items-center gap-1">
              <Blend className="w-3 h-3" />
              Blend Mode
            </span>
            <select className="bg-white/10 text-white text-xs px-2 py-1 rounded border border-white/10">
              <option value="normal">Normal</option>
              <option value="multiply">Multiply</option>
              <option value="screen">Screen</option>
              <option value="overlay">Overlay</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}