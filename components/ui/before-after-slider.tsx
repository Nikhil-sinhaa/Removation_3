// components/ui/before-after-slider.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  ArrowRight, 
  Maximize2, 
  Download,
  Eye,
  EyeOff 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkImagesLoaded = () => {
      const beforeImg = new Image();
      const afterImg = new Image();
      
      beforeImg.onload = () => setImagesLoaded(prev => ({ ...prev, before: true }));
      afterImg.onload = () => setImagesLoaded(prev => ({ ...prev, after: true }));
      
      beforeImg.src = beforeImage;
      afterImg.src = afterImage;
    };

    checkImagesLoaded();
  }, [beforeImage, afterImage]);

  useEffect(() => {
    if (imagesLoaded.before && imagesLoaded.after) {
      setIsLoading(false);
    }
  }, [imagesLoaded]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, percentage)));
  };

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

  const downloadImage = (imageSrc: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className={`relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading images...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      {/* Main Container */}
      <div
        ref={containerRef}
        className="relative w-full h-96 overflow-hidden rounded-lg bg-gray-100 cursor-col-resize"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onMouseEnter={() => setShowOverlay(true)}
        onMouseLeave={() => setShowOverlay(false)}
      >
        {/* Before Image */}
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* After Image with Clip */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            clipPath: `inset(0 ${100 - position}% 0 0)`,
          }}
        >
          <img
            src={afterImage}
            alt={afterLabel}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Slider Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
          style={{ left: `${position}%` }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center pointer-events-auto">
            <div className="flex space-x-1">
              <div className="w-0.5 h-4 bg-gray-400"></div>
              <div className="w-0.5 h-4 bg-gray-400"></div>
            </div>
          </div>
        </div>

        {/* Labels */}
        {showLabels && (
          <AnimatePresence>
            {showOverlay && (
              <>
                {/* Before Label */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm"
                >
                  {beforeLabel}
                </motion.div>

                {/* After Label */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm"
                >
                  {afterLabel}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        )}

        {/* Controls Overlay */}
        {showControls && (
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Position Slider */}
            <div className="flex items-center space-x-3 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
              <span className="text-white text-sm">Before</span>
              <Slider
                value={[position]}
                onValueChange={(value) => setPosition(value[0])}
                max={100}
                step={1}
                className="w-24"
              />
              <span className="text-white text-sm">After</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowOverlay(!showOverlay)}
                className="bg-black/50 backdrop-blur-sm hover:bg-black/70"
              >
                {showOverlay ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              
              <Button
                size="sm"
                variant="secondary"
                onClick={() => downloadImage(beforeImage, `before-${Date.now()}.jpg`)}
                className="bg-black/50 backdrop-blur-sm hover:bg-black/70"
              >
                <Download className="w-4 h-4" />
              </Button>
              
              <Button
                size="sm"
                variant="secondary"
                onClick={() => downloadImage(afterImage, `after-${Date.now()}.jpg`)}
                className="bg-black/50 backdrop-blur-sm hover:bg-black/70"
              >
                <Download className="w-4 h-4" />
              </Button>
              
              <Button
                size="sm"
                variant="secondary"
                onClick={toggleFullscreen}
                className="bg-black/50 backdrop-blur-sm hover:bg-black/70"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Quick Navigation Arrows */}
        <div className="absolute top-1/2 left-4 right-4 flex justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPosition(Math.max(0, position - 10))}
            className="pointer-events-auto bg-black/50 backdrop-blur-sm hover:bg-black/70"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPosition(Math.min(100, position + 10))}
            className="pointer-events-auto bg-black/50 backdrop-blur-sm hover:bg-black/70"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Position Indicator */}
      <div className="mt-2 flex items-center justify-center space-x-2 text-sm text-gray-600">
        <span>{Math.round(position)}%</span>
        <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-200"
            style={{ width: `${position}%` }}
          />
        </div>
        <span>After</span>
      </div>
    </div>
  );
}
