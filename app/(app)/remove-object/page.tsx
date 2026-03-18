// app/(app)/remove-object/page.tsx
"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BeforeAfterSlider } from "@/components/ui/before-after-slider";
import { 
  Upload, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Image, 
  Zap,
  Wand2,
  Scan
} from "lucide-react";

export default function RemoveObjectPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [promptId, setPromptId] = useState<string | null>(null);
  const [removalMethod, setRemovalMethod] = useState<'lama' | 'flux_fill' | 'sam2'>('lama');
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

    addLog("🗑️ Starting Object Removal...");
    addLog("📸 Image uploaded successfully");
    addLog(`📦 Method: ${removalMethod}`);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('data', JSON.stringify({
        mode: "object_removal",
        style: "professional",
        roomType: "room",
        prompt: "Object removal",
        negative_prompt: "blurry, low quality, distorted, artifacts, seams",
        settings: {
          method: removalMethod === 'flux_fill' ? 'high_end' : removalMethod === 'sam2' ? 'autonomous' : 'professional',
          creativity: 50,
          num_inference_steps: removalMethod === 'flux_fill' ? 25 : 15,
          guidance_scale: 7.5,
        },
        removalMethod: removalMethod,
        maskData: {
          coordinates: { x: 100, y: 100, width: 200, height: 150 },
          autoDetect: removalMethod === 'sam2'
        },
        replacementPrompt: removalMethod === 'flux_fill' ? "clean empty wall, minimalist room, seamless background" : undefined,
      }));

      addLog("🚀 Sending request to Object Removal API...");

      const response = await fetch('/api/object-removal/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addLog("✅ Object removal started successfully!");
        addLog(`🎯 Prompt ID: ${data.promptId}`);
        setPromptId(data.promptId);

        // Poll for completion
        await pollForResult(data.promptId);
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

  const pollForResult = async (promptId: string) => {
    const maxAttempts = 20;
    let completed = false;
    
    for (let attempt = 0; attempt < maxAttempts && !completed; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const response = await fetch(`/api/ai/status/${promptId}`);
        const data = await response.json();
        
        addLog(`📊 Status check ${attempt + 1}: ${data.status}`);
        
        if (data.status === 'completed') {
          addLog("🎉 Object removal completed!");
          addLog(`🖼️ Generated image: ${data.generatedImage}`);
          setResult(data);
          completed = true;
          break;
        } else if (data.status === 'error') {
          addLog(`❌ Object removal failed: ${data.message}`);
          setError(data.message || 'Generation failed');
          completed = true;
          break;
        }
      } catch (err) {
        addLog(`⚠️ Status check error: ${err}`);
      }
    }

    if (!completed) {
      addLog("⏰ Polling timeout");
      setError("Generation taking too long");
    }
  };

  const getMethodInfo = (method: string) => {
    switch (method) {
      case 'lama':
        return {
          name: 'LaMa (Large Mask Inpainting)',
          icon: <Zap className="w-4 h-4" />,
          color: 'green',
          description: 'Fast and stable method',
          time: '10 seconds'
        };
      case 'flux_fill':
        return {
          name: 'Flux.1 Fill / SDXL Inpaint',
          icon: <Wand2 className="w-4 h-4" />,
          color: 'purple',
          description: 'High-end creative replacement',
          time: '25 seconds'
        };
      case 'sam2':
        return {
          name: 'Segment Anything 2 + LaMa',
          icon: <Scan className="w-4 h-4" />,
          color: 'blue',
          description: 'Autonomous detection',
          time: '15 seconds'
        };
      default:
        return {
          name: 'Unknown Method',
          icon: <Trash2 className="w-4 h-4" />,
          color: 'gray',
          description: 'Select a method',
          time: 'Unknown'
        };
    }
  };

  const methodInfo = getMethodInfo(removalMethod);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            🗑️ Object Removal Studio
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Professional Object Removal with LaMa, Flux.1 Fill, and SAM 2
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Zap className="w-3 h-3 mr-1" />
              LaMa
            </Badge>
            <Badge variant="outline" className="border-purple-500 text-purple-600">
              <Wand2 className="w-3 h-3 mr-1" />
              Flux.1 Fill
            </Badge>
            <Badge variant="outline" className="border-blue-500 text-blue-600">
              <Scan className="w-3 h-3 mr-1" />
              SAM 2
            </Badge>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Upload & Settings */}
        <div className="space-y-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Room Photo
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
                disabled={isGenerating}
              >
                <Image className="w-4 h-4 mr-2" />
                {selectedFile ? `📸 ${selectedFile.name}` : "Choose Room Image"}
              </Button>
              {selectedFile && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ Ready for object removal
                </div>
              )}
            </CardContent>
          </Card>

          {/* Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Removal Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {(['lama', 'flux_fill', 'sam2'] as const).map((method) => {
                  const info = getMethodInfo(method);
                  return (
                    <div
                      key={method}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        removalMethod === method
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setRemovalMethod(method)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg bg-${info.color}-100 text-${info.color}-600`}>
                          {info.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold">{info.name}</h3>
                          <p className="text-sm text-gray-600">{info.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Time: {info.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!selectedFile || isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Removing Object...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Object
              </>
            )}
          </Button>

          {/* Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Processing Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono h-48 overflow-y-auto">
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))
                ) : (
                  <div className="text-gray-500">Waiting for configuration...</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle & Right Columns - Results */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {methodInfo.icon}
                Active Method: {methodInfo.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <h4 className="font-medium mb-2">8GB VRAM Optimized</h4>
                  <div className="text-sm space-y-1">
                    <div>• Lightweight models</div>
                    <div>• Fast processing</div>
                    <div>• Memory efficient</div>
                    <div>• GPU stable</div>
                  </div>
                </div>
                
                {removalMethod === 'flux_fill' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <h4 className="font-medium text-purple-800 mb-2">Replacement Prompt</h4>
                    <p className="text-sm text-purple-700">
                      Current prompt: "clean empty wall, minimalist room, seamless background"
                    </p>
                  </div>
                )}

                {removalMethod === 'sam2' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="font-medium text-blue-800 mb-2">Autonomous Detection</h4>
                    <p className="text-sm text-blue-700">
                      SAM 2 will automatically identify object boundaries and create perfect masks.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {result?.generatedImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  ✅ Object Removal Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Status:</strong> {result.status}
                    </div>
                    <div>
                      <strong>Processing Time:</strong> {result.processingTime}ms
                    </div>
                    <div>
                      <strong>Method:</strong> {methodInfo.name}
                    </div>
                    <div>
                      <strong>Auto-Detect:</strong> {removalMethod === 'sam2' ? 'Enabled' : 'Manual'}
                    </div>
                  </div>
                  
                  <BeforeAfterSlider
                    beforeImage={selectedFile ? URL.createObjectURL(selectedFile) : "/images/hero-before.jpg"}
                    afterImage={result.generatedImage}
                    beforeLabel="Original (With Object)"
                    afterLabel="Object Removed"
                  />
                  
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <Trash2 className="w-5 h-5" />
                      🎊 Object Removal Success!
                    </h3>
                    <p className="text-sm text-green-700 mb-2">
                      Object has been removed using {methodInfo.name} with seamless background reconstruction.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>8GB Optimized</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Seamless Fill</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Scan className="w-3 h-3" />
                        <span>Smart Detection</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Wand2 className="w-3 h-3" />
                        <span>Professional</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
