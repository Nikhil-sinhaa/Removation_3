// app/(app)/editor/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { ObjectRemovalSidebar } from '@/components/ai/ObjectRemovalSidebar';
import { LiveFeedbackSidebar } from '@/components/ai/LiveFeedbackSidebar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
// TODO: Remnant Clerk imports: useUser
import Image from 'next/image';
import {
  Upload,
  Wand2,
  Paintbrush,
  Eraser,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Home,
  Building2,
  Sofa,
  Bed,
  UtensilsCrossed,
  Bath,
  TreePine,
  Car,
  Briefcase,
  GraduationCap,
  Dumbbell,
  Music,
  Palette,
  Eye,
  EyeOff,
  Layers,
  Settings,
  Info,
  X,
  Check,
  Loader2,
  AlertCircle,
  ImagePlus,
  Trash2,
  Copy,
  MoreHorizontal,
  Sun,
  Moon,
  Maximize2,
  Grid3X3,
  SlidersHorizontal,
  RefreshCw,
  Clock,
  Activity,
  Compass,
  IndianRupee,
  DollarSign,
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

import { useUploadThing } from '@/lib/uploadthing';
import { cn } from '@/lib/utils';
import { DESIGN_STYLES } from '@/constants/styles-400';
import { ROOM_TYPES } from '@/constants/room-types';
import { TRANSFORMATION_MODES } from '@/constants/transformation-modes';

// Types
interface GeneratedImage {
  id: string;
  url: string;
  style: string;
  roomType: string;
  mode: string;
  createdAt: Date;
  isFavorite: boolean;
  vastuScore?: number;
  estimatedCost?: {
    inr: number;
    usd: number;
  };
}

interface HistoryItem {
  id: string;
  originalImage: string;
  generatedImages: GeneratedImage[];
  timestamp: Date;
}

interface VastuIssue {
  rule: string;
  severity: 'critical' | 'warning' | 'suggestion';
  description: string;
  fix: string;
}

interface CostBreakdown {
  materials: { name: string; cost: number }[];
  labor: number;
  tax: number;
  total: number;
}

// Helper Component for Style Cards
function StyleCard({
  style,
  isSelected,
  onSelect
}: {
  style: any;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [imgSrc, setImgSrc] = useState(style.thumbnail || '/images/styles/placeholder.jpg');

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
        isSelected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-transparent hover:border-muted-foreground/20'
      )}
    >
      <Image
        src={imgSrc}
        alt={style.name}
        fill
        className="object-cover"
        onError={() => setImgSrc('/images/styles/placeholder.jpg')}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-xs text-white font-medium truncate">
          {style.name}
        </p>
      </div>
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        </div>
      )}
    </motion.button>
  );
}

