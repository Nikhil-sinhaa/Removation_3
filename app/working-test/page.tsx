// app/working-test/page.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BeforeAfterSlider } from "@/components/ui/before-after-slider";
import { Upload, Zap, CheckCircle, AlertCircle, Loader2, Image } from "lucide-react";

export default function WorkingTestPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [promptId, setPromptId] = useState<string | null>(null);
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
        mode: "redesign",
        style: "modern",
        roomType: "living_room",
        prompt: "modern living room design",
        settings: {
          num_inference_steps: 5,
          guidance_scale: 7
        },
      }));

      addLog("Sending request to ComfyUI...");

      const response = await fetch('/api/working/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addLog("✅ Generation started successfully!");
        setPromptId(data.promptId);
        addLog(`🎯 Prompt ID: ${data.promptId}`);
        addLog(`⏱️ Estimated time: ${data.estimatedTime} seconds`);

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
        const response = await fetch(`/api/working/status/${promptId}`);
        const data = await response.json();
        
        addLog(`📊 Status check ${attempt + 1}: ${data.status}`);
        
        if (data.status === 'completed') {
          addLog("🎉 Generation completed!");
          addLog(`🖼️ Generated image: ${data.generatedImage || data.outputImage}`);
          setResult({
            ...data,
            outputImage: data.generatedImage || data.outputImage
          });
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
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🎯 Working ComfyUI Test</h1>
        <p className="text-gray-600">This version uses async processing and should work reliably</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Upload Room Photo</span>
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
                ✓ Ready for AI processing
              </div>
            )}
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
              Processing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Generate AI Design
            </>
          )}
        </Button>

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

        {/* Results */}
        {result?.generatedImage ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>✅ Result</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm">
                  <p><strong>Status:</strong> {result.status}</p>
                  <p><strong>Processing Time:</strong> {result.processingTime}ms</p>
                </div>
                
                <BeforeAfterSlider
                  beforeImage={selectedFile ? URL.createObjectURL(selectedFile) : "/images/hero-before.jpg"}
                  afterImage={result.generatedImage}
                  beforeLabel="Original"
                  afterLabel="AI Generated"
                />
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">🎉 Success!</h3>
                  <p className="text-sm text-green-700">
                    Your RTX 4060 has successfully generated an AI room design!
                  </p>
                </div>
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
  );
}
