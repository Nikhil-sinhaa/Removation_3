// components/editor/EditorCanvas.tsx
"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGesture } from "@use-gesture/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Move,
  Hand,
  Crosshair,
  Loader2,
  ImageOff,
  Upload,
} from "lucide-react";

export interface EditorCanvasRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  fitToScreen: () => void;
  getTransform: () => { scale: number; x: number; y: number };
  setTransform: (transform: { scale: number; x: number; y: number }) => void;
}

interface EditorCanvasProps {
  imageUrl?: string | null;
  overlayUrl?: string | null;
  maskUrl?: string | null;
  isLoading?: boolean;
  loadingProgress?: number;
  loadingText?: string;
  showGrid?: boolean;
  showRulers?: boolean;
  enablePan?: boolean;
  enableZoom?: boolean;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  initialZoom?: number;
  tool?: "select" | "pan" | "brush" | "eraser" | "crosshair";
  onZoomChange?: (zoom: number) => void;
  onPanChange?: (position: { x: number; y: number }) => void;
  onImageLoad?: (dimensions: { width: number; height: number }) => void;
  onCanvasClick?: (position: { x: number; y: number }) => void;
  onCanvasDrag?: (start: { x: number; y: number }, end: { x: number; y: number }) => void;
  onDrop?: (files: FileList) => void;
  children?: React.ReactNode;
  className?: string;
}

