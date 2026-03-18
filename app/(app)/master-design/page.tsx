// app/(app)/master-design/page.tsx
"use client";

import { useState, useRef } from "react";
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
  const [roomType, setRoomType] = useState("living_room");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [promptId, setPromptId] = useState<string | null>(null);
  const [masterSelector, setMasterSelector] = useState<any>(null);
  const [masterToggles, setMasterToggles] = useState<any>(null);
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
        addLog(`🎯 Prompt ID: ${data.promptId}`);
        addLog(`📝 Generated Prompt: ${data.generatedPrompt}`);
        addLog(`🚀 Using ArchAi3d: ${data.useArchAi3d ? 'Yes' : 'No'}`);
        addLog(`📊 Mode: ${data.mode}`);
        addLog(`⏱️ Estimated time: ${data.estimatedTime} seconds`);

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
    const maxAttempts = 30;
    let completed = false;
    
    for (let attempt = 0; attempt < maxAttempts && !completed; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const response = await fetch(`/api/ai/status/${promptId}`);
        const data = await response.json();
        
        addLog(`📊 Status check ${attempt + 1}: ${data.status}`);
        
        if (data.status === 'completed') {
          addLog("🎉 Generation completed!");
          addLog(`🖼️ Generated image: ${data.generatedImage}`);
          setResult(data);
          completed = true;
          break;
        } else if (data.status === 'error') {
          addLog(`❌ Generation failed: ${data.message}`);
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
        </div>

        {/* Middle Column - Master Selector */}
        <div className="lg:col-span-2">
          <MasterSelector
            onSelectionChange={handleMasterSelectionChange}
            roomType={roomType}
          />
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
                  ✅ Master Design Complete
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
                      <strong>Room Type:</strong> {roomType}
                    </div>
                    <div>
                      <strong>Categories Changed:</strong> {Object.keys(masterToggles || {}).filter(k => masterToggles[k]).length}
                    </div>
                  </div>
                  
                  <BeforeAfterSlider
                    beforeImage={selectedFile ? URL.createObjectURL(selectedFile) : "/images/hero-before.jpg"}
                    afterImage={result.generatedImage}
                    beforeLabel="Original Room"
                    afterLabel="Master AI Design"
                  />
                  
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      🎊 Master Design Success!
                    </h3>
                    <p className="text-sm text-blue-700 mb-2">
                      Your room has been transformed using professional Master Selector with precise material control.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(masterToggles || {}).map(([key, enabled]) => 
                        enabled ? (
                          <Badge key={key} variant="secondary" className="bg-white">
                            {key.charAt(0).toUpperCase() + key.slice(1)}: {masterSelector?.[key]}
                          </Badge>
                        ) : null
                      )}
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
