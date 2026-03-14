// components/ui/master-selector.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Palette, 
  Home, 
  Sofa, 
  Layers, 
  Lightbulb, 
  Sparkles,
  Settings,
  Wand2,
  Zap
} from "lucide-react";
import { MASTER_SELECTOR_OPTIONS, ARCHAI3D_MATERIALS } from "@/lib/ai/comfyui-workflows-master";

interface MasterSelectorProps {
  onSelectionChange: (selections: any, toggles: any) => void;
  roomType: string;
}

export function MasterSelector({ onSelectionChange, roomType }: MasterSelectorProps) {
  const [useArchAi3d, setUseArchAi3d] = useState(false);
  const [mode, setMode] = useState<'selective' | 'complete' | 'remove_paint'>('selective');

  // Master Selector Options
  const [selections, setSelections] = useState({
    wallColor: MASTER_SELECTOR_OPTIONS.wallColor[0],
    ceiling: MASTER_SELECTOR_OPTIONS.ceiling[0],
    furnitureStyle: MASTER_SELECTOR_OPTIONS.furnitureStyle[0],
    floorType: MASTER_SELECTOR_OPTIONS.floorType[0],
    lighting: MASTER_SELECTOR_OPTIONS.lighting[0],
    decorStyle: MASTER_SELECTOR_OPTIONS.decorStyle[0],
  });

  // Master Toggles
  const [toggles, setToggles] = useState({
    walls: true,
    ceiling: true,
    furniture: true,
    floor: false,
    lighting: false,
    decor: false,
  });

  const handleSelectionChange = (category: string, value: string) => {
    const newSelections = { ...selections, [category]: value };
    setSelections(newSelections);
    onSelectionChange(newSelections, toggles);
  };

  const handleToggleChange = (category: string, enabled: boolean) => {
    const newToggles = { ...toggles, [category]: enabled };
    setToggles(newToggles);
    onSelectionChange(selections, newToggles);
  };

  const buildPrompt = () => {
    const parts = [`A photorealistic interior of a ${roomType}`];
    
    if (toggles.walls) parts.push(`with ${selections.wallColor} walls`);
    if (toggles.ceiling) parts.push(`a ${selections.ceiling} ceiling`);
    if (toggles.furniture) parts.push(`and ${selections.furnitureStyle} furniture`);
    if (toggles.floor) parts.push(`on ${selections.floorType} flooring`);
    if (toggles.lighting) parts.push(`with ${selections.lighting} lighting`);
    if (toggles.decor) parts.push(`in ${selections.decorStyle} style`);

    return parts.join(', ') + '.';
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Master Selector Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ArchAi3d Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Use ArchAi3d-Qwen Engine</Label>
              <p className="text-sm text-gray-600">103+ material presets with advanced masking</p>
            </div>
            <Switch
              checked={useArchAi3d}
              onCheckedChange={setUseArchAi3d}
            />
          </div>

          {/* Mode Selection */}
          {useArchAi3d && (
            <div className="space-y-2">
              <Label className="text-base font-medium">Generation Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['selective', 'complete', 'remove_paint'] as const).map((m) => (
                  <Button
                    key={m}
                    variant={mode === m ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode(m)}
                    className="capitalize"
                  >
                    {m.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Master Selector Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Wall Color */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Wall Color
              </CardTitle>
              <Switch
                checked={toggles.walls}
                onCheckedChange={(enabled) => handleToggleChange('walls', enabled)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {MASTER_SELECTOR_OPTIONS.wallColor.map((color) => (
                <Button
                  key={color}
                  variant={selections.wallColor === color ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSelectionChange('wallColor', color)}
                  disabled={!toggles.walls}
                  className="justify-start"
                >
                  {color}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ceiling */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Home className="w-4 h-4" />
                Ceiling
              </CardTitle>
              <Switch
                checked={toggles.ceiling}
                onCheckedChange={(enabled) => handleToggleChange('ceiling', enabled)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {MASTER_SELECTOR_OPTIONS.ceiling.map((ceiling) => (
                <Button
                  key={ceiling}
                  variant={selections.ceiling === ceiling ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSelectionChange('ceiling', ceiling)}
                  disabled={!toggles.ceiling}
                  className="justify-start text-xs"
                >
                  {ceiling}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Furniture Style */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sofa className="w-4 h-4" />
                Furniture Style
              </CardTitle>
              <Switch
                checked={toggles.furniture}
                onCheckedChange={(enabled) => handleToggleChange('furniture', enabled)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {MASTER_SELECTOR_OPTIONS.furnitureStyle.map((style) => (
                <Button
                  key={style}
                  variant={selections.furnitureStyle === style ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSelectionChange('furnitureStyle', style)}
                  disabled={!toggles.furniture}
                  className="justify-start"
                >
                  {style}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Floor Type */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Floor Type
              </CardTitle>
              <Switch
                checked={toggles.floor}
                onCheckedChange={(enabled) => handleToggleChange('floor', enabled)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {MASTER_SELECTOR_OPTIONS.floorType.map((floor) => (
                <Button
                  key={floor}
                  variant={selections.floorType === floor ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSelectionChange('floorType', floor)}
                  disabled={!toggles.floor}
                  className="justify-start"
                >
                  {floor}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lighting */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Lighting
              </CardTitle>
              <Switch
                checked={toggles.lighting}
                onCheckedChange={(enabled) => handleToggleChange('lighting', enabled)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {MASTER_SELECTOR_OPTIONS.lighting.map((lighting) => (
                <Button
                  key={lighting}
                  variant={selections.lighting === lighting ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSelectionChange('lighting', lighting)}
                  disabled={!toggles.lighting}
                  className="justify-start"
                >
                  {lighting}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Decor Style */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Decor Style
              </CardTitle>
              <Switch
                checked={toggles.decor}
                onCheckedChange={(enabled) => handleToggleChange('decor', enabled)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {MASTER_SELECTOR_OPTIONS.decorStyle.map((style) => (
                <Button
                  key={style}
                  variant={selections.decorStyle === style ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSelectionChange('decorStyle', style)}
                  disabled={!toggles.decor}
                  className="justify-start"
                >
                  {style}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prompt Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Generated Prompt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm font-mono">{buildPrompt()}</p>
          </div>
          {useArchAi3d && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Zap className="w-3 h-3 mr-1" />
                ArchAi3d-Qwen
              </Badge>
              <Badge variant="outline" className="capitalize">
                {mode.replace('_', ' ')}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
