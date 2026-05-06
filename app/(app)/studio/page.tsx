// app/(app)/studio/page.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/editor-store';
import { useStudioSocket } from '@/hooks/useStudioSocket';

// Studio panel components
import { RenderPanel } from '@/components/studio/RenderPanel';
import { EditPanel } from '@/components/studio/EditPanel';
import { FurnishPanel } from '@/components/studio/FurnishPanel';
import { LightingPanel } from '@/components/studio/LightingPanel';
import { PostProcessPanel } from '@/components/studio/PostProcessPanel';
import { StudioProgressBar } from '@/components/studio/StudioProgressBar';
import { VastuPanel } from '@/components/editor/VastuPanel';
import { CostPanel } from '@/components/editor/CostPanel';

// UI
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Wand2, Paintbrush, ShoppingBag, SunMedium, ArrowUpCircle,
  Upload, ZoomIn, ZoomOut, RotateCcw, Download, Eye, EyeOff,
  Layers, Compass, IndianRupee, Sparkles, Loader2, ChevronLeft,
  ChevronRight, ImageIcon, Zap, X,
} from 'lucide-react';

// Tab definitions
const TABS = [
  { id: 'render',      label: 'Render',       icon: Wand2,          color: 'text-purple-400',  bg: 'from-purple-500/20 to-pink-500/20' },
  { id: 'edit',         label: 'Edit',         icon: Paintbrush,     color: 'text-blue-400',    bg: 'from-blue-500/20 to-cyan-500/20' },
  { id: 'furnish',      label: 'Furnish',      icon: ShoppingBag,    color: 'text-amber-400',   bg: 'from-amber-500/20 to-orange-500/20' },
  { id: 'lighting',     label: 'Lighting',     icon: SunMedium,      color: 'text-yellow-400',  bg: 'from-yellow-500/20 to-amber-500/20' },
  { id: 'postprocess',  label: 'Post-Process', icon: ArrowUpCircle,  color: 'text-emerald-400', bg: 'from-emerald-500/20 to-teal-500/20' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function StudioPage() {
  // Socket.IO for real-time progress
  useStudioSocket();

  const {
    isGenerating, generationProgress, generationStatus, generationError,
    processedImage,
  } = useEditorStore();

  // Local state
  const [activeTab, setActiveTab] = useState<TabId>('render');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [comparePos, setComparePos] = useState(50);
  const [zoom, setZoom] = useState(100);
  const [showSidePanels, setShowSidePanels] = useState({ vastu: false, cost: false });
  const [generationHistory, setGenerationHistory] = useState<{ tab: string; url: string; timestamp: Date }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image upload
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      if (uploadedImage) URL.revokeObjectURL(uploadedImage);
      setUploadedImage(URL.createObjectURL(file));
      setResultImage(null);
    }
  };

  // Handle generation from any tab
  const handleGenerate = useCallback(async (settings: any) => {
    if (!uploadedFile) return;
    const { tab, ...tabSettings } = settings;

    const formData = new FormData();
    formData.append('image', uploadedFile);

    // Tab-specific file attachments
    if (tab === 'furnish' && tabSettings.items?.length) {
      // Attach first item's image; subsequent items processed after first completes
      formData.append('furnitureImage', tabSettings.items[0].file);
    } else if (tab === 'furnish' && tabSettings.furnitureFile) {
      formData.append('furnitureImage', tabSettings.furnitureFile);
    }
    if (['render', 'interior-render', 'landscape'].includes(tab) && tabSettings.referenceImage) {
      formData.append('referenceImage', tabSettings.referenceImage);
    }
    if (tab === 'lighting' && tabSettings.referenceLight) {
      formData.append('referenceLight', tabSettings.referenceLight);
    }
    if (tab === 'style-transfer' && tabSettings.referenceImage) {
      formData.append('referenceImage', tabSettings.referenceImage);
    }
    // Collage multi-ref
    if (tab === 'collage' && tabSettings.references) {
      tabSettings.references.forEach((ref: File, i: number) => {
        formData.append(`reference${i}`, ref);
      });
    }

    // Remove non-serialisable values from JSON data
    const jsonData = { ...tabSettings };
    if (jsonData.items) {
      // Serialise only metadata (not File objects)
      jsonData.items = jsonData.items.map((item: any) => ({
        id: item.id,
        product: item.product || null,
      }));
    }
    delete jsonData.furnitureFile;
    delete jsonData.referenceImage;
    delete jsonData.referenceLight;
    delete jsonData.references;
    formData.append('data', JSON.stringify(jsonData));

    useEditorStore.setState({
      isGenerating: true,
      generationProgress: 0,
      generationError: null,
      generationStatus: 'Submitting...',
    });

    try {
      const res = await fetch(`/api/ai/${tab}`, { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Generation failed');
      }

      // Start polling as fallback
      const projectId = data.projectId;
      const pollInterval = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/ai/${tab}?projectId=${projectId}`);
          if (!pollRes.ok) return;
          const proj = await pollRes.json();
          if (proj.status === 'completed' && proj.resultImage) {
            clearInterval(pollInterval);
            const resultUrl = proj.resultImage + '?t=' + Date.now();
            setResultImage(resultUrl);
            setGenerationHistory(prev => [{ tab, url: resultUrl, timestamp: new Date() }, ...prev]);
            // Register each placed furniture item in the store for Cost panel
            if (tab === 'furnish' && tabSettings.items) {
              tabSettings.items.forEach((item: any) => {
                if (item.product) {
                  useEditorStore.getState().addPlacedFurniture(item.product);
                }
              });
            }
            useEditorStore.setState({
              isGenerating: false,
              generationProgress: 100,
              generationStatus: 'Complete!',
            });
          } else if (proj.status === 'failed') {
            clearInterval(pollInterval);
            useEditorStore.setState({
              isGenerating: false,
              generationProgress: 0,
              generationError: proj.errorMessage || 'Failed',
            });
          }
        } catch { /* continue polling */ }
      }, 3000);

      // Auto-clear after 5 min
      setTimeout(() => clearInterval(pollInterval), 300000);

    } catch (err: any) {
      useEditorStore.setState({
        isGenerating: false,
        generationProgress: 0,
        generationError: err.message,
      });
    }
  }, [uploadedFile]);

  // Active tab config
  const activeTabConfig = TABS.find(t => t.id === activeTab)!;
  const displayImage = resultImage || uploadedImage;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#0a0a0f] overflow-hidden">
      {/* ═══ TOP TAB BAR ═══ */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-1">
          <Sparkles className="w-5 h-5 text-purple-400 mr-2" />
          <span className="text-sm font-bold text-white mr-4">Studio</span>

          {/* Tab buttons */}
          <div className="flex bg-white/5 rounded-xl p-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                    isActive
                      ? `bg-gradient-to-r ${tab.bg} ${tab.color} border border-white/10`
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setShowCompare(!showCompare)}
                  className={cn('p-2 rounded-lg transition-all', showCompare ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70')}>
                  {showCompare ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>Compare Before/After</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
            <button onClick={() => setZoom(Math.max(25, zoom - 25))} className="text-white/40 hover:text-white">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-white/50 min-w-[32px] text-center">{zoom}%</span>
            <button onClick={() => setZoom(Math.min(400, zoom + 25))} className="text-white/40 hover:text-white">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button size="sm" variant="outline" className="text-xs gap-1.5 border-white/10 text-white/70"
            onClick={() => setShowSidePanels(p => ({ ...p, vastu: !p.vastu }))}>
            <Compass className="w-3.5 h-3.5" /> Vastu
          </Button>
          <Button size="sm" variant="outline" className="text-xs gap-1.5 border-white/10 text-white/70"
            onClick={() => setShowSidePanels(p => ({ ...p, cost: !p.cost }))}>
            <IndianRupee className="w-3.5 h-3.5" /> Cost
          </Button>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── Left Sidebar: Tab Controls ─── */}
        <motion.div
          initial={{ x: -320 }}
          animate={{ x: 0 }}
          className="w-72 bg-black/40 backdrop-blur-sm border-r border-white/5 flex flex-col"
        >
          {/* Tab header */}
          <div className={cn('px-4 py-3 border-b border-white/5 bg-gradient-to-r', activeTabConfig.bg)}>
            <div className="flex items-center gap-2">
              <activeTabConfig.icon className={cn('w-4 h-4', activeTabConfig.color)} />
              <h3 className="text-sm font-semibold text-white">{activeTabConfig.label}</h3>
            </div>
          </div>

          <ScrollArea className="flex-1 px-3 py-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'render' && (
                  <RenderPanel onGenerate={handleGenerate} isGenerating={isGenerating} currentImage={uploadedImage} />
                )}
                {activeTab === 'edit' && (
                  <EditPanel onGenerate={handleGenerate} isGenerating={isGenerating} currentImage={uploadedImage} />
                )}
                {activeTab === 'furnish' && (
                  <FurnishPanel onGenerate={handleGenerate} isGenerating={isGenerating} currentImage={uploadedImage} />
                )}
                {activeTab === 'lighting' && (
                  <LightingPanel onGenerate={handleGenerate} isGenerating={isGenerating} currentImage={uploadedImage} />
                )}
                {activeTab === 'postprocess' && (
                  <PostProcessPanel onGenerate={handleGenerate} isGenerating={isGenerating}
                    currentImage={uploadedImage} processedImage={resultImage} />
                )}
              </motion.div>
            </AnimatePresence>
          </ScrollArea>
        </motion.div>

        {/* ─── Canvas Area ─── */}
        <div className="flex-1 flex flex-col relative bg-[#111118]">
          {/* Upload or display */}
          {!uploadedImage ? (
            <div className="flex-1 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div onClick={() => fileInputRef.current?.click()}
                  className="group cursor-pointer border-2 border-dashed border-white/10 rounded-2xl p-16 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-300">
                  <Upload className="w-12 h-12 mx-auto text-white/20 group-hover:text-purple-400 transition-colors mb-4" />
                  <h3 className="text-lg font-semibold text-white/60 group-hover:text-white transition-colors mb-2">
                    Upload Room Photo
                  </h3>
                  <p className="text-sm text-white/30">
                    Drop an image or click to browse
                  </p>
                  <p className="text-xs text-white/20 mt-2">
                    Supports JPG, PNG, WebP up to 20MB
                  </p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              </motion.div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
              <div className="relative max-w-full max-h-full" style={{ transform: `scale(${zoom / 100})` }}>
                {/* Before/After Compare */}
                {showCompare && resultImage && uploadedImage ? (
                  <div className="relative overflow-hidden rounded-lg shadow-2xl"
                    style={{ maxWidth: '900px', maxHeight: '600px' }}>
                    {/* After image (full) */}
                    <img src={resultImage} alt="Result" className="w-full h-auto block" />
                    {/* Before image (clipped) */}
                    <div className="absolute inset-0 overflow-hidden" style={{ width: `${comparePos}%` }}>
                      <img src={uploadedImage} alt="Original" className="w-full h-auto block"
                        style={{ minWidth: `${10000 / comparePos}%` }} />
                    </div>
                    {/* Slider handle */}
                    <div className="absolute inset-y-0" style={{ left: `${comparePos}%` }}>
                      <div className="w-0.5 h-full bg-white shadow-lg" />
                      <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center cursor-ew-resize"
                        onMouseDown={(e) => {
                          const container = e.currentTarget.parentElement!.parentElement!;
                          const rect = container.getBoundingClientRect();
                          const onMove = (me: MouseEvent) => {
                            const pos = ((me.clientX - rect.left) / rect.width) * 100;
                            setComparePos(Math.max(5, Math.min(95, pos)));
                          };
                          const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                          window.addEventListener('mousemove', onMove);
                          window.addEventListener('mouseup', onUp);
                        }}>
                        <ChevronLeft className="w-3 h-3 text-black" />
                        <ChevronRight className="w-3 h-3 text-black" />
                      </div>
                    </div>
                    {/* Labels */}
                    <div className="absolute top-3 left-3"><Badge className="bg-black/60 text-white text-[10px]">Before</Badge></div>
                    <div className="absolute top-3 right-3"><Badge className="bg-purple-600 text-white text-[10px]">After</Badge></div>
                  </div>
                ) : (
                  <div className="relative rounded-lg overflow-hidden shadow-2xl" style={{ maxWidth: '900px' }}>
                    <img src={displayImage!} alt="Room" className="w-full h-auto block" />
                    {isGenerating && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-white/80">{generationStatus || 'Processing...'}</p>
                          <p className="text-xs text-white/40 mt-1">{generationProgress}%</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error toast */}
          <AnimatePresence>
            {generationError && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-xl">
                <span className="text-xs">{generationError}</span>
                <button onClick={() => useEditorStore.setState({ generationError: null })}>
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload button (when image exists) */}
          {uploadedImage && (
            <div className="absolute top-3 left-3 z-10">
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}
                className="bg-black/60 border-white/10 text-white/70 hover:text-white text-xs">
                <Upload className="w-3 h-3 mr-1" /> Change Image
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </div>
          )}
        </div>

        {/* ─── Right Sidebar: Vastu / Cost / History ─── */}
        {(showSidePanels.vastu || showSidePanels.cost || generationHistory.length > 0) && (
          <motion.div
            initial={{ x: 200 }}
            animate={{ x: 0 }}
            className="w-64 bg-black/40 backdrop-blur-sm border-l border-white/5 flex flex-col"
          >
            {/* Vastu Panel */}
            {showSidePanels.vastu && (
              <div className="flex-1 overflow-hidden border-b border-white/5">
                <VastuPanel roomType="living-room" className="h-full" />
              </div>
            )}

            {/* Cost Panel */}
            {showSidePanels.cost && (
              <div className="flex-1 overflow-hidden border-b border-white/5">
                <CostPanel roomType="living-room" className="h-full" />
              </div>
            )}

            {/* History */}
            {generationHistory.length > 0 && (
              <>
                <div className="px-3 py-2 border-b border-white/5">
                  <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">History</h4>
                </div>
                <ScrollArea className="flex-1 p-2">
                  <div className="space-y-2">
                    {generationHistory.map((item, i) => (
                      <button key={i} onClick={() => setResultImage(item.url)}
                        className={cn(
                          'w-full rounded-lg overflow-hidden border transition-all',
                          resultImage === item.url ? 'border-purple-500 ring-1 ring-purple-500/50' : 'border-white/10 hover:border-white/30'
                        )}>
                        <img src={item.url} alt={`${item.tab} result`} className="w-full h-20 object-cover" />
                        <div className="px-2 py-1 bg-black/40">
                          <p className="text-[9px] text-white/50 capitalize">{item.tab}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* ═══ BOTTOM PROGRESS BAR ═══ */}
      <AnimatePresence>
        <StudioProgressBar
          isGenerating={isGenerating}
          progress={generationProgress}
          status={generationStatus}
          activeTab={activeTab}
        />
      </AnimatePresence>
    </div>
  );
}
