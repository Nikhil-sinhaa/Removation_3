"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wand2, Cpu, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { useGPUStatus } from '@/hooks/useGPUStatus';

interface Point {
  x: number;
  y: number;
}

interface MaskData {
  mask: string; // base64 encoded mask
  confidence: number;
}

export function ObjectRemovalSidebar({ imageUrl, onImageUpdate }: {
  imageUrl: string;
  onImageUpdate: (newImageUrl: string) => void;
}) {
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [maskPreview, setMaskPreview] = useState<MaskData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'idle' | 'segmenting' | 'inpainting' | 'complete'>('idle');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const { gpuStatus, checkGPUStatus } = useGPUStatus();
  const [isInQueue, setIsInQueue] = useState(false);

  // Handle canvas click for object selection
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !imageRef.current || gpuStatus.status !== 'idle') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / canvas.width;
    const scaleY = imageRef.current.naturalHeight / canvas.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    setSelectedPoint({ x, y });
    setMaskPreview(null);
    setCurrentStep('segmenting');
    
    // Trigger SAM 2 segmentation
    triggerSegmentation(x, y);
  }, [gpuStatus.status]);

  // Trigger SAM 2 segmentation
  const triggerSegmentation = async (x: number, y: number) => {
    try {
      setIsGenerating(true);
      setProgress(10);

      const response = await fetch('/api/ai/segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          point: { x, y }
        })
      });

      if (!response.ok) {
        throw new Error('Segmentation failed');
      }

      const maskData = await response.json();
      setMaskPreview(maskData);
      setProgress(40);
      setCurrentStep('idle');
    } catch (error) {
      console.error('Segmentation error:', error);
      setCurrentStep('idle');
      setSelectedPoint(null);
    } finally {
      setIsGenerating(false);
    }
  };

  // Confirm object removal
  const confirmRemoval = async () => {
    if (!selectedPoint || !maskPreview) return;

    try {
      setIsGenerating(true);
      setCurrentStep('inpainting');
      setProgress(50);

      setIsInQueue(true);
      const res = await fetch('/api/ai/object-removal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          point: selectedPoint,
          mask: maskPreview.mask,
        }),
      });
      setIsInQueue(false);
      const response = await res.json();

      if (response.success) {
        setProgress(100);
        setCurrentStep('complete');
        onImageUpdate(response.resultImageUrl);
        
        // Reset after 2 seconds
        setTimeout(() => {
          setSelectedPoint(null);
          setMaskPreview(null);
          setCurrentStep('idle');
          setProgress(0);
        }, 2000);
      }
    } catch (error) {
      console.error('Removal error:', error);
      setCurrentStep('idle');
    } finally {
      setIsGenerating(false);
      setIsInQueue(false);
    }
  };

  // Draw mask preview on canvas
  useEffect(() => {
    if (!canvasRef.current || !imageRef.current || !maskPreview) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    // Draw mask overlay
    const img = new Image();
    img.onload = () => {
      ctx.globalAlpha = 0.5;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1.0;
    };
    img.src = `data:image/png;base64,${maskPreview.mask}`;

    // Draw selection point
    if (selectedPoint) {
      const scaleX = canvas.width / imageRef.current.naturalWidth;
      const scaleY = canvas.height / imageRef.current.naturalHeight;
      
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(selectedPoint.x * scaleX, selectedPoint.y * scaleY, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [maskPreview, selectedPoint]);

  // Check GPU status periodically
  useEffect(() => {
    const interval = setInterval(checkGPUStatus, 5000);
    return () => clearInterval(interval);
  }, [checkGPUStatus]);

  const getStatusColor = () => {
    switch (gpuStatus.status) {
      case 'idle': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (gpuStatus.status) {
      case 'idle': return 'GPU Ready';
      case 'busy': return 'GPU Busy';
      case 'offline': return 'GPU Offline';
      default: return 'Unknown';
    }
  };

  return (
    <Card className="w-80 h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Object Removal
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <span className="text-xs text-muted-foreground">{getStatusText()}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* GPU Status */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              GPU Status
            </span>
            <Badge variant={gpuStatus.status === 'idle' ? 'default' : 'secondary'}>
              {getStatusText()}
            </Badge>
          </div>
          {gpuStatus.vramUsed && (
            <div className="mt-2 text-xs text-muted-foreground">
              VRAM: {gpuStatus.vramUsed}GB / 8GB
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={300}
            height={200}
            className="w-full border rounded cursor-crosshair"
            onClick={handleCanvasClick}
            style={{ imageRendering: 'pixelated' }}
          />
          <img
            ref={imageRef}
            src={imageUrl}
            alt=""
            className="hidden"
            crossOrigin="anonymous"
            onLoad={() => {
              if (canvasRef.current) {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                if (ctx && imageRef.current) {
                  ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
                }
              }
            }}
          />
        </div>

        {/* Progress */}
        {(isGenerating || currentStep !== 'idle') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {currentStep === 'segmenting' && <Zap className="w-4 h-4 animate-pulse" />}
                {currentStep === 'inpainting' && <Loader2 className="w-4 h-4 animate-spin" />}
                {currentStep === 'complete' && <CheckCircle className="w-4 h-4" />}
                {currentStep === 'segmenting' && 'Segmenting...'}
                {currentStep === 'inpainting' && 'Removing Object...'}
                {currentStep === 'complete' && 'Complete!'}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {maskPreview && currentStep === 'idle' && (
            <Button
              onClick={confirmRemoval}
              disabled={gpuStatus.status !== 'idle' || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Confirm Removal
                </>
              )}
            </Button>
          )}

          {gpuStatus.status === 'offline' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4" />
                GPU Offline
              </div>
              <p className="text-xs text-red-600 mt-1">
                Please start ComfyUI server
              </p>
            </div>
          )}

          {isInQueue && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Queued for processing
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Click on the object you want to remove
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