const EditorCanvas = forwardRef<EditorCanvasRef, EditorCanvasProps>(
  (
    {
      imageUrl,
      overlayUrl,
      maskUrl,
      isLoading = false,
      loadingProgress,
      loadingText = "Loading...",
      showGrid = false,
      showRulers = false,
      enablePan = true,
      enableZoom = true,
      minZoom = 0.1,
      maxZoom = 5,
      zoomStep = 0.1,
      initialZoom = 1,
      tool = "select",
      onZoomChange,
      onPanChange,
      onImageLoad,
      onCanvasClick,
      onCanvasDrag,
      onDrop,
      children,
      className,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    
    const [scale, setScale] = useState(initialZoom);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageError, setImageError] = useState(false);
    const [isDropping, setIsDropping] = useState(false);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      zoomIn: () => handleZoom(scale + zoomStep),
      zoomOut: () => handleZoom(scale - zoomStep),
      resetView: () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      },
      fitToScreen: () => fitImageToScreen(),
      getTransform: () => ({ scale, x: position.x, y: position.y }),
      setTransform: (transform) => {
        setScale(transform.scale);
        setPosition({ x: transform.x, y: transform.y });
      },
    }));

    // Handle zoom
    const handleZoom = useCallback(
      (newScale: number) => {
        const clampedScale = Math.max(minZoom, Math.min(maxZoom, newScale));
        setScale(clampedScale);
        onZoomChange?.(clampedScale);
      },
      [minZoom, maxZoom, onZoomChange]
    );

    // Fit image to screen
    const fitImageToScreen = useCallback(() => {
      if (!containerDimensions.width || !imageDimensions.width) return;

      const scaleX = containerDimensions.width / imageDimensions.width;
      const scaleY = containerDimensions.height / imageDimensions.height;
      const fitScale = Math.min(scaleX, scaleY, 1) * 0.9;

      setScale(fitScale);
      setPosition({ x: 0, y: 0 });
      onZoomChange?.(fitScale);
    }, [containerDimensions, imageDimensions, onZoomChange]);

    // Gesture handling
    const bind = useGesture(
      {
        onWheel: ({ delta: [, dy], event }) => {
          if (!enableZoom) return;
          event.preventDefault();
          const zoomDelta = dy > 0 ? -zoomStep : zoomStep;
          handleZoom(scale + zoomDelta);
        },
        onPinch: ({ offset: [d] }) => {
          if (!enableZoom) return;
          handleZoom(d);
        },
        onDrag: ({ movement: [mx, my], first, last, event }) => {
          if (!enablePan || tool !== "pan") return;
          
          if (first) {
            setIsDragging(true);
          }
          
          if (last) {
            setIsDragging(false);
          }

          setPosition((prev) => ({
            x: prev.x + mx / scale,
            y: prev.y + my / scale,
          }));
          
          onPanChange?.({ x: position.x + mx / scale, y: position.y + my / scale });
        },
        onClick: ({ event }) => {
          if (!containerRef.current || !onCanvasClick) return;
          
          const rect = containerRef.current.getBoundingClientRect();
          const x = (event.clientX - rect.left - rect.width / 2) / scale - position.x;
          const y = (event.clientY - rect.top - rect.height / 2) / scale - position.y;
          
          onCanvasClick({ x, y });
        },
      },
      {
        wheel: { preventDefault: true },
        drag: { 
          preventDefault: true,
          pointer: { touch: true },
        },
      }
    );

    // Handle image load
    const handleImageLoad = useCallback(
      (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        const dimensions = { width: img.naturalWidth, height: img.naturalHeight };
        setImageDimensions(dimensions);
        setImageError(false);
        onImageLoad?.(dimensions);
        
        // Auto fit on first load
        setTimeout(() => fitImageToScreen(), 100);
      },
      [onImageLoad, fitImageToScreen]
    );

    // Handle container resize
    useEffect(() => {
      if (!containerRef.current) return;

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      });

      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }, []);

    // Handle drag and drop
    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDropping(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDropping(false);
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        setIsDropping(false);
        
        if (e.dataTransfer.files.length > 0 && onDrop) {
          onDrop(e.dataTransfer.files);
        }
      },
      [onDrop]
    );

    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }

        switch (e.key) {
          case "+":
          case "=":
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              handleZoom(scale + zoomStep);
            }
            break;
          case "-":
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              handleZoom(scale - zoomStep);
            }
            break;
          case "0":
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }
            break;
          case "f":
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              fitImageToScreen();
            }
            break;
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [scale, zoomStep, handleZoom, fitImageToScreen]);

    // Get cursor style based on tool
    const getCursorStyle = () => {
      switch (tool) {
        case "pan":
          return isDragging ? "grabbing" : "grab";
        case "brush":
        case "eraser":
          return "crosshair";
        case "crosshair":
          return "crosshair";
        default:
          return "default";
      }
    };

    return (
      <div
        ref={containerRef}
        className={cn(
          "relative w-full h-full overflow-hidden bg-muted/30",
          "flex items-center justify-center",
          isDropping && "ring-2 ring-primary ring-inset",
          className
        )}
        style={{ cursor: getCursorStyle() }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        {...bind()}
      >
        {/* Grid Background */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px)
              `,
              backgroundSize: `${20 * scale}px ${20 * scale}px`,
              backgroundPosition: `${position.x * scale}px ${position.y * scale}px`,
            }}
          />
        )}

        {/* Rulers */}
        {showRulers && (
          <>
            {/* Horizontal Ruler */}
            <div className="absolute top-0 left-8 right-0 h-6 bg-muted border-b flex items-end overflow-hidden">
              {Array.from({ length: Math.ceil(containerDimensions.width / (50 * scale)) + 1 }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="absolute bottom-0 text-[10px] text-muted-foreground"
                    style={{ left: `${i * 50 * scale + position.x * scale}px` }}
                  >
                    <div className="h-2 w-px bg-muted-foreground" />
                    <span className="ml-1">{i * 50}</span>
                  </div>
                )
              )}
            </div>
            
            {/* Vertical Ruler */}
            <div className="absolute top-6 left-0 bottom-0 w-6 bg-muted border-r flex flex-col overflow-hidden">
              {Array.from({ length: Math.ceil(containerDimensions.height / (50 * scale)) + 1 }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 text-[10px] text-muted-foreground"
                    style={{ top: `${i * 50 * scale + position.y * scale}px` }}
                  >
                    <div className="w-2 h-px bg-muted-foreground" />
                    <span className="ml-1 writing-mode-vertical">{i * 50}</span>
                  </div>
                )
              )}
            </div>
          </>
        )}

        {/* Canvas Content */}
        <motion.div
          className="relative"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: "center center",
          }}
          animate={{
            scale,
            x: position.x,
            y: position.y,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Main Image */}
          {imageUrl && !imageError ? (
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Editor canvas"
              className="max-w-none select-none"
              style={{
                imageRendering: scale > 2 ? "pixelated" : "auto",
              }}
              onLoad={handleImageLoad}
              onError={() => setImageError(true)}
              draggable={false}
            />
          ) : !isLoading && !imageUrl ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Upload className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg mb-2">No image loaded</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Upload an image or drag and drop to get started
              </p>
            </div>
          ) : imageError ? (
            /* Error State */
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <ImageOff className="w-10 h-10 text-destructive" />
              </div>
              <h3 className="font-medium text-lg mb-2">Failed to load image</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                The image could not be loaded. Please try again.
              </p>
            </div>
          ) : null}

          {/* Overlay Image */}
          {overlayUrl && (
            <img
              src={overlayUrl}
              alt="Overlay"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{ mixBlendMode: "normal" }}
            />
          )}

          {/* Mask Layer */}
          {maskUrl && (
            <img
              src={maskUrl}
              alt="Mask"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-50"
              style={{ mixBlendMode: "multiply" }}
            />
          )}

          {/* Children (overlays, annotations, etc.) */}
          {children}
        </motion.div>

        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-20"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  {loadingProgress !== undefined && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {Math.round(loadingProgress)}%
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{loadingText}</p>
                {loadingProgress !== undefined && (
                  <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${loadingProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drop Zone Overlay */}
        <AnimatePresence>
          {isDropping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary/10 backdrop-blur-sm flex items-center justify-center z-30 pointer-events-none"
            >
              <div className="flex flex-col items-center gap-2 text-primary">
                <Upload className="w-12 h-12" />
                <span className="font-medium">Drop image here</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zoom Indicator */}
        <Badge
          variant="secondary"
          className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm"
        >
          {Math.round(scale * 100)}%
        </Badge>

        {/* Quick Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-lg p-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => handleZoom(scale - zoomStep)}
            disabled={scale <= minZoom}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => handleZoom(scale + zoomStep)}
            disabled={scale >= maxZoom}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={fitImageToScreen}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => {
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Tool Indicator */}
        {tool !== "select" && (
          <Badge
            variant="outline"
            className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm"
          >
            {tool === "pan" && <Hand className="w-3 h-3 mr-1" />}
            {tool === "crosshair" && <Crosshair className="w-3 h-3 mr-1" />}
            {tool === "brush" && <span className="w-3 h-3 mr-1">🖌️</span>}
            {tool === "eraser" && <span className="w-3 h-3 mr-1">🧹</span>}
            {tool.charAt(0).toUpperCase() + tool.slice(1)}
          </Badge>
        )}
      </div>
    );
  }
);

EditorCanvas.displayName = "EditorCanvas";

export default EditorCanvas;