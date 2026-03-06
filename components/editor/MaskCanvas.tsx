"use client";

import React, { useRef, useState, useEffect } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Undo2, Eraser, Download, Brush } from "lucide-react";
import Image from "next/image";

interface MaskCanvasProps {
  imageUrl: string;
  onErase: (imageWithMask: { imageBase64: string; maskBase64: string }) => void;
  isLoading: boolean;
}

export default function MaskCanvas({ imageUrl, onErase, isLoading }: MaskCanvasProps) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [brushSize, setBrushSize] = useState(30);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure the container to size the canvas perfectly to the image
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          // Estimate height based on 4:3 aspect ratio common for room photos
          // If you have exact image dims, you could calculate this perfectly
          height: containerRef.current.clientWidth * 0.75, 
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [imageUrl]);

  const handleUndo = () => {
    canvasRef.current?.undo();
  };

  const handleClear = () => {
    canvasRef.current?.clearCanvas();
  };

  const handleGenerateMask = async () => {
    if (!canvasRef.current) return;

    try {
      // 1. Get the drawing as a PNG (transparent background, white strokes)
      const drawingDataUrl = await canvasRef.current.exportImage("png");
      
      // 2. We need to fetch the original image as base64 to send to our API
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const imageBase64 = reader.result as string;
        
        // Pass both to parent component which will call the API
        onErase({
          imageBase64,
          // The exported drawing is just the strokes. 
          // IOPaint expects a black & white mask (black background, white mask).
          // We will composite this on the server or let IOPaint handle the transparent PNG.
          maskBase64: drawingDataUrl 
        });
      };
      
      reader.readAsDataURL(blob);
      
    } catch (e) {
      console.error("Failed to generate mask", e);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border">
        
        {/* Brush Size */}
        <div className="flex items-center gap-3 w-full sm:w-1/2">
          <Brush className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium whitespace-nowrap">Brush Size: {brushSize}px</span>
          <Slider 
            value={[brushSize]} 
            onValueChange={(v) => setBrushSize(v[0])} 
            min={5} 
            max={100} 
            step={5}
            className="w-full"
            disabled={isLoading}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleUndo} disabled={isLoading}>
            <Undo2 className="w-4 h-4 mr-2" /> Undo
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear} disabled={isLoading}>
            <Eraser className="w-4 h-4 mr-2" /> Clear All
          </Button>
        </div>
      </div>

      {/* CANVAS AREA */}
      <div className="relative w-full rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center">
        
        <div 
            ref={containerRef}
            className="relative w-full max-w-4xl mx-auto cursor-crosshair"
            style={{ minHeight: '400px' }}
        >
          {/* Background Image */}
          {imageUrl && (
            <Image 
              src={imageUrl} 
              alt="Room to edit" 
              fill
              className="object-contain pointer-events-none"
              priority
            />
          )}

          {/* Drawing Canvas overlay */}
          <div className="absolute inset-0 z-10 opacity-70">
            {containerSize.width > 0 && (
                <ReactSketchCanvas
                ref={canvasRef}
                width="100%"
                height="100%"
                strokeWidth={brushSize}
                strokeColor="#ffffff" // White mask
                canvasColor="transparent" // Transparent so we can see the image below
                style={{ border: 'none' }}
                />
            )}
          </div>
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      <Button 
        size="lg" 
        className="w-full sm:w-auto mx-auto mt-2" 
        onClick={handleGenerateMask}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
            Removing Object...
          </>
        ) : (
          <>
            <Eraser className="w-5 h-5 mr-2" />
            Erase Highlighted Area
          </>
        )}
      </Button>
      
      <p className="text-sm text-center text-gray-500 mt-2">
        Tip: Paint completely over the object and its shadow for best results.
      </p>
    </div>
  );
}