// app/(app)/room-changer/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BeforeAfterSlider } from "@/components/ui/before-after-slider";
import { ColorPicker, ColorValue } from "@/components/roomChanger/ColorPicker";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/components/ui/use-toast";
import {
  Upload,
  Wand2,
  CheckCircle,
  Loader2,
  Image as ImageIcon,
  Paintbrush,
  AlertCircle,
  RotateCcw,
  Download,
  RefreshCw,
  BookmarkCheck,
} from "lucide-react";
import { MakeItReal } from "@/components/ai/MakeItReal";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserStore } from '@/stores/user-store';

interface ProgressState {
  stage: number; // 1 = scene analysis, 2 = repainting
  percent: number;
  label?: string;
  labelKey?: string;
}

interface ResultState {
  beforeUrl: string;
  afterUrl: string;
  runId: string;
  canRetryStage3: boolean;
}

interface FeedbackState {
  rating: 'up' | 'down' | null;
  text: string;
  submitted: boolean;
  submitting: boolean;
}

export default function RoomChangerPage() {
  const { t } = useLanguage();
  const setInsufficientCreditsModalOpen = useUserStore(s => s.setInsufficientCreditsModalOpen);
  // ── Core state ─────────────────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]     = useState<string | null>(null);
  const [color, setColor]               = useState<ColorValue>({ name: "", hex: "" });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress]         = useState<ProgressState | null>(null);
  const [result, setResult]             = useState<ResultState | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [projectId, setProjectId]       = useState<string | null>(null);
  const [feedback, setFeedback]         = useState<FeedbackState>({ rating: null, text: "", submitted: false, submitting: false });

  const isGeneratingRef = useRef(isGenerating);
  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef    = useRef<Socket | null>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  // ── Socket.IO ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_COMFY_WS || "http://localhost:3001";
    const socket = io(wsUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on("comfy:roomchanger:start", () => {
      setProgress({ stage: 1, percent: 0, labelKey: "rc_analyzing" });
    });

    socket.on("comfy:roomchanger:stage", (data: any) => {
      if (data.stage === 1) {
        setProgress({
          stage: 1,
          percent: data.status === "done" || data.status === "skipped" ? 100 : 10,
          labelKey: data.status === "done" || data.status === "skipped"
            ? "rc_analyzing_done"
            : "rc_analyzing",
        });
      } else if (data.stage === 2) {
        setProgress({
          stage: 2,
          percent: data.status === "done" ? 100 : 20,
          labelKey: data.status === "done"
            ? "rc_repainting_done"
            : undefined,
          label: data.status === "done" ? undefined : data.name || undefined,
        });
      }
    });

    socket.on("comfy:progress", (data: any) => {
      if (!isGeneratingRef.current) return;
      setProgress(prev => prev
        ? { ...prev, percent: Math.round(data.progress || prev.percent) }
        : null
      );
    });

    socket.on("comfy:roomchanger:done", (data: any) => {
      stopPolling();
      setProgress({ stage: 2, percent: 100, labelKey: "rc_done" });
      setResult({
        beforeUrl: data.beforeUrl + "?t=" + Date.now(),
        afterUrl:  data.afterUrl  + "?t=" + Date.now(),
        runId: data.runId,
        canRetryStage3: false,
      });
      setFeedback({ rating: null, text: "", submitted: false, submitting: false });
      setIsGenerating(false);
    });

    socket.on("comfy:roomchanger:error", (data: any) => {
      stopPolling();
      setError(data.error || t("rc_failed"));
      setIsGenerating(false);
      if (data.canRetryStage3 && data.runId) {
        setResult(prev => prev
          ? { ...prev, canRetryStage3: true }
          : { beforeUrl: "", afterUrl: "", runId: data.runId, canRetryStage3: true }
        );
      }
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); stopPolling(); };
  }, [stopPolling]);

  // ── File upload ────────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = async (opts: { retryRunId?: string } = {}) => {
    if (!color.hex && !opts.retryRunId) { setError(t("select_wall_color")); return; }
    if (!selectedFile && !opts.retryRunId) { setError(t("upload_room_photo")); return; }

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setProgress({ stage: 1, percent: 0, labelKey: "rc_starting" });

    try {
      const formData = new FormData();
      if (selectedFile && !opts.retryRunId) formData.append("roomImage", selectedFile);
      formData.append("colorName", color.name);
      formData.append("hex", color.hex);
      if (opts.retryRunId) formData.append("retryRunId", opts.retryRunId);

      const res = await fetch("/api/ai/room-changer/generate", {
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
        throw new Error(data.error || t("rc_submission_failed"));
      }

      setProjectId(data.projectId);

      // Fallback polling in case Socket.IO misses events
      stopPolling();
      const pid = data.projectId;
      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/ai/room-changer/generate?projectId=${pid}`);
          if (!pollRes.ok) return;
          const proj = await pollRes.json();
          if (proj.status === "completed" && proj.afterUrl) {
            stopPolling();
            setResult({
              beforeUrl: proj.beforeUrl + "?t=" + Date.now(),
              afterUrl:  proj.afterUrl  + "?t=" + Date.now(),
              runId: proj.runId || "",
              canRetryStage3: false,
            });
            setProgress({ stage: 2, percent: 100, labelKey: "rc_done" });
            setIsGenerating(false);
          } else if (proj.status === "failed") {
            stopPolling();
            setError(proj.errorMessage || t("rc_pipeline_failed"));
            setIsGenerating(false);
          }
        } catch { /* ignore poll errors */ }
      }, 3000);

    } catch (err: any) {
      setError(err.message || t("rc_network_error"));
      setIsGenerating(false);
    }
  };

  const handleTryAnother = () => {
    setResult(null);
    setError(null);
    setProgress(null);
    setProjectId(null);
    setFeedback({ rating: null, text: "", submitted: false, submitting: false });
  };

  const handleFeedbackRating = (rating: 'up' | 'down') => {
    if (feedback.submitted || feedback.rating !== null) return;
    setFeedback(prev => ({ ...prev, rating }));
  };

  const handleFeedbackSubmit = async () => {
    if (!result?.runId || !feedback.rating || feedback.submitting || feedback.submitted) return;
    setFeedback(prev => ({ ...prev, submitting: true }));
    try {
      await fetch('/api/ai/room-changer/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: result.runId, rating: feedback.rating, text: feedback.text }),
      });
    } catch { /* ignore — best-effort */ }
    setFeedback(prev => ({ ...prev, submitting: false, submitted: true }));
  };

  const canGenerate = !isGenerating;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {t("rc_repaint_title")}
          </h1>
          <p className="text-lg text-gray-600 mb-3">
            {t("rc_repaint_desc")}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Badge className="bg-violet-100 text-violet-800"><Wand2 className="w-3 h-3 mr-1" />{t("rc_repaint_sam2")}</Badge>
            <Badge className="bg-purple-100 text-purple-800"><Paintbrush className="w-3 h-3 mr-1" />{t("rc_repaint_sdxl")}</Badge>
            <Badge className="bg-indigo-100 text-indigo-800"><CheckCircle className="w-3 h-3 mr-1" />{t("rc_repaint_preset")}</Badge>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Left Panel: Inputs ──────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Image Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="w-4 h-4" />{t("rc_repaint_upload_title")}
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
              {!previewUrl ? (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                >
                  <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 font-medium">{t("rc_repaint_drop_photo")}</p>
                  <p className="text-xs text-gray-400 mt-1">{t("rc_repaint_max_size")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden border border-gray-200">
                    <img src={previewUrl} alt="Room preview" className="w-full h-52 object-cover" />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-2" />{t("rc_repaint_change_image")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Color Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Paintbrush className="w-4 h-4" />{t("rc_repaint_choose_color")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ColorPicker value={color} onChange={setColor} disabled={isGenerating} />
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={() => handleGenerate()}
            disabled={!canGenerate}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
            size="lg"
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("rc_repaint_generating")}</>
            ) : (
              <><Wand2 className="w-4 h-4 mr-2" />{t("rc_repaint_generate")}</>
            )}
          </Button>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{error}</p>
                  {result?.canRetryStage3 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => handleGenerate({ retryRunId: result.runId })}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />{t("rc_repaint_retry_saved")}
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Right Panel: Output ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="w-4 h-4" />{t("rc_repaint_result")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Idle state */}
              {!isGenerating && !result && !progress && (
                <div className="flex flex-col items-center justify-center h-80 text-center text-gray-400 space-y-3">
                  <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <Paintbrush className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">{t("rc_repaint_will_appear")}</p>
                  <p className="text-xs text-gray-400">{t("rc_repaint_instructions")}</p>
                </div>
              )}

              {/* Progress / loading state */}
              <AnimatePresence>
                {isGenerating && progress && (
                  <motion.div
                    key="progress"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4 py-4"
                  >
                    {/* Two-step progress */}
                    {[
                      { id: 1, label: t("rc_repaint_analyzing") },
                      { id: 2, label: t("rc_repaint_repainting", { color: color.name || t("rc_repaint_chosen_color_text") }) },
                    ].map(step => {
                      const isDone = progress.stage > step.id;
                      const isActive = progress.stage === step.id;
                      return (
                        <div key={step.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className={
                              isDone   ? "text-green-600 font-medium" :
                              isActive ? "text-violet-700 font-medium" :
                              "text-gray-400"
                            }>
                              {isDone ? "✓ " : isActive ? "◎ " : "○ "}
                              {step.label}
                            </span>
                            {isActive && (
                              <span className="text-xs text-violet-600 font-mono">
                                {progress.percent}%
                              </span>
                            )}
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <motion.div
                              className={
                                isDone   ? "bg-green-500 h-1.5 rounded-full" :
                                isActive ? "bg-violet-600 h-1.5 rounded-full" :
                                "bg-gray-200 h-1.5 rounded-full"
                              }
                              initial={{ width: 0 }}
                              animate={{
                                width: isDone ? "100%" : isActive ? `${progress.percent}%` : "0%",
                              }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    <div className="text-center text-xs text-gray-500 pt-2">{progress.label}</div>

                    {previewUrl && (
                      <div className="mt-4 opacity-40">
                        <img src={previewUrl} alt="Processing" className="w-full rounded-xl object-cover h-48" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Done state: Before/After slider */}
              <AnimatePresence>
                {result?.afterUrl && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <BeforeAfterSlider
                      beforeImage={result.beforeUrl}
                      afterImage={result.afterUrl}
                      beforeLabel={t("rc_repaint_original")}
                      afterLabel={color.name || t("rc_repaint_recolored")}
                    />

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = result.afterUrl;
                          a.download = `room-changer-${color.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.png`;
                          a.click();
                        }}
                        className="flex-1"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />{t("rc_repaint_download")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          toast({
                            title: t("rc_repaint_saved_title"),
                            description: t("rc_repaint_saved_desc", { color: color.name }),
                          });
                        }}
                        className="flex-1"
                      >
                        <BookmarkCheck className="w-3.5 h-3.5 mr-1.5" />{t("rc_repaint_save_to_project")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleTryAnother}
                        className="flex-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />{t("rc_repaint_try_another")}
                      </Button>
                    </div>

                    {/* Make It Real — connect render to a real designer */}
                    <MakeItReal
                      roomType="living-room"
                      afterImage={result.afterUrl}
                    />

                    {/* Feedback */}
                    <div className="pt-3 border-t border-gray-100">
                      {feedback.submitted ? (
                        <p className="text-center text-sm text-green-600 font-medium">{t("rc_repaint_thanks_feedback")}</p>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-gray-700 text-center">{t("rc_repaint_happy_result")}</p>
                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={() => handleFeedbackRating('up')}
                              disabled={feedback.rating !== null}
                              className={`text-2xl px-5 py-2 rounded-xl border-2 transition-colors ${
                                feedback.rating === 'up'
                                  ? 'border-green-500 bg-green-50'
                                  : feedback.rating !== null
                                  ? 'border-gray-200 opacity-40 cursor-not-allowed'
                                  : 'border-gray-200 hover:border-green-400 hover:bg-green-50 cursor-pointer'
                              }`}
                              aria-label="Thumbs up"
                            >
                              👍
                            </button>
                            <button
                              onClick={() => handleFeedbackRating('down')}
                              disabled={feedback.rating !== null}
                              className={`text-2xl px-5 py-2 rounded-xl border-2 transition-colors ${
                                feedback.rating === 'down'
                                  ? 'border-red-400 bg-red-50'
                                  : feedback.rating !== null
                                  ? 'border-gray-200 opacity-40 cursor-not-allowed'
                                  : 'border-gray-200 hover:border-red-300 hover:bg-red-50 cursor-pointer'
                              }`}
                              aria-label="Thumbs down"
                            >
                              👎
                            </button>
                          </div>
                          {feedback.rating && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-2"
                            >
                              <p className="text-xs text-gray-500 text-center">
                                {feedback.rating === 'up' ? t("rc_repaint_glad_liked") : t("rc_repaint_sorry_improve")}
                              </p>
                              <textarea
                                value={feedback.text}
                                onChange={e => setFeedback(prev => ({ ...prev, text: e.target.value }))}
                                maxLength={1000}
                                rows={2}
                                placeholder={feedback.rating === 'up' ? t("rc_repaint_feedback_worked") : t("rc_repaint_feedback_wrong")}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder:text-gray-400"
                              />
                              <Button
                                size="sm"
                                onClick={handleFeedbackSubmit}
                                disabled={feedback.submitting}
                                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                              >
                                {feedback.submitting ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />{t("rc_repaint_submitting")}</> : t("rc_repaint_submit")}
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      )}
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
