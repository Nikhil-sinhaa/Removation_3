// app/demo/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { StylePresets } from "@/components/ui/style-presets";
import { BeforeAfterSlider } from "@/components/ui/before-after-slider";
import { Upload, Zap, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const defaultStylePresets = [
  { id: "modern", name: "Modern", description: "Clean lines, minimalist" },
  { id: "industrial", name: "Industrial", description: "Exposed elements" },
  { id: "bohemian", name: "Bohemian", description: "Eclectic decor" },
  { id: "scandinavian", name: "Scandinavian", description: "Light wood, cozy" },
];

export default function DemoPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(defaultStylePresets[0]);
  const [mode, setMode] = useState("redesign");
  const [roomType, setRoomType] = useState("living_room");
  const [settings, setSettings] = useState({
    creativity: 50,
    preserveLayout: true,
    enhanceQuality: true,
    num_inference_steps: 25,
    guidance_scale: 7,
    strength: 0.6,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [comfyUIStatus, setComfyUIStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check ComfyUI status on mount
  useEffect(() => {
    checkComfyUIStatus();
    const interval = setInterval(checkComfyUIStatus, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  const checkComfyUIStatus = async () => {
    try {
      const response = await fetch('/api/health/comfyui');
      const data = await response.json();
      setComfyUIStatus(data.status === 'ok' ? 'online' : 'offline');
    } catch {
      setComfyUIStatus('offline');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      setGenerationId(null);
    }
  };

  // Poll for generation status
  const pollStatus = async (id: string) => {
    const maxAttempts = 180; // 6 minutes max (matches backend)
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/demo/generate?id=${id}`);
        const data = await response.json();

        if (data.status === 'completed') {
          setResult({
            status: 'completed',
            outputImage: data.outputImage,
            processingTime: data.processingTime,
          });
          setIsGenerating(false);
          return;
        } else if (data.status === 'failed') {
          setError(data.error || 'Generation failed');
          setIsGenerating(false);
          return;
        }

        // Still processing, continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000); // Poll every 2 seconds
        } else {
          setError('Generation timed out. Please try again.');
          setIsGenerating(false);
        }
      } catch (err) {
        setError('Error checking status. Please refresh the page.');
        setIsGenerating(false);
      }
    };

    checkStatus();
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('data', JSON.stringify({
        mode,
        style: selectedStyle.id,
        roomType,
        prompt: `${selectedStyle.name} ${roomType.replace('_', ' ')} redesign`,
        settings,
      }));

      const response = await fetch('/api/demo/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.generationId) {
        setGenerationId(data.generationId);
        // Start polling for status
        pollStatus(data.generationId);
      } else {
        setError(data.error || data.message || 'Generation failed');
        setIsGenerating(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ComfyUI Integration Demo</h1>
        <p className="text-gray-600">Test the complete upload → GPU → download pipeline</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Controls */}
        <div className="space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Upload Room Image</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                {selectedFile ? selectedFile.name : "Choose Image"}
              </Button>
              {selectedFile && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ Image selected: {selectedFile.name}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Style Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Design Style</CardTitle>
            </CardHeader>
            <CardContent>
              <StylePresets
                selectedStyle={selectedStyle.id}
                onStyleSelect={(style) => setSelectedStyle(style)}
                columns={2}
              />
            </CardContent>
          </Card>

          {/* Generation Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Generation Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Mode</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="redesign">Redesign</SelectItem>
                    <SelectItem value="beautify">Beautify</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="furnish">Furnish</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Room Type</Label>
                <Select value={roomType} onValueChange={setRoomType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="living_room">Living Room</SelectItem>
                    <SelectItem value="bedroom">Bedroom</SelectItem>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                    <SelectItem value="bathroom">Bathroom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Creativity: {settings.creativity}%</Label>
                <Slider
                  value={[settings.creativity]}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, creativity: value[0] }))}
                  max={100}
                  step={5}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.preserveLayout}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, preserveLayout: checked }))}
                />
                <Label>Preserve Layout</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.enhanceQuality}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enhanceQuality: checked }))}
                />
                <Label>Enhance Quality</Label>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!selectedFile || isGenerating || comfyUIStatus !== 'online'}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating... (RTX 4060 Working)
              </>
            ) : comfyUIStatus !== 'online' ? (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Start ComfyUI First
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate Design
              </>
            )}
          </Button>

          {/* Status Messages */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {result?.status === 'completed' && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>Generation completed in {result.processingTime}ms</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {result?.outputImage ? (
            <Card>
              <CardHeader>
                <CardTitle>Before & After Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <BeforeAfterSlider
                  beforeImage={URL.createObjectURL(selectedFile!)}
                  afterImage={result.outputImage}
                  beforeLabel="Original Room"
                  afterLabel={`${selectedStyle.name} Design`}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Upload an image and generate to see the before/after comparison</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>ComfyUI Server:</span>
                  <span className={comfyUIStatus === 'online' ? 'text-green-600' : comfyUIStatus === 'checking' ? 'text-yellow-600' : 'text-red-600'}>
                    {comfyUIStatus === 'online' ? '✅ Running' : comfyUIStatus === 'checking' ? '⏳ Checking...' : '❌ Offline'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>GPU:</span>
                  <span className="text-green-600">✅ RTX 4060</span>
                </div>
                <div className="flex justify-between">
                  <span>API Bridge:</span>
                  <span className={comfyUIStatus === 'online' ? 'text-green-600' : 'text-yellow-600'}>
                    {comfyUIStatus === 'online' ? '✅ Ready' : '⏳ Waiting'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cost:</span>
                  <span className="text-green-600">$0 (Local GPU)</span>
                </div>
              </div>
              {comfyUIStatus === 'offline' && (
                <div className="mt-4 p-3 bg-red-50 rounded text-xs text-red-700">
                  <strong>ComfyUI not running!</strong><br/>
                  Start it: <code className="bg-red-100 px-1 rounded">cd ~/ComfyUI && python main.py --listen 127.0.0.1 --port 8188</code>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
