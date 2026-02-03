'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/editor-store';
import type { MaskStroke } from '@/stores/editor-store';
import { v4 as uuidv4 } from 'uuid';

interface MaskCanvasProps {
  className?: string;
  width: number;
  height: number;
  onMaskChange?: (maskDataUrl: string) => void;
}

export function MaskCanvas({ className, width, height, onMaskChange }: MaskCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  const {
    mask,
    brushSettings,
    setMask,
    currentTool,
  } = useEditorStore();

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw existing mask if any
    if (mask && mask.dataUrl) {
      const image = new Image();
      image.onload = () => {
        ctx.drawImage(image, 0, 0, width, height);
      };
      image.src = mask.dataUrl;
    }
  }, [mask, width, height]);

  // Draw on canvas
  const draw = useCallback((x: number, y: number, isEraser: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    ctx.lineWidth = brushSettings.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Set brush hardness (gradient)
    if (brushSettings.hardness < 1) {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, brushSettings.size / 2);
      gradient.addColorStop(0, isEraser ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)');
      gradient.addColorStop(brushSettings.hardness, isEraser ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)');
      gradient.addColorStop(1, isEraser ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0)');
      ctx.strokeStyle = gradient;
    } else {
      ctx.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)';
    }

    ctx.globalAlpha = brushSettings.opacity * brushSettings.flow;

    if (lastPoint) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, brushSettings.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    setLastPoint({ x, y });
  }, [brushSettings, lastPoint]);

  // Get canvas-relative coordinates
  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool !== 'mask') return;

    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    setLastPoint({ x, y });
    draw(x, y, brushSettings.isEraser);
  }, [currentTool, getCanvasCoordinates, draw, brushSettings.isEraser]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || currentTool !== 'mask') return;

    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    draw(x, y, brushSettings.isEraser);
  }, [isDrawing, currentTool, getCanvasCoordinates, draw, brushSettings.isEraser]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;

    setIsDrawing(false);
    setLastPoint(null);

    // Save mask data
    const canvas = canvasRef.current;
    if (!canvas) return;

    const maskDataUrl = canvas.toDataURL('image/png');

    // Create new strokes array
    const newStrokes: MaskStroke[] = mask?.strokes ? [...mask.strokes] : [];
    newStrokes.push({
      id: uuidv4(),
      points: lastPoint ? [{ x: lastPoint.x, y: lastPoint.y, pressure: 1 }] : [],
      brushSize: brushSettings.size,
      brushHardness: brushSettings.hardness,
      isEraser: brushSettings.isEraser,
      color: brushSettings.color,
    });

    // Update mask
    setMask({
      id: mask?.id || uuidv4(),
      dataUrl: maskDataUrl,
      width,
      height,
      strokes: newStrokes,
      coverage: 0, // Calculate if needed
    });

    // Notify parent
    if (onMaskChange) {
      onMaskChange(maskDataUrl);
    }
  }, [isDrawing, mask, brushSettings, width, height, setMask, onMaskChange, lastPoint]);

  // Handle touch events
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (currentTool !== 'mask') return;

    e.preventDefault();
    const touch = e.touches[0];
    const { x, y } = getCanvasCoordinates(touch.clientX, touch.clientY);
    setIsDrawing(true);
    setLastPoint({ x, y });
    draw(x, y, brushSettings.isEraser);
  }, [currentTool, getCanvasCoordinates, draw, brushSettings.isEraser]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || currentTool !== 'mask') return;

    e.preventDefault();
    const touch = e.touches[0];
    const { x, y } = getCanvasCoordinates(touch.clientX, touch.clientY);
    draw(x, y, brushSettings.isEraser);
  }, [isDrawing, currentTool, getCanvasCoordinates, draw, brushSettings.isEraser]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            // Undo last stroke
            if (mask?.strokes.length) {
              const newStrokes = [...mask.strokes];
              newStrokes.pop();
              // Redraw mask without last stroke
              const canvas = canvasRef.current;
              if (canvas && canvas.parentElement) {
                // Clear and redraw all strokes except last
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.clearRect(0, 0, width, height);
                  newStrokes.forEach(stroke => {
                    // Simplified - in real app, would need to redraw each stroke
                  });
                }
              }
            }
            break;
          case 'y':
            // Redo (simplified)
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mask, width, height]);

  // Render mask visualization
  const renderMaskOverlay = useCallback(() => {
    if (!mask || brushSettings.opacity === 0) return null;

    const opacity = brushSettings.opacity * 0.3; // Reduced opacity for overlay

    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: brushSettings.isEraser
            ? `linear-gradient(135deg, rgba(239, 68, 68, ${opacity}) 0%, rgba(185, 28, 28, ${opacity}) 100%)`
            : `linear-gradient(135deg, rgba(168, 85, 247, ${opacity}) 0%, rgba(147, 51, 234, ${opacity}) 100%)`,
          maskImage: `url(${mask.dataUrl})`,
          WebkitMaskImage: `url(${mask.dataUrl})`,
          maskSize: '100% 100%',
          WebkitMaskSize: '100% 100%',
        }}
      />
    );
  }, [mask, brushSettings]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("relative", className)}
      style={{ width, height }}
    >
      {/* Canvas for drawing */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 cursor-crosshair bg-transparent border border-white/10 rounded-lg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      />

      {/* Mask visualization overlay */}
      {renderMaskOverlay()}

      {/* Drawing indicator */}
      {isDrawing && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: lastPoint ? `${(lastPoint.x / width) * 100}%` : '50%',
            top: lastPoint ? `${(lastPoint.y / height) * 100}%` : '50%',
            width: brushSettings.size,
            height: brushSettings.size,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: `2px dashed ${brushSettings.isEraser ? '#ef4444' : '#a855f7'}`,
            opacity: 0.7,
          }}
        />
      )}

      {/* Instructions */}
      {!mask && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-4 bg-black/50 backdrop-blur-sm rounded-lg">
            <p className="text-white/70 text-sm">
              {brushSettings.isEraser
                ? 'Click and drag to erase mask areas'
                : 'Click and drag to paint mask areas'
              }
            </p>
            <p className="text-white/40 text-xs mt-1">
              The AI will transform only the masked regions
            </p>
          </div>
        </div>
      )}

      {/* Brush preview */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/80 backdrop-blur-sm rounded-full px-3 py-2">
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: brushSettings.isEraser ? '#ef4444' : '#a855f7'
            }}
          />
          <span className="text-white/70 text-xs">
            {brushSettings.isEraser ? 'Eraser' : 'Brush'}
          </span>
        </div>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-white/60 text-xs">
          Size: {brushSettings.size}px
        </span>
      </div>
    </motion.div>
  );
}