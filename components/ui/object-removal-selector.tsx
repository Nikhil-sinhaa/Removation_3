// components/ui/object-removal-selector.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { 
  Trash2, 
  Zap, 
  Wand2, 
  Scan,
  Brush,
  Eye,
  Cpu,
  Clock,
  CheckCircle,
  Settings
} from "lucide-react";

interface ObjectRemovalSelectorProps {
  onSelectionChange: (selections: any) => void;
  roomType: string;
}

export function ObjectRemovalSelector({ onSelectionChange, roomType }: ObjectRemovalSelectorProps) {
  const [removalMethod, setRemovalMethod] = useState<'lama' | 'flux_fill' | 'sam2'>('lama');
  const [replacementPrompt, setReplacementPrompt] = useState('clean empty space, minimalist room, seamless background');
  const [autoDetect, setAutoDetect] = useState(false);
  const [creativity, setCreativity] = useState([50]);
  const [steps, setSteps] = useState([15]);
  const [guidance, setGuidance] = useState([7.5]);

  const updateSelections = () => {
    const selections = {
      removalMethod,
      replacementPrompt,
      maskData: {
        autoDetect,
        coordinates: autoDetect ? undefined : { x: 100, y: 100, width: 200, height: 150 }
      },
      settings: {
        method: removalMethod === 'flux_fill' ? 'high_end' : removalMethod === 'sam2' ? 'autonomous' : 'professional',
        creativity: creativity[0],
        num_inference_steps: steps[0],
        guidance_scale: guidance[0],
      }
    };
    onSelectionChange(selections);
  };

  // Update selections when any setting changes
  useState(() => {
    updateSelections();
  });

  const handleRemovalMethodChange = (method: 'lama' | 'flux_fill' | 'sam2') => {
    setRemovalMethod(method);
    setTimeout(updateSelections, 0);
  };

  const handleReplacementPromptChange = (prompt: string) => {
    setReplacementPrompt(prompt);
    setTimeout(updateSelections, 0);
  };

  const handleAutoDetectChange = (enabled: boolean) => {
    setAutoDetect(enabled);
    setTimeout(updateSelections, 0);
  };

  const handleCreativityChange = (value: number[]) => {
    setCreativity(value);
    setTimeout(updateSelections, 0);
  };

  const handleStepsChange = (value: number[]) => {
    setSteps(value);
    setTimeout(updateSelections, 0);
  };

  const handleGuidanceChange = (value: number[]) => {
    setGuidance(value);
    setTimeout(updateSelections, 0);
  };

  const getMethodInfo = (method: string) => {
    switch (method) {
      case 'lama':
        return {
          name: 'LaMa (Large Mask Inpainting)',
          description: 'Fastest and most stable method for 8GB VRAM',
          benefits: ['Lightweight model', 'Rarely crashes GPU', 'Intelligently fills gaps'],
          icon: <Zap className="w-5 h-5" />,
          color: 'green',
          estimatedTime: '10 seconds'
        };
      case 'flux_fill':
        return {
          name: 'Flux.1 Fill / SDXL Inpaint',
          description: 'High-end method that re-imagines space behind object',
          benefits: ['Creative replacement', 'Professional quality', 'Prompt-based generation'],
          icon: <Wand2 className="w-5 h-5" />,
          color: 'purple',
          estimatedTime: '25 seconds'
        };
      case 'sam2':
        return {
          name: 'Segment Anything 2 + LaMa',
          description: 'Autonomous method with perfect object boundary detection',
          benefits: ['Automatic detection', 'No manual masking', 'Perfect boundaries'],
          icon: <Scan className="w-5 h-5" />,
          color: 'blue',
          estimatedTime: '15 seconds'
        };
      default:
        return {
          name: 'Unknown Method',
          description: 'Select a removal method',
          benefits: [],
          icon: <Trash2 className="w-5 h-5" />,
          color: 'gray',
          estimatedTime: 'Unknown'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Object Removal Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {(['lama', 'flux_fill', 'sam2'] as const).map((method) => {
              const methodInfo = getMethodInfo(method);
              return (
                <div
                  key={method}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    removalMethod === method
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleRemovalMethodChange(method)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg bg-${methodInfo.color}-100 text-${methodInfo.color}-600`}>
                      {methodInfo.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{methodInfo.name}</h3>
                      <p className="text-sm text-gray-600">{methodInfo.description}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Estimated time: {methodInfo.estimatedTime}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {methodInfo.benefits.map((benefit, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Auto Detection (for SAM 2) */}
      {removalMethod === 'sam2' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="w-5 h-5" />
              Autonomous Detection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Enable Auto-Detection</Label>
                <p className="text-sm text-gray-600">
                  SAM 2 will automatically identify object boundaries
                </p>
              </div>
              <Switch
                checked={autoDetect}
                onCheckedChange={handleAutoDetectChange}
              />
            </div>
            {!autoDetect && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-800">
                  <Brush className="w-4 h-4" />
                  <span className="font-medium">Manual Mode</span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  Click and drag on the image to create a mask around the object you want to remove.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Replacement Prompt (for Flux.1 Fill) */}
      {removalMethod === 'flux_fill' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Replacement Prompt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Describe what should replace the object:</Label>
              <Textarea
                value={replacementPrompt}
                onChange={(e) => handleReplacementPromptChange(e.target.value)}
                placeholder="clean empty wall, minimalist room, seamless background"
                className="min-h-[80px]"
              />
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <h4 className="font-medium text-purple-800 mb-2">Prompt Examples:</h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-purple-600" />
                  <span>"clean empty wall, minimalist room"</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-purple-600" />
                  <span>"seamless floor continuation, natural lighting"</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-purple-600" />
                  <span>"empty space with plant, modern decor"</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Advanced Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Creativity: {creativity[0]}</Label>
            <Slider
              value={creativity}
              onValueChange={handleCreativityChange}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Conservative</span>
              <span>Creative</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Inference Steps: {steps[0]}</Label>
            <Slider
              value={steps}
              onValueChange={handleStepsChange}
              min={10}
              max={30}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Fast (10)</span>
              <span>Quality (30)</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Guidance Scale: {guidance[0].toFixed(1)}</Label>
            <Slider
              value={guidance}
              onValueChange={handleGuidanceChange}
              min={1.0}
              max={15.0}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Follow Prompt</span>
              <span>Creative Freedom</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Method Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Current Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Method:</span>
              <Badge variant="outline">{getMethodInfo(removalMethod).name}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Auto-Detect:</span>
              <Badge variant={autoDetect ? "default" : "secondary"}>
                {autoDetect ? 'Enabled' : 'Manual'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">8GB VRAM Optimized:</span>
              <Badge variant="outline">✅ Yes</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estimated Time:</span>
              <Badge variant="outline">{getMethodInfo(removalMethod).estimatedTime}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
