// app/simple-test/page.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { BeforeAfterSlider } from "@/components/ui/before-after-slider";
import { Upload, Zap, CheckCircle, AlertCircle, Loader2, Image } from "lucide-react";

const styles = [
  { id: "modern", name: "Modern", description: "Clean lines, minimalist" },
  { id: "industrial", name: "Industrial", description: "Exposed elements" },
  { id: "bohemian", name: "Bohemian", description: "Eclectic decor" },
  { id: "scandinavian", name: "Scandinavian", description: "Light wood, cozy" },
];

export default function SimpleTestPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(styles[0]);
  const [mode, setMode] = useState("redesign");
  const [roomType, setRoomType] = useState("living_room");
  const [settings, setSettings] = useState({
    creativity: 50,
    preserveLayout: true,
    enhanceQuality: true,
    num_inference_steps: 20,
    guidance_scale: 7,
    strength: 0.6,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      addLog(`Selected file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setLogs([]);

    addLog("Starting generation process...");

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

      addLog("Sending request to ComfyUI...");

      const response = await fetch('/api/simple-test/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      addLog(`Response received: ${response.status}`);

      if (response.ok) {
        addLog("✅ Generation successful!");
        setResult(data);
      } else {
        addLog(`❌ Error: ${data.error}`);
        setError(data.error || 'Generation failed');
      }
    } catch (err: any) {
      addLog(`❌ Network error: ${err.message}`);
      setError('Network error. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Simple ComfyUI Test</h1>
        <p className="text-gray-600">No authentication required - direct testing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Upload Image</span>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Style</Label>
                <Select value={selectedStyle.id} onValueChange={(value) => setSelectedStyle(styles.find(s => s.id === value) || styles[0])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {styles.map(style => (
                      <SelectItem key={style.id} value={style.id}>{style.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
            </CardContent>
          </Card>

          <Button
            onClick={handleGenerate}
            disabled={!selectedFile || isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {result?.generatedImage ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Result</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm">
                    <p><strong>Processing Time:</strong> {result.processingTime}ms</p>
                    <p><strong>Status:</strong> {result.status}</p>
                    <p><strong>Prompt:</strong> {result.prompt}</p>
                  </div>
                  
                  <BeforeAfterSlider
                    beforeImage={URL.createObjectURL(selectedFile!)}
                    afterImage={result.generatedImage}
                    beforeLabel="Original"
                    afterLabel={`${selectedStyle.name} Design`}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Upload an image and click Generate to see the result</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono h-48 overflow-y-auto">
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))
                ) : (
                  <div className="text-gray-500">Waiting for action...</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error */}
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
        </div>
      </div>
    </div>
  );
}