export default function EditorPage() {
  const router = useRouter();
  const { user, isLoading: isLoaded } = useAuth();
  const isSignedIn = !!user;
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State Management
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedGenerated, setSelectedGenerated] = useState<GeneratedImage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Editor Settings
  const [selectedStyle, setSelectedStyle] = useState<string>('modern-minimalist');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('living-room');
  const [showObjectRemoval, setShowObjectRemoval] = useState(false);
  const [showLiveFeedback, setShowLiveFeedback] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string>('redesign');
  const [preserveStructure, setPreserveStructure] = useState(true);
  const [creativityLevel, setCreativityLevel] = useState([50]);
  const [colorPreference, setColorPreference] = useState<string>('');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [numberOfVariations, setNumberOfVariations] = useState(4);

  // Inpainting State
  const [isInpaintMode, setIsInpaintMode] = useState(false);
  const [brushSize, setBrushSize] = useState([30]);
  const [maskCanvas, setMaskCanvas] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // View Controls
  const [zoom, setZoom] = useState(100);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPosition, setComparisonPosition] = useState(50);
  const [viewMode, setViewMode] = useState<'single' | 'grid' | 'compare'>('single');

  // Side Panels
  const [showVastuPanel, setShowVastuPanel] = useState(false);
  const [showCostPanel, setShowCostPanel] = useState(false);
  const [vastuScore, setVastuScore] = useState<number | null>(null);
  const [vastuIssues, setVastuIssues] = useState<VastuIssue[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'INR' | 'USD'>('INR');
  const [selectedCity, setSelectedCity] = useState('mumbai');

  // History
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Credits
  const [userCredits, setUserCredits] = useState(0);

  // Fetch real credits from the backend on mount
  useEffect(() => {
    fetch('/api/user/credits')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.credits === 'number') {
          setUserCredits(data.credits);
        }
      })
      .catch(() => {
        // Silently fail — credits display will show 0 until resolved
      });
  }, []);

  // Upload handlers — delegated to ImageUploader component
  const handleImageUploaded = (url: string) => {
    setOriginalImage(url);
  };

  const handleImageRemoved = () => {
    setOriginalImage(null);
    setGeneratedImages([]);
    setSelectedGenerated(null);
  };

  // Generate design
  const handleGenerate = async () => {
    if (!originalImage) {
      toast({
        title: 'No image uploaded',
        description: 'Please upload an image first',
        variant: 'destructive',
      });
      return;
    }


    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + Math.random() * 8, 85));
    }, 1000);

    try {
      const response = await fetch('/api/ai/redesign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: originalImage,
          style: selectedStyle,
          roomType: selectedRoomType,
          mode: selectedMode,
          settings: {
            creativity: creativityLevel[0],
            preserveLayout: preserveStructure,
            enhanceQuality: true,
            colorScheme: colorPreference || undefined,
          },
          customPrompt: additionalPrompt || undefined,
          numberOfVariations,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Generation failed');
      }

      // API returns renderIds — poll for completion
      const renderIds: string[] = data.renderIds || [];
      if (renderIds.length === 0) {
        throw new Error('No render IDs returned from server');
      }

      // Poll for render results
      const completedRenders: any[] = [];
      const maxAttempts = 40; // 2 minutes max (40 * 3s)

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 3000));

        let allDone = true;
        for (const renderId of renderIds) {
          // Skip already completed renders
          if (completedRenders.find(r => r._id === renderId)) continue;

          try {
            const statusRes = await fetch(`/api/ai/redesign?renderId=${renderId}`);
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              const render = statusData.render;

              if (render?.status === 'completed') {
                completedRenders.push(render);
              } else if (render?.status === 'failed') {
                console.error(`Render ${renderId} failed:`, render.error);
                // Don't block other renders
              } else {
                allDone = false;
              }
            }
          } catch (pollErr) {
            console.warn('Poll error:', pollErr);
            allDone = false;
          }
        }

        // Update progress
        const progress = Math.min(30 + (completedRenders.length / renderIds.length) * 60, 95);
        setGenerationProgress(progress);

        if (allDone) break;
      }

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (completedRenders.length === 0) {
        throw new Error('Generation timed out. Please check your renders page.');
      }

      const newImages: GeneratedImage[] = completedRenders.map((render: any, index: number) => ({
        id: render._id || `gen-${Date.now()}-${index}`,
        url: render.outputImage || render.resultUrl || '',
        style: selectedStyle,
        roomType: selectedRoomType,
        mode: selectedMode,
        createdAt: new Date(render.createdAt || Date.now()),
        isFavorite: false,
        vastuScore: render.vastuScore,
        estimatedCost: render.estimatedCost,
      }));

      setGeneratedImages((prev) => [...newImages, ...prev]);
      setSelectedGenerated(newImages[0]);
      setUserCredits((prev) => prev - (data.creditsUsed || numberOfVariations));

      // Add to history
      const historyItem: HistoryItem = {
        id: `history-${Date.now()}`,
        originalImage,
        generatedImages: newImages,
        timestamp: new Date(),
      };
      setHistory((prev) => [historyItem, ...prev]);
      setHistoryIndex(0);

      toast({
        title: 'Generation complete!',
        description: `${completedRenders.length} variation(s) created successfully`,
      });
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error('Generation error:', error);
      toast({
        title: 'Generation failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Analyze Vastu
  const analyzeVastu = async () => {
    if (!selectedGenerated) return;

    setShowVastuPanel(true);

    try {
      const response = await fetch('/api/vastu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: selectedGenerated.url,
          roomType: selectedRoomType,
        }),
      });

      const data = await response.json();
      setVastuScore(data.score);
      setVastuIssues(data.issues);
    } catch (error) {
      toast({
        title: 'Vastu analysis failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  // Calculate Cost
  const calculateCost = async () => {
    if (!selectedGenerated) return;

    setShowCostPanel(true);

    try {
      const response = await fetch('/api/cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: selectedGenerated.url,
          roomType: selectedRoomType,
          style: selectedStyle,
          city: selectedCity,
          currency: selectedCurrency,
        }),
      });

      const data = await response.json();
      setCostBreakdown(data);
    } catch (error) {
      toast({
        title: 'Cost calculation failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  // Download image
  const handleDownload = async () => {
    if (!selectedGenerated) return;

    try {
      const response = await fetch(selectedGenerated.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `removation-${selectedGenerated.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  // Toggle favorite
  const toggleFavorite = (imageId: string) => {
    setGeneratedImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, isFavorite: !img.isFavorite } : img
      )
    );
  };

  // Room type icons
  const roomTypeIcons: { [key: string]: React.ReactNode } = {
    'living-room': <Sofa className="h-4 w-4" />,
    bedroom: <Bed className="h-4 w-4" />,
    kitchen: <UtensilsCrossed className="h-4 w-4" />,
    bathroom: <Bath className="h-4 w-4" />,
    office: <Briefcase className="h-4 w-4" />,
    outdoor: <TreePine className="h-4 w-4" />,
    garage: <Car className="h-4 w-4" />,
    gym: <Dumbbell className="h-4 w-4" />,
    studio: <Music className="h-4 w-4" />,
  };

  return (
    <TooltipProvider>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
        {/* Left Sidebar - Tools & Settings */}
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-80 border-r bg-card overflow-hidden flex flex-col"
        >
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Design Studio</h2>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                {userCredits} credits
              </Badge>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <Tabs defaultValue="transform" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="transform" className="text-xs">
                  Transform
                </TabsTrigger>
                <TabsTrigger value="style" className="text-xs">
                  Style
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs">
                  Settings
                </TabsTrigger>
              </TabsList>

              {/* Transform Tab */}
              <TabsContent value="transform" className="space-y-4">
                {/* Transformation Mode */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Transformation Mode</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'redesign', label: 'Redesign', icon: <Wand2 className="h-4 w-4" /> },
                      { id: 'furnish', label: 'Fill Empty', icon: <Sofa className="h-4 w-4" /> },
                      { id: 'enhance', label: 'Enhance', icon: <Sparkles className="h-4 w-4" /> },
                      { id: 'inpaint', label: 'Edit Area', icon: <Paintbrush className="h-4 w-4" /> },
                      { id: 'remove', label: 'Remove', icon: <Eraser className="h-4 w-4" /> },
                      { id: 'outdoor', label: 'Exterior', icon: <TreePine className="h-4 w-4" /> },
                    ].map((mode) => (
                      <Button
                        key={mode.id}
                        variant={selectedMode === mode.id ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          'justify-start gap-2 h-10',
                          selectedMode === mode.id && 'ring-2 ring-primary/20'
                        )}
                        onClick={() => {
                          setSelectedMode(mode.id);
                          setIsInpaintMode(mode.id === 'inpaint' || mode.id === 'remove');
                        }}
                      >
                        {mode.icon}
                        <span className="text-xs">{mode.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Room Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Room Type</Label>
                  <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_TYPES.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          <div className="flex items-center gap-2">
                            {roomTypeIcons[room.id] || <Home className="h-4 w-4" />}
                            <span>{room.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Creativity Level */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Creativity Level</Label>
                    <span className="text-xs text-muted-foreground">{creativityLevel[0]}%</span>
                  </div>
                  <Slider
                    value={creativityLevel}
                    onValueChange={setCreativityLevel}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Conservative</span>
                    <span>Creative</span>
                  </div>
                </div>

                {/* Preserve Structure */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Preserve Structure</Label>
                    <p className="text-xs text-muted-foreground">Keep room layout intact</p>
                  </div>
                  <Switch
                    checked={preserveStructure}
                    onCheckedChange={setPreserveStructure}
                  />
                </div>

                {/* Number of Variations */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Number of Variations</Label>
                  <Select
                    value={numberOfVariations.toString()}
                    onValueChange={(v) => setNumberOfVariations(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 variation (1 credit)</SelectItem>
                      <SelectItem value="2">2 variations (2 credits)</SelectItem>
                      <SelectItem value="4">4 variations (4 credits)</SelectItem>
                      <SelectItem value="8">8 variations (8 credits)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional Prompt */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Custom Instructions</Label>
                  <Textarea
                    placeholder="Add specific requirements like 'wooden flooring', 'warm lighting', 'green plants'..."
                    value={additionalPrompt}
                    onChange={(e) => setAdditionalPrompt(e.target.value)}
                    className="min-h-[80px] text-sm resize-none"
                  />
                </div>
              </TabsContent>

              {/* Style Tab */}
              <TabsContent value="style" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Design Style</Label>
                  <Input
                    placeholder="Search styles..."
                    className="mb-2"
                  />
                </div>

                <ScrollArea className="h-[400px] pr-2">
                  <div className="grid grid-cols-2 gap-2">
                    {DESIGN_STYLES.slice(0, 24).map((style) => (
                      <StyleCard
                        key={style.id}
                        style={style}
                        isSelected={selectedStyle === style.id}
                        onSelect={() => setSelectedStyle(style.id)}
                      />
                    ))}
                  </div>
                </ScrollArea>

                <Button variant="outline" size="sm" className="w-full">
                  View All 400+ Styles
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>

                {/* Color Preference */}
                <div className="space-y-2 pt-4">
                  <Label className="text-sm font-medium">Color Preference</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { color: '#FFFFFF', name: 'White' },
                      { color: '#F5F5DC', name: 'Beige' },
                      { color: '#808080', name: 'Gray' },
                      { color: '#000000', name: 'Black' },
                      { color: '#8B4513', name: 'Brown' },
                      { color: '#1E90FF', name: 'Blue' },
                      { color: '#228B22', name: 'Green' },
                      { color: '#FFD700', name: 'Gold' },
                    ].map((c) => (
                      <Tooltip key={c.color}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setColorPreference(c.name)}
                            className={cn(
                              'h-8 w-8 rounded-full border-2 transition-all',
                              colorPreference === c.name
                                ? 'border-primary ring-2 ring-primary/20 scale-110'
                                : 'border-transparent hover:scale-105'
                            )}
                            style={{ backgroundColor: c.color }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{c.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                {/* Inpaint Settings */}
                {isInpaintMode && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Brush Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Brush Size</Label>
                          <span className="text-xs text-muted-foreground">{brushSize[0]}px</span>
                        </div>
                        <Slider
                          value={brushSize}
                          onValueChange={setBrushSize}
                          min={5}
                          max={100}
                          step={5}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Clear Mask
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* View Settings */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">View Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">View Mode</Label>
                      <div className="flex gap-2">
                        {[
                          { id: 'single', icon: <Maximize2 className="h-4 w-4" /> },
                          { id: 'grid', icon: <Grid3X3 className="h-4 w-4" /> },
                          { id: 'compare', icon: <SlidersHorizontal className="h-4 w-4" /> },
                        ].map((mode) => (
                          <Button
                            key={mode.id}
                            variant={viewMode === mode.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode(mode.id as any)}
                          >
                            {mode.icon}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Zoom</Label>
                        <span className="text-xs text-muted-foreground">{zoom}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setZoom((prev) => Math.max(25, prev - 25))}
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Slider
                          value={[zoom]}
                          onValueChange={(v) => setZoom(v[0])}
                          min={25}
                          max={200}
                          step={25}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setZoom((prev) => Math.min(200, prev + 25))}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Enhancement Options */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">AI Enhancement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Auto-enhance quality</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Remove watermarks</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Upscale to 4K</Label>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </ScrollArea>

          {/* Generate Button */}
          <div className="p-4 border-t bg-card">
            <Button
              onClick={handleGenerate}
              disabled={!originalImage || isGenerating}
              className="w-full h-12 text-base font-semibold gap-2"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating... {Math.round(generationProgress)}%
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  Generate Design
                  <Badge variant="secondary" className="ml-2">
                    {numberOfVariations} credits
                  </Badge>
                </>
              )}
            </Button>
            {isGenerating && (
              <Progress value={generationProgress} className="mt-2" />
            )}
          </div>
        </motion.aside>

        {/* Main Canvas Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Toolbar */}
          <div className="h-14 border-b bg-card flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" disabled={historyIndex <= 0}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" disabled={historyIndex >= history.length - 1}>
                <SkipForward className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <span className="text-sm text-muted-foreground">
                {generatedImages.length} renders
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Vastu Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showVastuPanel ? 'default' : 'outline'}
                    size="sm"
                    onClick={analyzeVastu}
                    disabled={!selectedGenerated}
                    className="gap-2"
                  >
                    <Compass className="h-4 w-4" />
                    Vastu Score
                    {vastuScore && (
                      <Badge
                        variant={
                          vastuScore >= 80
                            ? 'default'
                            : vastuScore >= 50
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {vastuScore}/100
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Analyze Vastu compliance</p>
                </TooltipContent>
              </Tooltip>

              {/* Object Removal Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showObjectRemoval ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowObjectRemoval(!showObjectRemoval)}
                    disabled={!selectedGenerated}
                    className="gap-2"
                  >
                    <Wand2 className="h-4 w-4" />
                    Object Removal
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remove unwanted objects from image</p>
                </TooltipContent>
              </Tooltip>

              {/* Live Feedback Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showLiveFeedback ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowLiveFeedback(!showLiveFeedback)}
                    disabled={!selectedGenerated}
                    className="gap-2"
                  >
                    <Activity className="h-4 w-4" />
                    Live Status
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Real-time AI processing status</p>
                </TooltipContent>
              </Tooltip>

              {/* Cost Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showCostPanel ? 'default' : 'outline'}
                    size="sm"
                    onClick={calculateCost}
                    disabled={!selectedGenerated}
                    className="gap-2"
                  >
                    {selectedCurrency === 'INR' ? (
                      <IndianRupee className="h-4 w-4" />
                    ) : (
                      <DollarSign className="h-4 w-4" />
                    )}
                    Cost Estimate
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Calculate renovation cost</p>
                </TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-6" />

              {/* Download */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!selectedGenerated}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>

              {/* Share */}
              <Button variant="outline" size="sm" disabled={!selectedGenerated}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>

              {/* More Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Layers className="h-4 w-4 mr-2" />
                    Save to Project
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative overflow-hidden bg-muted/30">
            {!originalImage ? (
              /* Upload Zone — uses the shared ImageUploader component */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-8 flex items-center justify-center"
              >
                <div className="w-full max-w-2xl">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">Upload your room photo</h2>
                    <p className="text-muted-foreground text-sm">
                      Upload a clear photo of your room to generate AI-powered redesigns
                    </p>
                  </div>
                  <ImageUploader
                    onUpload={handleImageUploaded}
                    onRemove={handleImageRemoved}
                    maxSize={8}
                    aspectRatio="video"
                    showUrlInput
                    showCameraButton
                  />
                </div>
              </motion.div>
            ) : (
              /* Image Display */
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <AnimatePresence mode="sync">
                  {viewMode === 'single' && (
                    <motion.div
                      key="single"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative w-full h-full flex items-center justify-center"
                      style={{ transform: `scale(${zoom / 100})` }}
                    >
                      {selectedGenerated ? (
                        <div className="relative max-w-full max-h-full">
                          <Image
                            src={selectedGenerated.url}
                            alt="Generated design"
                            width={1024}
                            height={768}
                            className="object-contain rounded-lg shadow-2xl"
                          />
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute top-4 right-4"
                            onClick={() => toggleFavorite(selectedGenerated.id)}
                          >
                            <Heart
                              className={cn(
                                'h-4 w-4',
                                selectedGenerated.isFavorite && 'fill-red-500 text-red-500'
                              )}
                            />
                          </Button>
                        </div>
                      ) : (
                        <div className="relative max-w-full max-h-full">
                          <Image
                            src={originalImage}
                            alt="Original"
                            width={1024}
                            height={768}
                            className="object-contain rounded-lg shadow-xl"
                          />
                          <Badge className="absolute top-4 left-4">Original</Badge>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {viewMode === 'grid' && (
                    <motion.div
                      key="grid"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full overflow-auto p-4"
                    >
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {/* Original */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className={cn(
                            'relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer border-2',
                            !selectedGenerated ? 'border-primary' : 'border-transparent'
                          )}
                          onClick={() => setSelectedGenerated(null)}
                        >
                          <Image
                            src={originalImage}
                            alt="Original"
                            fill
                            className="object-cover"
                          />
                          <Badge className="absolute top-2 left-2">Original</Badge>
                        </motion.div>

                        {/* Generated Images */}
                        {generatedImages.map((img) => (
                          <motion.div
                            key={img.id}
                            whileHover={{ scale: 1.02 }}
                            className={cn(
                              'relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer border-2',
                              selectedGenerated?.id === img.id
                                ? 'border-primary'
                                : 'border-transparent'
                            )}
                            onClick={() => setSelectedGenerated(img)}
                          >
                            <Image
                              src={img.url}
                              alt={img.style}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-xs text-white font-medium truncate">
                                  {DESIGN_STYLES.find((s) => s.id === img.style)?.name || img.style}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(img.id);
                              }}
                            >
                              <Heart
                                className={cn(
                                  'h-3 w-3',
                                  img.isFavorite && 'fill-red-500 text-red-500'
                                )}
                              />
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {viewMode === 'compare' && selectedGenerated && (
                    <motion.div
                      key="compare"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative w-full max-w-4xl aspect-[4/3] rounded-lg overflow-hidden"
                    >
                      {/* Before Image */}
                      <div className="absolute inset-0">
                        <Image
                          src={originalImage}
                          alt="Before"
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* After Image with Clip */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)` }}
                      >
                        <Image
                          src={selectedGenerated.url}
                          alt="After"
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Slider */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
                        style={{ left: `${comparisonPosition}%` }}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                          <ChevronLeft className="h-4 w-4 text-gray-600" />
                          <ChevronRight className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>

                      {/* Labels */}
                      <Badge className="absolute top-4 left-4">Before</Badge>
                      <Badge className="absolute top-4 right-4">After</Badge>

                      {/* Slider Control */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={comparisonPosition}
                        onChange={(e) => setComparisonPosition(parseInt(e.target.value))}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 opacity-50 hover:opacity-100 transition-opacity"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading Overlay */}
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
                  >
                    <div className="text-center">
                      <div className="relative h-24 w-24 mx-auto mb-4">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary"
                        />
                        <Wand2 className="absolute inset-0 m-auto h-10 w-10 text-primary" />
                      </div>
                      <p className="text-lg font-semibold">Creating your design...</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        This usually takes 10-15 seconds
                      </p>
                      <Progress value={generationProgress} className="w-48 mx-auto mt-4" />
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {generatedImages.length > 0 && (
            <div className="h-24 border-t bg-card px-4 py-2">
              <ScrollArea className="w-full overflow-x-auto">
                <div className="flex gap-2">
                  {/* Original Thumbnail */}
                  <button
                    onClick={() => setSelectedGenerated(null)}
                    className={cn(
                      'relative h-[72px] w-24 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all',
                      !selectedGenerated ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-70 hover:opacity-100'
                    )}
                  >
                    {originalImage && (
                      <Image
                        src={originalImage}
                        alt="Original"
                        fill
                        className="object-cover"
                      />
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-black/50 text-xs text-white text-center py-0.5">
                      Original
                    </div>
                  </button>

                  {/* Generated Thumbnails */}
                  {generatedImages.map((img, index) => (
                    <motion.button
                      key={img.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSelectedGenerated(img)}
                      className={cn(
                        'relative h-[72px] w-24 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all',
                        selectedGenerated?.id === img.id
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      )}
                    >
                      <Image
                        src={img.url}
                        alt={`Generated ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      {img.isFavorite && (
                        <Heart className="absolute top-1 right-1 h-3 w-3 fill-red-500 text-red-500" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </main>

        {/* Right Panel - Vastu */}
        <AnimatePresence>
          {showVastuPanel && (
            <motion.aside
              initial={{ x: 350, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 350, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-80 border-l bg-card flex flex-col"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Vastu Analysis</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowVastuPanel(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                {/* Vastu Score */}
                {vastuScore !== null && (
                  <div className="mb-6">
                    <div className="relative h-32 w-32 mx-auto">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${(vastuScore / 100) * 352} 352`}
                          className={cn(
                            vastuScore >= 80
                              ? 'text-green-500'
                              : vastuScore >= 50
                                ? 'text-yellow-500'
                                : 'text-red-500'
                          )}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-3xl font-bold">{vastuScore}</span>
                        <span className="text-xs text-muted-foreground">/ 100</span>
                      </div>
                    </div>
                    <p className="text-center mt-2 text-sm text-muted-foreground">
                      {vastuScore >= 80
                        ? 'Excellent Vastu compliance'
                        : vastuScore >= 50
                          ? 'Good with some improvements needed'
                          : 'Needs significant improvements'}
                    </p>
                  </div>
                )}

                {/* Issues List */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Suggestions</h4>
                  {vastuIssues.map((issue, index) => (
                    <Card
                      key={`vastu-issue-${index}`}
                      className={cn(
                        'border-l-4',
                        issue.severity === 'critical'
                          ? 'border-l-red-500'
                          : issue.severity === 'warning'
                            ? 'border-l-yellow-500'
                            : 'border-l-blue-500'
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle
                            className={cn(
                              'h-4 w-4 mt-0.5 flex-shrink-0',
                              issue.severity === 'critical'
                                ? 'text-red-500'
                                : issue.severity === 'warning'
                                  ? 'text-yellow-500'
                                  : 'text-blue-500'
                            )}
                          />
                          <div>
                            <p className="text-sm font-medium">{issue.rule}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {issue.description}
                            </p>
                            <p className="text-xs text-primary mt-2 flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              Fix: {issue.fix}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Auto-Fix Button */}
                <Button className="w-full mt-4 gap-2">
                  <Wand2 className="h-4 w-4" />
                  Auto-Fix Vastu Issues
                </Button>
              </ScrollArea>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Right Panel - Cost */}
        <AnimatePresence>
          {showCostPanel && (
            <motion.aside
              initial={{ x: 350, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 350, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-80 border-l bg-card flex flex-col"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedCurrency === 'INR' ? (
                    <IndianRupee className="h-5 w-5 text-primary" />
                  ) : (
                    <DollarSign className="h-5 w-5 text-primary" />
                  )}
                  <h3 className="font-semibold">Cost Estimate</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={selectedCurrency === 'INR' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setSelectedCurrency('INR')}
                  >
                    ₹
                  </Button>
                  <Button
                    variant={selectedCurrency === 'USD' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setSelectedCurrency('USD')}
                  >
                    $
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCostPanel(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                {/* City Selector */}
                <div className="mb-4">
                  <Label className="text-sm">City</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mumbai">Mumbai</SelectItem>
                      <SelectItem value="delhi">Delhi NCR</SelectItem>
                      <SelectItem value="bangalore">Bangalore</SelectItem>
                      <SelectItem value="chennai">Chennai</SelectItem>
                      <SelectItem value="hyderabad">Hyderabad</SelectItem>
                      <SelectItem value="pune">Pune</SelectItem>
                      <SelectItem value="kolkata">Kolkata</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {costBreakdown && (
                  <>
                    {/* Total Cost */}
                    <Card className="mb-4 bg-primary/5 border-primary/20">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Estimated Total</p>
                        <p className="text-3xl font-bold text-primary">
                          {selectedCurrency === 'INR' ? '₹' : '$'}
                          {costBreakdown.total.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Including taxes and labor
                        </p>
                      </CardContent>
                    </Card>

                    {/* Breakdown */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Materials Breakdown</h4>
                      {costBreakdown.materials.map((item, index) => (
                        <div key={`material-${index}`} className="flex justify-between items-center">
                          <span className="text-sm">{item.name}</span>
                          <span className="text-sm font-medium">
                            {selectedCurrency === 'INR' ? '₹' : '$'}
                            {item.cost.toLocaleString()}
                          </span>
                        </div>
                      ))}

                      <Separator />

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Labor</span>
                        <span className="text-sm font-medium">
                          {selectedCurrency === 'INR' ? '₹' : '$'}
                          {costBreakdown.labor.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Tax (GST 18%)</span>
                        <span className="text-sm font-medium">
                          {selectedCurrency === 'INR' ? '₹' : '$'}
                          {costBreakdown.tax.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Export Options */}
                    <div className="mt-6 space-y-2">
                      <Button variant="outline" className="w-full gap-2">
                        <Download className="h-4 w-4" />
                        Download PDF Quote
                      </Button>
                      <Button variant="outline" className="w-full gap-2">
                        <Share2 className="h-4 w-4" />
                        Share with Contractor
                      </Button>
                    </div>
                  </>
                )}
              </ScrollArea>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Object Removal Sidebar */}
        <AnimatePresence>
          {showObjectRemoval && selectedGenerated && (
            <motion.aside
              initial={{ x: 350, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 350, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-80 border-l bg-card flex flex-col"
            >
              <ObjectRemovalSidebar
                imageUrl={selectedGenerated.url}
                onImageUpdate={(newImageUrl) => {
                  // Update the selected generated image with the new one
                  setSelectedGenerated(prev => prev ? { ...prev, url: newImageUrl } : null);
                }}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Live Feedback Sidebar */}
        <AnimatePresence>
          {showLiveFeedback && selectedGenerated && (
            <motion.aside
              initial={{ x: 350, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 350, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-80 border-l bg-card flex flex-col"
            >
              <LiveFeedbackSidebar
                projectId={selectedGenerated.id}
                onImageUpdate={(newImageUrl) => {
                  // Update the selected generated image with the new one
                  setSelectedGenerated(prev => prev ? { ...prev, url: newImageUrl } : null);
                }}
                onProcessStart={() => {
                  setIsGenerating(true);
                  setGenerationProgress(0);
                }}
                onProcessComplete={(result) => {
                  setIsGenerating(false);
                  setGenerationProgress(100);
                  console.log('✅ Processing completed:', result);
                }}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}