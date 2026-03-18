// app/(app)/professional-design/page.tsx
"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BeforeAfterSlider } from "@/components/ui/before-after-slider";
import { ProfessionalSelector } from "@/components/ui/professional-selector";
import { 
  Upload, 
  Wand2, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Image, 
  Shield,
  Zap,
  Lock,
  Eye,
  Cpu,
  Settings,
  HardDrive,
  Home
} from "lucide-react";

const roomTypes = [
  { id: "living_room", name: "Living Room", icon: <Home className="w-4 h-4" /> },
  { id: "bedroom", name: "Bedroom", icon: <Home className="w-4 h-4" /> },
  { id: "kitchen", name: "Kitchen", icon: <Home className="w-4 h-4" /> },
  { id: "bathroom", name: "Bathroom", icon: <Home className="w-4 h-4" /> },
  { id: "dining_room", name: "Dining Room", icon: <Home className="w-4 h-4" /> },
  { id: "office", name: "Office", icon: <Home className="w-4 h-4" /> },
];

export default function ProfessionalDesignPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [roomType, setRoomType] = useState("living_room");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [promptId, setPromptId] = useState<string | null>(null);
  const [professionalSettings, setProfessionalSettings] = useState<any>(null);
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

  const handleProfessionalSelectionChange = (selections: any) => {
    setProfessionalSettings(selections);
    addLog(`🔧 Professional settings updated`);
    addLog(`   🔒 Structural Lock: ${selections.structuralLock.enabled ? 'Enabled' : 'Disabled'} (Strength: ${selections.structuralLock.strength})`);
    addLog(`   👁️ Context Strength: ${selections.encoderV2.contextStrength} | Text Strength: ${selections.encoderV2.userTextStrength}`);
    addLog(`   💻 Hardware Mode: ${Object.keys(selections.hardwareOptimization).find(k => selections.hardwareOptimization[k] === true) || 'standard'}`);
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    if (!professionalSettings) {
      setError("Please configure your professional settings");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setLogs([]);

    addLog("🎯 Starting Professional Conditioning Injection...");
    addLog("📸 Image uploaded successfully");
    addLog(`🏠 Room type: ${roomType}`);
    addLog(`🔒 Structural Lock: ${professionalSettings.structuralLock.enabled ? 'YES' : 'NO'}`);
    addLog(`💻 Hardware Optimization: ${professionalSettings.hardwareOptimization.useTiledVAE ? 'Tiled VAE' : 'Standard'}`);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('data', JSON.stringify({
        mode: "redesign",
        style: "professional",
        roomType,
        prompt: "Professional architectural renovation",
        negative_prompt: "blurry, low quality, distorted, weight spikes, perspective changes",
        settings: {
          creativity: 50,
          num_inference_steps: professionalSettings.hardwareOptimization.steps,
          guidance_scale: 7.5,
          strength: 0.75,
        },
        structuralLock: professionalSettings.structuralLock,
        encoderV2: professionalSettings.encoderV2,
        masterPrompt: professionalSettings.masterPrompt,
        hardwareOptimization: professionalSettings.hardwareOptimization,
      }));

      addLog("🚀 Sending request to Professional API...");

      const response = await fetch('/api/ai/redesign', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addLog("✅ Professional generation started successfully!");
        addLog(`🎯 Prompt ID: ${data.promptId}`);
        addLog(`📝 Prompt Summary: ${data.promptSummary}`);
        addLog(`🔒 Structural Lock Strength: ${data.structuralLock.strength}`);
        addLog(`👁️ Context Strength: ${data.encoderV2.contextStrength}`);
        addLog(`💻 Hardware Mode: ${data.hardwareOptimization.useTiledVAE ? 'Tiled VAE' : 'Standard'}`);
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
          addLog("🎉 Professional generation completed!");
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
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            🛡️ Professional Design Studio
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Conditioning Injection with Structural Lock for MSI Katana 8GB VRAM
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Shield className="w-3 h-3 mr-1" />
              Structural Lock
            </Badge>
            <Badge variant="outline" className="border-blue-500 text-blue-600">
              <Eye className="w-3 h-3 mr-1" />
              Encoder V2
            </Badge>
            <Badge variant="outline" className="border-purple-500 text-purple-600">
              <Cpu className="w-3 h-3 mr-1" />
              8GB Optimized
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
                  ✓ Ready for Professional processing
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
            disabled={!selectedFile || !professionalSettings || isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Professional Processing...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Professional Design
              </>
            )}
          </Button>

          {/* Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Processing Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono h-48 overflow-y-auto">
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))
                ) : (
                  <div className="text-gray-500">Waiting for professional configuration...</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle & Right Columns - Professional Selector */}
        <div className="lg:col-span-2">
          <ProfessionalSelector
            onSelectionChange={handleProfessionalSelectionChange}
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
                  ✅ Professional Design Complete
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
                      <strong>Structural Lock:</strong> {professionalSettings?.structuralLock?.enabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  
                  <BeforeAfterSlider
                    beforeImage={selectedFile ? URL.createObjectURL(selectedFile) : "/images/hero-before.jpg"}
                    afterImage={result.generatedImage}
                    beforeLabel="Original Room"
                    afterLabel="Professional AI Design"
                  />
                  
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      🎊 Professional Success!
                    </h3>
                    <p className="text-sm text-green-700 mb-2">
                      Your room has been transformed using Conditioning Injection with perfect structure preservation.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Structure: Locked</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>Context: {professionalSettings?.encoderV2?.contextStrength}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        <span>Hardware: Optimized</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        <span>8GB VRAM: Efficient</span>
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
