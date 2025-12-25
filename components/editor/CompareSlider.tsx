// components/editor/CompareSlider.tsx
"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeftRight,
  Maximize2,
  Minimize2,
  RotateCcw,
  Download,
  Eye,
  EyeOff,
  SplitSquareHorizontal,
  Columns,
  Rows,
  Move,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CompareMode = "slider" | "side-by-side" | "stacked" | "fade" | "onion";
type SliderOrientation = "horizontal" | "vertical";

interface CompareSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  initialPosition?: number;
  orientation?: SliderOrientation;
  mode?: CompareMode;
  showControls?: boolean;
  showLabels?: boolean;
  showZoom?: boolean;
  enableFullscreen?: boolean;
  onPositionChange?: (position: number) => void;
  onModeChange?: (mode: CompareMode) => void;
  onDownload?: (type: "before" | "after" | "both") => void;
  className?: string;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startPosition: number;
}

export default function CompareSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  initialPosition = 50,
  orientation = "horizontal",
  mode: initialMode = "slider",
  showControls = true,
  showLabels = true,
  showZoom = true,
  enableFullscreen = true,
  onPositionChange,
  onModeChange,
  onDownload,
  className,
}: CompareSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(initialPosition);
  const [mode, setMode] = useState<CompareMode>(initialMode);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(0.5);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [showAfter, setShowAfter] = useState(true);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPosition: 50,
  });

  // Handle slider position change
  const handlePositionChange = useCallback(
    (newPosition: number) => {
      const clampedPosition = Math.max(0, Math.min(100, newPosition));
      setPosition(clampedPosition);
      onPositionChange?.(clampedPosition);
    },
    [onPositionChange]
  );

  // Handle mode change
  const handleModeChange = useCallback(
    (newMode: CompareMode) => {
      setMode(newMode);
      onModeChange?.(newMode);
    },
    [onModeChange]
  );

  // Mouse/Touch handlers for slider
  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (mode !== "slider") return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      setDragState({
        isDragging: true,
        startX: clientX,
        startY: clientY,
        startPosition: position,
      });
    },
    [mode, position]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragState.isDragging || !containerRef.current) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const rect = containerRef.current.getBoundingClientRect();

      if (orientation === "horizontal") {
        const relativeX = clientX - rect.left;
        const newPosition = (relativeX / rect.width) * 100;
        handlePositionChange(newPosition);
      } else {
        const relativeY = clientY - rect.top;
        const newPosition = (relativeY / rect.height) * 100;
        handlePositionChange(newPosition);
      }
    },
    [dragState.isDragging, orientation, handlePositionChange]
  );

  const handleMouseUp = useCallback(() => {
    setDragState((prev) => ({ ...prev, isDragging: false }));
  }, []);

  // Add/remove global event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleMouseMove);
      window.addEventListener("touchend", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("touchmove", handleMouseMove);
        window.removeEventListener("touchend", handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  // Handle click on container to set position
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (mode !== "slider" || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();

      if (orientation === "horizontal") {
        const relativeX = e.clientX - rect.left;
        const newPosition = (relativeX / rect.width) * 100;
        handlePositionChange(newPosition);
      } else {
        const relativeY = e.clientY - rect.top;
        const newPosition = (relativeY / rect.height) * 100;
        handlePositionChange(newPosition);
      }
    },
    [mode, orientation, handlePositionChange]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode !== "slider") return;

      const step = e.shiftKey ? 10 : 1;

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          handlePositionChange(position - step);
          break;
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          handlePositionChange(position + step);
          break;
        case "Home":
          e.preventDefault();
          handlePositionChange(0);
          break;
        case "End":
          e.preventDefault();
          handlePositionChange(100);
          break;
        case " ":
          e.preventDefault();
          handlePositionChange(50);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, position, handlePositionChange]);

  // Fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Reset view
  const handleReset = useCallback(() => {
    setPosition(50);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setFadeOpacity(0.5);
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  // Render different comparison modes
  const renderSliderMode = () => (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-col-resize select-none"
      onClick={handleContainerClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Before Image (Full) */}
      <div
        className="absolute inset-0"
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
        }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* After Image (Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={
          orientation === "horizontal"
            ? { clipPath: `inset(0 0 0 ${position}%)` }
            : { clipPath: `inset(${position}% 0 0 0)` }
        }
      >
        <div
          className="w-full h-full"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          }}
        >
          <img
            src={afterImage}
            alt={afterLabel}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      </div>

      {/* Slider Handle */}
      <motion.div
        className={cn(
          "absolute z-10 flex items-center justify-center",
          orientation === "horizontal"
            ? "top-0 bottom-0 w-1 cursor-col-resize"
            : "left-0 right-0 h-1 cursor-row-resize"
        )}
        style={
          orientation === "horizontal"
            ? { left: `${position}%`, transform: "translateX(-50%)" }
            : { top: `${position}%`, transform: "translateY(-50%)" }
        }
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* Slider Line */}
        <div
          className={cn(
            "bg-white shadow-lg",
            orientation === "horizontal" ? "w-0.5 h-full" : "h-0.5 w-full"
          )}
        />

        {/* Slider Handle Circle */}
        <motion.div
          className={cn(
            "absolute flex items-center justify-center w-10 h-10 rounded-full",
            "bg-white shadow-xl border-2 border-primary",
            "hover:scale-110 transition-transform"
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeftRight className="w-5 h-5 text-primary" />
        </motion.div>

        {/* Arrow Indicators */}
        <AnimatePresence>
          {(isHovering || dragState.isDragging) && (
            <>
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={cn(
                  "absolute bg-black/70 text-white px-2 py-1 rounded text-xs",
                  orientation === "horizontal" ? "-left-16" : "-top-8"
                )}
              >
                <ChevronLeft className="w-3 h-3 inline" /> {beforeLabel}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={cn(
                  "absolute bg-black/70 text-white px-2 py-1 rounded text-xs",
                  orientation === "horizontal" ? "-right-16" : "-bottom-8"
                )}
              >
                {afterLabel} <ChevronRight className="w-3 h-3 inline" />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Labels */}
      {showLabels && (
        <>
          <Badge
            variant="secondary"
            className="absolute top-3 left-3 bg-black/70 text-white border-0"
          >
            {beforeLabel}
          </Badge>
          <Badge
            variant="secondary"
            className="absolute top-3 right-3 bg-black/70 text-white border-0"
          >
            {afterLabel}
          </Badge>
        </>
      )}
    </div>
  );

  const renderSideBySideMode = () => (
    <div
      ref={containerRef}
      className="flex w-full h-full gap-1"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative flex-1 overflow-hidden">
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="w-full h-full object-cover"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          }}
        />
        {showLabels && (
          <Badge
            variant="secondary"
            className="absolute top-3 left-3 bg-black/70 text-white border-0"
          >
            {beforeLabel}
          </Badge>
        )}
      </div>
      <div className="relative flex-1 overflow-hidden">
        <img
          src={afterImage}
          alt={afterLabel}
          className="w-full h-full object-cover"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          }}
        />
        {showLabels && (
          <Badge
            variant="secondary"
            className="absolute top-3 right-3 bg-black/70 text-white border-0"
          >
            {afterLabel}
          </Badge>
        )}
      </div>
    </div>
  );

  const renderStackedMode = () => (
    <div
      ref={containerRef}
      className="flex flex-col w-full h-full gap-1"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative flex-1 overflow-hidden">
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="w-full h-full object-cover"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          }}
        />
        {showLabels && (
          <Badge
            variant="secondary"
            className="absolute top-3 left-3 bg-black/70 text-white border-0"
          >
            {beforeLabel}
          </Badge>
        )}
      </div>
      <div className="relative flex-1 overflow-hidden">
        <img
          src={afterImage}
          alt={afterLabel}
          className="w-full h-full object-cover"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          }}
        />
        {showLabels && (
          <Badge
            variant="secondary"
            className="absolute top-3 left-3 bg-black/70 text-white border-0"
          >
            {afterLabel}
          </Badge>
        )}
      </div>
    </div>
  );

  const renderFadeMode = () => (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Before Image */}
      <img
        src={beforeImage}
        alt={beforeLabel}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
        }}
      />

      {/* After Image with opacity */}
      <img
        src={afterImage}
        alt={afterLabel}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200"
        style={{
          opacity: fadeOpacity,
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
        }}
      />

      {/* Opacity Slider */}
      <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
        <div className="flex items-center gap-3">
          <span className="text-white text-xs shrink-0">{beforeLabel}</span>
          <Slider
            value={[fadeOpacity * 100]}
            onValueChange={([value]) => setFadeOpacity(value / 100)}
            min={0}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-white text-xs shrink-0">{afterLabel}</span>
        </div>
      </div>

      {/* Labels */}
      {showLabels && (
        <Badge
          variant="secondary"
          className="absolute top-3 left-3 bg-black/70 text-white border-0"
        >
          Fade: {Math.round(fadeOpacity * 100)}%
        </Badge>
      )}
    </div>
  );

  const renderOnionMode = () => (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-pointer"
      onClick={() => setShowAfter(!showAfter)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={showAfter ? "after" : "before"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          src={showAfter ? afterImage : beforeImage}
          alt={showAfter ? afterLabel : beforeLabel}
          className="w-full h-full object-cover"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          }}
        />
      </AnimatePresence>

      {/* Toggle Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <Button
          size="sm"
          variant={!showAfter ? "default" : "secondary"}
          onClick={(e) => {
            e.stopPropagation();
            setShowAfter(false);
          }}
        >
          {beforeLabel}
        </Button>
        <Button
          size="sm"
          variant={showAfter ? "default" : "secondary"}
          onClick={(e) => {
            e.stopPropagation();
            setShowAfter(true);
          }}
        >
          {afterLabel}
        </Button>
      </div>

      {/* Current Label */}
      {showLabels && (
        <Badge
          variant="secondary"
          className="absolute top-3 left-3 bg-black/70 text-white border-0"
        >
          {showAfter ? afterLabel : beforeLabel}
        </Badge>
      )}

      {/* Click to toggle hint */}
      <AnimatePresence>
        {isHovering && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
              Click to toggle
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderContent = () => {
    switch (mode) {
      case "slider":
        return renderSliderMode();
      case "side-by-side":
        return renderSideBySideMode();
      case "stacked":
        return renderStackedMode();
      case "fade":
        return renderFadeMode();
      case "onion":
        return renderOnionMode();
      default:
        return renderSliderMode();
    }
  };

  const modeOptions: { id: CompareMode; icon: React.ReactNode; label: string }[] = [
    { id: "slider", icon: <SplitSquareHorizontal className="w-4 h-4" />, label: "Slider" },
    { id: "side-by-side", icon: <Columns className="w-4 h-4" />, label: "Side by Side" },
    { id: "stacked", icon: <Rows className="w-4 h-4" />, label: "Stacked" },
    { id: "fade", icon: <Move className="w-4 h-4" />, label: "Fade" },
    { id: "onion", icon: <Eye className="w-4 h-4" />, label: "Toggle" },
  ];

  return (
    <div
      className={cn(
        "relative flex flex-col bg-black rounded-xl overflow-hidden",
        isFullscreen && "fixed inset-0 z-50 rounded-none",
        className
      )}
    >
      {/* Main Content */}
      <div className="relative flex-1 min-h-0">{renderContent()}</div>

      {/* Controls */}
      {showControls && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
        >
          <div className="flex items-center justify-between gap-4">
            {/* Mode Selector */}
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-lg p-1">
              <TooltipProvider>
                {modeOptions.map((option) => (
                  <Tooltip key={option.id}>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant={mode === option.id ? "secondary" : "ghost"}
                        className="h-8 w-8 text-white hover:text-white"
                        onClick={() => handleModeChange(option.id)}
                      >
                        {option.icon}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{option.label}</TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>

            {/* Slider Position (for slider mode) */}
            {mode === "slider" && (
              <div className="flex-1 max-w-xs">
                <Slider
                  value={[position]}
                  onValueChange={([value]) => handlePositionChange(value)}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            )}

            {/* Zoom & Actions */}
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-lg p-1">
              <TooltipProvider>
                {showZoom && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-white hover:text-white"
                          onClick={handleZoomOut}
                          disabled={zoom <= 0.5}
                        >
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Zoom Out</TooltipContent>
                    </Tooltip>

                    <span className="text-white text-xs px-2 min-w-[3rem] text-center">
                      {Math.round(zoom * 100)}%
                    </span>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-white hover:text-white"
                          onClick={handleZoomIn}
                          disabled={zoom >= 3}
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Zoom In</TooltipContent>
                    </Tooltip>
                  </>
                )}

                <div className="w-px h-4 bg-white/30 mx-1" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:text-white"
                      onClick={handleReset}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset View</TooltipContent>
                </Tooltip>

                {enableFullscreen && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-white hover:text-white"
                        onClick={toggleFullscreen}
                      >
                        {isFullscreen ? (
                          <Minimize2 className="w-4 h-4" />
                        ) : (
                          <Maximize2 className="w-4 h-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    </TooltipContent>
                  </Tooltip>
                )}

                {onDownload && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-white hover:text-white"
                        onClick={() => onDownload("after")}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Download</TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          </div>
        </motion.div>
      )}

      {/* Position indicator */}
      {mode === "slider" && showControls && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2">
          <Badge variant="secondary" className="bg-black/70 text-white border-0">
            {Math.round(position)}%
          </Badge>
        </div>
      )}
    </div>
  );
}

// Lightweight version for thumbnails/grids
export function CompareSliderMini({
  beforeImage,
  afterImage,
  className,
}: {
  beforeImage: string;
  afterImage: string;
  className?: string;
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [position, setPosition] = useState(50);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, percentage)));
  };

  return (
    <div
      className={cn(
        "relative w-full h-full overflow-hidden cursor-col-resize",
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setPosition(50);
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Before Image */}
      <img
        src={beforeImage}
        alt="Before"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* After Image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 0 0 ${position}%)` }}
      >
        <img
          src={afterImage}
          alt="After"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Slider line */}
      <AnimatePresence>
        {isHovering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
            style={{ left: `${position}%`, transform: "translateX(-50%)" }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center">
              <ArrowLeftRight className="w-3 h-3 text-gray-700" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}