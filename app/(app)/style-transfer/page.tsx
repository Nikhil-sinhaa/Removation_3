// app/(app)/style-transfer/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ImageCropModal } from "@/components/shared/ImageCropModal";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/components/ui/use-toast";
import {
  Upload, Wand2, Loader2, AlertCircle, ArrowLeft, ArrowRight,
  Check, Sparkles, X, RefreshCw,
} from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { AIResultPanel } from "@/components/ai/AIResultPanel";
import {
  STYLE_PRESETS, StylePreset, RoomType,
  ROOM_TYPES, getPresetsByRoomType,
} from "@/config/style-presets";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLanguage } from '@/hooks/useLanguage';

type Step = 1 | 2 | 3 | 4;

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
  const { t } = useLanguage();
  const setInsufficientCreditsModalOpen = useUserStore(s => s.setInsufficientCreditsModalOpen);
  const { toast } = useToast();

  // ── Wizard state ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1);
  const [selectedRoomType,      setSelectedRoomType]      = useState<RoomType | null>(null);
  const [selectedPreset,        setSelectedPreset]        = useState<StylePreset | null>(null);
  const [selectedReferenceImage, setSelectedReferenceImage] = useState<string | null>(null);

  // Step 3 — dynamically fetched reference images
  const [refImages,        setRefImages]        = useState<string[]>([]);
  const [refImagesLoading, setRefImagesLoading] = useState(false);

  // ── Step 4 settings ──────────────────────────────────────────────────────────
  const [strength,          setStrength]          = useState(0.7);
  const [preserveStructure, setPreserveStructure] = useState(true);

  // ── Upload state ─────────────────────────────────────────────────────────────
  const [roomFile,    setRoomFile]    = useState<File | null>(null);
  const [roomPreview, setRoomPreview] = useState<string | null>(null);

  // ── Generation state ─────────────────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress,     setProgress]     = useState<ProgressState | null>(null);
  const [result,       setResult]       = useState<ResultState | null>(null);
  const [error,        setError]        = useState<string | null>(null);
  const [projectId,    setProjectId]    = useState<string | null>(null);
  const [renderId,     setRenderId]     = useState<string | null>(null);

  const isGeneratingRef = useRef(isGenerating);
  useEffect(() => { isGeneratingRef.current = isGenerating; }, [isGenerating]);

  const roomInputRef = useRef<HTMLInputElement>(null);
  const socketRef    = useRef<Socket | null>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  // ── Socket.IO ────────────────────────────────────────────────────────────────
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
      setResult({ beforeUrl: data.beforeUrl, afterUrl: data.afterUrl, runId: data.runId });
      toast({ title: "✨ Style transfer complete!", description: "Your room has been restyled." });
    });

    socketRef.current.on("comfy:style-transfer:error", (data: any) => {
      if (!isGeneratingRef.current) return;
      stopPolling();
      setIsGenerating(false);
      setProgress(null);
      setError(data.error || "Generation failed. Please try again.");
    });

    return () => { socketRef.current?.disconnect(); stopPolling(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch reference images whenever the user reaches step 3
  useEffect(() => {
    if (step !== 3 || !selectedPreset || !selectedRoomType) return;
    setRefImagesLoading(true);
    setRefImages([]);
    fetch(`/api/style-references?preset=${encodeURIComponent(selectedPreset.id)}&room=${encodeURIComponent(selectedRoomType)}`)
      .then(r => r.json())
      .then(d => setRefImages(d.images ?? []))
      .catch(() => setRefImages([]))
      .finally(() => setRefImagesLoading(false));
  }, [step, selectedPreset, selectedRoomType]);

  // ── Crop modal state ─────────────────────────────────────────────────────────
  const [cropOpen,    setCropOpen]    = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingUrl,  setPendingUrl]  = useState("");

  const applyRoomFile = useCallback((file: File, url: string) => {
    setRoomFile(file);
    setRoomPreview(url);
    setResult(null);
    setError(null);
  }, []);

  const openCrop = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPendingFile(file);
    setPendingUrl(url);
    setCropOpen(true);
  }, []);

  // ── Polling fallback ─────────────────────────────────────────────────────────
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
          setResult({ beforeUrl: data.originalImage || roomPreview || "", afterUrl: data.resultImage, runId: data._id });
        } else if (data.status === "failed") {
          stopPolling();
          setIsGenerating(false);
          setError(data.errorMessage || "Generation failed. Please try again.");
        }
      } catch { /* swallow */ }
    }, 4000);
  }, [stopPolling, roomPreview]);

  // ── Generate ─────────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!roomFile || !selectedPreset || !selectedRoomType || !selectedReferenceImage) {
      toast({ title: "Please complete all steps first", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setProgress({ stage: "preparing", percent: 5, label: "Preparing your request..." });
    setResult(null);
    setError(null);

    const fd = new FormData();
    fd.append("roomImage",          roomFile);
    fd.append("presetId",           selectedPreset.id);
    fd.append("roomType",           selectedRoomType);
    fd.append("referenceImageUrl",  selectedReferenceImage);
    fd.append("strength",           strength.toString());
    fd.append("preserveStructure",  preserveStructure.toString());

    try {
      const res  = await fetch("/api/ai/style-transfer", { method: "POST", body: fd });
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
      if (data.renderId) setRenderId(data.renderId);
      setProgress(null);
      startPolling(pid);
    } catch (err: any) {
      setIsGenerating(false);
      setProgress(null);
      setError(err.message || "Network error. Please try again.");
    }
  }, [roomFile, selectedPreset, selectedRoomType, selectedReferenceImage, strength, preserveStructure, startPolling, setInsufficientCreditsModalOpen, toast]);

  // ── Reset (back to step 1) ────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setStep(1);
    setSelectedRoomType(null);
    setSelectedPreset(null);
    setSelectedReferenceImage(null);
    setRefImages([]);
    setRoomFile(null);
    setRoomPreview(null);
    setResult(null);
    setError(null);
    setProgress(null);
    setProjectId(null);
    setRenderId(null);
    setIsGenerating(false);
    setStrength(0.7);
    setPreserveStructure(true);
    stopPolling();
  }, [stopPolling]);

  // ── Step navigation helpers ───────────────────────────────────────────────────
  const handleRoomTypeSelect = useCallback((roomType: RoomType) => {
    setSelectedRoomType(roomType);
    setSelectedPreset(null);
    setSelectedReferenceImage(null);
    setRefImages([]);
    setTimeout(() => setStep(2), 300);
  }, []);

  const handlePresetSelect = useCallback((preset: StylePreset) => {
    setSelectedPreset(preset);
    setSelectedReferenceImage(null);
    setTimeout(() => setStep(3), 300);
  }, []);

  const handleBack = useCallback(() => {
    setStep(s => (s > 1 ? ((s - 1) as Step) : s));
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const filteredPresets = selectedRoomType ? getPresetsByRoomType(selectedRoomType) : STYLE_PRESETS;
  const canGenerate     = !!roomFile && !isGenerating;

  // ── Summary breadcrumb ────────────────────────────────────────────────────────
  const roomMeta = ROOM_TYPES.find(r => r.id === selectedRoomType);

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", fontFamily: "'Inter', sans-serif" }}>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div
        className="relative px-3 py-6 md:px-6 md:py-8 mb-4"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(59,130,246,0.06) 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 0 20px rgba(124,58,237,0.4)" }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('style_tr_title')}</h1>
              <p className="text-xs text-purple-300/70">AI-powered visual style matching</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16">

        {/* ── Result view ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AIResultPanel
                originalImageUrl={result.beforeUrl}
                resultImageUrl={result.afterUrl}
                toolName="Style Transfer"
                featureLabel="Style Transfer"
                renderId={renderId ?? undefined}
                showMakeItReal={false}
                onTryAgain={handleReset}
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try another style
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-colors disabled:opacity-40"
                  style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Regenerate
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Wizard ───────────────────────────────────────────────────────── */}
        {!result && (
          <>
            {/* Progress indicator + back + summary */}
            <div className="mb-7 space-y-3">
              {/* Step dots + back button */}
              <div className="flex items-center gap-3">
                {step > 1 && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors flex-shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                )}

                <div className="flex items-center gap-1.5 flex-1">
                  {([1, 2, 3, 4] as Step[]).map((s) => (
                    <div key={s} className="flex items-center gap-1.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 flex-shrink-0"
                        style={
                          s < step
                            ? { background: "#7c3aed", color: "#fff" }
                            : s === step
                            ? { background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", boxShadow: "0 0 14px rgba(124,58,237,0.5)" }
                            : { background: "#1a1a1a", color: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.08)" }
                        }
                      >
                        {s < step ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : s}
                      </div>
                      {s < 4 && (
                        <div
                          className="h-px flex-1 min-w-[20px] max-w-[48px] rounded-full transition-all duration-300"
                          style={{ background: s < step ? "#7c3aed" : "rgba(255,255,255,0.08)" }}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <span className="text-xs text-gray-600 flex-shrink-0">
                  {["Room", "Style", "Reference", "Generate"][step - 1]}
                </span>
              </div>

              {/* Summary breadcrumb */}
              {step > 1 && roomMeta && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: "rgba(124,58,237,0.18)", color: "#c4b5fd" }}
                  >
                    {roomMeta.emoji} {roomMeta.label}
                  </span>
                  {selectedPreset && (
                    <>
                      <span className="text-gray-700 text-xs">›</span>
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: "rgba(124,58,237,0.18)", color: "#c4b5fd" }}
                      >
                        {selectedPreset.icon} {selectedPreset.label}
                      </span>
                    </>
                  )}
                  {selectedReferenceImage && (
                    <>
                      <span className="text-gray-700 text-xs">›</span>
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: "rgba(124,58,237,0.18)", color: "#c4b5fd" }}
                      >
                        Reference selected
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── Step content ─────────────────────────────────────────────── */}
            <AnimatePresence mode="wait">

              {/* STEP 1 — Room Type */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="mb-7">
                    <h2 className="text-xl font-bold text-white mb-1.5">What type of room are you redesigning?</h2>
                    <p className="text-sm text-gray-400">We'll use the most relevant design references for your room</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {ROOM_TYPES.map(room => {
                      const isSelected = selectedRoomType === room.id;
                      return (
                        <motion.button
                          key={room.id}
                          onClick={() => handleRoomTypeSelect(room.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          className="relative flex flex-col items-center justify-center gap-3 rounded-2xl p-8 transition-all duration-200 text-center"
                          style={{
                            background: isSelected ? "rgba(124,58,237,0.15)" : "#111111",
                            border: isSelected ? "2px solid #7c3aed" : "1px solid rgba(255,255,255,0.08)",
                            boxShadow: isSelected ? "0 0 28px rgba(124,58,237,0.2)" : "none",
                          }}
                        >
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            </div>
                          )}
                          <span className="text-5xl leading-none">{room.emoji}</span>
                          <div>
                            <p className={cn("text-sm font-semibold", isSelected ? "text-purple-300" : "text-white")}>
                              {room.label}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{room.description}</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 2 — Style Preset */}
              {step === 2 && selectedRoomType && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="mb-7">
                    <h2 className="text-xl font-bold text-white mb-1.5">Choose your design style</h2>
                    <p className="text-sm text-gray-400">
                      Showing styles available for{" "}
                      <span className="text-purple-300">{roomMeta?.label}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredPresets.map(preset => {
                      const isSelected = selectedPreset?.id === preset.id;
                      const thumb = preset.getReferenceImage(selectedRoomType);
                      return (
                        <motion.button
                          key={preset.id}
                          onClick={() => handlePresetSelect(preset)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          className="relative flex flex-col rounded-2xl overflow-hidden text-left transition-all duration-200"
                          style={{
                            background: isSelected ? "rgba(124,58,237,0.1)" : "#111111",
                            border: isSelected ? "2px solid #7c3aed" : "1px solid rgba(255,255,255,0.08)",
                            boxShadow: isSelected ? "0 0 22px rgba(124,58,237,0.18)" : "none",
                          }}
                        >
                          <div className="relative w-full bg-gray-900" style={{ aspectRatio: "16/9" }}>
                            <Image
                              src={thumb}
                              alt={preset.label}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            {isSelected && (
                              <>
                                <div className="absolute inset-0" style={{ background: "rgba(124,58,237,0.12)" }} />
                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center shadow">
                                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                </div>
                              </>
                            )}
                          </div>
                          <div className="px-3 py-2.5">
                            <p className={cn("text-xs font-semibold flex items-center gap-1.5", isSelected ? "text-purple-300" : "text-white")}>
                              <span>{preset.icon}</span> {preset.label}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                              {preset.description}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 3 — Reference Image */}
              {step === 3 && selectedPreset && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="mb-7">
                    <h2 className="text-xl font-bold text-white mb-1.5">Pick a reference image</h2>
                    <p className="text-sm text-gray-400">
                      Choose which{" "}
                      <span className="text-purple-300">{selectedPreset.label}</span>{" "}
                      photo to use as the style reference
                    </p>
                  </div>

                  {refImagesLoading && (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                    </div>
                  )}

                  {!refImagesLoading && refImages.length === 0 && (
                    <div className="text-center py-16 text-sm text-gray-500">
                      No reference images found for this combination.
                    </div>
                  )}

                  {!refImagesLoading && refImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {refImages.map((imgUrl) => {
                        const isSelected = selectedReferenceImage === imgUrl;
                        return (
                          <motion.button
                            key={imgUrl}
                            onClick={() => setSelectedReferenceImage(imgUrl)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className="relative rounded-xl overflow-hidden transition-all duration-200"
                            style={{
                              border: isSelected ? "2px solid #7c3aed" : "2px solid transparent",
                              boxShadow: isSelected ? "0 0 22px rgba(124,58,237,0.35)" : "none",
                              outline: isSelected ? "none" : undefined,
                            }}
                          >
                            <div className="relative w-full bg-gray-900" style={{ aspectRatio: "4/3" }}>
                              <Image
                                src={imgUrl}
                                alt="Style reference"
                                fill
                                className="object-cover"
                                unoptimized
                              />
                              {isSelected && (
                                <>
                                  <div className="absolute inset-0" style={{ background: "rgba(124,58,237,0.15)" }} />
                                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center shadow">
                                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                  </div>
                                </>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-7">
                    <button
                      onClick={() => selectedReferenceImage && setStep(4)}
                      disabled={!selectedReferenceImage}
                      className={cn(
                        "w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200",
                        selectedReferenceImage ? "text-white hover:scale-[1.01] active:scale-[0.99]" : "opacity-40 cursor-not-allowed text-gray-400"
                      )}
                      style={selectedReferenceImage ? {
                        background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                        boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
                      } : { background: "#1c1c1c" }}
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    {!selectedReferenceImage && !refImagesLoading && refImages.length > 0 && (
                      <p className="text-[11px] text-gray-600 text-center mt-2">Select a reference image above to continue</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 4 — Upload & Generate */}
              {step === 4 && selectedPreset && selectedReferenceImage && selectedRoomType && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="mb-7">
                    <h2 className="text-xl font-bold text-white mb-1.5">Upload your room photo</h2>
                    <p className="text-sm text-gray-400">
                      We'll redesign it in{" "}
                      <span className="text-purple-300">{selectedPreset.label}</span>
                      {" "}style using your selected reference
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                    {/* Left: upload + progress + error */}
                    <div className="space-y-4">
                      <div
                        className="rounded-2xl overflow-hidden"
                        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        <div className="p-4">
                          {roomPreview ? (
                            <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                              <Image src={roomPreview} alt="Room preview" fill className="object-cover" />
                              <button
                                onClick={() => { setRoomFile(null); setRoomPreview(null); }}
                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) openCrop(f); }}
                              onDragOver={e => e.preventDefault()}
                              onClick={() => roomInputRef.current?.click()}
                              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 hover:border-purple-500/50 hover:bg-purple-500/5"
                              style={{ aspectRatio: "16/9", borderColor: "rgba(255,255,255,0.12)" }}
                            >
                              <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                style={{ background: "rgba(124,58,237,0.15)" }}
                              >
                                <Upload className="w-6 h-6 text-purple-400" />
                              </div>
                              <div className="text-center px-4">
                                <p className="text-sm font-medium text-gray-300">Drop your room photo here</p>
                                <p className="text-xs text-gray-500 mt-1">or click to browse — JPG, PNG, WEBP up to 10MB</p>
                              </div>
                            </div>
                          )}
                          <input
                            ref={roomInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; e.currentTarget.value = ""; if (f) openCrop(f); }}
                          />
                        </div>
                      </div>

                      {/* Error */}
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
                                <span className="text-xs font-medium text-purple-300">{progress.label}</span>
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
                            <p className="text-[11px] text-gray-500">Style transfer typically takes 30–90 seconds.</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Right: settings + generate */}
                    <div className="space-y-4">
                      {/* Settings */}
                      <div
                        className="rounded-2xl p-4 space-y-5"
                        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        {/* Strength slider */}
                        <div>
                          <div className="flex items-center justify-between mb-2.5">
                            <label className="text-xs font-semibold text-white">How much to change</label>
                            <span className="text-xs font-mono text-purple-400">{Math.round(strength * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min={30}
                            max={90}
                            step={1}
                            value={Math.round(strength * 100)}
                            onChange={e => setStrength(parseInt(e.target.value) / 100)}
                            className="w-full accent-purple-500 cursor-pointer"
                          />
                          <div className="flex justify-between mt-1.5">
                            <span className="text-[10px] text-gray-600">Subtle</span>
                            <span className="text-[10px] text-gray-600">Complete transformation</span>
                          </div>
                        </div>

                        {/* Preserve structure toggle */}
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-white">Keep room layout</p>
                            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                              Preserve walls, floor plan and furniture positions
                            </p>
                          </div>
                          <button
                            onClick={() => setPreserveStructure(p => !p)}
                            className="relative flex-shrink-0 rounded-full transition-all duration-200"
                            style={{
                              width: 40, height: 22,
                              background: preserveStructure ? "#7c3aed" : "#2a2a2a",
                            }}
                          >
                            <div
                              className="absolute top-0.5 rounded-full bg-white transition-all duration-200"
                              style={{ width: 18, height: 18, left: preserveStructure ? 20 : 2 }}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Generate button */}
                      <button
                        onClick={handleGenerate}
                        disabled={!canGenerate}
                        className={cn(
                          "w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200",
                          canGenerate
                            ? "text-white hover:scale-[1.01] active:scale-[0.99]"
                            : "opacity-40 cursor-not-allowed text-gray-400"
                        )}
                        style={canGenerate ? {
                          background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                          boxShadow: "0 4px 24px rgba(124,58,237,0.4)",
                        } : { background: "#1c1c1c" }}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-5 h-5" />
                            Generate Style
                          </>
                        )}
                      </button>

                      {!roomFile && !isGenerating && (
                        <p className="text-[11px] text-gray-600 text-center">
                          Upload your room photo above to enable generation
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </>
        )}
      </div>

      {/* ── Crop modal ─────────────────────────────────────────────────────── */}
      <ImageCropModal
        isOpen={cropOpen}
        imageFile={pendingFile}
        imageUrl={pendingUrl}
        title="Crop your room photo"
        onConfirm={(croppedFile, croppedUrl) => {
          setCropOpen(false);
          if (pendingUrl) URL.revokeObjectURL(pendingUrl);
          setPendingFile(null);
          setPendingUrl("");
          applyRoomFile(croppedFile, croppedUrl);
        }}
        onCancel={() => {
          setCropOpen(false);
          const f = pendingFile;
          const u = pendingUrl;
          setPendingFile(null);
          setPendingUrl("");
          if (f) applyRoomFile(f, u);
        }}
      />
    </div>
  );
}
