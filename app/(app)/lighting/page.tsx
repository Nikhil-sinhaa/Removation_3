// app/(app)/lighting/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BeforeAfterSlider } from "@/components/ui/before-after-slider";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/components/ui/use-toast";
import {
  Upload,
  Wand2,
  Loader2,
  Image as ImageIcon,
  Sun,
  Moon,
  Sparkles,
  Download,
  RefreshCw,
  Sliders,
  Maximize2,
  BookmarkCheck,
  Compass,
  Lightbulb,
  Layers,
  Sparkle
} from "lucide-react";
import { useUserStore } from '@/stores/user-store';

interface ResultImage {
  label: string;
  url: string;
}

interface ProgressState {
  currentStep: number;
  totalSteps: number;
  percent: number;
  label: string;
}

interface SingleResultState {
  beforeUrl: string;
  results: ResultImage[];
}

export const LIGHTING_PRESETS: Record<string, {
  label: string;
  icon: string;
  description: string;
  shape: string;
  lightWidth: number;
  lightHeight: number;
  spread: number;
  softness: number;
  invertLight: boolean;
  intensity: number;
  icMultiplier: number;
  denoise: number;
  cfg: number;
  steps: number;
  frames: number;
  prompt: string;
}> = {
  night_lamp: {
    label: 'Night Lamp',
    icon: '🌙',
    description: 'Warm dim lamp in a dark room',
    shape: 'circle',
    lightWidth: 120,
    lightHeight: 80,
    spread: 0.45,
    softness: 6.0,
    invertLight: false,
    intensity: 0.60,
    icMultiplier: 0.22,
    denoise: 1.00,
    cfg: 2.0,
    steps: 25,
    frames: 1,
    prompt: 'An eye-level medium shot of the cozy interior space, taken from a vantage point two and a half meters away. The warm glow of the lamp is centered in the frame, beautifully illuminating the surroundings while seamlessly blending with the existing room structure, wall colors, and layout details. Shallow depth of field keeps the immediate area sharp while the background softly blurs into smooth creamy bokeh. Dark and moody low-key style with warm 2700k incandescent lamp light, soft light bloom, and realistic shadows.',
  },
  dim_evening: {
    label: 'Dim Evening',
    icon: '🕯️',
    description: 'Soft low evening light',
    shape: 'rectangle',
    lightWidth: 80,
    lightHeight: 65,
    spread: 0.90,
    softness: 15.0,
    invertLight: false,
    intensity: 1.00,
    icMultiplier: 0.28,
    denoise: 1.00,
    cfg: 3.0,
    steps: 25,
    frames: 1,
    prompt: 'An eye-level full shot of the elegant interior space, taken from a vantage point four and a half meters away. The soft evening shadows and ambient lighting are balanced across the room, beautifully showcasing the original room structure, wall colors, and furniture layout. Medium depth of field keeps the main living area sharp while the far background gently softens. Cozy and moody low-key style with dim evening twilight illumination, gentle diffuse candlelight atmosphere, and realistic shadow falloff.',
  },
  window_day: {
    label: 'Window Daylight',
    icon: '🪟',
    description: 'Natural light through a window',
    shape: 'rectangle',
    lightWidth: 180,
    lightHeight: 330,
    spread: 0.55,
    softness: 30.0,
    invertLight: false,
    intensity: 0.80,
    icMultiplier: 0.30,
    denoise: 0.95,
    cfg: 7.5,
    steps: 25,
    frames: 1,
    prompt: 'An eye-level full shot of the bright interior space, taken from a vantage point four and a half meters away. The direct sunbeam from the side window is centered, casting beautiful sun rays across the room while strictly preserving the existing room structure, original wall colors, and architectural layout. Deep depth of field keeps everything from the foreground furniture to the background wall art in sharp focus. Clean architectural style with natural bright window daylight streaming in, crisp shadows, and an airy Architectural Digest aesthetic.',
  },
  bright_day: {
    label: 'Bright Daylight',
    icon: '☀️',
    description: 'Flood the room with bright light',
    shape: 'rectangle',
    lightWidth: 200,
    lightHeight: 400,
    spread: 0.8,
    softness: 40.0,
    invertLight: true,
    intensity: 0.90,
    icMultiplier: 0.35,
    denoise: 0.97,
    cfg: 9.0,
    steps: 25,
    frames: 1,
    prompt: 'An eye-level wide shot of the interior space, taken from a vantage point six and a half meters away. The entire room is visible, showcasing and fully preserving the original architectural structure, authentic wall colors, exact furniture textures, and room layout. Deep depth of field keeps the entire environment from foreground to background in razor-sharp focus. Highly realistic architectural style with natural vibrant daylight flooding the entire space, casting soft realistic shadows while perfectly retaining the original color palette and warm authentic tones of the room.',
  },
  dramatic_spot: {
    label: 'Dramatic Spotlight',
    icon: '🎭',
    description: 'High contrast theatrical beam',
    shape: 'circle',
    lightWidth: 90,
    lightHeight: 90,
    spread: 0.40,
    softness: 7.0,
    invertLight: false,
    intensity: 0.85,
    icMultiplier: 0.38,
    denoise: 1.00,
    cfg: 3.5,
    steps: 25,
    frames: 1,
    prompt: 'An eye-level medium shot of the dramatic interior space, taken from a vantage point two and a half meters away. A single highly focused theatrical spotlight beam streams down from above, casting a brilliant circular pool of intense bright light directly onto the floor and furniture below it. The surrounding room is enveloped in deep, high-contrast chiaroscuro darkness. Shallow depth of field keeps the brightly illuminated pool of light in sharp focus, showcasing realistic material textures, while the edges of the light fade out into soft shadow. Dramatic cinematic style with high contrast theatrical lighting, strong shadow falloff, and realistic light ray projection.',
  },
  golden_hour: {
    label: 'Golden Hour',
    icon: '🌅',
    description: 'Warm amber side light',
    shape: 'rectangle',
    lightWidth: 80,
    lightHeight: 300,
    spread: 0.60,
    softness: 35.0,
    invertLight: false,
    intensity: 0.85,
    icMultiplier: 0.32,
    denoise: 0.82,
    cfg: 5.0,
    steps: 25,
    frames: 1,
    prompt: 'An eye-level full shot of the warm interior space, taken from a vantage point four and a half meters away. Beautiful long sun shadows and golden light stretch across the room from the side, perfectly tracing and respecting the original room structure, wall colors, and layout. Deep depth of field keeps the entire living area and structural details in sharp focus. Cinematic style with warm 3000k golden hour sunset glow, warm amber side lighting, and atmospheric ray tracing.',
  },
  multi_view: {
    label: 'Multi-View',
    icon: '🔢',
    description: 'See 3 lighting variations at once',
    shape: 'circle',
    lightWidth: 80,
    lightHeight: 80,
    spread: 0.3,
    softness: 15.0,
    invertLight: false,
    intensity: 0.75,
    icMultiplier: 0.28,
    denoise: 0.87,
    cfg: 2.5,
    steps: 20,
    frames: 3,
    prompt: 'An eye-level full shot of the premium interior space, taken from a vantage point four and a half meters away. The layout is centered in the frame, showcasing and fully preserving the original room structure, wall colors, realistic material textures, and details. Deep depth of field keeps all elements from the foreground to the background in sharp focus. Clean architectural style with balanced, studio-grade clean lighting and professional high-end photography.',
  },
};

