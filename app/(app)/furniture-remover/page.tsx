// app/(app)/furniture-remover/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Paintbrush,
  AlertCircle,
  RotateCcw,
  Download,
  RefreshCw,
  BookmarkCheck,
  Eraser,
  Undo2,
  Trash2,
  SlidersHorizontal,
} from "lucide-react";

interface ProgressState {
  stage: number;
  percent: number;
  label: string;
}

interface ResultState {
  beforeUrl: string;
  afterUrl: string;
  runId: string;
}

interface FeedbackState {
  rating: 'up' | 'down' | null;
  text: string;
  submitted: boolean;
  submitting: boolean;
}

const PRESET_CATEGORIES = [
  "sofa", "chair", "table", "bed", "cabinet", "lamp", "rug", "plants", "clutter"
];

// Helper to convert red-drawn display canvas mask to white-on-black PNG blob,
// scaled up perfectly to the original image resolution to prevent alignment issues.
async function exportMaskAsWhiteOnBlack(
  sourceCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // 1. Create canvas matching high-res target (original image) resolution
    const output = document.createElement("canvas");
    output.width  = targetWidth;
    output.height = targetHeight;
    const ctx = output.getContext("2d");
    if (!ctx) return reject(new Error("Could not get high-res canvas context"));

    // 2. Fill background as pure black (non-mask)
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, output.width, output.height);

    // 3. Draw display canvas content onto offscreen display-sized canvas to process raw pixel data
    const temp = document.createElement("canvas");
    temp.width = sourceCanvas.width;
    temp.height = sourceCanvas.height;
    const tempCtx = temp.getContext("2d");
    if (!tempCtx) return reject(new Error("Could not get temp canvas context"));
    tempCtx.drawImage(sourceCanvas, 0, 0);

    const srcData = tempCtx.getImageData(0, 0, temp.width, temp.height);
    const dstData = tempCtx.createImageData(temp.width, temp.height);

    // 4. Convert transparent/red brush strokes to white, and empty space to opaque black
    for (let i = 0; i < srcData.data.length; i += 4) {
      const r = srcData.data[i];
      const g = srcData.data[i + 1];
      const b = srcData.data[i + 2];
      const a = srcData.data[i + 3];

      // Detect red brush strokes (rgba(239, 68, 68, 0.4) overlay)
      const isRed = a > 10 && r > 100 && r > g * 1.2 && r > b * 1.2;
      if (isRed) {
        dstData.data[i]     = 255; // R
        dstData.data[i + 1] = 255; // G
        dstData.data[i + 2] = 255; // B
        dstData.data[i + 3] = 255; // A (fully opaque white)
      } else {
        dstData.data[i]     = 0;
        dstData.data[i + 1] = 0;
        dstData.data[i + 2] = 0;
        dstData.data[i + 3] = 255; // A (fully opaque black)
      }
    }
    tempCtx.putImageData(dstData, 0, 0);

    // 5. Upscale cleanly to target resolution and draw onto output canvas
    ctx.drawImage(temp, 0, 0, targetWidth, targetHeight);

    output.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to create blob from canvas"));
      }
    }, "image/png");
  });
}

