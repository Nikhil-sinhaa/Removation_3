// app/(app)/style-transfer/page.tsx
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
  CheckCircle,
  Loader2,
  Image as ImageIcon,
  Palette,
  AlertCircle,
  RotateCcw,
  Download,
  RefreshCw,
  BookmarkCheck,
  Sparkles,
  Sliders,
  ArrowRight,
} from "lucide-react";
import { MakeItReal } from "@/components/ai/MakeItReal";
import { TRANSFER_PRESETS, StylePreset } from "@/src/config/transferPresets";

interface ProgressState {
  stage: string; // 'preparing' | 'uploading' | 'generating' | 'finalizing' | 'done'
  percent: number;
  label: string;
}

interface ResultState {
  beforeUrl: string;
  afterUrl: string;
  runId: string;
}

export default function StyleTransferPage() {
  const [roomFile, setRoomFile] = useState<File | null>(null);
  const [roomPreview, setRoomPreview] = useState<string | null>(null);
  
  const [styleFile, setStyleFile] = useState<File | null>(null);
  const [stylePreview, setStylePreview] = useState<string | null>(null);

  const [selectedPresetId, setSelectedPresetId] = useState<string>("japandi");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  const isGeneratingRef = useRef(isGenerating);
  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  const { toast } = useToast();
  
  const roomInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ── Socket.IO Connection & Events ─────────────────────────────────────────
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_COMFY_WS || "http://localhost:3001";
    const socket = io(wsUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on("comfy:style-transfer:start", (data: any) => {
      setProgress({ stage: "preparing", percent: 10, label: "Initializing pipeline..." });
    });

    socket.on("comfy:style-transfer:progress", (data: any) => {
      if (!isGeneratingRef.current) return;
      setProgress({
        stage: data.stage || "generating",
        percent: Math.round(data.percent || 50),
        label: data.name || "Processing...",
      });
    });

    socket.on("comfy:style-transfer:done", (data: any) => {
      stopPolling();
      setProgress({ stage: "done", percent: 100, label: "Success!" });
      setResult({
        beforeUrl: data.beforeUrl + "?t=" + Date.now(),
        afterUrl: data.afterUrl + "?t=" + Date.now(),
        runId: data.runId,
      });
      setIsGenerating(false);
      toast({
        title: "Generation Complete!",
        description: "Your style transfer redesign is ready.",
      });
    });

    socket.on("comfy:style-transfer:error", (data: any) => {
      stopPolling();
      setError(data.error || "Style transfer pipeline failed");
      setIsGenerating(false);
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      stopPolling();
    };
  }, [stopPolling, toast]);

  // ── File Helpers ──────────────────────────────────────────────────────────
  const handleRoomSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRoomFile(file);
    if (roomPreview) URL.revokeObjectURL(roomPreview);
    setRoomPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const handleStyleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStyleFile(file);
    if (stylePreview) URL.revokeObjectURL(stylePreview);
    setStylePreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const handleRoomDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setRoomFile(file);
    if (roomPreview) URL.revokeObjectURL(roomPreview);
    setRoomPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const handleStyleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setStyleFile(file);
    if (stylePreview) URL.revokeObjectURL(stylePreview);
    setStylePreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  // ── Execution Pipeline ───────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!roomFile) {
      setError("Please upload an original room photo.");
      return;
    }
    if (!styleFile) {
      setError("Please upload a style reference photo.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setProgress({ stage: "preparing", percent: 5, label: "Connecting to server..." });

    try {
      const formData = new FormData();
      formData.append("roomImage", roomFile);
      formData.append("styleImage", styleFile);
      formData.append("stylePreset", selectedPresetId);

      const res = await fetch("/api/ai/style-transfer", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.status === 422) {
        throw new Error(data.message || "Required IPAdapter models are not installed. Please install them to proceed.");
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Submission failed");
      }

      setProjectId(data.projectId);

      // Fallback Polling Mechanism
      stopPolling();
      const pid = data.projectId;
      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/ai/style-transfer?projectId=${pid}`);
          if (!pollRes.ok) return;
          const proj = await pollRes.json();
          if (proj.status === "completed" && proj.resultImage) {
            stopPolling();
            setResult({
              beforeUrl: proj.originalImage + "?t=" + Date.now(),
              afterUrl: proj.resultImage + "?t=" + Date.now(),
              runId: proj.runId || pid,
            });
            setProgress({ stage: "done", percent: 100, label: "Redesign Complete!" });
            setIsGenerating(false);
          } else if (proj.status === "failed") {
            stopPolling();
            setError(proj.errorMessage || "Style transfer processing failed");
            setIsGenerating(false);
          }
        } catch { /* Ignore poll errors */ }
      }, 3000);

    } catch (err: any) {
      setError(err.message || "Network error submitting style transfer request.");
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setProgress(null);
    setProjectId(null);
  };

  const currentPreset = TRANSFER_PRESETS.find(p => p.id === selectedPresetId);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header Banner */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            AI Style Transfer
          </h1>
          <p className="text-lg text-gray-600 mb-4 max-w-2xl mx-auto">
            Infuse the structure of your room with the high-fidelity style, colors, materials, and textures of any reference design.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Badge className="bg-indigo-100 text-indigo-800 border-none"><Sparkles className="w-3 h-3 mr-1" />IP-Adapter Style Transfer</Badge>
            <Badge className="bg-purple-100 text-purple-800 border-none"><Palette className="w-3 h-3 mr-1" />Dual ControlNet (Canny & LSD)</Badge>
            <Badge className="bg-pink-100 text-pink-800 border-none"><Sliders className="w-3 h-3 mr-1" />Dynamic Aspect Resolution</Badge>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ─── Left Panel: Configurations & Uploads ────────────────────────── */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Room Image Card */}
            <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <ImageIcon className="w-4 h-4 text-indigo-500" />
                  Your Room Photo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  ref={roomInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleRoomSelect}
                  className="hidden"
                  disabled={isGenerating}
                />
                {!roomPreview ? (
                  <div
                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 transition-all min-h-[140px] flex flex-col justify-center items-center"
                    onClick={() => roomInputRef.current?.click()}
                    onDrop={handleRoomDrop}
                    onDragOver={e => e.preventDefault()}
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-600 font-medium">Drop room photo or browse</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden border border-gray-100 group">
                      <img src={roomPreview} alt="Room Preview" className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => roomInputRef.current?.click()}>
                        <RefreshCw className="w-6 h-6 text-white animate-pulse" />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs text-gray-500 hover:text-indigo-600"
                      onClick={() => roomInputRef.current?.click()}
                      disabled={isGenerating}
                    >
                      Change room photo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Style Reference Card */}
            <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Palette className="w-4 h-4 text-purple-500" />
                  Style Reference
                </CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  ref={styleInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleStyleSelect}
                  className="hidden"
                  disabled={isGenerating}
                />
                {!stylePreview ? (
                  <div
                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/20 transition-all min-h-[140px] flex flex-col justify-center items-center"
                    onClick={() => styleInputRef.current?.click()}
                    onDrop={handleStyleDrop}
                    onDragOver={e => e.preventDefault()}
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-600 font-medium">Drop style reference or browse</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden border border-gray-100 group">
                      <img src={stylePreview} alt="Style Preview" className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => styleInputRef.current?.click()}>
                        <RefreshCw className="w-6 h-6 text-white animate-pulse" />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs text-gray-500 hover:text-purple-600"
                      onClick={() => styleInputRef.current?.click()}
                      disabled={isGenerating}
                    >
                      Change reference
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preset Styles Selector */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-500" />
                Select Visual Style Preset
              </CardTitle>
              <CardDescription>
                Excludes other visual styles and targets specific atmospheric designs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                {TRANSFER_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <motion.div
                      key={preset.id}
                      onClick={() => !isGenerating && setSelectedPresetId(preset.id)}
                      whileHover={{ scale: isGenerating ? 1 : 1.01 }}
                      whileTap={{ scale: isGenerating ? 1 : 0.99 }}
                      className={`p-3 rounded-xl border cursor-pointer text-left transition-all ${
                        isSelected
                          ? "border-purple-500 bg-purple-50/40 shadow-sm"
                          : "border-gray-100 hover:border-gray-200 bg-white"
                      } ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <h4 className={`text-sm font-semibold ${isSelected ? "text-purple-700" : "text-gray-700"}`}>
                        {preset.name}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Generate Action Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !roomFile || !styleFile}
            className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-medium shadow-md shadow-purple-500/10 py-6 text-base rounded-xl transition-all"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Styling your room...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Wand2 className="w-5 h-5" />
                Transfer Style Design
              </span>
            )}
          </Button>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Generation Error</p>
                  <p className="text-xs text-rose-600 mt-1 leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Right Panel: Interactive Outputs ───────────────────────────── */}
        <div className="space-y-4">
          <Card className="h-full border border-gray-100 shadow-sm flex flex-col min-h-[480px]">
            <CardHeader className="pb-3 border-b border-gray-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-gray-800">Result Studio</CardTitle>
                <CardDescription>Visualizing your styled interior redesign</CardDescription>
              </div>
              {result && (
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-gray-400 hover:text-purple-600">
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Reset
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center p-6">
              {/* Idle State */}
              {!isGenerating && !result && !progress && (
                <div className="flex flex-col items-center justify-center text-center text-gray-400 space-y-4 py-12">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50/50 flex items-center justify-center border border-indigo-50/50">
                    <Sparkles className="w-8 h-8 text-indigo-400/80" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Style Redesign Preview</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-[260px] mx-auto leading-relaxed">
                      Upload your room image, supply a style reference photo, select a preset, and let the AI redesign your space.
                    </p>
                  </div>
                </div>
              )}

              {/* Progress State */}
              <AnimatePresence>
                {isGenerating && progress && (
                  <motion.div
                    key="progress"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6 py-6 w-full max-w-md mx-auto"
                  >
                    <h3 className="text-sm font-semibold text-gray-700 text-center mb-2 flex items-center justify-center gap-1.5">
                      <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                      Style Transfer in Progress
                    </h3>

                    {/* Step Pipeline */}
                    {[
                      { id: "preparing", label: "Aspect Resolution Mapping", val: 10 },
                      { id: "uploading", label: "Transferring Files to Generator", val: 30 },
                      { id: "generating", label: "Running High-Weight Style Adaptation", val: 50 },
                      { id: "finalizing", label: "High-Resolution upscale", val: 90 },
                    ].map((step, idx) => {
                      const stages = ["preparing", "uploading", "generating", "finalizing", "done"];
                      const currentIdx = stages.indexOf(progress.stage);
                      const stepIdx = stages.indexOf(step.id);
                      
                      const isDone = currentIdx > stepIdx;
                      const isActive = progress.stage === step.id;

                      return (
                        <div key={step.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className={`flex items-center gap-1.5 ${
                              isDone ? "text-green-600 font-medium" :
                              isActive ? "text-purple-600 font-semibold" :
                              "text-gray-400"
                            }`}>
                              {isDone ? (
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] ${
                                  isActive ? "border-purple-500 text-purple-600 font-bold" : "border-gray-200 text-gray-400"
                                }`}>
                                  {idx + 1}
                                </span>
                              )}
                              {step.label}
                            </span>
                            {isActive && (
                              <span className="text-[10px] text-purple-600 font-mono font-semibold">
                                {progress.percent}%
                              </span>
                            )}
                          </div>
                          <div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                              className={
                                isDone ? "bg-green-500 h-full" :
                                isActive ? "bg-gradient-to-r from-indigo-500 to-purple-500 h-full" :
                                "bg-gray-200 h-full"
                              }
                              initial={{ width: 0 }}
                              animate={{
                                width: isDone ? "100%" : isActive ? `${progress.percent}%` : "0%",
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    <div className="p-3 bg-purple-50/50 rounded-xl text-center text-xs text-purple-700 border border-purple-100/50 mt-4 leading-relaxed font-medium">
                      {progress.label}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success Result State */}
              <AnimatePresence>
                {result?.afterUrl && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6 w-full"
                  >
                    <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                      <BeforeAfterSlider
                        beforeImage={result.beforeUrl}
                        afterImage={result.afterUrl}
                        beforeLabel="Original Room"
                        afterLabel={`${currentPreset?.name || "Redesigned"} Style`}
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = result.afterUrl;
                          a.download = `styled-redesign-${selectedPresetId}-${Date.now()}.png`;
                          a.click();
                        }}
                        className="flex-1 text-xs py-5 rounded-lg border-gray-200 text-gray-600 hover:text-indigo-600"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          toast({
                            title: "Saved to Projects",
                            description: "Style transfer redesign run logged to your dashboard successfully.",
                          });
                        }}
                        className="flex-1 text-xs py-5 rounded-lg border-gray-200 text-gray-600 hover:text-purple-600"
                      >
                        <BookmarkCheck className="w-3.5 h-3.5 mr-1.5" />Save to Project
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleReset}
                        className="flex-1 text-xs py-5 rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Try Another Style
                      </Button>
                    </div>

                    {/* Make It Real Connector Banner */}
                    <div className="pt-2 border-t border-gray-50">
                      <MakeItReal
                        roomType="living-room"
                        style={currentPreset?.name || "Modern"}
                        afterImage={result.afterUrl}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
