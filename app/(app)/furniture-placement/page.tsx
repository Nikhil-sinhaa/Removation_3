'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Wand2, Download, RotateCcw, Loader2,
  Image as ImageIcon, Sofa, CheckCircle, AlertCircle, RefreshCw, BookmarkCheck,
} from 'lucide-react';
import { BeforeAfterSlider } from '@/components/ui/before-after-slider';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

type Stage      = 'upload' | 'place' | 'done';
type AsyncState = 'idle' | 'loading' | 'done' | 'error';

export default function FurniturePlacementPage() {
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>('upload');

  // Room
  const [roomPreview,       setRoomPreview]       = useState('');  // blob URL for live preview
  const [roomPreviewUrl,    setRoomPreviewUrl]     = useState('');  // server URL for slider / MongoDB
  const [roomComfyFilename, setRoomComfyFilename]  = useState('');
  const [roomWidth,         setRoomWidth]          = useState(0);
  const [roomHeight,        setRoomHeight]         = useState(0);
  const [roomUpload,        setRoomUpload]         = useState<AsyncState>('idle');

  // Furniture
  const [furnitureFile,          setFurnitureFile]          = useState<File | null>(null);
  const [furniturePreview,       setFurniturePreview]       = useState('');
  const [furnitureNoBgUrl,       setFurnitureNoBgUrl]       = useState('');
  const [furnitureComfyFilename, setFurnitureComfyFilename] = useState('');  // ORIGINAL file
  const [bgState,                setBgState]                = useState<AsyncState>('idle');
  const [furNatW, setFurNatW] = useState(0);
  const [furNatH, setFurNatH] = useState(0);

  // Placement controls
  const [posX,     setPosX]     = useState(50);
  const [posY,     setPosY]     = useState(60);
  const [scalePct, setScalePct] = useState(30);
  const [rotation, setRotation] = useState(0);

  // Flow
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl,    setResultUrl]    = useState('');

  const fileRoomRef      = useRef<HTMLInputElement>(null);
  const fileFurnitureRef = useRef<HTMLInputElement>(null);

  // Load furniture natural dimensions from the no-bg image
  useEffect(() => {
    if (!furnitureNoBgUrl) return;
    const img = new Image();
    img.onload = () => { setFurNatW(img.naturalWidth); setFurNatH(img.naturalHeight); };
    img.src = furnitureNoBgUrl;
  }, [furnitureNoBgUrl]);

  // ── Room upload ───────────────────────────────────────────────────────────────
  const handleRoomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Room photo must be under 10 MB.', variant: 'destructive' });
      return;
    }
    setRoomPreview(URL.createObjectURL(file));
    setRoomPreviewUrl('');
    setRoomUpload('loading');
    setRoomComfyFilename('');
    try {
      const fd = new FormData();
      fd.append('roomImage', file);
      const res  = await fetch('/api/ai/furniture-placement/upload-room', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Room upload failed');
      setRoomComfyFilename(data.comfyFilename);
      setRoomWidth(data.roomWidth   || 1024);
      setRoomHeight(data.roomHeight || 768);
      setRoomPreviewUrl(data.inputImageUrl || '');
      setRoomUpload('done');
    } catch (err: any) {
      setRoomUpload('error');
      toast({ title: 'Room upload failed', description: err.message, variant: 'destructive' });
    }
  };

  // ── Furniture upload + bg removal ─────────────────────────────────────────────
  const runBgRemoval = async (file: File) => {
    setBgState('loading');
    setFurnitureNoBgUrl('');
    setFurnitureComfyFilename('');
    setFurNatW(0);
    setFurNatH(0);
    try {
      const fd = new FormData();
      fd.append('furnitureImage', file);
      const res  = await fetch('/api/ai/furniture-placement/remove-bg', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Background removal failed');
      setFurnitureNoBgUrl(data.furnitureNoBgUrl);
      setFurnitureComfyFilename(data.furnitureComfyFilename);
      setBgState('done');
    } catch (err: any) {
      setBgState('error');
      toast({ title: 'Background removal failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleFurnitureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Furniture photo must be under 10 MB.', variant: 'destructive' });
      return;
    }
    setFurnitureFile(file);
    setFurniturePreview(URL.createObjectURL(file));
    runBgRemoval(file);
  };

  // ── Continue to placement ─────────────────────────────────────────────────────
  const handleContinue = () => {
    if (roomUpload === 'done' && bgState === 'done') setStage('place');
  };

  // ── Generate ──────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!roomComfyFilename || !furnitureComfyFilename) {
      toast({ title: 'Missing files', description: 'Please upload both images first.', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/furniture-placement/composite', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomComfyFilename,
          furnitureComfyFilename,
          roomImageUrl: roomPreviewUrl || roomPreview,
          roomWidth,
          roomHeight,
          placement: {
            posX,
            posY,
            scaleFactor: scalePct / 100,
            rotation,
            furNatW,
            furNatH,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setResultUrl(data.resultUrl + '?t=' + Date.now());
      setStage('done');
    } catch (err: any) {
      toast({ title: 'Generation failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const handleTryAnother = () => { setResultUrl(''); setStage('place'); };

  const handleStartOver = () => {
    setStage('upload');
    setRoomPreview('');        setRoomPreviewUrl('');
    setRoomComfyFilename('');  setRoomWidth(0);  setRoomHeight(0);
    setRoomUpload('idle');
    setFurnitureFile(null);    setFurniturePreview('');
    setFurnitureNoBgUrl('');   setFurnitureComfyFilename('');
    setFurNatW(0);             setFurNatH(0);
    setBgState('idle');
    setIsGenerating(false);    setResultUrl('');
    setPosX(50); setPosY(60); setScalePct(30); setRotation(0);
  };

  // ── Derived values ────────────────────────────────────────────────────────────
  const canContinue = roomUpload === 'done' && bgState === 'done';

  // CSS preview: furniture width as % of room container
  const furCssWidthPct = roomWidth > 0 && furNatW > 0
    ? ((furNatW * (scalePct / 100)) / roomWidth) * 100
    : scalePct * 0.4;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto p-6 max-w-5xl">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/30">
            <Sofa className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Furniture Placer
          </h1>
        </div>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Upload your room and furniture photos. Set position, scale, and rotation — then generate.
        </p>
        <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
          <Badge className="bg-violet-100 text-violet-800">
            <Wand2 className="w-3 h-3 mr-1" />RMBG · INSPYRENET
          </Badge>
          <Badge className="bg-purple-100 text-purple-800">
            <ImageIcon className="w-3 h-3 mr-1" />Full Control Workflow
          </Badge>
          <Badge className="bg-indigo-100 text-indigo-800">
            <CheckCircle className="w-3 h-3 mr-1" />Before / After Slider
          </Badge>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ── UPLOAD STAGE ──────────────────────────────────────────────────────── */}
        {stage === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Room photo */}
              <div
                onClick={() => fileRoomRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group ${
                  roomPreview
                    ? roomUpload === 'done'
                      ? 'border-green-400 bg-green-50/30'
                      : 'border-violet-300 bg-violet-50/20'
                    : 'border-gray-200 hover:border-violet-400 hover:bg-violet-50/30'
                }`}
              >
                {roomPreview ? (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img src={roomPreview} alt="Room preview" className="w-full h-40 object-cover" />
                      {roomUpload === 'loading' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                      {roomUpload === 'done' && (
                        <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                      {roomUpload === 'error' && (
                        <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                          <AlertCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Room Photo — click to replace</p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gray-100 group-hover:bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
                      <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-violet-500" />
                    </div>
                    <p className="font-semibold text-gray-700 mb-1">Upload Room Photo</p>
                    <p className="text-sm text-gray-400">The room you want to furnish — JPG or PNG, max 10 MB</p>
                  </>
                )}
              </div>

              {/* Furniture photo */}
              <div
                onClick={() => fileFurnitureRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group ${
                  furniturePreview
                    ? bgState === 'done'
                      ? 'border-green-400 bg-green-50/30'
                      : 'border-purple-300 bg-purple-50/20'
                    : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50/30'
                }`}
              >
                {furniturePreview ? (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img
                        src={bgState === 'done' ? furnitureNoBgUrl : furniturePreview}
                        alt="Furniture preview"
                        className={`w-full h-40 ${bgState === 'done' ? 'object-contain bg-gray-100' : 'object-cover'}`}
                      />
                      {bgState === 'loading' && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                          <p className="text-white text-xs font-medium">Removing background…</p>
                        </div>
                      )}
                      {bgState === 'done' && (
                        <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                      {bgState === 'error' && (
                        <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                          <AlertCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Furniture Photo — click to replace</p>
                    {bgState === 'error' && (
                      <button
                        onClick={e => { e.stopPropagation(); if (furnitureFile) runBgRemoval(furnitureFile); }}
                        className="inline-flex items-center gap-1 text-xs text-red-600 underline"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry background removal
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gray-100 group-hover:bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
                      <Sofa className="w-8 h-8 text-gray-400 group-hover:text-purple-500" />
                    </div>
                    <p className="font-semibold text-gray-700 mb-1">Upload Furniture Photo</p>
                    <p className="text-sm text-gray-400">Product on white or plain background — JPG or PNG, max 10 MB</p>
                  </>
                )}
              </div>

              <input ref={fileRoomRef}      type="file" accept="image/*" className="hidden" onChange={handleRoomUpload} />
              <input ref={fileFurnitureRef} type="file" accept="image/*" className="hidden" onChange={handleFurnitureUpload} />
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleContinue}
                disabled={!canContinue}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl shadow-md shadow-violet-600/20 transition-all text-base"
              >
                <Wand2 className="w-4 h-4" /> Continue to Placement
              </button>
            </div>

            {(roomUpload === 'loading' || bgState === 'loading') && (
              <p className="text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {bgState === 'loading' ? 'Removing background…' : 'Uploading room…'}
              </p>
            )}
          </motion.div>
        )}

        {/* ── PLACE STAGE ───────────────────────────────────────────────────────── */}
        {stage === 'place' && (
          <motion.div
            key="place"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
              <button
                onClick={() => setStage('upload')}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Upload className="w-4 h-4" /> Change Images
              </button>
              <button
                onClick={() => { setPosX(50); setPosY(60); setScalePct(30); setRotation(0); }}
                className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="ml-auto flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg shadow-md shadow-violet-600/20 transition-all"
              >
                {isGenerating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                  : <><Wand2 className="w-4 h-4" /> Generate</>
                }
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left: Live CSS preview */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">
                  Live Preview <span className="text-xs text-gray-400">(approximate)</span>
                </p>
                <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-900">
                  <img src={roomPreview} alt="Room" className="w-full h-auto block" />
                  {furnitureNoBgUrl && (
                    <img
                      src={furnitureNoBgUrl}
                      alt="Furniture overlay"
                      style={{
                        position:    'absolute',
                        left:        `${posX}%`,
                        top:         `${posY}%`,
                        width:       `${Math.max(2, furCssWidthPct)}%`,
                        height:      'auto',
                        transform:   `translate(-50%, -50%) rotate(${rotation}deg)`,
                        pointerEvents: 'none',
                        userSelect:  'none',
                      }}
                    />
                  )}
                  {isGenerating && (
                    <div className="absolute inset-0 bg-gray-900/70 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-10 h-10 text-white animate-spin" />
                      <p className="text-white font-semibold">Placing furniture…</p>
                      <p className="text-white/60 text-sm">~30–60s</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Controls */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-600">Placement Controls</p>

                {([
                  { label: 'X Position', sub: '% from left',        value: posX,     setValue: setPosX,     min: 0,    max: 100, step: 1, unit: '%' },
                  { label: 'Y Position', sub: '% from top',         value: posY,     setValue: setPosY,     min: 0,    max: 100, step: 1, unit: '%' },
                  { label: 'Scale',      sub: '% of original size', value: scalePct, setValue: setScalePct, min: 5,    max: 200, step: 1, unit: '%' },
                  { label: 'Rotation',   sub: '° clockwise',        value: rotation, setValue: setRotation, min: -180, max: 180, step: 1, unit: '°' },
                ] as const).map(({ label, sub, value, setValue, min, max, step, unit }) => (
                  <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{label}</p>
                        <p className="text-xs text-gray-400">{sub}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          value={value}
                          min={min}
                          max={max}
                          onChange={e => setValue(Math.min(max, Math.max(min, Number(e.target.value))) as any)}
                          className="w-16 text-right text-sm font-mono border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <span className="text-xs text-gray-400 w-5">{unit}</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      value={value}
                      min={min}
                      max={max}
                      step={step}
                      onChange={e => setValue(Number(e.target.value) as any)}
                      className="w-full h-2 rounded-full accent-violet-600 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── DONE STAGE ────────────────────────────────────────────────────────── */}
        {stage === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-green-800 font-medium">
                Furniture placed successfully — drag the slider to compare.
              </p>
            </div>

            <BeforeAfterSlider
              beforeImage={roomPreviewUrl || roomPreview}
              afterImage={resultUrl}
              beforeLabel="Original"
              afterLabel="Furnished"
            />

            <div className="flex flex-wrap gap-3">
              <a
                href={resultUrl}
                download="furnished-room.png"
                className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold px-5 py-3 rounded-xl transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Download
              </a>
              <button
                onClick={() => toast({ title: 'Saved to project', description: 'Furniture placement saved.' })}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold px-5 py-3 rounded-xl transition-colors shadow-sm"
              >
                <BookmarkCheck className="w-4 h-4" /> Save to Project
              </button>
              <button
                onClick={handleTryAnother}
                className="flex items-center gap-2 border border-violet-200 text-violet-700 hover:bg-violet-50 font-semibold px-5 py-3 rounded-xl transition-colors"
              >
                <Wand2 className="w-4 h-4" /> Try Different Position
              </button>
              <button
                onClick={handleStartOver}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white font-semibold px-5 py-3 rounded-xl shadow-md shadow-violet-600/20 transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Start Over
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
