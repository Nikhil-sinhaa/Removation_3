// app/(app)/style-transfer/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/components/ui/use-toast";
import {
  Upload, Wand2, CheckCircle, Loader2, Image as ImageIcon,
  AlertCircle, RotateCcw, Download, Sparkles, ArrowRight, X, Info,
} from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { AIResultPanel } from "@/components/ai/AIResultPanel";
import { StylePresetSelector } from "@/components/ai/StylePresetSelector";
import { StyleReferenceGallery } from "@/components/ai/StyleReferenceGallery";
import { STYLE_PRESETS, StylePreset, StyleReference } from "@/config/style-presets";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProgressState {
  stage: string;
  percent: number;
  label: string;
}

interface ResultState {
  beforeUrl: string;
  afterUrl: string;
  runId: string;
}

export default function StyleTransferPage() {
  const setInsufficientCreditsModalOpen = useUserStore(s => s.setInsufficientCreditsModalOpen);
  const { toast } = useToast();

  // ── Core image state ────────────────────────────────────────────────────────
  const [roomFile,    setRoomFile]    = useState<File | null>(null);
  const [roomPreview, setRoomPreview] = useState<string | null>(null);

  // ── Style preset + reference gallery state ──────────────────────────────────
  const [selectedPreset,    setSelectedPreset]    = useState<StylePreset>(STYLE_PRESETS[0]);
  const [selectedReference, setSelectedReference] = useState<StyleReference | null>(STYLE_PRESETS[0].references[0] || null);
  const [customRefFile,     setCustomRefFile]     = useState<File | null>(null);
  const [customRefUrl,      setCustomRefUrl]      = useState<string | null>(null);

  // ── Generation state ────────────────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress,     setProgress]     = useState<ProgressState | null>(null);
  const [result,       setResult]       = useState<ResultState | null>(null);
  const [error,        setError]        = useState<string | null>(null);
  const [projectId,    setProjectId]    = useState<string | null>(null);

  const isGeneratingRef = useRef(isGenerating);
  useEffect(() => { isGeneratingRef.current = isGenerating; }, [isGenerating]);

  const roomInputRef = useRef<HTMLInputElement>(null);
  const socketRef    = useRef<Socket | null>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  // ── Socket.IO ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_COMFY_WS || "http://localhost:3001";
    socketRef.current = io(wsUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 20000,
    });

    socketRef.current.on("comfy:style-transfer:start", (data: any) => {
      if (data.projectId && data.projectId !== projectId) return;
      setIsGenerating(true);
      setProgress({ stage: "generating", percent: 10, label: "Starting style transfer..." });
    });

    socketRef.current.on("comfy:style-transfer:progress", (data: any) => {
      if (data.projectId && data.projectId !== projectId) return;
      setProgress({
        stage:   data.stage   || "generating",
        percent: data.percent || 50,
        label:   data.name    || "Processing...",
      });
    });

    socketRef.current.on("comfy:style-transfer:done", (data: any) => {
      if (!isGeneratingRef.current) return;
      stopPolling();
      setIsGenerating(false);
      setProgress(null);
      setResult({
        beforeUrl: data.beforeUrl,
        afterUrl:  data.afterUrl,
        runId:     data.runId,
      });
      toast({
        title: "✨ Style transfer complete!",
        description: "Your room has been restyled successfully.",
      });
    });

    socketRef.current.on("comfy:style-transfer:error", (data: any) => {
      if (!isGeneratingRef.current) return;
      stopPolling();
      setIsGenerating(false);
      setProgress(null);
      setError(data.error || "Generation failed. Please try again.");
    });

    return () => {
      socketRef.current?.disconnect();
      stopPolling();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── File handlers ───────────────────────────────────────────────────────────
  const handleRoomFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setRoomFile(file);
    const url = URL.createObjectURL(file);
    setRoomPreview(url);
    setResult(null);
    setError(null);
  };

  const handleRoomDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleRoomFile(file);
  };

  const handlePresetSelect = (preset: StylePreset) => {
    setSelectedPreset(preset);
    setSelectedReference(preset.references[0] || null);
    // Clear custom reference when switching preset
    setCustomRefFile(null);
    if (customRefUrl) { URL.revokeObjectURL(customRefUrl); setCustomRefUrl(null); }
  };

  const handleReferenceSelect = (ref: StyleReference) => {
    setSelectedReference(ref);
    // Clear custom when curated is picked
    if (customRefUrl) { URL.revokeObjectURL(customRefUrl); setCustomRefUrl(null); }
    setCustomRefFile(null);
  };

  const handleCustomRefUpload = (file: File) => {
    setCustomRefFile(file);
    if (customRefUrl) URL.revokeObjectURL(customRefUrl);
    setCustomRefUrl(URL.createObjectURL(file));
    setSelectedReference(null); // deselect curated
  };

  // ── Polling fallback ────────────────────────────────────────────────────────
  const startPolling = useCallback((pid: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/ai/style-transfer?projectId=${pid}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "completed" && data.resultImage) {
          stopPolling();
          setIsGenerating(false);
          setProgress(null);
          setResult({
            beforeUrl: data.originalImage || roomPreview || "",
            afterUrl:  data.resultImage,
            runId:     data._id,
          });
        } else if (data.status === "failed") {
          stopPolling();
          setIsGenerating(false);
          setError(data.errorMessage || "Generation failed. Please try again.");
        }
      } catch { /* swallow */ }
    }, 4000);
  }, [stopPolling, roomPreview]);

  // ── Generate ────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!roomFile) {
      toast({ title: "Upload your room first", variant: "destructive" });
      return;
    }
    if (!selectedReference && !customRefFile) {
      toast({ title: "Select a style reference image", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setProgress({ stage: "preparing", percent: 5, label: "Preparing your request..." });
    setResult(null);
    setError(null);

    const fd = new FormData();
    fd.append("roomImage",  roomFile);
    fd.append("presetId",   selectedPreset.id);

    if (customRefFile) {
      // Custom uploaded reference
      fd.append("referenceImageFile", customRefFile);
    } else if (selectedReference) {
      // Curated gallery reference
      fd.append("referenceId",       selectedReference.id);
      fd.append("referenceImageUrl", selectedReference.imageUrl);
      fd.append("prompt",            selectedReference.prompt);
      fd.append("negativePrompt",    selectedReference.negativePrompt);
    }

    try {
      const res = await fetch("/api/ai/style-transfer", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "insufficient_credits") {
          setInsufficientCreditsModalOpen(true);
        } else {
          setError(data.message || data.error || "Failed to start generation");
        }
        setIsGenerating(false);
        setProgress(null);
        return;
      }

      const pid = data.projectId;
      setProjectId(pid);
      setProgress({ stage: "generating", percent: 20, label: "Queued — waiting for ComfyUI..." });

      // Socket events will fire done/error; poll as fallback
      startPolling(pid);

    } catch (err: any) {
      setIsGenerating(false);
      setProgress(null);
      setError(err.message || "Network error. Please try again.");
    }
  };

  const handleReset = () => {
    setRoomFile(null);
    setRoomPreview(null);
    setResult(null);
    setError(null);
    setProgress(null);
    setProjectId(null);
    setIsGenerating(false);
    stopPolling();
  };

  // ── Derived helpers ─────────────────────────────────────────────────────────
  const activeRefImageUrl = customRefFile && customRefUrl
    ? customRefUrl
    : selectedReference?.imageUrl ?? null;

  const canGenerate = !!roomFile && (!!selectedReference || !!customRefFile) && !isGenerating;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div
        className="relative px-6 py-10 mb-6"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(59,130,246,0.06) 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 0 20px rgba(124,58,237,0.4)" }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Style Transfer</h1>
              <p className="text-xs text-purple-300/70">AI-powered visual style matching</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 max-w-lg leading-relaxed">
            Pick a style preset, choose a curated reference photo, and our AI will restyle your room to match that exact visual — colors, materials, lighting, and mood.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-12">
        {/* ── Result view ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8"
            >
              <AIResultPanel
                originalImageUrl={result.beforeUrl}
                resultImageUrl={result.afterUrl}
                toolName="Style Transfer"
                showMakeItReal={false}
                onTryAgain={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main layout ───────────────────────────────────────────────── */}
        {!result && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            {/* ── Left: Room upload + style preview ─── */}
            <div className="space-y-4">

              {/* Room upload */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="px-5 py-4 border-b border-white/5">
                  <h2 className="text-sm font-semibold text-white">Your Room</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Upload the room photo you want to restyle</p>
                </div>

                <div className="p-4">
                  {roomPreview ? (
                    <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                      <Image
                        src={roomPreview}
                        alt="Room preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={() => { setRoomFile(null); setRoomPreview(null); }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDrop={handleRoomDrop}
                      onDragOver={e => e.preventDefault()}
                      onClick={() => roomInputRef.current?.click()}
                      className="relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 hover:border-purple-500/50 hover:bg-purple-500/5"
                      style={{
                        aspectRatio: "16/9",
                        borderColor: "rgba(255,255,255,0.12)",
                      }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(124,58,237,0.15)" }}
                      >
                        <Upload className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-300">Drop your room photo here</p>
                        <p className="text-xs text-gray-500 mt-1">or click to browse — JPG, PNG, WEBP</p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={roomInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleRoomFile(f); }}
                  />
                </div>
              </div>

              {/* Style preview panel */}
              {activeRefImageUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: "#111111", border: "1px solid rgba(124,58,237,0.2)" }}
                >
                  <div className="px-5 py-3 border-b border-purple-500/10 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span className="text-xs font-semibold text-purple-300">Style Reference</span>
                    <span className="text-xs text-gray-500">
                      — {selectedReference?.label || "Custom photo"} · {selectedPreset.label}
                    </span>
                  </div>
                  <div className="relative" style={{ aspectRatio: "16/9" }}>
                    <Image
                      src={activeRefImageUrl}
                      alt="Style reference"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div
                      className="absolute inset-0 flex items-end"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }}
                    >
                      <div className="px-4 py-3">
                        <p className="text-xs text-white/90 leading-relaxed max-w-md line-clamp-2">
                          {selectedReference?.prompt?.replace(/\s*,\s*\(professional architectural photography.*$/i, "") || "Custom reference image"}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error state */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl px-4 py-3 flex items-start gap-3"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300 leading-relaxed">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress */}
              <AnimatePresence>
                {isGenerating && progress && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl px-5 py-4 space-y-3"
                    style={{ background: "#111111", border: "1px solid rgba(124,58,237,0.25)" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                        <span className="text-xs font-medium text-purple-300">
                          {progress.label}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-purple-400">{progress.percent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, #7c3aed, #a855f7)" }}
                        animate={{ width: `${progress.percent}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Style transfer typically takes 30–90 seconds depending on resolution.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Right: Preset selector + reference gallery ─── */}
            <div className="space-y-4">

              {/* Preset selector */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="px-5 py-4 border-b border-white/5">
                  <h2 className="text-sm font-semibold text-white">Step 1 — Choose Style</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Pick a design style preset</p>
                </div>
                <div className="p-4">
                  <StylePresetSelector
                    selectedPresetId={selectedPreset.id}
                    onSelectPreset={handlePresetSelect}
                    disabled={isGenerating}
                  />
                </div>
              </div>

              {/* Reference gallery */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="px-5 py-4 border-b border-white/5">
                  <h2 className="text-sm font-semibold text-white">Step 2 — Pick Reference</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Choose the exact look to apply</p>
                </div>
                <div className="p-4">
                  <StyleReferenceGallery
                    preset={selectedPreset}
                    selectedReferenceId={selectedReference?.id ?? null}
                    onSelectReference={handleReferenceSelect}
                    onUploadCustom={handleCustomRefUpload}
                    customReferenceUrl={customRefUrl}
                    disabled={isGenerating}
                  />
                </div>
              </div>

              {/* Generate CTA */}
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={cn(
                  "w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200",
                  canGenerate
                    ? "text-white hover:scale-[1.01] active:scale-[0.99]"
                    : "opacity-40 cursor-not-allowed text-gray-400"
                )}
                style={canGenerate ? {
                  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
                } : { background: "#1c1c1c" }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Apply Style Transfer
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </>
                )}
              </button>

              {/* Info note */}
              <div
                className="rounded-xl px-3 py-2.5 flex items-start gap-2"
                style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)" }}
              >
                <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-300/70 leading-relaxed">
                  The selected reference photo is used as the IP-Adapter input — the AI matches its colors, materials, and atmosphere to your room.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
