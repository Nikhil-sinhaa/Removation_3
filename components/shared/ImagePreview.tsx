// components/shared/ImagePreview.tsx
"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  Copy,
  Check,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Trash2,
  Edit3,
  Loader2,
  ImageOff,
  Eye,
  EyeOff,
  Grid3X3,
  Layers,
  Move,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { LoadingShimmer } from "./LoadingShimmer";

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ImagePreviewProps {
  src: string;
  alt?: string;
  originalSrc?: string; // For before/after comparison
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  aspectRatio?: "square" | "video" | "portrait" | "landscape" | "auto";
  objectFit?: "contain" | "cover" | "fill" | "none";
  quality?: number;
  priority?: boolean;
  placeholder?: "blur" | "empty" | "shimmer";
  blurDataURL?: string;
  showControls?: boolean;
  showZoom?: boolean;
  showFullscreen?: boolean;
  showDownload?: boolean;
  showShare?: boolean;
  showCompare?: boolean;
  showRotate?: boolean;
  showFlip?: boolean;
  showGrid?: boolean;
  showFavorite?: boolean;
  showDelete?: boolean;
  showEdit?: boolean;
  isFavorite?: boolean;
  isLoading?: boolean;
  isGenerating?: boolean;
  generationProgress?: number;
  enableZoomOnHover?: boolean;
  enablePinchZoom?: boolean;
  enableDrag?: boolean;
  enableKeyboardNav?: boolean;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  initialZoom?: number;
  galleryImages?: string[];
  currentIndex?: number;
  label?: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline" | "success";
  overlay?: React.ReactNode;
  metadata?: {
    style?: string;
    roomType?: string;
    dimensions?: string;
    createdAt?: Date;
    renderTime?: number;
    model?: string;
  };
  onZoomChange?: (zoom: number) => void;
  onRotateChange?: (rotation: number) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  onDownload?: () => void;
  onShare?: () => void;
  onFavorite?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onNavigate?: (direction: "prev" | "next") => void;
}

interface TransformState {
  zoom: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  panX: number;
  panY: number;
}

// ============================================================================
// Constants
// ============================================================================

const ASPECT_RATIOS = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
  auto: "aspect-auto",
};

const DEFAULT_TRANSFORM: TransformState = {
  zoom: 1,
  rotation: 0,
  flipX: false,
  flipY: false,
  panX: 0,
  panY: 0,
};

// ============================================================================
// Sub-components
// ============================================================================

const ControlButton = ({
  icon: Icon,
  tooltip,
  onClick,
  disabled,
  active,
  className,
  size = "sm",
}: {
  icon: React.ElementType;
  tooltip: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  size?: "sm" | "md";
}) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? "secondary" : "ghost"}
          size="icon"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            size === "sm" ? "h-8 w-8" : "h-10 w-10",
            "bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm",
            "border border-white/10 transition-all duration-200",
            active && "bg-white/20 border-white/30",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <Icon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="bg-gray-900 text-white border-gray-700">
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const ZoomIndicator = ({ zoom }: { zoom: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full
               bg-black/70 backdrop-blur-sm border border-white/10"
  >
    <span className="text-white text-sm font-medium">{Math.round(zoom * 100)}%</span>
  </motion.div>
);

const CompareSlider = ({
  originalSrc,
  currentSrc,
  alt,
  className,
}: {
  originalSrc: string;
  currentSrc: string;
  alt: string;
  className?: string;
}) => {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percentage);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;
      handleMove(e.clientX);
    },
    [handleMove]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging.current) return;
      handleMove(e.touches[0].clientX);
    },
    [handleMove]
  );

  const handleEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleEnd);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [handleMouseMove, handleTouchMove, handleEnd]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full overflow-hidden cursor-ew-resize", className)}
      onMouseDown={(e) => {
        isDragging.current = true;
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        isDragging.current = true;
        handleMove(e.touches[0].clientX);
      }}
    >
      {/* Original Image (Before) */}
      <div className="absolute inset-0">
        <Image
          src={currentSrc}
          alt={`${alt} - After`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* New Image (After) - Clipped */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image
          src={originalSrc}
          alt={`${alt} - Before`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        {/* Handle Circle */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center
                      border-2 border-gray-200"
        >
          <div className="flex gap-0.5">
            <ChevronLeft className="h-4 w-4 text-gray-600" />
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 px-2 py-1 rounded bg-black/50 backdrop-blur-sm">
        <span className="text-white text-xs font-medium">Before</span>
      </div>
      <div className="absolute top-4 right-4 px-2 py-1 rounded bg-black/50 backdrop-blur-sm">
        <span className="text-white text-xs font-medium">After</span>
      </div>
    </div>
  );
};

const ImageGrid = ({
  visible,
  columns = 3,
  rows = 3,
}: {
  visible: boolean;
  columns?: number;
  rows?: number;
}) => {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Vertical Lines */}
      {Array.from({ length: columns - 1 }).map((_, i) => (
        <div
          key={`v-${i}`}
          className="absolute top-0 bottom-0 w-px bg-white/30"
          style={{ left: `${((i + 1) / columns) * 100}%` }}
        />
      ))}
      {/* Horizontal Lines */}
      {Array.from({ length: rows - 1 }).map((_, i) => (
        <div
          key={`h-${i}`}
          className="absolute left-0 right-0 h-px bg-white/30"
          style={{ top: `${((i + 1) / rows) * 100}%` }}
        />
      ))}
    </div>
  );
};

