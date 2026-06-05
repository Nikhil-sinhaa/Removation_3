'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, ChevronRight, ChevronLeft, Sparkles, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

interface StyleOption {
  id: string;
  name: string;
  description: string;
  colorName: string;
  hex: string;
  swatchClass: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const SAMPLE_ROOMS = [
  { label: 'Living Room', src: '/samples/living-room.jpg' },
  { label: 'Bedroom',     src: '/samples/bedroom.jpg' },
  { label: 'Kitchen',     src: '/samples/kitchen.jpg' },
];

const STYLES: StyleOption[] = [
  {
    id: 'modern',
    name: 'Modern Minimalist',
    description: 'Clean lines, neutral palette',
    colorName: 'warm white',
    hex: '#F5F0E8',
    swatchClass: 'bg-[#F5F0E8] border border-gray-300',
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    description: 'Light, airy, natural tones',
    colorName: 'soft sage green',
    hex: '#B5C4B1',
    swatchClass: 'bg-[#B5C4B1]',
  },
  {
    id: 'industrial',
    name: 'Industrial',
    description: 'Raw textures, dark accents',
    colorName: 'charcoal gray',
    hex: '#707070',
    swatchClass: 'bg-[#707070]',
  },
  {
    id: 'bohemian',
    name: 'Bohemian',
    description: 'Warm earthy terracotta',
    colorName: 'terracotta orange',
    hex: '#C4704F',
    swatchClass: 'bg-[#C4704F]',
  },
  {
    id: 'indian',
    name: 'Classic Indian',
    description: 'Rich marigold warmth',
    colorName: 'marigold yellow',
    hex: '#F4A940',
    swatchClass: 'bg-[#F4A940]',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'Deep navy, opulent feel',
    colorName: 'deep navy blue',
    hex: '#1B2A4A',
    swatchClass: 'bg-[#1B2A4A]',
  },
];

const LS = {
  step:      'onboarding_step',
  imageUrl:  'onboarding_image_url',
  imageSrc:  'onboarding_image_src',
  styleId:   'onboarding_style_id',
  projectId: 'onboarding_project_id',
  resultUrl: 'onboarding_result_url',
  beforeUrl: 'onboarding_before_url',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function lsGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}
function lsSet(key: string, val: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, val);
}
function lsClear() {
  if (typeof window === 'undefined') return;
  Object.values(LS).forEach(k => localStorage.removeItem(k));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep]           = useState<Step>(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc]   = useState<string | null>(null);   // data URL or sample path
  const [isDragging, setIsDragging] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [progress, setProgress]   = useState(0);
  const [pollError, setPollError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const sliderRef    = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const draggingSlider = useRef(false);

  // ── Restore from localStorage ──────────────────────────────────────────────
  useEffect(() => {
    const savedStep      = parseInt(lsGet(LS.step) || '1', 10) as Step;
    const savedImageSrc  = lsGet(LS.imageSrc);
    const savedStyleId   = lsGet(LS.styleId);
    const savedProjectId = lsGet(LS.projectId);
    const savedResultUrl = lsGet(LS.resultUrl);
    const savedBeforeUrl = lsGet(LS.beforeUrl);

    if (savedImageSrc)  setImageSrc(savedImageSrc);
    if (savedStyleId)   setSelectedStyle(STYLES.find(s => s.id === savedStyleId) || null);
    if (savedProjectId) setProjectId(savedProjectId);
    if (savedResultUrl) setResultUrl(savedResultUrl);
    if (savedBeforeUrl) setBeforeUrl(savedBeforeUrl);

    // If we were mid-generation on refresh, jump back to step 3 and resume polling
    if (savedStep >= 1 && savedStep <= 4) {
      setStep(savedStep as Step);
    }
  }, []);

  // ── Resume polling on step 3 restore ──────────────────────────────────────
  useEffect(() => {
    if (step === 3 && projectId && !resultUrl) {
      startPolling(projectId);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, projectId]);

  // ── Persist step ──────────────────────────────────────────────────────────
  useEffect(() => {
    lsSet(LS.step, String(step));
  }, [step]);

  // ── Complete onboarding ────────────────────────────────────────────────────
  const completeOnboarding = useCallback(async () => {
    lsClear();
    await fetch('/api/user/complete-onboarding', { method: 'POST' });
  }, []);

  const navigateTo = useCallback(async (path: string) => {
    await completeOnboarding();
    window.location.href = path;
  }, [completeOnboarding]);

  // ── Image upload/select ────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
      lsSet(LS.imageSrc, src);
    };
    reader.readAsDataURL(file);
  };

  const handleSampleSelect = (src: string) => {
    setImageFile(null);
    setImageSrc(src);
    lsSet(LS.imageSrc, src);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!imageSrc || !selectedStyle) return;
    setStep(3);
    lsSet(LS.step, '3');
    setProgress(5);
    setPollError(null);

    try {
      const fd = new FormData();
      fd.append('colorName', selectedStyle.colorName);
      fd.append('hex', selectedStyle.hex);
      fd.append('source', 'onboarding');

      if (imageFile) {
        fd.append('roomImage', imageFile);
      } else if (imageSrc?.startsWith('/samples/')) {
        // Fetch the sample image and attach as a File
        const blob = await fetch(imageSrc).then(r => r.blob());
        const filename = imageSrc.split('/').pop() || 'room.jpg';
        fd.append('roomImage', new File([blob], filename, { type: blob.type || 'image/jpeg' }));
      } else if (imageSrc?.startsWith('data:')) {
        // Convert data URL to File
        const res = await fetch(imageSrc);
        const blob = await res.blob();
        fd.append('roomImage', new File([blob], 'room.png', { type: 'image/png' }));
      }

      const res = await fetch('/api/ai/room-changer/generate', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok || !data.projectId) {
        setPollError(data.error || 'Failed to start generation');
        setStep(2);
        lsSet(LS.step, '2');
        return;
      }

      setProjectId(data.projectId);
      lsSet(LS.projectId, data.projectId);
      startPolling(data.projectId);
    } catch (err: any) {
      setPollError(err.message || 'Network error');
      setStep(2);
      lsSet(LS.step, '2');
    }
  };

  // ── Polling ────────────────────────────────────────────────────────────────
  const startPolling = (pid: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    let elapsed = 0;
    pollRef.current = setInterval(async () => {
      elapsed += 3;
      // Fake progress: ramp from 5 → 90 over 90 seconds then stall
      setProgress(Math.min(90, 5 + elapsed * 0.93));

      try {
        const r = await fetch(`/api/ai/room-changer/generate?projectId=${pid}`);
        const d = await r.json();

        if (d.status === 'completed' && d.afterUrl) {
          clearInterval(pollRef.current!);
          setProgress(100);
          setResultUrl(d.afterUrl);
          setBeforeUrl(d.beforeUrl || imageSrc || '');
          lsSet(LS.resultUrl, d.afterUrl);
          lsSet(LS.beforeUrl, d.beforeUrl || imageSrc || '');
          lsSet(LS.step, '4');
          setStep(4);
        } else if (d.status === 'failed') {
          clearInterval(pollRef.current!);
          setPollError(d.errorMessage || 'Generation failed');
          lsSet(LS.step, '2');
          setStep(2);
        }
      } catch {
        // transient network error — keep polling
      }
    }, 3000);
  };

  // ── Before/After slider ────────────────────────────────────────────────────
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    draggingSlider.current = true;
    e.preventDefault();
  };

  const handleSliderMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingSlider.current || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  const handleSliderMouseUp = useCallback(() => {
    draggingSlider.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleSliderMouseMove);
    window.addEventListener('mouseup', handleSliderMouseUp);
    window.addEventListener('touchend', handleSliderMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleSliderMouseMove);
      window.removeEventListener('mouseup', handleSliderMouseUp);
      window.removeEventListener('touchend', handleSliderMouseUp);
    };
  }, [handleSliderMouseMove, handleSliderMouseUp]);

  const handleSliderTouchMove = (e: React.TouchEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  // ── Skip ───────────────────────────────────────────────────────────────────
  const handleSkip = async () => {
    // 1. Mark onboarding complete in DB
    await fetch('/api/user/complete-onboarding', { method: 'POST' });
    
    // 2. Clear localStorage onboarding state using the helper
    lsClear();
    
    // 3. Hard redirect to dashboard (not router.push — use window.location)
    window.location.href = '/dashboard';
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg">Removation</span>
        </div>

        {/* Progress dots + skip */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5">
            {([1, 2, 3, 4] as Step[]).map(s => (
              <div
                key={s}
                className={cn(
                  'rounded-full transition-all duration-300',
                  s === step ? 'w-6 h-2 bg-violet-500' : s < step ? 'w-2 h-2 bg-violet-600' : 'w-2 h-2 bg-gray-700'
                )}
              />
            ))}
          </div>
          {(step === 1 || step === 2) && (
            <button
              onClick={handleSkip}
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1"
            >
              Skip for now <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Slim progress bar */}
      <div className="mx-6 mt-4 h-0.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        {/* ── Step 1: Upload ── */}
        {step === 1 && (
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-medium mb-4">
                <Sparkles className="w-3 h-3" /> Step 1 of 4
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Let's transform your space
              </h1>
              <p className="text-gray-400">
                Upload a room photo or pick one of our samples — we'll show you what AI can do in 30 seconds.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
                isDragging
                  ? 'border-violet-500 bg-violet-500/10'
                  : imageSrc && !imageSrc.startsWith('/samples/')
                  ? 'border-violet-600 bg-gray-900'
                  : 'border-gray-700 bg-gray-900 hover:border-gray-500 hover:bg-gray-800/50'
              )}
            >
              {imageSrc && !imageSrc.startsWith('/samples/') ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageSrc} alt="Uploaded room" className="w-full h-48 object-cover rounded-xl" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-medium">Click to change</p>
                  </div>
                  <div className="absolute top-2 right-2 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-white font-medium mb-1">Drop your photo here</p>
                  <p className="text-gray-500 text-sm">or click to browse — JPG, PNG up to 20 MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
            </div>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-gray-950 text-gray-500 text-xs">or try a sample</span>
              </div>
            </div>

            {/* Samples */}
            <div className="grid grid-cols-3 gap-3">
              {SAMPLE_ROOMS.map(room => (
                <button
                  key={room.src}
                  onClick={() => handleSampleSelect(room.src)}
                  className={cn(
                    'relative rounded-xl overflow-hidden border-2 transition-all duration-200 aspect-video',
                    imageSrc === room.src
                      ? 'border-violet-500 shadow-lg shadow-violet-500/25'
                      : 'border-gray-800 hover:border-gray-600'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={room.src} alt={room.label} className="w-full h-full object-cover" />
                  {imageSrc === room.src && (
                    <div className="absolute inset-0 bg-violet-600/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white drop-shadow" />
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 p-1.5">
                    <p className="text-white text-xs font-medium text-center">{room.label}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => { if (imageSrc) setStep(2); }}
              disabled={!imageSrc}
              className={cn(
                'w-full mt-6 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200',
                imageSrc
                  ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              )}
            >
              Choose a Style <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Step 2: Style Picker ── */}
        {step === 2 && (
          <div className="w-full max-w-xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-medium mb-4">
                <Sparkles className="w-3 h-3" /> Step 2 of 4
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Choose your design style
              </h1>
              <p className="text-gray-400">Pick a vibe — we'll repaint and style your room to match.</p>
            </div>

            {pollError && (
              <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-800 text-red-300 text-sm">
                {pollError}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {STYLES.map(style => (
                <button
                  key={style.id}
                  onClick={() => { setSelectedStyle(style); lsSet(LS.styleId, style.id); }}
                  className={cn(
                    'relative p-4 rounded-2xl border-2 text-left transition-all duration-200',
                    selectedStyle?.id === style.id
                      ? 'border-violet-500 bg-violet-600/10 shadow-lg shadow-violet-500/20'
                      : 'border-gray-800 bg-gray-900 hover:border-gray-600 hover:bg-gray-800/50'
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-lg mb-3', style.swatchClass)} />
                  <p className="text-white font-semibold text-sm leading-tight">{style.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{style.description}</p>
                  {selectedStyle?.id === style.id && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-shrink-0 px-4 py-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium flex items-center gap-2 transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleGenerate}
                disabled={!selectedStyle}
                className={cn(
                  'flex-1 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200',
                  selectedStyle
                    ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                )}
              >
                <Sparkles className="w-4 h-4" /> Generate My Design
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Generating ── */}
        {step === 3 && (
          <div className="w-full max-w-md text-center">
            <div className="mb-8">
              <div className="relative w-24 h-24 mx-auto mb-6">
                {/* Spinning rings */}
                <div className="absolute inset-0 rounded-full border-4 border-gray-800" />
                <div
                  className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 animate-spin"
                  style={{ animationDuration: '1.2s' }}
                />
                <div
                  className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-400 animate-spin"
                  style={{ animationDuration: '0.9s', animationDirection: 'reverse' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-violet-400 animate-pulse" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-white mb-2">Transforming your space…</h1>
              <p className="text-gray-400 text-sm">
                Our AI is painting your walls and reimagining your room.
                <br />This takes about 30–60 seconds.
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-800 rounded-full h-2 mb-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-gray-500 text-xs">{Math.round(progress)}% complete</p>

            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              {['Analyzing room', 'Detecting walls', 'Applying style'].map((label, i) => (
                <div key={label} className="p-3 rounded-xl bg-gray-900 border border-gray-800">
                  <div className={cn(
                    'w-2 h-2 rounded-full mx-auto mb-1.5',
                    progress > i * 30 + 5 ? 'bg-violet-500' : 'bg-gray-700'
                  )} />
                  <p className="text-gray-400 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 4: Result ── */}
        {step === 4 && resultUrl && (
          <div className="w-full max-w-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-600/20 border border-green-500/30 text-green-300 text-xs font-medium mb-3">
                <Check className="w-3 h-3" /> Done!
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Your room, reimagined</h1>
              <p className="text-gray-400">Drag the slider to compare before &amp; after</p>
            </div>

            {/* Before/After slider */}
            <div
              ref={sliderRef}
              className="relative rounded-2xl overflow-hidden select-none cursor-ew-resize mb-6"
              style={{ aspectRatio: '4/3' }}
              onMouseDown={handleSliderMouseDown}
              onTouchMove={handleSliderTouchMove}
              onTouchStart={() => { draggingSlider.current = true; }}
            >
              {/* After (full width background) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultUrl}
                alt="After"
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />

              {/* Before (clipped) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPos}%` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={beforeUrl || imageSrc || ''}
                  alt="Before"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: 'none' }}
                  draggable={false}
                />
              </div>

              {/* Divider handle */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
                style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l-3 3 3 3M16 9l3 3-3 3" />
                  </svg>
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 rounded text-white text-xs font-medium backdrop-blur-sm">Before</div>
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-violet-600/80 rounded text-white text-xs font-medium backdrop-blur-sm">After</div>
            </div>

            {/* CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => navigateTo('/projects')}
                className="py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-violet-600/30"
              >
                <Check className="w-4 h-4" /> Save to Projects
              </button>
              <button
                onClick={() => navigateTo('/designers')}
                className="py-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200"
              >
                <Sparkles className="w-4 h-4" /> Book a Designer
              </button>
              <button
                onClick={() => navigateTo('/dashboard')}
                className="py-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold flex items-center justify-center gap-2 transition-all duration-200"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
