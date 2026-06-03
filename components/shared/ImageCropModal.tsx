'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw, RotateCw, ZoomIn, ZoomOut,
  Crop, Check, X, FlipHorizontal, FlipVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CropArea {
  x:      number;
  y:      number;
  width:  number;
  height: number;
}

export interface ImageCropModalProps {
  isOpen:       boolean;
  imageFile:    File | null;
  imageUrl:     string;
  onConfirm:    (croppedFile: File, croppedUrl: string) => void;
  onCancel:     () => void;
  aspectRatio?: number | null;
  title?:       string;
}

const ASPECT_PRESETS: { label: string; ratio: number | null }[] = [
  { label: 'Free', ratio: null },
  { label: '1:1',  ratio: 1 },
  { label: '4:3',  ratio: 4 / 3 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '3:4',  ratio: 3 / 4 },
];

export function ImageCropModal({
  isOpen,
  imageFile,
  imageUrl,
  onConfirm,
  onCancel,
  aspectRatio: initialAspectRatio = null,
  title = 'Crop & Adjust Image',
}: ImageCropModalProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef     = useRef<HTMLImageElement | null>(null);
  const isDragging   = useRef(false);
  const dragStart    = useRef({ x: 0, y: 0 });
  const dragType     = useRef<'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | null>(null);

  const [rotation,     setRotation]     = useState(0);
  const [flipH,        setFlipH]        = useState(false);
  const [flipV,        setFlipV]        = useState(false);
  const [zoom,         setZoom]         = useState(1);
  const [aspectRatio,  setAspectRatio]  = useState<number | null>(initialAspectRatio);
  const [cropArea,     setCropArea]     = useState<CropArea>({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
  const [imageLoaded,  setImageLoaded]  = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load image when URL changes
  useEffect(() => {
    if (!imageUrl || !isOpen) return;
    setImageLoaded(false);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(1);

    const img = new window.Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);

      if (initialAspectRatio) {
        const imgAR = img.width / img.height;
        let w = 0.8, h = 0.8;
        if (initialAspectRatio > imgAR) {
          w = 0.95; h = (w / initialAspectRatio) * imgAR;
        } else {
          h = 0.95; w = (h * initialAspectRatio) / imgAR;
        }
        setCropArea({ x: (1 - w) / 2, y: (1 - h) / 2, width: w, height: h });
      } else {
        setCropArea({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
      }
    };
    img.src = imageUrl;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, isOpen]);

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;
    const container = containerRef.current;
    if (!container) return;

    const maxW  = container.clientWidth  || 600;
    const maxH  = container.clientHeight || 400;
    const angle = (rotation * Math.PI) / 180;
    const ac    = Math.abs(Math.cos(angle));
    const as_   = Math.abs(Math.sin(angle));
    const rotW  = img.width  * ac + img.height * as_;
    const rotH  = img.width  * as_ + img.height * ac;
    const scale = Math.min(maxW / rotW, maxH / rotH) * zoom;
    const dispW = Math.round(img.width  * scale);
    const dispH = Math.round(img.height * scale);
    const cW    = Math.round(rotW * scale);
    const cH    = Math.round(rotH * scale);

    canvas.width  = cW;
    canvas.height = cH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, cW, cH);

    // Draw full image with transforms
    ctx.save();
    ctx.translate(cW / 2, cH / 2);
    ctx.rotate(angle);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -dispW / 2, -dispH / 2, dispW, dispH);
    ctx.restore();

    // Dark overlay
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, cW, cH);

    const cx = cropArea.x * cW;
    const cy = cropArea.y * cH;
    const cw = cropArea.width  * cW;
    const ch = cropArea.height * cH;

    // Redraw image inside crop area clearly
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx, cy, cw, ch);
    ctx.clip();
    ctx.translate(cW / 2, cH / 2);
    ctx.rotate(angle);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -dispW / 2, -dispH / 2, dispW, dispH);
    ctx.restore();

    // Crop border
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth   = 2;
    ctx.strokeRect(cx, cy, cw, ch);

    // Rule of thirds
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth   = 0.5;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + (cw * i) / 3, cy);
      ctx.lineTo(cx + (cw * i) / 3, cy + ch);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy + (ch * i) / 3);
      ctx.lineTo(cx + cw, cy + (ch * i) / 3);
      ctx.stroke();
    }

    // Corner handles
    const hs = 10;
    ctx.fillStyle = '#8B5CF6';
    [[cx, cy], [cx + cw - hs, cy], [cx, cy + ch - hs], [cx + cw - hs, cy + ch - hs]].forEach(
      ([hx, hy]) => ctx.fillRect(hx, hy, hs, hs)
    );

    ctx.restore();
  }, [rotation, flipH, flipV, zoom, cropArea, imageLoaded]);

  useEffect(() => { draw(); }, [draw]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect    = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / canvas.width,
      y: (clientY - rect.top)  / canvas.height,
    };
  };

  const getHitTarget = (pos: { x: number; y: number }) => {
    const { x, y, width, height } = cropArea;
    const hs = 0.03;
    if (Math.abs(pos.x - x)            < hs && Math.abs(pos.y - y)            < hs) return 'resize-tl';
    if (Math.abs(pos.x - (x + width))  < hs && Math.abs(pos.y - y)            < hs) return 'resize-tr';
    if (Math.abs(pos.x - x)            < hs && Math.abs(pos.y - (y + height)) < hs) return 'resize-bl';
    if (Math.abs(pos.x - (x + width))  < hs && Math.abs(pos.y - (y + height)) < hs) return 'resize-br';
    if (pos.x > x && pos.x < x + width && pos.y > y && pos.y < y + height) return 'move';
    return null;
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if ('touches' in e) e.preventDefault();
    const pos  = getPos(e, canvas);
    const type = getHitTarget(pos);
    if (!type) return;
    isDragging.current = true;
    dragType.current   = type;
    dragStart.current  = pos;
  };

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !isDragging.current) return;
    if ('touches' in e) e.preventDefault();

    const pos = getPos(e, canvas);
    const dx  = pos.x - dragStart.current.x;
    const dy  = pos.y - dragStart.current.y;
    dragStart.current = pos;

    setCropArea(prev => {
      let { x, y, width, height } = prev;
      const min = 0.05;

      if (dragType.current === 'move') {
        x = Math.max(0, Math.min(1 - width,  x + dx));
        y = Math.max(0, Math.min(1 - height, y + dy));
      } else if (dragType.current === 'resize-tl') {
        const nx = Math.max(0,    Math.min(x + width  - min, x + dx));
        const ny = Math.max(0,    Math.min(y + height - min, y + dy));
        width += x - nx; height += y - ny; x = nx; y = ny;
      } else if (dragType.current === 'resize-tr') {
        const ny = Math.max(0,    Math.min(y + height - min, y + dy));
        height += y - ny; y = ny;
        width  = Math.max(min, Math.min(1 - x, width + dx));
      } else if (dragType.current === 'resize-bl') {
        const nx = Math.max(0, Math.min(x + width - min, x + dx));
        width += x - nx; x = nx;
        height = Math.max(min, Math.min(1 - y, height + dy));
      } else if (dragType.current === 'resize-br') {
        width  = Math.max(min, Math.min(1 - x, width  + dx));
        height = Math.max(min, Math.min(1 - y, height + dy));
      }

      // Enforce aspect ratio on resize
      if (aspectRatio && dragType.current !== 'move' && imageRef.current) {
        const imgAR     = imageRef.current.width / imageRef.current.height;
        const targetAR  = aspectRatio / imgAR;
        height = width / targetAR;
        if (y + height > 1) { height = 1 - y; width = height * targetAR; }
        if (x + width  > 1) { width  = 1 - x; height = width / targetAR; }
      }

      return { x, y, width, height };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspectRatio]);

  const handlePointerUp = () => { isDragging.current = false; };

  const applyCrop = useCallback(async () => {
    const img = imageRef.current;
    if (!img || isProcessing) return;
    setIsProcessing(true);

    try {
      const offscreen = document.createElement('canvas');
      const angle     = (rotation * Math.PI) / 180;
      const ac        = Math.abs(Math.cos(angle));
      const as_       = Math.abs(Math.sin(angle));
      const fullW     = img.width  * ac + img.height * as_;
      const fullH     = img.width  * as_ + img.height * ac;
      offscreen.width  = fullW;
      offscreen.height = fullH;

      const ctx = offscreen.getContext('2d')!;
      ctx.translate(fullW / 2, fullH / 2);
      ctx.rotate(angle);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const cropCanvas = document.createElement('canvas');
      const px = Math.round(cropArea.x      * fullW);
      const py = Math.round(cropArea.y      * fullH);
      const pw = Math.round(cropArea.width  * fullW);
      const ph = Math.round(cropArea.height * fullH);
      cropCanvas.width  = pw;
      cropCanvas.height = ph;
      cropCanvas.getContext('2d')!.drawImage(offscreen, px, py, pw, ph, 0, 0, pw, ph);

      cropCanvas.toBlob(
        blob => {
          if (!blob) { setIsProcessing(false); onCancel(); return; }
          const type        = imageFile?.type || 'image/jpeg';
          const name        = imageFile?.name || 'cropped.jpg';
          const croppedFile = new File([blob], name, { type });
          const croppedUrl  = URL.createObjectURL(blob);
          setIsProcessing(false);
          onConfirm(croppedFile, croppedUrl);
        },
        imageFile?.type || 'image/jpeg',
        0.92
      );
    } catch {
      setIsProcessing(false);
      onCancel();
    }
  }, [rotation, flipH, flipV, cropArea, imageFile, onConfirm, onCancel, isProcessing]);

  const rotate = (deg: number) => setRotation(r => (r + deg + 360) % 360);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)' }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1,    opacity: 1 }}
          exit={{ scale: 0.95,    opacity: 0 }}
          className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden border border-neutral-700"
          style={{ maxHeight: '90vh' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Crop className="w-4 h-4 text-purple-400" />
              <span className="font-semibold text-white text-sm">{title}</span>
            </div>
            <button onClick={onCancel} className="text-neutral-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Canvas */}
          <div
            ref={containerRef}
            className="flex-1 flex items-center justify-center p-4 overflow-hidden bg-neutral-950"
            style={{ minHeight: '260px', maxHeight: '52vh' }}
          >
            {!imageLoaded ? (
              <div className="flex items-center gap-2 text-neutral-500 text-sm">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                Loading...
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full rounded select-none"
                style={{ cursor: 'crosshair', touchAction: 'none' }}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              />
            )}
          </div>

          {/* Controls */}
          <div className="px-5 py-4 border-t border-neutral-800 space-y-3 flex-shrink-0">
            {/* Aspect ratio presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-neutral-500">Ratio:</span>
              {ASPECT_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => setAspectRatio(preset.ratio)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    aspectRatio === preset.ratio
                      ? 'bg-purple-600 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Transform controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => rotate(-90)}
                  className="p-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
                  title="Rotate left 90°"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => rotate(90)}
                  className="p-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
                  title="Rotate right 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setFlipH(f => !f)}
                  className={`p-2 rounded-lg transition-colors ${flipH ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}
                  title="Flip horizontal"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setFlipV(f => !f)}
                  className={`p-2 rounded-lg transition-colors ${flipV ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}
                  title="Flip vertical"
                >
                  <FlipVertical className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(z => Math.max(0.5, +(z - 0.15).toFixed(2)))}
                  className="p-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(z => Math.min(3, +(z + 0.15).toFixed(2)))}
                  className="p-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => { setCropArea({ x: 0.05, y: 0.05, width: 0.9, height: 0.9 }); setRotation(0); setFlipH(false); setFlipV(false); setZoom(1); }}
                className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                onClick={onCancel}
                disabled={isProcessing}
              >
                Skip (use original)
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={applyCrop}
                disabled={isProcessing || !imageLoaded}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Apply Crop
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ImageCropModal;
