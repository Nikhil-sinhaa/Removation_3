// app/(app)/professional-design/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BeforeAfterSlider } from "@/components/ui/before-after-slider";
import { ProfessionalSelector } from "@/components/ui/professional-selector";
import GPUModeSwitch from "@/components/ui/GPUModeSwitch";
import { io, Socket } from "socket.io-client";
import { analyzeVastu } from "@/lib/vastu-engine";
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
  HardDrive,
  Home,
  ShoppingBag,
  Compass,
  IndianRupee,
  ArrowUpCircle,
  Sparkles,
  X,
  Bed,
  CookingPot,
  Bath,
  UtensilsCrossed,
  Briefcase,
  Sofa,
} from "lucide-react";
import { useUserStore } from '@/stores/user-store';

// ─── Stage definitions for progress bar ──────────────────────────────
const STAGES = [
  { id: 1, name: "Scene Analysis",     icon: Eye,       color: "from-blue-500 to-cyan-500" },
  { id: 2, name: "Geometry Lock",       icon: Lock,      color: "from-cyan-500 to-teal-500" },
  { id: 3, name: "Regional Paint",      icon: Wand2,     color: "from-teal-500 to-green-500" },
  { id: 4, name: "Furniture Place",     icon: ShoppingBag, color: "from-green-500 to-amber-500" },
  { id: 5, name: "Refine",             icon: Sparkles,  color: "from-amber-500 to-orange-500" },
  { id: 6, name: "4× Upscale",         icon: ArrowUpCircle, color: "from-orange-500 to-red-500" },
];

const roomTypes = [
  { id: "living_room", name: "Living Room", icon: <Sofa className="w-4 h-4" /> },
  { id: "bedroom", name: "Bedroom", icon: <Bed className="w-4 h-4" /> },
  { id: "kitchen", name: "Kitchen", icon: <CookingPot className="w-4 h-4" /> },
  { id: "bathroom", name: "Bathroom", icon: <Bath className="w-4 h-4" /> },
  { id: "dining_room", name: "Dining Room", icon: <UtensilsCrossed className="w-4 h-4" /> },
  { id: "office", name: "Office", icon: <Briefcase className="w-4 h-4" /> },
];