const GeneratingOverlay = ({ progress }: { progress?: number }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10"
  >
    <div className="relative">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-purple-400 animate-pulse" />
      </div>
    </div>
    <p className="mt-4 text-white font-medium">Generating...</p>
    {progress !== undefined && (
      <div className="mt-2 w-32">
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-center text-white/60 text-xs mt-1">{progress}%</p>
      </div>
    )}
  </motion.div>
);

const MetadataOverlay = ({
  metadata,
  visible,
}: {
  metadata: ImagePreviewProps["metadata"];
  visible: boolean;
}) => {
  if (!visible || !metadata) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
    >
      <div className="flex flex-wrap gap-2">
        {metadata.style && (
          <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
            {metadata.style}
          </Badge>
        )}
        {metadata.roomType && (
          <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
            {metadata.roomType}
          </Badge>
        )}
        {metadata.dimensions && (
          <Badge variant="outline" className="text-white/70 border-white/20">
            {metadata.dimensions}
          </Badge>
        )}
        {metadata.renderTime && (
          <Badge variant="outline" className="text-white/70 border-white/20">
            {metadata.renderTime}s
          </Badge>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export function ImagePreview({
  src,
  alt = "Image preview",
  originalSrc,
  width,
  height,
  className,
  containerClassName,
  aspectRatio = "auto",
  objectFit = "cover",
  quality = 90,
  priority = false,
  placeholder = "shimmer",
  blurDataURL,
  showControls = true,
  showZoom = true,
  showFullscreen = true,
  showDownload = true,
  showShare = true,
  showCompare = false,
  showRotate = false,
  showFlip = false,
  showGrid = false,
  showFavorite = false,
  showDelete = false,
  showEdit = false,
  isFavorite = false,
  isLoading = false,
  isGenerating = false,
  generationProgress,
  enableZoomOnHover = false,
  enablePinchZoom = true,
  enableDrag = true,
  enableKeyboardNav = true,
  minZoom = 0.5,
  maxZoom = 5,
  zoomStep = 0.25,
  initialZoom = 1,
  galleryImages,
  currentIndex = 0,
  label,
  badge,
  badgeVariant = "default",
  overlay,
  metadata,
  onZoomChange,
  onRotateChange,
  onFullscreenChange,
  onDownload,
  onShare,
  onFavorite,
  onDelete,
  onEdit,
  onClick,
  onLoad,
  onError,
  onNavigate,
}: ImagePreviewProps) {
  // State
  const [transform, setTransform] = useState<TransformState>({
    ...DEFAULT_TRANSFORM,
    zoom: initialZoom,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCompareView, setShowCompareView] = useState(false);
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  const { toast } = useToast();

  // Effects
  useEffect(() => {
    if (enableKeyboardNav) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!isFullscreen) return;

        switch (e.key) {
          case "Escape":
            setIsFullscreen(false);
            break;
          case "ArrowLeft":
            if (galleryImages && currentIndex > 0) {
              onNavigate?.("prev");
            }
            break;
          case "ArrowRight":
            if (galleryImages && currentIndex < galleryImages.length - 1) {
              onNavigate?.("next");
            }
            break;
          case "+":
          case "=":
            handleZoom("in");
            break;
          case "-":
            handleZoom("out");
            break;
          case "0":
            handleResetTransform();
            break;
          case "g":
            setShowGridOverlay((prev) => !prev);
            break;
          case "c":
            if (originalSrc) setShowCompareView((prev) => !prev);
            break;
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isFullscreen, galleryImages, currentIndex, onNavigate, originalSrc, enableKeyboardNav]);

  // Handlers
  const handleZoom = useCallback(
    (direction: "in" | "out") => {
      setTransform((prev) => {
        const newZoom =
          direction === "in"
            ? Math.min(prev.zoom + zoomStep, maxZoom)
            : Math.max(prev.zoom - zoomStep, minZoom);

        onZoomChange?.(newZoom);
        return { ...prev, zoom: newZoom };
      });
    },
    [zoomStep, maxZoom, minZoom, onZoomChange]
  );

  const handleZoomSlider = useCallback(
    (value: number[]) => {
      const newZoom = value[0];
      setTransform((prev) => ({ ...prev, zoom: newZoom }));
      onZoomChange?.(newZoom);
    },
    [onZoomChange]
  );

  const handleRotate = useCallback(
    (direction: "cw" | "ccw") => {
      setTransform((prev) => {
        const newRotation = direction === "cw" ? prev.rotation + 90 : prev.rotation - 90;
        onRotateChange?.(newRotation);
        return { ...prev, rotation: newRotation };
      });
    },
    [onRotateChange]
  );

  const handleFlip = useCallback((axis: "x" | "y") => {
    setTransform((prev) => ({
      ...prev,
      flipX: axis === "x" ? !prev.flipX : prev.flipX,
      flipY: axis === "y" ? !prev.flipY : prev.flipY,
    }));
  }, []);

  const handleResetTransform = useCallback(() => {
    setTransform({ ...DEFAULT_TRANSFORM, zoom: initialZoom });
    onZoomChange?.(initialZoom);
    onRotateChange?.(0);
  }, [initialZoom, onZoomChange, onRotateChange]);

  const handleFullscreen = useCallback(() => {
    const newFullscreen = !isFullscreen;
    setIsFullscreen(newFullscreen);
    onFullscreenChange?.(newFullscreen);
  }, [isFullscreen, onFullscreenChange]);

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `removation-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded!",
        description: "Image saved successfully.",
      });

      onDownload?.();
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the image. Please try again.",
        variant: "destructive",
      });
    }
  }, [src, toast, onDownload]);

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: alt,
          text: "Check out this design from Removation.ai",
          url: src,
        });
      } else {
        await navigator.clipboard.writeText(src);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "Link copied!",
          description: "Image URL copied to clipboard.",
        });
      }
      onShare?.();
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        toast({
          title: "Share failed",
          description: "Could not share the image. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [src, alt, toast, onShare]);

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!enableDrag || transform.zoom <= 1) return;
      setIsDragging(true);

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      dragStart.current = {
        x: clientX - transform.panX,
        y: clientY - transform.panY,
      };
    },
    [enableDrag, transform.zoom, transform.panX, transform.panY]
  );

  const handleDragMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      setTransform((prev) => ({
        ...prev,
        panX: clientX - dragStart.current.x,
        panY: clientY - dragStart.current.y,
      }));
    },
    [isDragging]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!enablePinchZoom) return;
      e.preventDefault();

      const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
      setTransform((prev) => {
        const newZoom = Math.max(minZoom, Math.min(maxZoom, prev.zoom + delta));
        onZoomChange?.(newZoom);
        return { ...prev, zoom: newZoom };
      });
    },
    [enablePinchZoom, zoomStep, minZoom, maxZoom, onZoomChange]
  );

  const handleImageLoad = useCallback(() => {
    setHasLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(() => {
    setHasError(true);
    setHasLoaded(true);
    onError?.(new Error("Failed to load image"));
  }, [onError]);

  // Computed styles
  const transformStyle = {
    transform: `
      translate(${transform.panX}px, ${transform.panY}px)
      scale(${transform.zoom})
      rotate(${transform.rotation}deg)
      scaleX(${transform.flipX ? -1 : 1})
      scaleY(${transform.flipY ? -1 : 1})
    `,
    transition: isDragging ? "none" : "transform 0.2s ease-out",
  };

  const hoverZoomStyle = enableZoomOnHover && isHovered && !isDragging
    ? { transform: "scale(1.05)" }
    : {};

  // Render
  const imageContent = (
    <div
      ref={containerRef}
      className={cn(
        "relative group overflow-hidden bg-gray-900 rounded-lg",
        ASPECT_RATIOS[aspectRatio],
        containerClassName
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onWheel={handleWheel}
    >
      {/* Loading State */}
      <AnimatePresence>
        {(isLoading || !hasLoaded) && !hasError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10"
          >
            {placeholder === "shimmer" && <LoadingShimmer className="w-full h-full" />}
            {placeholder === "blur" && blurDataURL && (
              <Image
                src={blurDataURL}
                alt=""
                fill
                sizes="100vw"
                className="object-cover blur-lg scale-110"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
          <ImageOff className="h-12 w-12 text-gray-500 mb-2" />
          <p className="text-gray-400 text-sm">Failed to load image</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-gray-300"
            onClick={() => {
              setHasError(false);
              setHasLoaded(false);
            }}
          >
            Try again
          </Button>
        </div>
      )}

      {/* Compare View */}
      {showCompareView && originalSrc ? (
        <CompareSlider
          originalSrc={originalSrc}
          currentSrc={src}
          alt={alt}
        />
      ) : (
        /* Main Image */
        <div
          ref={imageRef}
          className={cn(
            "relative w-full h-full",
            isDragging ? "cursor-grabbing" : enableDrag && transform.zoom > 1 ? "cursor-grab" : "cursor-pointer"
          )}
          style={{ ...transformStyle, ...hoverZoomStyle }}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onClick={transform.zoom === 1 && !isDragging ? onClick : undefined}
        >
          <Image
            src={src}
            alt={alt}
            fill={!width || !height}
            width={width}
            height={height}
            quality={quality}
            priority={priority}
            className={cn(
              "transition-opacity duration-300",
              hasLoaded ? "opacity-100" : "opacity-0",
              objectFit === "contain" && "object-contain",
              objectFit === "cover" && "object-cover",
              objectFit === "fill" && "object-fill",
              objectFit === "none" && "object-none",
              className
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      )}

      {/* Grid Overlay */}
      <ImageGrid visible={showGridOverlay} />

      {/* Generating Overlay */}
      <AnimatePresence>
        {isGenerating && <GeneratingOverlay progress={generationProgress} />}
      </AnimatePresence>

      {/* Metadata Overlay */}
      <AnimatePresence>
        <MetadataOverlay metadata={metadata} visible={showMetadata} />
      </AnimatePresence>

      {/* Badge */}
      {badge && (
        <div className="absolute top-3 left-3 z-20">
          <Badge
            variant={badgeVariant === "success" ? "default" : badgeVariant}
            className={cn(
              badgeVariant === "success" && "bg-green-500 hover:bg-green-600"
            )}
          >
            {badge}
          </Badge>
        </div>
      )}

      {/* Label */}
      {label && (
        <div className="absolute bottom-3 left-3 z-20">
          <span className="px-2 py-1 rounded bg-black/50 backdrop-blur-sm text-white text-sm">
            {label}
          </span>
        </div>
      )}

      {/* Custom Overlay */}
      {overlay}

      {/* Controls */}
      {showControls && hasLoaded && !hasError && !isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered || isFullscreen ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 pointer-events-none"
        >
          {/* Top Controls */}
          <div className="absolute top-3 right-3 flex gap-2 pointer-events-auto">
            {showFavorite && (
              <ControlButton
                icon={Heart}
                tooltip={isFavorite ? "Remove from favorites" : "Add to favorites"}
                onClick={onFavorite}
                active={isFavorite}
                className={isFavorite ? "text-red-500" : ""}
              />
            )}
            {showEdit && (
              <ControlButton
                icon={Edit3}
                tooltip="Edit"
                onClick={onEdit}
              />
            )}
            {showDelete && (
              <ControlButton
                icon={Trash2}
                tooltip="Delete"
                onClick={onDelete}
                className="hover:text-red-500"
              />
            )}
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto">
            {/* Zoom Controls */}
            {showZoom && (
              <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-lg p-1">
                <ControlButton
                  icon={ZoomOut}
                  tooltip="Zoom out"
                  onClick={() => handleZoom("out")}
                  disabled={transform.zoom <= minZoom}
                />
                <div className="w-20 px-2">
                  <Slider
                    value={[transform.zoom]}
                    min={minZoom}
                    max={maxZoom}
                    step={zoomStep}
                    onValueChange={handleZoomSlider}
                    className="cursor-pointer"
                  />
                </div>
                <ControlButton
                  icon={ZoomIn}
                  tooltip="Zoom in"
                  onClick={() => handleZoom("in")}
                  disabled={transform.zoom >= maxZoom}
                />
              </div>
            )}

            {/* Rotate Controls */}
            {showRotate && (
              <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-lg p-1">
                <ControlButton
                  icon={RotateCcw}
                  tooltip="Rotate left"
                  onClick={() => handleRotate("ccw")}
                />
                <ControlButton
                  icon={RotateCw}
                  tooltip="Rotate right"
                  onClick={() => handleRotate("cw")}
                />
              </div>
            )}

            {/* Flip Controls */}
            {showFlip && (
              <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-lg p-1">
                <ControlButton
                  icon={FlipHorizontal}
                  tooltip="Flip horizontal"
                  onClick={() => handleFlip("x")}
                  active={transform.flipX}
                />
                <ControlButton
                  icon={FlipVertical}
                  tooltip="Flip vertical"
                  onClick={() => handleFlip("y")}
                  active={transform.flipY}
                />
              </div>
            )}
          </div>

          {/* Right Side Controls */}
          <div className="absolute bottom-3 right-3 flex gap-2 pointer-events-auto">
            {showGrid && (
              <ControlButton
                icon={Grid3X3}
                tooltip="Toggle grid"
                onClick={() => setShowGridOverlay(!showGridOverlay)}
                active={showGridOverlay}
              />
            )}
            {showCompare && originalSrc && (
              <ControlButton
                icon={Layers}
                tooltip="Compare"
                onClick={() => setShowCompareView(!showCompareView)}
                active={showCompareView}
              />
            )}
            {metadata && (
              <ControlButton
                icon={showMetadata ? EyeOff : Eye}
                tooltip={showMetadata ? "Hide info" : "Show info"}
                onClick={() => setShowMetadata(!showMetadata)}
                active={showMetadata}
              />
            )}
            {showShare && (
              <ControlButton
                icon={copied ? Check : Share2}
                tooltip={copied ? "Copied!" : "Share"}
                onClick={handleShare}
              />
            )}
            {showDownload && (
              <ControlButton
                icon={Download}
                tooltip="Download"
                onClick={handleDownload}
              />
            )}
            {showFullscreen && (
              <ControlButton
                icon={isFullscreen ? Minimize2 : Maximize2}
                tooltip={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                onClick={handleFullscreen}
              />
            )}
          </div>

          {/* Reset Transform Button */}
          {(transform.zoom !== 1 ||
            transform.rotation !== 0 ||
            transform.flipX ||
            transform.flipY ||
            transform.panX !== 0 ||
            transform.panY !== 0) && (
            <div className="absolute top-3 left-3 pointer-events-auto">
              <ControlButton
                icon={X}
                tooltip="Reset"
                onClick={handleResetTransform}
              />
            </div>
          )}
        </motion.div>
      )}

      {/* Zoom Indicator */}
      <AnimatePresence>
        {transform.zoom !== 1 && isHovered && (
          <ZoomIndicator zoom={transform.zoom} />
        )}
      </AnimatePresence>

      {/* Gallery Navigation */}
      {galleryImages && galleryImages.length > 1 && (
        <>
          <button
            onClick={() => onNavigate?.("prev")}
            disabled={currentIndex === 0}
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full",
              "bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm",
              "transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed",
              "opacity-0 group-hover:opacity-100"
            )}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => onNavigate?.("next")}
            disabled={currentIndex === galleryImages.length - 1}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full",
              "bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm",
              "transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed",
              "opacity-0 group-hover:opacity-100"
            )}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1.5">
            {galleryImages.map((_, idx) => (
              <div
                key={`gallery-nav-${idx}`}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  idx === currentIndex
                    ? "bg-white scale-110"
                    : "bg-white/40 hover:bg-white/60"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  // Fullscreen Dialog
  if (isFullscreen) {
    return (
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black border-gray-800">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <div className="relative w-full h-[90vh]">
            {imageContent}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return imageContent;
}

// ============================================================================
// Exports
// ============================================================================

export default ImagePreview;