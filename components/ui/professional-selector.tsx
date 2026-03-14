// components/ui/professional-selector.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Settings, 
  Shield, 
  Zap, 
  Monitor, 
  Lock,
  Eye,
  Cpu,
  HardDrive,
  AlertTriangle
} from "lucide-react";
import { PROFESSIONAL_PRESETS } from "@/lib/ai/comfyui-workflows-professional";

interface ProfessionalSelectorProps {
  onSelectionChange: (selections: any) => void;
  roomType: string;
}

export function ProfessionalSelector({ onSelectionChange, roomType }: ProfessionalSelectorProps) {
  const [structuralLock, setStructuralLock] = useState(true);
  const [structuralStrength, setStructuralStrength] = useState([1.8]);
  const [cannyThreshold, setCannyThreshold] = useState([100, 200]);
  const [contextStrength, setContextStrength] = useState([0.95]);
  const [userTextStrength, setUserTextStrength] = useState([0.6]);
  const [twoStageInterpolation, setTwoStageInterpolation] = useState(true);
  const [hardwareMode, setHardwareMode] = useState<'conservative' | 'standard' | 'quality'>('standard');
  const [materials, setMaterials] = useState({
    walls: 'keep_original',
    ceilings: 'keep_original',
    furniture: 'keep_original',
    floors: 'keep_original',
    lighting: 'keep_original',
  });

  const updateSelections = () => {
    const selections = {
      structuralLock: {
        enabled: structuralLock,
        strength: structuralStrength[0],
        preprocessor: 'canny' as const,
        cannyThreshold: [cannyThreshold[0], cannyThreshold[1]],
      },
      encoderV2: {
        contextStrength: contextStrength[0],
        userTextStrength: userTextStrength[0],
        twoStageInterpolation,
      },
      masterPrompt: {
        mode: 'remove_paint_selective' as const,
        materials,
        style: 'architectural_visualization',
        promptFormula: `(Architectural visualization:1.2), maintain original room geometry, professional design, realistic lighting, 8k photo`,
      },
      hardwareOptimization: PROFESSIONAL_PRESETS.hardwareOptimization[hardwareMode],
    };

    onSelectionChange(selections);
  };

  // Update selections when any setting changes
  useState(() => {
    updateSelections();
  });

  const handleMaterialChange = (category: string, value: string) => {
    setMaterials(prev => ({ ...prev, [category]: value }));
    setTimeout(updateSelections, 0);
  };

  const handleStructuralStrengthChange = (value: number[]) => {
    setStructuralStrength(value);
    setTimeout(updateSelections, 0);
  };

  const handleCannyThresholdChange = (value: number[]) => {
    setCannyThreshold(value);
    setTimeout(updateSelections, 0);
  };

  const handleContextStrengthChange = (value: number[]) => {
    setContextStrength(value);
    setTimeout(updateSelections, 0);
  };

  const handleUserTextStrengthChange = (value: number[]) => {
    setUserTextStrength(value);
    setTimeout(updateSelections, 0);
  };

  const handleTwoStageInterpolationChange = (enabled: boolean) => {
    setTwoStageInterpolation(enabled);
    setTimeout(updateSelections, 0);
  };

  const handleHardwareModeChange = (mode: 'conservative' | 'standard' | 'quality') => {
    setHardwareMode(mode);
    setTimeout(updateSelections, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Professional Conditioning Injection
          </CardTitle>
          <p className="text-sm text-gray-600">
            Perfect implementation for MSI Katana 8GB VRAM - Preserves room structure while transforming materials
          </p>
        </CardHeader>
      </Card>

      {/* Structural Lock Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Structural Lock (InstantX Union)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable Structural Lock</Label>
              <p className="text-sm text-gray-600">Locks room geometry to prevent deformation</p>
            </div>
            <Switch
              checked={structuralLock}
              onCheckedChange={(enabled) => {
                setStructuralLock(enabled);
                setTimeout(updateSelections, 0);
              }}
            />
          </div>

          {structuralLock && (
            <>
              <div className="space-y-2">
                <Label>ControlNet Strength: {structuralStrength[0].toFixed(1)}</Label>
                <Slider
                  value={structuralStrength}
                  onValueChange={handleStructuralStrengthChange}
                  min={1.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1.5 (Conservative)</span>
                  <span>2.0 (Aggressive)</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Canny Edge Threshold: [{cannyThreshold[0]}, {cannyThreshold[1]}]</Label>
                <Slider
                  value={cannyThreshold}
                  onValueChange={handleCannyThresholdChange}
                  min={50}
                  max={250}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Low: {cannyThreshold[0]}</span>
                  <span>High: {cannyThreshold[1]}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Encoder V2 Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            ArchAi3D Encoder V2
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Context Strength: {contextStrength[0].toFixed(2)}</Label>
            <Slider
              value={contextStrength}
              onValueChange={handleContextStrengthChange}
              min={0.7}
              max={0.95}
              step={0.05}
              className="w-full"
            />
            <p className="text-xs text-gray-600">How much to trust the original photo (0.95 = 95% from image)</p>
          </div>

          <div className="space-y-2">
            <Label>User Text Strength: {userTextStrength[0].toFixed(2)}</Label>
            <Slider
              value={userTextStrength}
              onValueChange={handleUserTextStrengthChange}
              min={0.4}
              max={0.8}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-gray-600">How much to follow your material selections (0.6 = balanced)</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Two-Stage Interpolation</Label>
              <p className="text-sm text-gray-600">Analyze structure before painting</p>
            </div>
            <Switch
              checked={twoStageInterpolation}
              onCheckedChange={handleTwoStageInterpolationChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Materials Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Material Selection (Vastu-Safe)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(materials).map(([category, value]) => (
            <div key={category} className="space-y-2">
              <Label className="capitalize">{category}</Label>
              <div className="grid grid-cols-2 gap-2">
                {PROFESSIONAL_PRESETS.materials[category as keyof typeof PROFESSIONAL_PRESETS.materials].map((material) => (
                  <Button
                    key={material}
                    variant={value === material ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleMaterialChange(category, material)}
                    className="justify-start text-xs"
                  >
                    {material === 'keep_original' ? '📷 Keep Original' : material}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Hardware Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            Hardware Optimization (MSI Katana 8GB)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {(['conservative', 'standard', 'quality'] as const).map((mode) => (
              <Button
                key={mode}
                variant={hardwareMode === mode ? "default" : "outline"}
                size="sm"
                onClick={() => handleHardwareModeChange(mode)}
                className="capitalize"
              >
                {mode}
              </Button>
            ))}
          </div>

          <div className="bg-gray-100 p-3 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Current Settings:
            </h4>
            <div className="text-sm space-y-1">
              <div>• Tiled VAE: {PROFESSIONAL_PRESETS.hardwareOptimization[hardwareMode].useTiledVAE ? '✅' : '❌'}</div>
              <div>• FP8 Base: {PROFESSIONAL_PRESETS.hardwareOptimization[hardwareMode].useFP8 ? '✅' : '❌'}</div>
              <div>• High VRAM: {PROFESSIONAL_PRESETS.hardwareOptimization[hardwareMode].useHighVRAM ? '✅' : '❌'}</div>
              <div>• Sampler: {PROFESSIONAL_PRESETS.hardwareOptimization[hardwareMode].sampler}</div>
              <div>• Steps: {PROFESSIONAL_PRESETS.hardwareOptimization[hardwareMode].steps}</div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">8GB VRAM Optimization</span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              Start ComfyUI with: <code className="bg-amber-100 px-1 rounded">--fp8_base --highvram --preview-method taesd</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Professional Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={structuralLock ? "default" : "secondary"}>
                {structuralLock ? '🔒 Locked' : '🔓 Unlocked'}
              </Badge>
              <span className="text-sm">Structural Integrity</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {contextStrength[0] >= 0.9 ? '📷 Reality-Focused' : '🎨 Creative'}
              </Badge>
              <span className="text-sm">Context Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {Object.values(materials).filter(m => m !== 'keep_original').length} changes
              </Badge>
              <span className="text-sm">Material Modifications</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {hardwareMode === 'conservative' ? '🐌 Safe' : hardwareMode === 'standard' ? '⚡ Balanced' : '🚀 Max'}
              </Badge>
              <span className="text-sm">Performance Mode</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
