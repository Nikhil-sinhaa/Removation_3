// app/(app)/ai-design/page.tsx
"use client";

import { useState, useRef } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { BeforeAfterSlider } from "@/components/ui/before-after-slider";
import { StylePresets } from "@/components/ui/style-presets";
import { useAuth } from '@/hooks/useAuth';
import { usePageTour } from '@/hooks/usePageTour';
import { 
  Upload, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Image as ImageIcon,
  Wand2,
  Palette,
  Home,
  Sofa,
  ChefHat,
  Bed,
  Bath,
  TreePine,
  Building2,
  Download,
  Eye,
  Clock,
  Star,
  ArrowRight
} from "lucide-react";
import { useUserStore } from '@/stores/user-store';

const roomTypes = [
  { id: "living_room", name: "Living Room", icon: <Sofa className="w-4 h-4" /> },
  { id: "bedroom", name: "Bedroom", icon: <Bed className="w-4 h-4" /> },
  { id: "kitchen", name: "Kitchen", icon: <ChefHat className="w-4 h-4" /> },
  { id: "bathroom", name: "Bathroom", icon: <Bath className="w-4 h-4" /> },
  { id: "dining_room", name: "Dining Room", icon: <Home className="w-4 h-4" /> },
  { id: "office", name: "Home Office", icon: <Building2 className="w-4 h-4" /> },
  { id: "garden", name: "Garden/Outdoor", icon: <TreePine className="w-4 h-4" /> },
];

const modes = [
  { id: "redesign", name: "Redesign", description: "Complete room transformation" },
  { id: "beautify", name: "Beautify", description: "Enhance existing design" },
  { id: "creative", name: "Creative", description: "Artistic interpretation" },
  { id: "furnish", name: "Furnish", description: "Add furniture and decor" },
];

const defaultStylePresets = [
  { id: "modern", name: "Modern", description: "Clean lines, minimalist furniture, neutral colors" },
  { id: "industrial", name: "Industrial", description: "Exposed brick, metal elements, raw materials" },
  { id: "bohemian", name: "Bohemian", description: "Eclectic decor, plants, textiles, warm colors" },
  { id: "scandinavian", name: "Scandinavian", description: "Light wood, cozy, functional, hygge" },
  { id: "luxury", name: "Luxury", description: "High-end materials, elegant, sophisticated" },
  { id: "indian", name: "Indian", description: "Traditional elements, vibrant colors, intricate patterns" },
];

