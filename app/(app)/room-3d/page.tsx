// app/(app)/room-3d/page.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ColorPicker, ColorValue } from '@/components/roomChanger/ColorPicker';
import {
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Box,
  ExternalLink,
  Paintbrush,
  Image as ImageIcon,
  RefreshCw,
  Layers,
  Camera,
  Sparkles,
  Download,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { downloadMultiRoomZip } from '@/lib/ai/download-multi-room';
import RatingFeedback from '@/src/components/RatingFeedback';
import { useToast } from '@/components/ui/use-toast';

type PaintStage = 'upload' | 'painting' | 'painted' | 'generating3d' | 'done' | 'cancelled' | 'error';

interface PhotoStatus {
  order: number;
  originalUrl: string;
  paintedUrl: string | null;
  status: 'queued' | 'processing' | 'done' | 'error';
  errorMessage?: string | null;
}

interface ProjectData {
  projectId: string;
  roomName: string;
  colorName: string;
  colorHex: string;
  paintingStatus: string;
  paintedCount: number;
  totalCount: number;
  photos: PhotoStatus[];
  marbleStatus: string;
  marbleWorldUrl: string | null;
  marbleThumbnail: string | null;
  errorMessage: string | null;
}

export default function Room3DPage() {
  const { toast } = useToast();
  const [stage, setStage]             = useState<PaintStage>('upload');
  const [files, setFiles]             = useState<File[]>([]);
  const [previews, setPreviews]       = useState<string[]>([]);
  const [roomName, setRoomName]       = useState('My Room');
  const [color, setColor]             = useState<ColorValue>({ name: '', hex: '' });
  const [projectId, setProjectId]     = useState<string | null>(null);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [error, setError]             = useState('');
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied]           = useState(false);

  const fileRef  = useRef<HTMLInputElement>(null);
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const stageRef = useRef(stage);

  useEffect(() => { stageRef.current = stage; }, [stage]);

  // ── File selection ──────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length < 3) {
      setError('Please select at least 3 photos');
      return;
    }
    if (selected.length > 15) {
      setError('Maximum 15 photos allowed');
      return;
    }
    setError('');
    setFiles(selected);

    // Build preview URLs
    const urls = selected.map(f => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith('image/')
    );
    if (dropped.length === 0) return;
    if (dropped.length < 3) { setError('Please drop at least 3 photos'); return; }
    setError('');
    setFiles(dropped);
    setPreviews(dropped.map(f => URL.createObjectURL(f)));
  };

  // ── Polling ─────────────────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPolling = useCallback((pid: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/multi-room/status/${pid}`);
        if (!res.ok) return;
        const data: ProjectData = await res.json();
        setProjectData(data);

        const currentStage = stageRef.current;

        if (
          data.paintingStatus === 'painted' &&
          (currentStage === 'painting' || currentStage === 'upload')
        ) {
          stopPolling();
          setStage('painted');
        } else if (data.marbleStatus === 'done') {
          stopPolling();
          setStage('done');
        } else if (data.marbleStatus === 'cancelled') {
          stopPolling();
          setStage('cancelled');
        } else if (
          data.paintingStatus === 'error' &&
          currentStage === 'painting'
        ) {
          stopPolling();
          setError(data.errorMessage || 'All photos failed to paint');
          setStage('error');
        } else if (
          data.marbleStatus === 'error' &&
          currentStage === 'generating3d'
        ) {
          stopPolling();
          setError(data.errorMessage || '3D generation failed');
          setStage('error');
        }
      } catch { /* ignore transient poll errors */ }
    }, 4000);
  }, [stopPolling]);

  useEffect(() => () => { stopPolling(); previews.forEach(URL.revokeObjectURL); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('projectId');
    if (pid) {
      setProjectId(pid);
      setStage('generating3d');
      startPolling(pid);
    }
  }, [startPolling]);

  // ── Upload + start painting ─────────────────────────────────────────────────
  const handleUploadAndPaint = async () => {
    if (files.length < 3) { setError('Please select at least 3 photos'); return; }
    if (!color.hex)        { setError('Please select a wall color'); return; }

    setStage('painting');
    setError('');

    const formData = new FormData();
    formData.append('roomName', roomName);
    formData.append('colorName', color.name);
    formData.append('colorHex', color.hex);
    files.forEach(f => formData.append('photos', f));

    try {
      const res = await fetch('/api/multi-room/create', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Upload failed');
        setStage('error');
        return;
      }

      setProjectId(data.projectId);
      startPolling(data.projectId);
    } catch (err: any) {
      setError(err.message || 'Network error');
      setStage('error');
    }
  };

  // ── Open Marble AI with auto-download ─────────────────────────────────────
  const handleOpenMarble = async () => {
    const paintedImages = projectData?.photos
      .map(p => p.paintedUrl)
      .filter((u): u is string => Boolean(u)) ?? [];

    if (paintedImages.length > 0) {
      for (let i = 0; i < paintedImages.length; i++) {
        const url = paintedImages[i];
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `room-painted-${i + 1}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    window.open('https://marble.worldlabs.ai', '_blank');
    toast({
      title: '🎮 Opening Marble AI',
      description: 'Your painted room photos are downloading. Upload them to Marble AI to explore in 3D!',
      duration: 6000,
    });
  };

  // ── Trigger Marble 3D ───────────────────────────────────────────────────────
  const handleGenerate3D = async () => {
    if (!projectId) return;
    setStage('generating3d');
    setError('');
    startPolling(projectId);

    try {
      const res = await fetch('/api/multi-room/generate-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '3D generation request failed');
        setStage('error');
        stopPolling();
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
      setStage('error');
      stopPolling();
    }
  };

  // ── Download Photos ────────────────────────────────────────────────────────
  const handleDownloadPhotos = async () => {
    if (!projectData || !projectId) return;
    setDownloading(true);
    try {
      await downloadMultiRoomZip(projectId, projectData.photos);
    } catch (err) {
      console.error('Failed to download photos:', err);
    } finally {
      setDownloading(false);
    }
  };

  // ── Download Painted Photos ────────────────────────────────────────────────
  const handleDownloadPainted = async () => {
    if (!projectId) return;
    const link = document.createElement('a');
    link.href = `/api/multi-room/download/${projectId}`;
    link.download = `${projectId}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Stop Generation ────────────────────────────────────────────────────────
  const handleStop = async () => {
    if (!projectId) return;

    // Stop polling immediately
    if (pollRef.current) clearInterval(pollRef.current);

    // Tell backend to mark as cancelled
    await fetch(`/api/multi-room/cancel/${projectId}`, {
      method: 'POST',
    });

    setStage('cancelled');
  };

  // ── Reset ───────────────────────────────────────────────────────────────────
  const reset = () => {
    stopPolling();
    previews.forEach(URL.revokeObjectURL);
    setStage('upload');
    setFiles([]);
    setPreviews([]);
    setProjectId(null);
    setProjectData(null);
    setError('');
    setRoomName('My Room');
    setColor({ name: '', hex: '' });
    setDownloading(false);
  };

  // ── Photo grid status badge ─────────────────────────────────────────────────
  const statusDot = (s: string) => {
    const cls =
      s === 'done'       ? 'bg-green-500' :
      s === 'processing' ? 'bg-yellow-400 animate-pulse' :
      s === 'error'      ? 'bg-red-500' :
                           'bg-gray-400';
    return (
      <span
        className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-white ${cls}`}
      />
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
          3D Room Color Preview
        </h1>
        <p className="text-gray-600 mb-4">
          Upload 3–15 photos, pick a wall color, and explore your painted room in immersive 3D
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Badge className="bg-blue-100 text-blue-800">
            <Camera className="w-3 h-3 mr-1" />Multi-Photo
          </Badge>
          <Badge className="bg-indigo-100 text-indigo-800">
            <Paintbrush className="w-3 h-3 mr-1" />SDXL Painting
          </Badge>
          <Badge className="bg-violet-100 text-violet-800">
            <Box className="w-3 h-3 mr-1" />Marble AI 3D
          </Badge>
        </div>
      </motion.div>

      {/* ── UPLOAD STAGE ─────────────────────────────────────────────────────── */}
      {stage === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: inputs */}
          <div className="space-y-4">
            {/* Room name */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Room Name</CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  id="room-name-input"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  placeholder="e.g. Living Room"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </CardContent>
            </Card>

            {/* Color picker */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Paintbrush className="w-4 h-4" />Choose Wall Color
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ColorPicker value={color} onChange={setColor} />
              </CardContent>
            </Card>

            {/* Generate button */}
            <Button
              id="paint-all-button"
              onClick={handleUploadAndPaint}
              disabled={files.length < 3 || !color.hex}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              size="lg"
            >
              <Paintbrush className="w-4 h-4 mr-2" />
              {files.length >= 3
                ? `Paint All ${files.length} Photos in ${color.name || 'chosen color'}`
                : 'Select at least 3 photos to continue'}
            </Button>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: photo upload */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Upload className="w-4 h-4" />Upload Room Photos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="photo-file-input"
                  onChange={handleFileSelect}
                />

                {previews.length === 0 ? (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    onClick={() => fileRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                  >
                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium text-gray-600">Drop photos here or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">3–15 photos · JPG / PNG · up to 20 MB each</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Tip: take photos from all 4 walls, corners, and angles
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-4 gap-1.5">
                      {previews.map((p, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                          <img src={p} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 rounded">
                            {i + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => fileRef.current?.click()}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Change photos ({files.length} selected)
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── PAINTING STAGE ───────────────────────────────────────────────────── */}
      {stage === 'painting' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
              Painting your room photos…
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Progress bar */}
            {projectData && (
              <div>
                <div className="flex justify-between text-sm text-gray-500 mb-1.5">
                  <span>Photos painted</span>
                  <span className="font-medium">
                    {projectData.paintedCount} / {projectData.totalCount}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <motion.div
                    className="bg-indigo-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        projectData.totalCount > 0
                          ? (projectData.paintedCount / projectData.totalCount) * 100
                          : 0
                      }%`,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            {/* Photo grid */}
            {projectData?.photos && (
              <div className="grid grid-cols-5 gap-2">
                {projectData.photos.map(photo => (
                  <div
                    key={photo.order}
                    className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"
                  >
                    <img
                      src={photo.paintedUrl || photo.originalUrl}
                      alt={`Photo ${photo.order + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {statusDot(photo.status)}
                  </div>
                ))}
              </div>
            )}

            <p className="text-sm text-gray-500 text-center">
              Each photo runs through Room Changer — this takes 1–2 minutes per photo
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── PAINTED STAGE ────────────────────────────────────────────────────── */}
      {stage === 'painted' && projectData && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl"
          >
            <CheckCircle className="text-green-600 w-6 h-6 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">
                All {projectData.paintedCount} photos painted in {projectData.colorName}!
              </p>
              <p className="text-sm text-green-600">Ready to generate your 3D room</p>
            </div>
          </motion.div>

          {/* Before / After gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500 font-normal">Original</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-1">
                  {projectData.photos.slice(0, 6).map(p => (
                    <img
                      key={p.order}
                      src={p.originalUrl}
                      className="w-full aspect-square object-cover rounded"
                      alt=""
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500 font-normal">
                  Painted — {projectData.colorName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-1">
                  {projectData.photos
                    .filter(p => p.paintedUrl)
                    .slice(0, 6)
                    .map(p => (
                      <img
                        key={p.order}
                        src={p.paintedUrl!}
                        className="w-full aspect-square object-cover rounded"
                        alt=""
                      />
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Download button for painted photos */}
          <button
            onClick={handleDownloadPainted}
            className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-medium py-3.5 rounded-xl transition-colors"
          >
            <Download size={18} />
            Download Painted Photos
          </button>

          <Button
            id="generate-3d-button"
            onClick={handleOpenMarble}
            className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white py-6 text-lg"
            size="lg"
          >
            <Box className="w-5 h-5 mr-2" />
            Open in Marble AI 3D
          </Button>
          <Button variant="outline" className="w-full" onClick={reset}>
            <RefreshCw className="w-4 h-4 mr-2" />Start Over
          </Button>
        </div>
      )}

      {/* ── GENERATING 3D STAGE ──────────────────────────────────────────────── */}
      {stage === 'generating3d' && (
        <div className="bg-gray-900 rounded-xl p-8 text-center border border-gray-800">
          {/* Animated box icon */}
          <Box
            className="mx-auto mb-4 text-blue-400"
            size={56}
            style={{ animation: 'pulse 2s infinite' }}
          />

          <h3 className="text-white font-semibold text-xl mb-2">
            Building your 3D room...
          </h3>
          <p className="text-gray-400 mb-2">
            Marble AI is constructing an explorable 3D world from your painted photos
          </p>
          <p className="text-gray-500 text-sm mb-6">
            This usually takes about 5 minutes
          </p>

          {/* Status badge */}
          {projectData?.marbleStatus && (
            <div className="inline-flex items-center gap-2 bg-gray-800 rounded-full px-4 py-2 mb-6">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-gray-300 text-sm">
                Status: {projectData.marbleStatus}
              </span>
            </div>
          )}

          {/* Stop button */}
          <div>
            <button
              onClick={handleStop}
              className="flex items-center gap-2 mx-auto bg-red-900/30 hover:bg-red-900/50 border border-red-700 text-red-400 hover:text-red-300 font-medium px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              <X size={16} />
              Stop Generation
            </button>
            <p className="text-gray-600 text-xs mt-2">
              Note: Marble credits are still used if cancelled after upload
            </p>
          </div>
        </div>
      )}

      {/* ── CANCELLED STAGE ─────────────────────────────────────────────────── */}
      {stage === 'cancelled' && (
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <div className="text-4xl mb-4">⏹️</div>
          <h3 className="text-white font-semibold text-lg mb-2">
            Generation Stopped
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            3D generation was cancelled. Your painted photos are still saved.
          </p>

          <div className="space-y-3">
            {/* Re-generate button */}
            {projectId && (
              <button
                onClick={async () => {
                  // Reset marble status and try again
                  setStage('generating3d');
                  await fetch('/api/multi-room/generate-3d', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId }),
                  });
                  startPolling(projectId);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Box size={20} />
                Try Generate Again
              </button>
            )}

            {/* Download painted photos anyway */}
            {projectId && (
              <a
                href={`/api/multi-room/download/${projectId}`}
                download
                className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-xl transition-colors"
              >
                <Download size={18} />
                Download Painted Photos
              </a>
            )}

            <button
              onClick={reset}
              className="w-full bg-gray-800 text-gray-400 py-2 rounded-xl text-sm hover:bg-gray-700 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* ── DONE STAGE ───────────────────────────────────────────────────────── */}
      {stage === 'done' && projectData && (
        <div className="space-y-4">
          <div className="bg-green-900/20 border border-green-600/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="text-green-400" size={28} />
              <h3 className="text-white font-semibold text-xl">
                Your 3D Room is Ready!
              </h3>
            </div>

            {/* Thumbnail */}
            {projectData.marbleThumbnail && (
              <img
                src={projectData.marbleThumbnail}
                alt="3D World Preview"
                className="w-full rounded-xl mb-4 max-h-56 object-cover"
              />
            )}

            {/* Marble URL display */}
            {projectData.marbleWorldUrl && (
              <div className="mb-4">
                {/* URL box with copy button */}
                <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 mb-3">
                  <span className="text-blue-400 text-xs font-mono truncate flex-1 text-left">
                    {projectData.marbleWorldUrl}
                  </span>
                  <button
                    onClick={() => {
                      if (projectData.marbleWorldUrl) {
                        navigator.clipboard.writeText(projectData.marbleWorldUrl);
                        // Show brief "Copied!" feedback
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }
                    }}
                    className="text-gray-400 hover:text-white transition-colors shrink-0"
                    title="Copy URL"
                  >
                    {copied ? (
                      <Check size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>

                {/* Big explore button */}
                <a
                  href={projectData.marbleWorldUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors text-lg"
                >
                  <Box size={24} />
                  Explore 3D Room in Marble
                  <ExternalLink size={18} />
                </a>
              </div>
            )}

            {/* Download */}
            {projectId && (
              <a
                id="download-all-photos-button"
                href={`/api/multi-room/download/${projectId}`}
                download={`${projectId}.zip`}
                className="flex items-center justify-center gap-2 w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium py-3 rounded-xl transition-colors mb-4"
              >
                <Download size={18} />
                Download All Photos (Input + Output)
              </a>
            )}
          </div>

          {/* Rating */}
          {projectId && (
            <RatingFeedback
              projectId={projectId}
              feature="room-3d"
            />
          )}

          <button
            onClick={reset}
            className="w-full bg-gray-800 text-gray-400 py-3 rounded-xl text-sm hover:bg-gray-700 transition-colors"
          >
            Create Another Room
          </button>
        </div>
      )}

      {/* ── ERROR STAGE ──────────────────────────────────────────────────────── */}
      {stage === 'error' && (
        <Card className="border-red-200">
          <CardContent className="py-10 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-red-400" />
            <h3 className="text-lg font-semibold text-gray-800">Something went wrong</h3>
            <p className="text-sm text-red-600 max-w-sm mx-auto">{error}</p>
            <Button
              variant="outline"
              onClick={reset}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