export default function FurnitureRemoverPage() {
  // ── Mode & Core State ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab]       = useState<'auto' | 'manual'>('auto');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]     = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress]         = useState<ProgressState | null>(null);
  const [result, setResult]             = useState<ResultState | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [projectId, setProjectId]       = useState<string | null>(null);
  const [feedback, setFeedback]         = useState<FeedbackState>({ rating: null, text: "", submitted: false, submitting: false });

  // ── Auto Mode Parameters ───────────────────────────────────────────────────
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["sofa", "chair", "table", "bed", "cabinet", "lamp"]);
  const [customPrompt, setCustomPrompt]             = useState<string>("");
  const [threshold, setThreshold]                   = useState<number>(0.3);
  const [growMaskExpand, setGrowMaskExpand]         = useState<number>(10);
  const [invertMask, setInvertMask]                 = useState<boolean>(false);

  // ── Manual Mode (Canvas Painting) Parameters ──────────────────────────────
  const [brushSize, setBrushSize]                   = useState<number>(20);
  const [canvasHistory, setCanvasHistory]           = useState<string[]>([]); // Base64 history for undo

  // Refs for elements
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const socketRef     = useRef<Socket | null>(null);
  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const imageRef      = useRef<HTMLImageElement>(null);
  const isDrawingRef  = useRef<boolean>(false);

  const isGeneratingRef = useRef(isGenerating);
  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  const { toast } = useToast();

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  // ── Socket.IO Connection ───────────────────────────────────────────────────
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_COMFY_WS || "http://localhost:3001";
    const socket = io(wsUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on("comfy:furniture-remover:start", () => {
      setProgress({ stage: 1, percent: 0, label: "Initializing ComfyUI graph…" });
    });

    socket.on("comfy:furniture-remover:stage", (data: any) => {
      setProgress({
        stage: 1,
        percent: data.status === "done" ? 100 : 35,
        label: data.name || "Processing removal request…",
      });
    });

    socket.on("comfy:progress", (data: any) => {
      if (!isGeneratingRef.current) return;
      setProgress(prev => prev
        ? { ...prev, percent: Math.round(data.progress || prev.percent) }
        : null
      );
    });

    socket.on("comfy:furniture-remover:done", (data: any) => {
      stopPolling();
      setProgress({ stage: 1, percent: 100, label: "Removal complete!" });
      setResult({
        beforeUrl: data.beforeUrl + "?t=" + Date.now(),
        afterUrl:  data.afterUrl  + "?t=" + Date.now(),
        runId:     data.runId,
      });
      setFeedback({ rating: null, text: "", submitted: false, submitting: false });
      setIsGenerating(false);
    });

    socket.on("comfy:furniture-remover:error", (data: any) => {
      stopPolling();
      setError(data.error || "Generation error");
      setIsGenerating(false);
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); stopPolling(); };
  }, [stopPolling]);

  // ── File Selection ─────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
    setCanvasHistory([]);
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
    setCanvasHistory([]);
  };

  // ── Auto Mode category selection toggles ──────────────────────────────────
  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // ── Interactive Canvas Mask Editor Logic ───────────────────────────────────
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imageRef.current;
    if (!canvas || !img) return;

    // Matches physical drawing dimensions to matched client display bounds
    canvas.width  = img.clientWidth;
    canvas.height = img.clientHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineCap  = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(239, 68, 68, 0.4)"; // Soft red brush overlay
    ctx.fillStyle   = "rgba(239, 68, 68, 0.4)";
  }, []);

  // Recalculates canvas sizing when image loads or screen resizes
  useEffect(() => {
    if (previewUrl && activeTab === 'manual') {
      const timer = setTimeout(initCanvas, 150); // slight offset to allow ref sizing calculations
      window.addEventListener("resize", initCanvas);
      return () => {
        window.removeEventListener("resize", initCanvas);
        clearTimeout(timer);
      };
    }
  }, [previewUrl, activeTab, initCanvas]);

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setCanvasHistory(prev => [...prev, dataUrl]);
  };

  const undoLastDraw = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext("2d");
    const img    = imageRef.current;
    if (!canvas || !ctx || !img) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (canvasHistory.length <= 1) {
      setCanvasHistory([]);
      return;
    }

    const nextHistory = [...canvasHistory];
    nextHistory.pop(); // remove current state
    const prevState = nextHistory[nextHistory.length - 1];

    const prevImg = new Image();
    prevImg.onload = () => {
      ctx.drawImage(prevImg, 0, 0);
    };
    prevImg.src = prevState;
    setCanvasHistory(nextHistory);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCanvasHistory([]);
  };

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isGenerating) return;
    isDrawingRef.current = true;
    const coords = getCanvasCoords(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || isGenerating) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.lineWidth = brushSize;
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      saveCanvasState();
    }
  };

  // ── Action: Generation submission ──────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedFile) { setError("Please upload a room photo first."); return; }

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setProgress({ stage: 1, percent: 0, label: "Initiating backend task…" });

    try {
      const formData = new FormData();
      formData.append("roomImage", selectedFile);
      formData.append("mode", activeTab);
      formData.append("growMaskExpand", String(growMaskExpand));
      formData.append("invertMask", String(invertMask));

      if (activeTab === 'auto') {
        const promptList = [...selectedCategories];
        if (customPrompt.trim()) {
          promptList.push(...customPrompt.split(',').map(s => s.trim()));
        }
        const finalPrompt = [...new Set(promptList)].filter(Boolean).join(', ');
        if (!finalPrompt) {
          throw new Error("Please select at least one furniture category or enter custom labels.");
        }
        formData.append("prompt", finalPrompt);
        formData.append("threshold", String(threshold));
      } else {
        // Manual mode: Export overlay canvas scaled to exact full size original resolution
        const canvas = canvasRef.current;
        const img    = imageRef.current;
        if (!canvas || !img) {
          throw new Error("Draw tool state missing or failed to initialize.");
        }
        if (canvasHistory.length === 0) {
          throw new Error("Please paint/brush over the furniture area you wish to remove.");
        }

        const maskBlob = await exportMaskAsWhiteOnBlack(
          canvas,
          img.naturalWidth,
          img.naturalHeight
        );
        const maskFile = new File([maskBlob], "mask.png", { type: "image/png" });
        formData.append("userMask", maskFile);
      }

      const res = await fetch("/api/ai/furniture-remover/generate", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to trigger removal process.");
      }

      setProjectId(data.projectId);

      // Fallback status polling active concurrently
      stopPolling();
      const pid = data.projectId;
      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/ai/furniture-remover/generate?projectId=${pid}`);
          if (!pollRes.ok) return;
          const proj = await pollRes.json();
          if (proj.status === "completed" && proj.afterUrl) {
            stopPolling();
            setResult({
              beforeUrl: proj.beforeUrl + "?t=" + Date.now(),
              afterUrl:  proj.afterUrl  + "?t=" + Date.now(),
              runId:     proj.runId || "",
            });
            setProgress({ stage: 1, percent: 100, label: "Done!" });
            setIsGenerating(false);
          } else if (proj.status === "failed") {
            stopPolling();
            setError(proj.errorMessage || "Generation crashed on backend.");
            setIsGenerating(false);
          }
        } catch { /* ignore best-effort poll errors */ }
      }, 3000);

    } catch (err: any) {
      setError(err.message || "Network error. Please check your connection.");
      setIsGenerating(false);
    }
  };

  const handleTryAnother = () => {
    setResult(null);
    setError(null);
    setProgress(null);
    setProjectId(null);
    setFeedback({ rating: null, text: "", submitted: false, submitting: false });
    setCanvasHistory([]);
  };

  // ── Feedback submissions ───────────────────────────────────────────────────
  const handleFeedbackRating = (rating: 'up' | 'down') => {
    if (feedback.submitted || feedback.rating !== null) return;
    setFeedback(prev => ({ ...prev, rating }));
  };

  const handleFeedbackSubmit = async () => {
    if (!result?.runId || !feedback.rating || feedback.submitting || feedback.submitted) return;
    setFeedback(prev => ({ ...prev, submitting: true }));
    try {
      await fetch('/api/ai/furniture-remover/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: result.runId, rating: feedback.rating, text: feedback.text }),
      });
    } catch { /* best effort */ }
    setFeedback(prev => ({ ...prev, submitting: false, submitted: true }));
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Title Header */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-red-500 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
            Furniture Remover
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Automatically detect and remove furniture, or paint over specific zones manually
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Badge className="bg-red-50 text-red-700 border-red-100"><Wand2 className="w-3 h-3 mr-1.5" />Auto AI Segment</Badge>
            <Badge className="bg-pink-50 text-pink-700 border-pink-100"><Paintbrush className="w-3 h-3 mr-1.5" />Manual Canvas Brush</Badge>
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100"><CheckCircle className="w-3 h-3 mr-1.5" />LaMa Inpaint</Badge>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ─── Left Column: Setup ──────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Card 1: Upload */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Upload className="w-4 h-4 text-gray-500" />
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
              {!previewUrl ? (
                <div
                  className="border-2 border-dashed border-gray-200 hover:border-red-400 hover:bg-red-50/20 rounded-xl p-8 text-center cursor-pointer transition-all duration-200"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                >
                  <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-600">Drag photo here or click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">Supports PNG, JPG, JPEG up to 20MB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div 
                    ref={containerRef}
                    className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center"
                    style={{ maxHeight: "380px" }}
                  >
                    <img 
                      ref={imageRef}
                      src={previewUrl} 
                      alt="Room Workspace" 
                      className="w-full h-auto object-contain select-none pointer-events-none" 
                      style={{ maxHeight: "380px" }}
                    />
                    
                    {/* Painted Canvas Overlay (Only manual mode) */}
                    {activeTab === 'manual' && (
                      <canvas
                        ref={canvasRef}
                        className="absolute inset-0 z-10 cursor-crosshair touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isGenerating}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Replace Photo
                    </Button>
                    {activeTab === 'manual' && canvasHistory.length > 0 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={undoLastDraw}
                          disabled={isGenerating}
                        >
                          <Undo2 className="w-3.5 h-3.5 mr-1" />Undo
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-red-600 hover:bg-red-50 border-red-200"
                          onClick={clearCanvas}
                          disabled={isGenerating}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />Clear
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Workspace Tabs (Auto vs Manual) */}
          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-3">
              <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
                <button
                  onClick={() => { if (!isGenerating) setActiveTab('auto'); }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    activeTab === 'auto' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Wand2 className="w-4 h-4" />Auto Segment
                </button>
                <button
                  onClick={() => { if (!isGenerating) setActiveTab('manual'); }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    activeTab === 'manual' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Paintbrush className="w-4 h-4" />Manual Brush
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Tabs details panels */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence mode="wait">
                {activeTab === 'auto' ? (
                  <motion.div
                    key="auto-panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* Auto Select Categories */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                        Categories to Detect
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_CATEGORIES.map(cat => {
                          const isActive = selectedCategories.includes(cat);
                          return (
                            <button
                              key={cat}
                              onClick={() => toggleCategory(cat)}
                              disabled={isGenerating}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 capitalize ${
                                isActive 
                                  ? 'bg-red-500 border-red-500 text-white shadow-sm shadow-red-500/10' 
                                  : 'bg-white border-gray-200 hover:border-gray-300 text-gray-600'
                              }`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom prompt additions */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                        Custom object categories
                      </label>
                      <input
                        type="text"
                        disabled={isGenerating}
                        placeholder="e.g. coffee table, cushion, stack of books"
                        value={customPrompt}
                        onChange={e => setCustomPrompt(e.target.value)}
                        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-100 placeholder:text-gray-400"
                      />
                    </div>

                    {/* Threshold slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold uppercase tracking-wider text-gray-400">Detection Confidence</span>
                        <span className="font-semibold text-gray-700">{threshold}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.05"
                        disabled={isGenerating}
                        value={threshold}
                        onChange={e => setThreshold(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                      <p className="text-[10px] text-gray-400 leading-normal">
                        Lower thresholds catch more items but may include false objects. Higher thresholds are strictly precise.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="manual-panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* Brush size */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold uppercase tracking-wider text-gray-400">Brush Thickness</span>
                        <span className="font-semibold text-gray-700">{brushSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="60"
                        step="1"
                        disabled={isGenerating}
                        value={brushSize}
                        onChange={e => setBrushSize(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-pink-500"
                      />
                    </div>
                    
                    <div className="p-3 bg-pink-50/50 rounded-lg border border-pink-100 text-xs text-pink-700 leading-relaxed">
                      💡 <strong>How to Paint:</strong> Click and drag/draw inside the image workspace above to paint a mask over the furniture items. The painted area (shaded red) will be perfectly reconstructed into empty wall/floor.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Shared parameters */}
              <div className="border-t border-gray-100 pt-4 space-y-4">
                {/* Grow expansion */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-gray-400">Mask Border Padding</span>
                    <span className="font-semibold text-gray-700">{growMaskExpand}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="2"
                    disabled={isGenerating}
                    value={growMaskExpand}
                    onChange={e => setGrowMaskExpand(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <p className="text-[10px] text-gray-400 leading-normal">
                    Expands the mask edge outward to eliminate outline artifacts and ensure seamless surrounding blending.
                  </p>
                </div>

                {/* Invert mask toggle */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Invert Mask Polarity</span>
                    <span className="text-[10px] text-gray-400">Keeps the selected item and erases the rest</span>
                  </div>
                  <input
                    type="checkbox"
                    disabled={isGenerating}
                    checked={invertMask}
                    onChange={e => setInvertMask(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 accent-red-500 cursor-pointer"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trigger Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedFile}
            className="w-full text-white bg-gradient-to-r from-red-500 via-pink-500 to-indigo-600 hover:opacity-90 shadow-md font-semibold text-base py-6"
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processing Furniture Removal…</>
            ) : (
              <><Eraser className="w-5 h-5 mr-2" />Erase Furniture</>
            )}
          </Button>

          {/* Error Message Box */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold">Generation Failed</p>
                  <p className="text-xs text-red-600/90 mt-0.5">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Right Column: Output & Preview ──────────────────────────────── */}
        <div className="space-y-4">
          <Card className="h-full border-gray-100 shadow-sm min-h-[460px]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <ImageIcon className="w-4 h-4 text-gray-500" />
                Generated Result
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-[calc(100%-65px)]">
              
              {/* State 1: Idle */}
              {!isGenerating && !result && !progress && (
                <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 space-y-4 my-auto">
                  <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
                    <Eraser className="w-10 h-10 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Empty Workspace</p>
                    <p className="text-xs text-gray-400 mt-1">Upload a room photo to start background reconstruction</p>
                  </div>
                </div>
              )}

              {/* State 2: Generating Progress */}
              <AnimatePresence>
                {isGenerating && progress && (
                  <motion.div
                    key="progress-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4 my-auto py-6"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span className="text-red-600 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                          {progress.label}
                        </span>
                        <span className="text-xs font-mono text-gray-500">{progress.percent}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <motion.div
                          className="bg-gradient-to-r from-red-500 to-indigo-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress.percent}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>

                    {previewUrl && (
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 opacity-60">
                        <img src={previewUrl} alt="Processing Preview" className="w-full rounded-xl object-cover h-44" />
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* State 3: Done before/after viewer */}
              <AnimatePresence>
                {result?.afterUrl && (
                  <motion.div
                    key="result-view"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4 my-auto"
                  >
                    <BeforeAfterSlider
                      beforeImage={result.beforeUrl}
                      afterImage={result.afterUrl}
                      beforeLabel="Original Room"
                      afterLabel="Furniture Erased"
                    />

                    {/* Actions Panel */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = result.afterUrl;
                          a.download = `furniture-remover-${activeTab}-${Date.now()}.png`;
                          a.click();
                        }}
                        className="flex-1 py-5 border-gray-200"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          toast({
                            title: "Saved successfully",
                            description: "Generation saved to your user history dashboard.",
                          });
                        }}
                        className="flex-1 py-5 border-gray-200"
                      >
                        <BookmarkCheck className="w-3.5 h-3.5 mr-1.5" />Save to Project
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleTryAnother}
                        className="flex-1 py-5 border-gray-200"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Try Another
                      </Button>
                    </div>

                    {/* Feedback Rating Module */}
                    <div className="pt-4 border-t border-gray-100">
                      {feedback.submitted ? (
                        <p className="text-center text-xs font-semibold text-green-600">👍 Feedback saved. Thanks for helping us improve!</p>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 text-center">Are you happy with the removal boundaries?</p>
                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={() => handleFeedbackRating('up')}
                              disabled={feedback.rating !== null}
                              className={`text-2xl px-5 py-2 rounded-xl border-2 transition-all ${
                                feedback.rating === 'up'
                                  ? 'border-green-500 bg-green-50/50 scale-95'
                                  : feedback.rating !== null
                                  ? 'border-gray-100 opacity-30 cursor-not-allowed'
                                  : 'border-gray-200 hover:border-green-400 hover:bg-green-50/20 cursor-pointer'
                              }`}
                            >
                              👍
                            </button>
                            <button
                              onClick={() => handleFeedbackRating('down')}
                              disabled={feedback.rating !== null}
                              className={`text-2xl px-5 py-2 rounded-xl border-2 transition-all ${
                                feedback.rating === 'down'
                                  ? 'border-red-400 bg-red-50/50 scale-95'
                                  : feedback.rating !== null
                                  ? 'border-gray-100 opacity-30 cursor-not-allowed'
                                  : 'border-gray-200 hover:border-red-300 hover:bg-red-50/20 cursor-pointer'
                              }`}
                            >
                              👎
                            </button>
                          </div>

                          {feedback.rating && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-2"
                            >
                              <textarea
                                value={feedback.text}
                                onChange={e => setFeedback(prev => ({ ...prev, text: e.target.value }))}
                                maxLength={1000}
                                rows={2}
                                placeholder={feedback.rating === 'up' ? "Awesome! Any details on the blending?" : "What went wrong with the mask or background blending?"}
                                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-red-100"
                              />
                              <Button
                                size="sm"
                                onClick={handleFeedbackSubmit}
                                disabled={feedback.submitting}
                                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold"
                              >
                                {feedback.submitting ? "Saving feedback…" : "Submit Review"}
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