export default function AIDesignPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const setInsufficientCreditsModalOpen = useUserStore(s => s.setInsufficientCreditsModalOpen);

  usePageTour({
    tourKey: 'ai_design_tour',
    completed: !user || user.onboardingCompleted === false || (user.completedTours?.includes('ai_design_tour') ?? false),
    steps: [
      {
        element: '[data-tour="ad-uploader"]',
        popover: {
          title: 'Upload Room Photo',
          description: 'Upload a clear, well-lit photo of the room you want to transform.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '[data-tour="ad-room-type"]',
        popover: {
          title: 'Select Room Type',
          description: 'Choose the room category so the AI generator understands what type of space it is redesigning.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '[data-tour="ad-design-mode"]',
        popover: {
          title: 'Choose Design Mode',
          description: 'Select your preferred transformation depth, from subtle decoration changes to a complete layout overhaul.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '[data-tour="ad-style-presets"]',
        popover: {
          title: 'Pick a Design Style',
          description: 'Choose from modern, luxury, traditional Indian, and many other curated design themes.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '[data-tour="ad-advanced-settings"]',
        popover: {
          title: 'Advanced Settings',
          description: 'Toggle Architectural Mode to keep structural elements intact, or manually adjust AI creativity levels.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '[data-tour="ad-generate-btn"]',
        popover: {
          title: 'Generate Design',
          description: 'Ready to see the magic? Click here to kick off the high-performance AI room redesign.',
          side: 'top',
          align: 'center'
        }
      }
    ]
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(defaultStylePresets[0]);
  const [mode, setMode] = useState("redesign");
  const [roomType, setRoomType] = useState("living_room");
  const [selectedPalette, setSelectedPalette] = useState({ id: "neutral", name: "Neutral" });
  const [changeLevel, setChangeLevel] = useState("medium");
  const [settings, setSettings] = useState({
    creativity: 50,
    preserveLayout: true,
    enhanceQuality: true,
    colorScheme: "neutral",
    lighting: "natural",
    num_inference_steps: 25,
    guidance_scale: 7,
    strength: 0.6,
    architecturalMode: true,
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

    addLog("🎯 Starting AI generation process...");
    addLog("📸 Image uploaded successfully");
    addLog(`🎨 Style: ${selectedStyle.name}`);
    addLog(`🏠 Room type: ${roomType}`);
    addLog(`🎨 Color palette: ${selectedPalette.name}`);
    addLog(`⚡ Change intensity: ${changeLevel}`);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('style', selectedStyle.name);
      formData.append('roomType', roomType);
      formData.append('colorPalette', selectedPalette.name);
      formData.append('changeLevel', changeLevel);
      formData.append('useControlNet', String(settings.architecturalMode));

      addLog("🚀 Sending request to AI redesign service...");

      // Use the working API (no auth required)
      const response = await fetch('/api/ai/redesign', {
        method: 'POST',
        body: formData,
      });

      if (response.status === 402) {
        setIsGenerating(false);
        setInsufficientCreditsModalOpen(true);
        return;
      }

      const data = await response.json();

      if (response.ok && data.projectId) {
        addLog("✅ Generation started successfully!");
        addLog(`🎯 Project ID: ${data.projectId}`);
        addLog(`⏱️ Processing started...`);

        // Poll for completion
        await pollForResult(data.projectId);
      } else {
        addLog(`❌ Error: ${data.error}`);
        setError(data.error || 'Generation failed');
        setIsGenerating(false);
      }
    } catch (error) {
      console.error('Generation error:', error);
      addLog(`❌ Network error: ${(error as Error).message}`);
      setError('Network error occurred');
      setIsGenerating(false);
    }
  };

  const pollForResult = async (projectId: string) => {
    const maxAttempts = 180; // 6 minutes max
    let completed = false;
    
    for (let attempt = 0; attempt < maxAttempts && !completed; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const response = await fetch(`/api/ai/redesign?projectId=${projectId}`);
        const data = await response.json();
        
        addLog(`📊 Status check ${attempt + 1}: ${data.status}`);
        
        if (data.status === 'completed') {
          addLog("🎉 Generation completed!");
          addLog(`🖼️ Generated image: ${data.resultImage}`);
          setResult({
            ...data,
            outputImage: data.resultImage + '?t=' + Date.now() // Add cache-buster
          });
          completed = true;
          break;
        } else if (data.status === 'failed') {
          addLog(`❌ Generation failed: ${data.errorMessage}`);
          setError(data.errorMessage || 'Generation failed');
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
            {t('ad_title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('ad_subtitle')}
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant="secondary" className="text-green-600">
              <Zap className="w-3 h-3 mr-1" />
              {t('ad_zero_cost')}
            </Badge>
            <Badge variant="secondary">
              <Clock className="w-3 h-3 mr-1" />
              {t('ad_time')}
            </Badge>
            <Badge variant="secondary">
              <Star className="w-3 h-3 mr-1" />
              {t('ad_pro_quality')}
            </Badge>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Upload */}
          <motion.div
            data-tour="ad-uploader"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>{t('ad_upload_title')}</span>
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
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {selectedFile ? selectedFile.name : t('ad_choose_image')}
                </Button>
                {selectedFile && (
                  <div className="mt-2 text-sm text-green-600">
                    {t('ad_ready_processing')}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Room Type */}
          <motion.div
            data-tour="ad-room-type"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t('ad_room_type')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {roomTypes.map((room) => (
                    <Button
                      key={room.id}
                      variant={roomType === room.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRoomType(room.id)}
                      className="justify-start"
                    >
                      {room.icon}
                      <span className="ml-2">{room.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Design Mode */}
          <motion.div
            data-tour="ad-design-mode"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t('ad_mode_title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {modes.map((modeOption) => (
                    <Button
                      key={modeOption.id}
                      variant={mode === modeOption.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMode(modeOption.id)}
                      className="w-full justify-start"
                    >
                      <div className="text-left">
                        <div className="font-medium">{modeOption.name}</div>
                        <div className="text-xs text-gray-500">{modeOption.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Style Selection */}
          <motion.div
            data-tour="ad-style-presets"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <StylePresets
              selectedStyle={selectedStyle.id}
              onStyleSelect={(style) => setSelectedStyle(style)}
              showPremium={true}
              columns={2}
            />
          </motion.div>

          {/* Settings */}
          <motion.div
            data-tour="ad-advanced-settings"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t('ad_settings_title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.architecturalMode}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, architecturalMode: checked }))}
                  />
                  <Label className="flex flex-col">
                    <span>🏛️ Architectural Mode</span>
                    <span className="text-xs text-gray-500">
                      {settings.architecturalMode
                        ? "ControlNet active — preserves walls, windows & doors"
                        : "ControlNet off — faster processing, less structure control"}
                    </span>
                  </Label>
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
                  <Label>Preserve Room Layout</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.enhanceQuality}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enhanceQuality: checked }))}
                  />
                  <Label>Enhance Quality</Label>
                </div>

                <div>
                  <Label>Color Scheme</Label>
                  <Select value={settings.colorScheme} onValueChange={(value) => setSettings(prev => ({ ...prev, colorScheme: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="warm">Warm</SelectItem>
                      <SelectItem value="cool">Cool</SelectItem>
                      <SelectItem value="vibrant">Vibrant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Generate Button */}
          <motion.div
            data-tour="ad-generate-btn"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={handleGenerate}
              disabled={!selectedFile || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('ad_generating')}
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  {t('ad_generate_btn')}
                </>
              )}
            </Button>
          </motion.div>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2 space-y-6">
          {result?.outputImage ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>{t('ad_result_title')}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        {t('ad_download')}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        {t('ad_view_fullscreen')}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Style:</span>
                        <p className="font-medium">{selectedStyle.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Mode:</span>
                        <p className="font-medium">{mode}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Room:</span>
                        <p className="font-medium">{roomType.replace('_', ' ')}</p>
                      </div>
                    </div>
                    
                    <BeforeAfterSlider
                      beforeImage={URL.createObjectURL(selectedFile!)}
                      afterImage={result.outputImage}
                      beforeLabel="Original Room"
                      afterLabel={`${selectedStyle.name} Design`}
                      showControls={true}
                      showLabels={true}
                    />
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-semibold text-green-800 mb-2">🎉 AI Design Generated Successfully!</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm text-green-700">
                        <div>
                          <span className="font-medium">Processing Time:</span> {result.processingTime}ms
                        </div>
                        <div>
                          <span className="font-medium">Cost:</span> $0.00 (Free!)
                        </div>
                        <div>
                          <span className="font-medium">GPU Used:</span> RTX 4060
                        </div>
                        <div>
                          <span className="font-medium">Quality:</span> Professional
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                      <ImageIcon className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{t('ad_empty_title')}</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      {t('ad_empty_desc')}
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Zap className="w-4 h-4 mr-1" />
                        <span>{t('ad_rtx_powered')}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{t('ad_time')}</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        <span>{t('ad_pro_quality')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Progress */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="font-medium">{t('ad_ai_processing')}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 animate-pulse"
                          style={{ width: '60%' }}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium">GPU Status</div>
                          <div className="text-green-600">Active</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Model</div>
                          <div className="text-blue-600">SDXL</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Speed</div>
                          <div className="text-purple-600">~25s</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertCircle className="w-5 h-5" />
                      <span>{error}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Features Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t('ad_features_title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Palette className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">7 Design Styles</h4>
                      <p className="text-sm text-gray-600">Modern, Industrial, Bohemian, and more</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Home className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">All Room Types</h4>
                      <p className="text-sm text-gray-600">Living room, bedroom, kitchen, bathroom</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Zap className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Instant Results</h4>
                      <p className="text-sm text-gray-600">Professional designs in ~25 seconds</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Star className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Zero Cost</h4>
                      <p className="text-sm text-gray-600">Powered by your RTX 4060 GPU</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