export default function LightingPage() {
  const { toast } = useToast();
  const setInsufficientCreditsModalOpen = useUserStore(s => s.setInsufficientCreditsModalOpen);

  // ── Core Input State ────────────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]     = useState<string | null>(null);
  
  // Active Preset Selection
  const [activePreset, setActivePreset] = useState<string>("window_day");
  const [isDirty, setIsDirty]           = useState<boolean>(false);
  
  // Custom Sliders & Form States
  const [shape, setShape]               = useState<string>("rectangle");
  const [lightWidth, setLightWidth]     = useState<number>(100);
  const [lightHeight, setLightHeight]   = useState<number>(280);
  const [spread, setSpread]             = useState<number>(0.4);
  const [softness, setSoftness]         = useState<number>(25.0);
  const [invertLight, setInvertLight]   = useState<boolean>(false);
  const [intensity, setIntensity]       = useState<number>(0.80);
  const [icMultiplier, setIcMultiplier] = useState<number>(0.30);
  const [denoise, setDenoise]           = useState<number>(0.90);
  const [cfg, setCfg]                   = useState<number>(3.5);
  const [frames, setFrames]             = useState<number>(1);
  const [manualPrompt, setManualPrompt] = useState<string>("");

  // Interactive Coordinates (Canvas scale)
  const [lightX, setLightX]             = useState<number>(400);
  const [lightY, setLightY]             = useState<number>(250);
  const [canvasWidth, setCanvasWidth]   = useState<number>(800);
  const [canvasHeight, setCanvasHeight] = useState<number>(500);

  // Processing state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress]         = useState<ProgressState | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [projectId, setProjectId]       = useState<string | null>(null);

  // Output states
  const [singleResult, setSingleResult] = useState<SingleResultState | null>(null);
  const [activeResultUrl, setActiveResultUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef    = useRef<Socket | null>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Apply Preset Values ────────────────────────────────────────────────────
  const applyPreset = useCallback((key: string) => {
    const p = LIGHTING_PRESETS[key];
    if (!p) return;
    setActivePreset(key);
    setIsDirty(false);
    setShape(p.shape);
    setLightWidth(p.lightWidth);
    setLightHeight(p.lightHeight);
    setSpread(p.spread);
    setSoftness(p.softness);
    setInvertLight(p.invertLight);
    setIntensity(p.intensity);
    setIcMultiplier(p.icMultiplier);
    setDenoise(p.denoise);
    setCfg(p.cfg);
    setFrames(p.frames);
    setManualPrompt(p.prompt);
  }, []);

  // Initialize with window daylight
  useEffect(() => {
    applyPreset("window_day");
  }, [applyPreset]);

  // Handle custom manual tweaking
  const handleTweak = () => {
    setIsDirty(true);
  };

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ── Sockets Connection ─────────────────────────────────────────────────────
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_COMFY_WS || "http://localhost:3001";
    const socket = io(wsUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on("comfy:lighting:progress", (data: any) => {
      setProgress({
        currentStep: data.currentStep,
        totalSteps: data.totalSteps,
        percent: Math.round((data.currentStep / data.totalSteps) * 100),
        label: `Relighting Room: Step ${data.currentStep}/${data.totalSteps}...`
      });
    });

    socket.on("comfy:lighting:done", (data: any) => {
      stopPolling();
      setIsGenerating(false);
      setProgress(null);
      
      toast({
        title: "Relighting Completed!",
        description: "Your realistic light transformation is ready.",
      });

      if (data.urls && data.urls.length > 0) {
        setSingleResult({
          beforeUrl: previewUrl || "",
          results: data.urls.map((url: string, i: number) => ({ label: `View ${i + 1}`, url }))
        });
        setActiveResultUrl(data.urls[0]);
      }
    });

    socket.on("comfy:lighting:error", (data: any) => {
      stopPolling();
      setError(data.error || "Generation failed");
      setIsGenerating(false);
      setProgress(null);
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      stopPolling();
    };
  }, [previewUrl, stopPolling, toast]);

  // ── File Helpers ───────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setSingleResult(null);
    setActiveResultUrl(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setSingleResult(null);
    setActiveResultUrl(null);
    setError(null);
  };

  // ── Interactive Coordinates Click ──────────────────────────────────────────
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isGenerating) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLightX(x);
    setLightY(y);
    setCanvasWidth(rect.width);
    setCanvasHeight(rect.height);
  };

  const handleCanvasTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isGenerating) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    setLightX(x);
    setLightY(y);
    setCanvasWidth(rect.width);
    setCanvasHeight(rect.height);
  };

  // ── Generate Dispatcher ────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedFile) {
      setError("Please upload a room photo first.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSingleResult(null);
    setActiveResultUrl(null);

    setProgress({
      currentStep: 0,
      totalSteps: 25,
      percent: 5,
      label: "Submitting prompt to studio server..."
    });

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const requestData = {
        preset: activePreset === "custom" ? null : activePreset,
        manualPrompt: manualPrompt.trim() || undefined,
        shape,
        lightX,
        lightY,
        canvasWidth,
        canvasHeight,
        lightWidth,
        lightHeight,
        spread,
        softness,
        invertLight,
        intensity,
        icMultiplier,
        denoise,
        cfg,
        frames
      };

      formData.append("data", JSON.stringify(requestData));

      const res = await fetch("/api/ai/lighting", {
        method: "POST",
        body: formData,
      });

      if (res.status === 402) {
        setIsGenerating(false);
        setInsufficientCreditsModalOpen(true);
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to start lighting studio");
      }

      setProjectId(data.projectId);

      // Start Polling Fallback
      stopPolling();
      const pid = data.projectId;
      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/ai/lighting?projectId=${pid}`);
          if (!pollRes.ok) return;
          const proj = await pollRes.json();

          if (proj.status === "completed") {
            stopPolling();
            setIsGenerating(false);
            setProgress(null);
            
            if (proj.results && proj.results.length > 0) {
              setSingleResult({
                beforeUrl: previewUrl || "",
                results: proj.results
              });
              setActiveResultUrl(proj.results[0]?.url || null);
            }
          } else if (proj.status === "failed") {
            stopPolling();
            setError(proj.errorMessage || "GPU generation failed");
            setIsGenerating(false);
            setProgress(null);
          }
        } catch { /* ignore fallback errors */ }
      }, 4000);

    } catch (err: any) {
      setError(err.message || "Network request failed");
      setIsGenerating(false);
      setProgress(null);
    }
  };

  return (
    <div className="container mx-auto p-4 lg:p-8 max-w-7xl font-sans text-slate-800">
      
      {/* ─── Premium Header ──────────────────────────────────────────────────── */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300 px-3 py-1 mb-3 rounded-full text-xs font-bold tracking-wider">
              ✨ ADVANCED STUDIO INTERFACE
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 bg-clip-text text-transparent mb-2">
              AI Lighting Studio
            </h1>
            <p className="text-base text-slate-500 max-w-3xl">
              Place custom light sources, tweak soft cast shadows, and configure hyper-realistic lighting presets.
            </p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ─── Left Panel: Controls (Col 5) ──────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Image Upload Box */}
          <Card className="border border-slate-100 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="pb-3 bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                <Upload className="w-5 h-5 text-amber-600" />Upload Room Photo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {!previewUrl ? (
                <div
                  className="border-2 border-dashed border-slate-200 hover:border-amber-400 rounded-xl p-8 text-center cursor-pointer hover:bg-amber-50/20 transition-all duration-300"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                >
                  <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
                  <p className="text-sm text-slate-600 font-semibold">Drop room image here or click to browse</p>
                  <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG, JPEG up to 20MB</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-100 shadow-inner">
                    <img src={previewUrl} alt="Room source preview" className="w-full h-44 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-slate-200 hover:bg-slate-50 text-slate-600 font-medium"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />Change photo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preset Buttons Grid */}
          <Card className="border border-slate-100 shadow-sm rounded-2xl">
            <CardHeader className="pb-3 bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                <Compass className="w-5 h-5 text-amber-600" />Relighting Studio Presets
              </CardTitle>
              <CardDescription>
                Select a preset to auto-configure all studio sliders and prompts.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(LIGHTING_PRESETS).map(([key, conf]) => (
                  <button
                    key={key}
                    onClick={() => !isGenerating && applyPreset(key)}
                    disabled={isGenerating}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-300 ${
                      activePreset === key
                        ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/30'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <span className="text-2xl mb-1">{conf.icon}</span>
                    <span className="text-xs font-bold text-slate-800 flex items-center justify-between w-full">
                      <span>{conf.label}</span>
                      {activePreset === key && isDirty && (
                        <span className="text-[9px] text-orange-600 font-bold bg-orange-100/80 px-1 py-0.5 rounded ml-1 animate-pulse">(modified)</span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{conf.description}</span>
                  </button>
                ))}
                
                {/* Custom Preset Marker */}
                <button
                  onClick={() => !isGenerating && (setActivePreset("custom"), setIsDirty(false))}
                  disabled={isGenerating}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-300 ${
                    activePreset === "custom"
                      ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/30'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 bg-white'
                  }`}
                >
                  <span className="text-2xl mb-1">🎛️</span>
                  <span className="text-xs font-bold text-slate-800">Custom Sliders</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Manual slider override mode</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Relighting Parameters Panel */}
          <Card className="border border-slate-100 shadow-sm rounded-2xl">
            <CardHeader className="pb-3 bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                <Sliders className="w-5 h-5 text-amber-600" />Studio Control Sliders
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              
              {/* Shape selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Light Source Shape</label>
                <div className="grid grid-cols-3 gap-2">
                  {['circle', 'rectangle', 'triangle'].map(s => (
                    <button
                      key={s}
                      onClick={() => { handleTweak(); setShape(s); }}
                      disabled={isGenerating}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border capitalize transition-all ${
                        shape === s
                          ? 'border-amber-500 bg-amber-500/10 text-amber-700'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Denoise Strength */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Denoise Strength</span>
                  <span className="font-mono text-amber-600">{denoise.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.50"
                  max="1.00"
                  step="0.01"
                  value={denoise}
                  onChange={e => { handleTweak(); setDenoise(parseFloat(e.target.value)); }}
                  disabled={isGenerating}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
              </div>

              {/* Light Intensity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Light Intensity (Brightness)</span>
                  <span className="font-mono text-amber-600">{intensity.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.30"
                  max="1.00"
                  step="0.05"
                  value={intensity}
                  onChange={e => { handleTweak(); setIntensity(parseFloat(e.target.value)); }}
                  disabled={isGenerating}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
              </div>

              {/* IC Multiplier */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Multiplier Strength (IC-Light)</span>
                  <span className="font-mono text-amber-600">{icMultiplier.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="1.00"
                  step="0.05"
                  value={icMultiplier}
                  onChange={e => { handleTweak(); setIcMultiplier(parseFloat(e.target.value)); }}
                  disabled={isGenerating}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
              </div>

              {/* Shape width / height */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Shape Width</span>
                    <span className="font-mono text-amber-600">{lightWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="500"
                    step="5"
                    value={lightWidth}
                    onChange={e => { handleTweak(); setLightWidth(parseInt(e.target.value)); }}
                    disabled={isGenerating}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Shape Height</span>
                    <span className="font-mono text-amber-600">{lightHeight}px</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="500"
                    step="5"
                    value={lightHeight}
                    onChange={e => { handleTweak(); setLightHeight(parseInt(e.target.value)); }}
                    disabled={isGenerating}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>
              </div>

              {/* Spread & Softness */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Spread</span>
                    <span className="font-mono text-amber-600">{spread.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={spread}
                    onChange={e => { handleTweak(); setSpread(parseFloat(e.target.value)); }}
                    disabled={isGenerating}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Softness (Blur)</span>
                    <span className="font-mono text-amber-600">{softness}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={softness}
                    onChange={e => { handleTweak(); setSoftness(parseInt(e.target.value)); }}
                    disabled={isGenerating}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>
              </div>

              {/* CFG Scale & Frames */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>CFG Scale</span>
                    <span className="font-mono text-amber-600">{cfg.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="15.0"
                    step="0.5"
                    value={cfg}
                    onChange={e => { handleTweak(); setCfg(parseFloat(e.target.value)); }}
                    disabled={isGenerating}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex justify-between">
                    <span>Batch Output Variations</span>
                    <span className="font-mono text-amber-600">{frames} views</span>
                  </label>
                  <select
                    value={frames}
                    onChange={e => { handleTweak(); setFrames(parseInt(e.target.value)); }}
                    disabled={isGenerating}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value={1}>1 View (Standard)</option>
                    <option value={3}>3 Views (Multi-View)</option>
                    <option value={5}>5 Views (Maximum)</option>
                  </select>
                </div>
              </div>

              {/* Invert Light Toggle */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700">Invert Light Source</span>
                  <span className="text-[10px] text-slate-400">Floods the rest of the room instead of pinpoint spotlight</span>
                </div>
                <input
                  type="checkbox"
                  checked={invertLight}
                  onChange={e => { handleTweak(); setInvertLight(e.target.checked); }}
                  disabled={isGenerating}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
              </div>

              {/* Prompt Textbox */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-600">Dynamic Text Prompt</label>
                <textarea
                  value={manualPrompt}
                  onChange={e => { handleTweak(); setManualPrompt(e.target.value); }}
                  placeholder="e.g. warm window light, cinematic lighting..."
                  disabled={isGenerating}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 resize-none h-16 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

            </CardContent>
          </Card>

          {/* Action Render Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedFile}
            className="w-full py-6 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 font-bold text-white shadow-md shadow-orange-600/10"
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating Light Studio...</>
            ) : (
              <><Wand2 className="w-5 h-5 mr-2" />Render Light Source</>
            )}
          </Button>

          {/* Error alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5"
              >
                <div className="font-bold">⚠️ Error:</div>
                <div>{error}</div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* ─── Right Panel: Canvas & Results (Col 7) ─────────────────────────── */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Interactive Source Image Canvas */}
          <Card className="border border-slate-100 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="pb-3 bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-800">
                  Interactive Design Canvas
                </CardTitle>
                <CardDescription>
                  Click or touch anywhere inside the image below to place your Light Source.
                </CardDescription>
              </div>
              <Badge className="bg-amber-100 text-amber-800 border-none font-semibold uppercase tracking-wider text-[10px]">
                {shape} Mode
              </Badge>
            </CardHeader>
            <CardContent className="pt-2 flex justify-center">
              <div 
                onClick={handleCanvasClick}
                onTouchStart={handleCanvasTouch}
                onTouchMove={handleCanvasTouch}
                className="relative w-full rounded-xl border border-slate-200 overflow-hidden shadow-inner bg-slate-900 cursor-crosshair select-none"
              >
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt="Relighting Canvas"
                      className="w-full h-auto object-contain block select-none pointer-events-none"
                    />
                    
                    {/* Glowing light source aiming dot overlay */}
                    <motion.div
                      style={{
                        left: `${(lightX / canvasWidth) * 100}%`,
                        top: `${(lightY / canvasHeight) * 100}%`
                      }}
                      className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-2 border-white bg-amber-500 shadow-2xl flex items-center justify-center pointer-events-none"
                      animate={{ scale: [1, 1.15, 1], boxShadow: ["0 0 10px rgba(245,158,11,0.5)", "0 0 25px rgba(245,158,11,0.9)", "0 0 10px rgba(245,158,11,0.5)"] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Lightbulb className="w-4 h-4 text-white" />
                    </motion.div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-2">
                    <ImageIcon className="w-16 h-16 text-slate-600 animate-pulse" />
                    <p className="text-sm font-semibold text-slate-500">No Image Uploaded</p>
                    <p className="text-xs text-slate-600">Interactive canvas is loaded automatically upon image upload</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Display */}
          <Card className="border border-slate-100 shadow-sm rounded-2xl min-h-[380px] overflow-hidden flex flex-col">
            <CardHeader className="pb-3 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-800">
                Relighted Output Studio
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex-1 flex flex-col justify-center">
              
              {/* Idle Placeholder */}
              {!isGenerating && !singleResult && (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 space-y-4">
                  <div className="w-20 h-20 rounded-2xl bg-amber-50/50 flex items-center justify-center shadow-sm border border-amber-100/50">
                    <Sun className="w-10 h-10 text-amber-500 animate-spin-slow" />
                  </div>
                  <div className="max-w-sm">
                    <p className="text-sm font-bold text-slate-700">Studio Output Viewer</p>
                    <p className="text-xs text-slate-400 mt-1">Configure your preset parameters on the left and click "Render Light Source" to generate stunning transformations.</p>
                  </div>
                </div>
              )}

              {/* Progress Bar & Stage view */}
              {isGenerating && progress && (
                <div className="space-y-6 py-10 max-w-xl mx-auto w-full">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700">{progress.label}</span>
                    <span className="font-mono text-sm text-amber-600 font-bold">{progress.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                    <motion.div
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.percent}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <div className="relative rounded-xl overflow-hidden aspect-[8/5] opacity-50 shadow border bg-slate-900">
                    {previewUrl && <img src={previewUrl} alt="Processing..." className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                      <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                    </div>
                  </div>
                </div>
              )}

              {/* Rendered Before/After Slider Results */}
              {!isGenerating && singleResult && activeResultUrl && (
                <div className="space-y-6">
                <div className="rounded-xl overflow-hidden shadow-md border border-slate-100 bg-slate-950 w-full">
                    <BeforeAfterSlider
                      beforeImage={singleResult.beforeUrl}
                      afterImage={activeResultUrl + "?t=" + Date.now()}
                      beforeLabel="Original Room"
                      afterLabel="Relighted Studio Output"
                    />
                  </div>

                  {/* Multi-result thumbnails selection grid (if frames > 1) */}
                  {singleResult.results.length > 1 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Generated Variations</p>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {singleResult.results.map((res) => (
                          <button
                            key={res.url}
                            onClick={() => setActiveResultUrl(res.url)}
                            className={`relative rounded-xl overflow-hidden border-2 aspect-[4/3] text-left transition-all duration-300 ${
                              activeResultUrl === res.url
                                ? 'border-amber-500 ring-2 ring-amber-500/20 scale-[1.03]'
                                : 'border-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <img src={res.url} alt={res.label} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-950/20 hover:bg-slate-950/0 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Single Action bar */}
                  <div className="flex gap-3 justify-end pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = activeResultUrl;
                        a.download = `relighted-room-${Date.now()}.png`;
                        a.click();
                      }}
                      className="border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-xl px-4 py-2"
                    >
                      <Download className="w-4 h-4 mr-1.5" />Download PNG
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Relighting Saved",
                          description: "Saved successfully to project history.",
                        });
                      }}
                      className="border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-xl px-4 py-2"
                    >
                      <BookmarkCheck className="w-4 h-4 mr-1.5 text-green-600" />Save Render
                    </Button>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