export default function ProfessionalDesignPage() {
  const setInsufficientCreditsModalOpen = useUserStore(s => s.setInsufficientCreditsModalOpen);
  // ─── Core state ────────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [roomType, setRoomType] = useState("living_room");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [professionalSettings, setProfessionalSettings] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Ultra-Pro state ───────────────────────────────────────────────
  const [currentStage, setCurrentStage] = useState(0);
  const [stageStatus, setStageStatus] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [projectId, setProjectId] = useState<string | null>(null);

  // ─── Feature toggles (Gap 5: upscale/refine) ──────────────────────
  const [enableUpscale, setEnableUpscale] = useState(true);
  const [enableRefine, setEnableRefine] = useState(true);

  // ─── Furniture upload (Gap 3: IPAdapter) ───────────────────────────
  const [furnitureFile, setFurnitureFile] = useState<File | null>(null);
  const [furniturePreview, setFurniturePreview] = useState<string | null>(null);
  const furnitureInputRef = useRef<HTMLInputElement>(null);

  // ─── Vastu + Cost results (Gap 4: auto-trigger) ───────────────────
  const [vastuResult, setVastuResult] = useState<any>(null);
  const [costResult, setCostResult] = useState<any>(null);
  const [vastuLoading, setVastuLoading] = useState(false);
  const [costLoading, setCostLoading] = useState(false);

  // ─── Socket.IO ref ─────────────────────────────────────────────────
  const socketRef = useRef<Socket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helper: stop fallback polling
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // ─── File handlers ─────────────────────────────────────────────────
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
      setVastuResult(null);
      setCostResult(null);
      addLog(`📸 Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    }
  };

  const handleFurnitureSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFurnitureFile(file);
      if (furniturePreview) URL.revokeObjectURL(furniturePreview);
      setFurniturePreview(URL.createObjectURL(file));
      addLog(`🛋️ Furniture image: ${file.name}`);
    }
  };

  const clearFurniture = () => {
    setFurnitureFile(null);
    if (furniturePreview) URL.revokeObjectURL(furniturePreview);
    setFurniturePreview(null);
  };

  const handleProfessionalSelectionChange = useCallback((selections: any) => {
    setProfessionalSettings(selections);
  }, []);

  // ─── Auto Vastu + Cost (Gap 4) ────────────────────────────────────
  const runVastuAnalysis = useCallback(async () => {
    setVastuLoading(true);
    try {
      const result = analyzeVastu({ roomType, direction: 'north' });
      setVastuResult(result);
      addLog(`🕉️ Vastu Score: ${result.overallScore.value}/100 (${result.overallScore.grade})`);
    } catch (e: any) {
      addLog(`⚠️ Vastu analysis failed: ${e.message}`);
    } finally {
      setVastuLoading(false);
    }
  }, [roomType]);

  const runCostEstimate = useCallback(async () => {
    setCostLoading(true);
    try {
      const response = await fetch('/api/cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'calculate',
          roomType,
          area: { value: 500, unit: 'sqft' },
          city: 'mumbai',
          renovationType: 'standard',
          includeLabor: true,
          includeTax: true,
          currency: 'INR',
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setCostResult(data.estimate);
        addLog(`💰 Cost: ₹${data.estimate?.totalCost?.toLocaleString() || 'N/A'}`);
      }
    } catch (e: any) {
      addLog(`⚠️ Cost estimate failed: ${e.message}`);
    } finally {
      setCostLoading(false);
    }
  }, [roomType]);

  // ─── Socket.IO for real-time progress (Gap 2) ─────────────────────
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_COMFY_WS || 'http://localhost:3001';
    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      addLog(`🔗 Socket.IO connected (${wsUrl})`);
    });
    socket.on('disconnect', (reason: string) => {
      addLog(`🔌 Socket.IO disconnected: ${reason}`);
    });
    socket.on('connect_error', (err: any) => {
      addLog(`⚠️ Socket.IO connection error: ${err.message}`);
    });

    socket.on('comfy:ultrapro:start', (data: any) => {
      addLog(`🚀 Ultra-Pro pipeline started (${data.totalStages} stages)`);
      setCurrentStage(0);
      setProgressPct(5);
    });

    socket.on('comfy:ultrapro:stage', (data: any) => {
      const pctMap: Record<number, number> = { 1: 15, 2: 35, 3: 55, 4: 75, 5: 90, 6: 100 };
      const pct = data.status === 'done' ? (pctMap[data.stage] || 50) : (pctMap[data.stage] || 50) - 10;
      setCurrentStage(data.stage);
      setProgressPct(pct);
      setStageStatus(
        data.status === 'done'
          ? `Stage ${data.stage} done${data.ms ? ` (${(data.ms / 1000).toFixed(1)}s)` : ''}`
          : `Stage ${data.stage}: ${data.name || 'Processing'}...`
      );
      addLog(data.status === 'done'
        ? `✅ Stage ${data.stage} complete (${data.name})${data.ms ? ` — ${(data.ms / 1000).toFixed(1)}s` : ''}`
        : `🔄 Stage ${data.stage}: ${data.name}...`
      );
    });

    socket.on('comfy:ultrapro:done', async (data: any) => {
      stopPolling();
      addLog(`🎉 Ultra-Pro complete! (${(data.totalMs / 1000).toFixed(1)}s total)`);
      setResult({
        generatedImage: data.imageUrl + '?t=' + Date.now(),
        originalPreview: null, // will use previewUrl
        timings: data.timings,
        totalMs: data.totalMs,
        status: 'completed',
      });
      setIsGenerating(false);
      setCurrentStage(6);
      setProgressPct(100);

      // Gap 4: Auto-trigger Vastu + Cost
      setTimeout(() => { runVastuAnalysis(); }, 500);
      setTimeout(() => { runCostEstimate(); }, 1000);
    });

    socket.on('comfy:ultrapro:error', (data: any) => {
      stopPolling();
      addLog(`❌ Pipeline error: ${data.error}`);
      setError(data.error);
      setIsGenerating(false);
      setCurrentStage(0);
      setProgressPct(0);
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); stopPolling(); };
  }, [runVastuAnalysis, runCostEstimate, stopPolling]);

  // ─── Generate (Gap 1: Ultra-Pro route) ─────────────────────────────
  const handleGenerate = async () => {
    if (!selectedFile) { setError("Please select an image first"); return; }
    if (!professionalSettings) { setError("Please configure settings"); return; }

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setVastuResult(null);
    setCostResult(null);
    setCurrentStage(0);
    setProgressPct(0);
    setLogs([]);

    addLog("🎯 Starting Ultra-Pro 6-Stage Pipeline...");
    addLog(`🏠 Room: ${roomType} | 🔒 Structure Lock: ${professionalSettings.structuralLock.enabled ? 'ON' : 'OFF'}`);

    try {
      const masterSelector = {
        wallColor: professionalSettings.masterPrompt?.materials?.walls || 'keep_original',
        ceiling: professionalSettings.masterPrompt?.materials?.ceiling || 'keep_original',
        furnitureStyle: professionalSettings.masterPrompt?.materials?.furniture || 'keep_original',
        floorType: professionalSettings.masterPrompt?.materials?.floors || 'keep_original',
        lighting: professionalSettings.masterPrompt?.materials?.lighting || 'keep_original',
      };
      const masterToggles = {
        walls: masterSelector.wallColor !== 'keep_original',
        ceiling: masterSelector.ceiling !== 'keep_original',
        furniture: masterSelector.furnitureStyle !== 'keep_original',
        floor: masterSelector.floorType !== 'keep_original',
        lighting: masterSelector.lighting !== 'keep_original',
        decor: false,
      };

      // Build skip list: 5 = refinement, 6 = upscale (now independently controlled)
      const skipStages: number[] = [];
      if (!enableRefine)  skipStages.push(5);
      if (!enableUpscale) skipStages.push(6);
      if (!furnitureFile) skipStages.push(4);

      // Bug #1 fix: Remap UI slider range 1.5-2.0 → valid ControlNet range 0.70-0.95
      // The ProfessionalSelector sends structuralLock.strength in range 1.5-2.0 which is
      // a UI-friendly scale, but ControlNetApplyAdvanced.strength must be 0.0-1.0.
      const rawLock = professionalSettings.structuralLock ?? {};
      const remappedStrength = rawLock.strength != null
        ? 0.70 + ((rawLock.strength - 1.5) / (2.0 - 1.5)) * (0.95 - 0.70)
        : 0.85; // default

      const formData = new FormData();
      formData.append('image', selectedFile);
      // Append furniture file if provided (backend will save to ComfyUI/input)
      if (furnitureFile) {
        formData.append('furnitureImage', furnitureFile);
        addLog("🛋️ Uploading furniture image for IPAdapter...");
      }
      formData.append('data', JSON.stringify({
        roomType,
        masterSelector,
        masterToggles,
        skipStages,
        // Forward structural lock params — strength remapped to 0.70-0.95 range
        structuralLock: {
          ...rawLock,
          strength: remappedStrength,
        },
        // Bug #4 fix: Forward encoderV2 settings so workflows can use them
        encoderV2: professionalSettings.encoderV2 ?? {},
      }));

      addLog("📤 Submitting to Ultra-Pro pipeline...");

      const response = await fetch('/api/ai/ultra-pro', {
        method: 'POST',
        body: formData,
      });

      if (response.status === 402) {
        setIsGenerating(false);
        setInsufficientCreditsModalOpen(true);
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        setProjectId(data.projectId);
        addLog(`✅ Queued! Project: ${data.projectId} (${data.stages} stages)`);
        // Surface IPAdapter model warning so user knows Stage 4 was auto-skipped
        if (data.ipadapterWarning) {
          addLog(`⚠️ ${data.ipadapterWarning}`);
        }
        addLog("⏳ Waiting for progress events...");


        // Start fallback polling in case Socket.IO misses events
        stopPolling();
        const pid = data.projectId;
        pollRef.current = setInterval(async () => {
          try {
            const pollRes = await fetch(`/api/ai/ultra-pro?projectId=${pid}`);
            if (!pollRes.ok) return;
            const proj = await pollRes.json();
            if (proj.status === 'completed' && proj.resultImage) {
              stopPolling();
              addLog(`🎉 Pipeline complete (via polling)`);
              setResult({
                generatedImage: proj.resultImage + '?t=' + Date.now(),
                originalPreview: null,
                status: 'completed',
              });
              setIsGenerating(false);
              setCurrentStage(6);
              setProgressPct(100);
              setTimeout(() => { runVastuAnalysis(); }, 500);
              setTimeout(() => { runCostEstimate(); }, 1000);
            } else if (proj.status === 'failed') {
              stopPolling();
              const errMsg = proj.errorMessage || 'Pipeline failed (check ComfyUI logs)';
              addLog(`❌ Pipeline error (via polling): ${errMsg}`);
              setError(errMsg);
              setIsGenerating(false);
              setCurrentStage(0);
              setProgressPct(0);
            }
          } catch (pollErr: any) { console.warn('Poll error:', pollErr?.message); }
        }, 3000);
      } else {
        addLog(`❌ Error: ${data.error || data.message}`);
        setError(data.error || 'Submission failed');
        setIsGenerating(false);
      }
    } catch (err: any) {
      addLog(`❌ Network error: ${err.message}`);
      setError('Network error. Is the server running?');
      setIsGenerating(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
            ⚡ Ultra-Pro Design Studio
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            6-Stage AI Pipeline — SDXL + SAM2 + ControlNet + IPAdapter — Optimized for 8GB VRAM
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Badge className="bg-blue-100 text-blue-800"><Eye className="w-3 h-3 mr-1" />SAM2 Scene</Badge>
            <Badge className="bg-teal-100 text-teal-800"><Lock className="w-3 h-3 mr-1" />Triple ControlNet</Badge>
            <Badge className="bg-green-100 text-green-800"><Wand2 className="w-3 h-3 mr-1" />Regional Paint</Badge>
            <Badge className="bg-amber-100 text-amber-800"><ShoppingBag className="w-3 h-3 mr-1" />IPAdapter</Badge>
            <Badge className="bg-orange-100 text-orange-800"><ArrowUpCircle className="w-3 h-3 mr-1" />4× Upscale</Badge>
            <Badge className="bg-purple-100 text-purple-800"><Cpu className="w-3 h-3 mr-1" />8GB Safe</Badge>
          </div>
        </motion.div>
      </div>

      {/* ── GPU Mode Switch ───────────────────────────────────────────── */}
      <div className="flex justify-end mb-6">
        <GPUModeSwitch />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Left Column: Upload + Controls ─────────────────────────── */}
        <div className="space-y-4">
          {/* Room Photo Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="w-4 h-4" />Upload Room Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full" disabled={isGenerating}>
                <Image className="w-4 h-4 mr-2" />
                {selectedFile ? `📸 ${selectedFile.name}` : "Choose Room Image"}
              </Button>
              {previewUrl && (
                <div className="mt-3 rounded-lg overflow-hidden border">
                  <img src={previewUrl} alt="Room preview" className="w-full h-40 object-cover" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Furniture Upload (Gap 3) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingBag className="w-4 h-4" />
                Furniture Image
                <Badge variant="secondary" className="text-xs">Optional</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input ref={furnitureInputRef} type="file" accept="image/*" onChange={handleFurnitureSelect} className="hidden" />
              {!furnitureFile ? (
                <Button onClick={() => furnitureInputRef.current?.click()} variant="outline" size="sm" className="w-full" disabled={isGenerating}>
                  <ShoppingBag className="w-4 h-4 mr-2" />Add Product Image (Amazon/Flipkart)
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  {furniturePreview && <img src={furniturePreview} alt="Furniture" className="w-16 h-16 rounded-lg object-cover border" />}
                  <div className="flex-1 text-sm truncate">{furnitureFile.name}</div>
                  <Button variant="ghost" size="sm" onClick={clearFurniture}><X className="w-4 h-4" /></Button>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">IPAdapter will place this furniture into your room using depth-aware compositing</p>
            </CardContent>
          </Card>

          {/* Room Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Home className="w-4 h-4" />Room Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {roomTypes.map((room) => (
                  <Button key={room.id} variant={roomType === room.id ? "default" : "outline"} size="sm"
                    onClick={() => setRoomType(room.id)} disabled={isGenerating} className="justify-start text-xs">
                    {room.icon}<span className="ml-1">{room.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Feature Toggles (Gap 5) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="w-4 h-4" />Pipeline Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={enableRefine} onChange={(e) => setEnableRefine(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300" disabled={isGenerating} />
                <div>
                  <div className="text-sm font-medium">Detail Refinement</div>
                  <div className="text-xs text-gray-500">MaskDetailer sharpens edges (Stage 5)</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={enableUpscale} onChange={(e) => setEnableUpscale(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300" disabled={isGenerating} />
                <div>
                  <div className="text-sm font-medium">4× Upscale + Sharpen</div>
                  <div className="text-xs text-gray-500">UltraSharp upscale to 2048px (Stage 6)</div>
                </div>
              </label>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <div className="relative group/gen">
            <Button onClick={handleGenerate} disabled={!selectedFile || !professionalSettings || isGenerating}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white" size="lg">
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{stageStatus || 'Processing...'}</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" />Generate Ultra-Pro Design</>
              )}
            </Button>
            {(!selectedFile || !professionalSettings) && !isGenerating && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap opacity-0 group-hover/gen:opacity-100 transition-opacity pointer-events-none">
                {!selectedFile ? '📸 Upload a room image first' : '⚙️ Configure settings above'}
              </div>
            )}
          </div>

          {/* 6-Stage Progress Bar (Gap 2) */}
          <AnimatePresence>
            {(isGenerating || progressPct === 100) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <Card>
                  <CardContent className="pt-4 pb-3">
                    {/* Overall progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <motion.div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }} />
                    </div>
                    {/* Stage indicators */}
                    <div className="grid grid-cols-6 gap-1">
                      {STAGES.map((stage) => {
                        const Icon = stage.icon;
                        const isDone = currentStage > stage.id || progressPct === 100;
                        const isActive = currentStage === stage.id && progressPct < 100;
                        return (
                          <div key={stage.id} className="flex flex-col items-center gap-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
                              isDone ? 'bg-green-500 text-white' :
                              isActive ? 'bg-amber-500 text-white animate-pulse' :
                              'bg-gray-200 text-gray-400'
                            }`}>
                              {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                            </div>
                            <span className={`text-[10px] text-center leading-tight ${isDone ? 'text-green-600 font-medium' : isActive ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                              {stage.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-center text-xs text-gray-500 mt-2">{stageStatus || `${progressPct}% complete`}</div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Logs */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Processing Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono h-36 overflow-y-auto">
                {logs.length > 0 ? logs.map((log, i) => <div key={i}>{log}</div>) : (
                  <div className="text-gray-500">Waiting for configuration...</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Middle + Right: Professional Selector ──────────────────── */}
        <div className="lg:col-span-2">
          <ProfessionalSelector onSelectionChange={handleProfessionalSelectionChange} roomType={roomType} />
        </div>
      </div>

      {/* ─── Results Section ────────────────────────────────────────────── */}
      <AnimatePresence>
        {result?.generatedImage && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mt-8 space-y-6">
            {/* Before/After + Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Ultra-Pro Design Complete
                  {result.totalMs && (
                    <Badge variant="outline" className="ml-2">{(result.totalMs / 1000).toFixed(1)}s total</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BeforeAfterSlider
                  beforeImage={previewUrl || "/images/hero-before.jpg"}
                  afterImage={result.generatedImage}
                  beforeLabel="Original Room"
                  afterLabel="Ultra-Pro AI Design"
                />
              </CardContent>
            </Card>

            {/* Vastu + Cost panels (Gap 4: auto-triggered) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vastu Panel */}
              <Card className="border-amber-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Compass className="w-5 h-5 text-amber-600" />
                    Vastu Analysis
                    {vastuLoading && <Loader2 className="w-4 h-4 animate-spin text-amber-500" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {vastuResult ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className={`text-4xl font-bold ${
                          vastuResult.overallScore.value >= 80 ? 'text-green-600' :
                          vastuResult.overallScore.value >= 60 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {vastuResult.overallScore.value}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{vastuResult.overallScore.label}</div>
                          <div className="text-xs text-gray-500">{vastuResult.overallScore.labelHi}</div>
                        </div>
                      </div>
                      {vastuResult.violations.length > 0 && (
                        <div className="bg-red-50 rounded-lg p-3">
                          <div className="text-xs font-medium text-red-800 mb-1">Issues ({vastuResult.violations.length})</div>
                          {vastuResult.violations.slice(0, 3).map((v: any, i: number) => (
                            <div key={i} className="text-xs text-red-700">• {v.description}</div>
                          ))}
                        </div>
                      )}
                      {vastuResult.recommendations.length > 0 && (
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="text-xs font-medium text-green-800 mb-1">Recommendations</div>
                          {vastuResult.recommendations.slice(0, 3).map((r: any, i: number) => (
                            <div key={i} className="text-xs text-green-700">• {r.recommendation}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 text-center py-4">
                      {vastuLoading ? 'Analyzing...' : 'Will auto-analyze after generation'}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cost Panel */}
              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <IndianRupee className="w-5 h-5 text-green-600" />
                    Cost Estimate
                    {costLoading && <Loader2 className="w-4 h-4 animate-spin text-green-500" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {costResult ? (
                    <div className="space-y-3">
                      <div className="text-3xl font-bold text-green-700">
                        ₹{costResult.totalCost?.toLocaleString() || 'N/A'}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 rounded p-2">
                          <div className="text-gray-500">Materials</div>
                          <div className="font-medium">₹{costResult.materialCost?.toLocaleString() || '—'}</div>
                        </div>
                        <div className="bg-gray-50 rounded p-2">
                          <div className="text-gray-500">Labor</div>
                          <div className="font-medium">₹{costResult.laborCost?.toLocaleString() || '—'}</div>
                        </div>
                      </div>
                      {costResult.estimatedDays && (
                        <div className="text-xs text-gray-500">
                          Timeline: {costResult.estimatedDays.min}–{costResult.estimatedDays.max} days
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 text-center py-4">
                      {costLoading ? 'Calculating...' : 'Will auto-estimate after generation'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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
