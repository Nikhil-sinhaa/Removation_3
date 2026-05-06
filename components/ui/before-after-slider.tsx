// components/ui/before-after-slider.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  Download,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  showLabels?: boolean;
  showControls?: boolean;
  initialPosition?: number;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  className = "",
  showLabels = true,
  showControls = true,
  initialPosition = 50,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState({ before: false, after: false });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Image preloading ──────────────────────────────────────────────────────
  useEffect(() => {
    setImagesLoaded({ before: false, after: false });
    setIsLoading(true);

    const beforeImg = new Image();
    const afterImg = new Image();

    beforeImg.onload = () => setImagesLoaded((p) => ({ ...p, before: true }));
    afterImg.onload = () => setImagesLoaded((p) => ({ ...p, after: true }));
    beforeImg.onerror = () => setImagesLoaded((p) => ({ ...p, before: true }));
    afterImg.onerror = () => setImagesLoaded((p) => ({ ...p, after: true }));

    beforeImg.src = beforeImage;
    afterImg.src = afterImage;
  }, [beforeImage, afterImage]);

  useEffect(() => {
    if (imagesLoaded.before && imagesLoaded.after) setIsLoading(false);
  }, [imagesLoaded]);

  // ── Slider drag ───────────────────────────────────────────────────────────
  const updateSliderPosition = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      setPosition(Math.max(0, Math.min(100, (x / rect.width) * 100)));
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // If zoomed in, pointer should pan instead of moving slider
      if (zoom > 1) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        return;
      }
      setIsDraggingSlider(true);
      updateSliderPosition(e.clientX);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [zoom, pan, updateSliderPosition]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isPanning && zoom > 1) {
        const maxPan = ((zoom - 1) / zoom) * 50; // limit pan within bounds (%)
        const newX = Math.max(-maxPan * 5, Math.min(maxPan * 5, e.clientX - panStart.x));
        const newY = Math.max(-maxPan * 5, Math.min(maxPan * 5, e.clientY - panStart.y));
        setPan({ x: newX, y: newY });
        return;
      }
      if (isDraggingSlider) {
        updateSliderPosition(e.clientX);
      }
    },
    [isPanning, isDraggingSlider, zoom, panStart, updateSliderPosition]
  );

  const handlePointerUp = useCallback(() => {
    setIsDraggingSlider(false);
    setIsPanning(false);
  }, []);

  // ── Touch slider (non-pointer-event fallback) ─────────────────────────────
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (zoom > 1) return; // panning handled by pointer events
    updateSliderPosition(e.touches[0].clientX);
  };

  // ── Zoom controls ─────────────────────────────────────────────────────────
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => {
      const next = Math.max(z - 0.5, 1);
      if (next === 1) setPan({ x: 0, y: 0 }); // reset pan at 1×
      return next;
    });
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Mousewheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) handleZoomIn();
        else handleZoomOut();
      }
    },
    [handleZoomIn, handleZoomOut]
  );

  // ── Fullscreen ────────────────────────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const downloadImage = (imageSrc: string, filename: string) => {
    const link = document.createElement("a");
    link.href = imageSrc;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Image transform style ────────────────────────────────────────────────
  const imgTransform =
    zoom > 1
      ? { transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }
      : {};

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={`relative w-full aspect-square max-h-[80vh] bg-gray-100 rounded-xl overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            <p className="text-gray-600">Loading images...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      {/* Main Container — aspect-square for 1024×1024, capped at viewport height */}
      <div
        ref={containerRef}
        className={`relative w-full overflow-hidden rounded-xl bg-gray-900 select-none touch-none ${
          isFullscreen ? "h-screen" : "aspect-square max-h-[80vh]"
        } ${zoom > 1 ? "cursor-grab" : "cursor-col-resize"}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchMove={handleTouchMove}
        onWheel={handleWheel}
        onMouseEnter={() => setShowOverlay(true)}
        onMouseLeave={() => { if (!isDraggingSlider) setShowOverlay(false); }}
      >
        {/* Before Image (full background) */}
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="absolute inset-0 w-full h-full object-contain transition-transform duration-100"
          style={imgTransform}
          draggable={false}
        />

        {/* After Image (clipped by slider position) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <img
            src={afterImage}
            alt={afterLabel}
            className="absolute inset-0 w-full h-full object-contain transition-transform duration-100"
            style={imgTransform}
            draggable={false}
          />
        </div>

        {/* Slider Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-20"
          style={{ left: `${position}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-gray-200">
            <div className="flex space-x-0.5">
              <ArrowLeft className="w-3 h-3 text-gray-500" />
              <ArrowRight className="w-3 h-3 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Labels */}
        {showLabels && (
          <AnimatePresence>
            {showOverlay && (
              <>
                <motion.div
                  key="before-label"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md z-30 pointer-events-none"
                >
                  {beforeLabel}
                </motion.div>
                <motion.div
                  key="after-label"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md z-30 pointer-events-none"
                >
                  {afterLabel}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        )}

        {/* ── Bottom Controls Bar ──────────────────────────────────────── */}
        {showControls && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
            {/* Slider position control */}
            <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5">
              <span className="text-white/80 text-xs font-medium">Before</span>
              <Slider
                value={[position]}
                onValueChange={(v) => setPosition(v[0])}
                max={100}
                step={1}
                className="w-20"
              />
              <span className="text-white/80 text-xs font-medium">After</span>
            </div>

            {/* Zoom & Action Buttons */}
            <div className="flex items-center space-x-1">
              {/* Zoom controls */}
              <div className="flex items-center bg-black/60 backdrop-blur-md rounded-full px-1.5 py-0.5 space-x-0.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                  className="h-7 w-7 p-0 text-white hover:bg-white/20 rounded-full"
                  title="Zoom out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
                <span className="text-white/90 text-xs font-mono w-8 text-center">
                  {zoom.toFixed(1)}×
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                  className="h-7 w-7 p-0 text-white hover:bg-white/20 rounded-full"
                  title="Zoom in"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
                {zoom > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); handleZoomReset(); }}
                    className="h-7 w-7 p-0 text-white hover:bg-white/20 rounded-full"
                    title="Reset zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              {/* Utility buttons */}
              <div className="flex items-center bg-black/60 backdrop-blur-md rounded-full px-1 py-0.5 space-x-0.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); setShowOverlay(!showOverlay); }}
                  className="h-7 w-7 p-0 text-white hover:bg-white/20 rounded-full"
                  title="Toggle labels"
                >
                  {showOverlay ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); downloadImage(afterImage, `redesigned-${Date.now()}.png`); }}
                  className="h-7 w-7 p-0 text-white hover:bg-white/20 rounded-full"
                  title="Download result"
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                  className="h-7 w-7 p-0 text-white hover:bg-white/20 rounded-full"
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Zoom hint badge (shown when zoomed) */}
        {zoom > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white/80 text-xs px-3 py-1 rounded-full z-30 pointer-events-none">
            Drag to pan • Scroll to zoom
          </div>
        )}
      </div>

      {/* Position indicator below */}
      <div className="mt-2 flex items-center justify-center space-x-2 text-sm text-gray-500">
        <span className="text-xs">{Math.round(position)}%</span>
        <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-200 rounded-full"
            style={{ width: `${position}%` }}
          />
        </div>
        <span className="text-xs">After</span>
      </div>
    </div>
  );
}
