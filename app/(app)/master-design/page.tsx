// app/(app)/master-design/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BeforeAfterSlider } from "@/components/ui/before-after-slider";
import { MasterSelector } from "@/components/ui/master-selector";
import { 
  Upload, 
  Wand2, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Image, 
  Settings,
  Zap,
  Sparkles,
  Palette,
  Home
} from "lucide-react";
import { MakeItReal } from "@/components/ai/MakeItReal";

const roomTypes = [
  { id: "living_room", name: "Living Room", icon: <Home className="w-4 h-4" /> },
  { id: "bedroom", name: "Bedroom", icon: <Home className="w-4 h-4" /> },
  { id: "kitchen", name: "Kitchen", icon: <Home className="w-4 h-4" /> },
  { id: "bathroom", name: "Bathroom", icon: <Home className="w-4 h-4" /> },
  { id: "dining_room", name: "Dining Room", icon: <Home className="w-4 h-4" /> },
  { id: "office", name: "Office", icon: <Home className="w-4 h-4" /> },
  { id: "garden", name: "Garden/Outdoor", icon: <Home className="w-4 h-4" /> },
];

export default function MasterDesignPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [roomType, setRoomType] = useState("living_room");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [masterSelector, setMasterSelector] = useState<any>(null);
  const [masterToggles, setMasterToggles] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Revoke previous URL to avoid memory leaks
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
      addLog(`Selected file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    }
  };

  // Auto-scroll to result when it appears
  useEffect(() => {
    if (result?.generatedImage && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const handleMasterSelectionChange = (selections: any, toggles: any) => {
    setMasterSelector(selections);
    setMasterToggles(toggles);
    addLog(`🎨 Master Selector updated: ${Object.keys(toggles).filter(k => toggles[k]).length} categories enabled`);
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    if (!masterSelector || !masterToggles) {
      setError("Please configure your design selections");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setLogs([]);

    addLog("🎯 Starting Master Selector generation...");
    addLog("📸 Image uploaded successfully");
    addLog(`🏠 Room type: ${roomType}`);
    addLog(`🎨 Master Selector: ${JSON.stringify(masterSelector, null, 2)}`);
    addLog(`🔘 Master Toggles: ${JSON.stringify(masterToggles, null, 2)}`);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('data', JSON.stringify({
        mode: "redesign",
        style: "master",
        roomType,
        prompt: "Master design transformation",
        negative_prompt: "blurry, low quality, distorted, watermark",
        settings: {
          creativity: 50,
          num_inference_steps: 25,
          guidance_scale: 7,
          strength: 0.8,
        },
        masterSelector,
        masterToggles,
        useArchAi3d: masterToggles.walls || masterToggles.ceiling, // Use ArchAi3d for complex changes
        generationMode: 'selective',
      }));

      addLog("🚀 Sending request to Master API...");

      const response = await fetch('/api/ai/redesign', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addLog("✅ Generation started successfully!");
        addLog(`🎯 Project ID: ${data.projectId}`);
        addLog(`⏱️ Estimated time: ${data.estimatedTime} seconds`);

        // Poll for completion using projectId
        await pollForResult(data.projectId);
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

  const pollForResult = async (projectId: string) => {
    const maxAttempts = 90; // 3 minutes max (at 2s intervals)
    let completed = false;
    
    for (let attempt = 0; attempt < maxAttempts && !completed; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        // Poll the redesign GET endpoint which returns the MongoDB project
        const response = await fetch(`/api/ai/redesign?projectId=${projectId}`);
        const data = await response.json();
        
        addLog(`📊 Status check ${attempt + 1}: ${data.status}`);
        
        if (data.status === 'completed') {
          addLog("🎉 Generation completed!");
          addLog(`🖼️ Generated image: ${data.resultImage}`);
          setResult({
            ...data,
            generatedImage: data.resultImage + '?t=' + Date.now(),
            originalPreview: previewUrl,
          });
          completed = true;
          break;
        } else if (data.status === 'failed') {
          addLog(`❌ Generation failed: ${data.errorMessage || 'Unknown error'}`);
          setError(data.errorMessage || 'Generation failed');
          completed = true;
          break;
        }
        // status: 'queued' or 'processing' → keep polling
      } catch (err) {
        addLog(`⚠️ Status check error: ${err}`);
      }
    }

    if (!completed) {
      addLog("⏰ Polling timeout — check ComfyUI is running");
      setError("Generation is taking too long. Make sure ComfyUI is running at http://127.0.0.1:8188");
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🎨 Master Design Studio
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Professional Master Selector with ArchAi3d-Qwen Integration
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Settings className="w-3 h-3 mr-1" />
              Master Selector
            </Badge>
            <Badge variant="outline" className="border-purple-500 text-purple-600">
              <Zap className="w-3 h-3 mr-1" />
              ArchAi3d-Qwen Ready
            </Badge>
            <Badge variant="outline" className="border-green-500 text-green-600">
              <Sparkles className="w-3 h-3 mr-1" />
              103+ Material Presets
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
                  ✓ Ready for Master processing
                </div>
              )}
            </CardContent>
          </Card>

          {/* Room Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Room Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {roomTypes.map((room) => (
                  <Button
                    key={room.id}
                    variant={roomType === room.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRoomType(room.id)}
                    disabled={isGenerating}
                    className="justify-start"
                  >
                    {room.icon}
                    {room.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!selectedFile || !masterSelector || isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Master Design
              </>
            )}
          </Button>

          {/* Logs */}
          {isGenerating && (
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
                    <div className="text-gray-500">Waiting for action...</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Middle Column - Master Selector OR Result */}
        <div className="lg:col-span-2" ref={resultRef}>
          <AnimatePresence mode="wait">
            {result?.generatedImage ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="border-green-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        Design Generated!
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setResult(null); setLogs([]); }}
                      >
                        <Palette className="w-4 h-4 mr-1" />
                        Redesign
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <BeforeAfterSlider
                      beforeImage={result.originalPreview || "/images/hero-before.jpg"}
                      afterImage={result.generatedImage}
                      beforeLabel="Original Room"
                      afterLabel="AI Redesigned"
                    />
                  </CardContent>
                </Card>

                {/* Make It Real — connect render to a real designer */}
                <MakeItReal
                  roomType={roomType}
                  afterImage={result.generatedImage}
                />
              </motion.div>
            ) : (
              <motion.div
                key="selector"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <MasterSelector
                  onSelectionChange={handleMasterSelectionChange}
                  roomType={roomType}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>



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
