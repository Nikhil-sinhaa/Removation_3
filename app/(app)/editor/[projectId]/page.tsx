// app/(app)/editor/[projectId]/page.tsx
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
// TODO: Remnant Clerk imports: useUser
import Image from 'next/image';
import Link from 'next/link';
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
  Compass,
  IndianRupee,
  DollarSign,
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FolderOpen,
  Save,
  ArrowLeft,
  PenTool,
  Square,
  Circle,
  Type,
  Undo2,
  Redo2,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Crop,
  Scissors,
  Pipette,
  Ruler,
  MousePointer,
  Hand,
  PlusCircle,
  MinusCircle,
  Lock,
  Unlock,
  Filter,
  Sliders,
  Contrast,
  Droplet,
  Thermometer,
  Lightbulb,
  Aperture,
  Focus,
  Maximize,
  Minimize,
  ExternalLink,
  FileImage,
  FolderPlus,
  Star,
  StarOff,
  MessageSquare,
  Users,
  History,
  GitBranch,
  Tag,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';

import { useUploadThing } from '@/lib/uploadthing';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/user-store';
import { DESIGN_STYLES } from '@/constants/styles-400';
import { ROOM_TYPES } from '@/constants/room-types';

// Types
interface Project {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  roomType: string;
  status: 'draft' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  renders: Render[];
  collaborators: Collaborator[];
  tags: string[];
  isStarred: boolean;
}

interface Render {
  id: string;
  originalImage: string;
  generatedImage: string;
  style: string;
  roomType: string;
  mode: string;
  vastuScore?: number;
  estimatedCost?: {
    inr: number;
    usd: number;
  };
  createdAt: Date;
  isFavorite: boolean;
  notes?: string;
  version: number;
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
}

interface VastuIssue {
  rule: string;
  severity: 'critical' | 'warning' | 'suggestion';
  description: string;
  fix: string;
  category: string;
}

interface CostBreakdown {
  materials: { name: string; cost: number; quantity?: string }[];
  labor: { type: string; cost: number; days?: number }[];
  overhead: number;
  tax: number;
  total: number;
  perSqFt: number;
}

interface HistoryEntry {
  id: string;
  action: string;
  timestamp: Date;
  user: string;
  details?: string;
}

// Tool types
type ToolType = 'select' | 'pan' | 'brush' | 'eraser' | 'crop' | 'text' | 'shape' | 'eyedropper';

export default function ProjectEditorPage() {
  const setInsufficientCreditsModalOpen = useUserStore(s => s.setInsufficientCreditsModalOpen);
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { user, isLoading: isLoaded } = useAuth();
  const isSignedIn = !!user;
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Project State
  const [project, setProject] = useState<Project | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Image State
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedRender, setSelectedRender] = useState<Render | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Editor Settings
  const [selectedStyle, setSelectedStyle] = useState<string>('modern-minimalist');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('living-room');
  const [selectedMode, setSelectedMode] = useState<string>('redesign');
  const [preserveStructure, setPreserveStructure] = useState(true);
  const [creativityLevel, setCreativityLevel] = useState([50]);
  const [colorPreference, setColorPreference] = useState<string>('');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [numberOfVariations, setNumberOfVariations] = useState(4);

  // Tool State
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [brushSize, setBrushSize] = useState([30]);
  const [brushHardness, setBrushHardness] = useState([80]);
  const [brushOpacity, setBrushOpacity] = useState([100]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [maskData, setMaskData] = useState<string | null>(null);

  // View Controls
  const [zoom, setZoom] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'grid' | 'compare' | 'timeline'>('single');
  const [comparisonPosition, setComparisonPosition] = useState(50);

  // Side Panels
  const [activePanel, setActivePanel] = useState<'tools' | 'styles' | 'layers' | 'history'>('tools');
  const [showVastuPanel, setShowVastuPanel] = useState(false);
  const [showCostPanel, setShowCostPanel] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);

  // Vastu & Cost
  const [vastuScore, setVastuScore] = useState<number | null>(null);
  const [vastuIssues, setVastuIssues] = useState<VastuIssue[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'INR' | 'USD'>('INR');
  const [selectedCity, setSelectedCity] = useState('mumbai');
  const [roomSize, setRoomSize] = useState(200); // sq ft

  // History & Undo
  const [historyStack, setHistoryStack] = useState<HistoryEntry[]>([]);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  // Dialogs
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Credits
  const [userCredits, setUserCredits] = useState(50);

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoadingProject(true);
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) throw new Error('Project not found');
        const data = await response.json();
        // Normalize: the API may not return a renders array for redesign projects
        const renders = data.renders || [];
        const normalizedProject = {
          ...data,
          id: data.id || data._id?.toString(),
          renders,
          collaborators: data.collaborators || [],
          tags: data.tags || (data.aiConfig?.style ? [data.aiConfig.style.toLowerCase()] : []),
          isStarred: data.isStarred ?? false,
          roomType: data.roomType || data.aiConfig?.roomType || 'Living Room',
        };
        setProject(normalizedProject);
        setSelectedRoomType(normalizedProject.roomType);
        if (renders.length > 0) {
          setOriginalImage(renders[0].originalImage);
          setSelectedRender(renders[renders.length - 1]);
        } else if (data.originalImage || data.resultImage) {
          // Fallback for redesign projects stored without renders array
          if (data.originalImage) setOriginalImage(data.originalImage);
          if (data.resultImage) {
            setSelectedRender({
              id: data._id?.toString() || data.id,
              originalImage: data.originalImage || '',
              generatedImage: data.resultImage,
              style: data.aiConfig?.style || 'Modern',
              roomType: data.aiConfig?.roomType || 'Living Room',
              mode: 'redesign',
              vastuScore: data.vastuScore,
              createdAt: new Date(data.createdAt || Date.now()),
              isFavorite: false,
              version: 1,
            });
          }
        }
      } catch (error) {
        toast({
          title: 'Error loading project',
          description: 'Please try again',
          variant: 'destructive',
        });
        router.push('/projects');
      } finally {
        setIsLoadingProject(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId, router, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // Save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        handleRedo();
      }
      // Tools
      if (e.key === 'v') setActiveTool('select');
      if (e.key === 'h') setActiveTool('pan');
      if (e.key === 'b') setActiveTool('brush');
      if (e.key === 'e') setActiveTool('eraser');
      if (e.key === 'c') setActiveTool('crop');
      if (e.key === 't') setActiveTool('text');
      // Zoom
      if ((e.metaKey || e.ctrlKey) && e.key === '=') {
        e.preventDefault();
        setZoom((prev) => Math.min(prev + 25, 400));
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault();
        setZoom((prev) => Math.max(prev - 25, 25));
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        setZoom(100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Upload handling
  const { startUpload, isUploading: uploadingFile } = useUploadThing('imageUploader', {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        setOriginalImage(res[0].url);
        setIsUploading(false);
        setUploadProgress(100);
        setHasUnsavedChanges(true);
        toast({
          title: 'Image uploaded',
          description: 'Your image is ready for transformation',
        });
      }
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
    onUploadError: (error) => {
      setIsUploading(false);
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0 && files[0].type.startsWith('image/')) {
        setIsUploading(true);
        startUpload(files);
      }
    },
    [startUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        setIsUploading(true);
        startUpload(Array.from(files));
      }
    },
    [startUpload]
  );

  const handleSave = async () => {
    if (!project) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...project,
          renders: project.renders,
        }),
      });
      if (!response.ok) throw new Error('Failed to save');
      setHasUnsavedChanges(false);
      toast({
        title: 'Project saved',
        description: 'All changes have been saved',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const lastState = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, { /* current state */ }]);
    setUndoStack((prev) => prev.slice(0, -1));
    // Apply lastState
    toast({ title: 'Undone' });
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, { /* current state */ }]);
    setRedoStack((prev) => prev.slice(0, -1));
    // Apply nextState
    toast({ title: 'Redone' });
  };

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

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + Math.random() * 8, 85));
    }, 1000);

    try {
      const response = await fetch('/api/ai/redesign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
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

      if (response.status === 402) {
        setIsGenerating(false);
        setInsufficientCreditsModalOpen(true);
        return;
      }

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
              } else {
                allDone = false;
              }
            }
          } catch (pollErr) {
            console.warn('Poll error:', pollErr);
            allDone = false;
          }
        }

        const progress = Math.min(30 + (completedRenders.length / renderIds.length) * 60, 95);
        setGenerationProgress(progress);

        if (allDone) break;
      }

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (completedRenders.length === 0) {
        throw new Error('Generation timed out. Please check your renders page.');
      }

      const newRenders: Render[] = completedRenders.map((render: any, index: number) => ({
        id: render._id || `render-${Date.now()}-${index}`,
        originalImage,
        generatedImage: render.outputImage || render.resultUrl || '',
        style: selectedStyle,
        roomType: selectedRoomType,
        mode: selectedMode,
        vastuScore: render.vastuScore,
        estimatedCost: render.estimatedCost,
        createdAt: new Date(render.createdAt || Date.now()),
        isFavorite: false,
        version: (project?.renders.length || 0) + index + 1,
      }));

      setProject((prev) => prev ? {
        ...prev,
        renders: [...prev.renders, ...newRenders],
        updatedAt: new Date(),
      } : null);

      setSelectedRender(newRenders[0]);
      setUserCredits((prev) => prev - (data.creditsUsed || numberOfVariations));
      setHasUnsavedChanges(true);

      // Add to history
      setHistoryStack((prev) => [{
        id: `history-${Date.now()}`,
        action: 'Generated design',
        timestamp: new Date(),
        user: user?.firstName || 'You',
        details: `${completedRenders.length} variation(s) in ${DESIGN_STYLES.find((s) => s.id === selectedStyle)?.name} style`,
      }, ...prev]);

      toast({
        title: 'Generation complete!',
        description: `${completedRenders.length} variation(s) created`,
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

  const analyzeVastu = async () => {
    if (!selectedRender) return;

    setShowVastuPanel(true);
    setShowCostPanel(false);
    setShowCommentsPanel(false);

    try {
      const response = await fetch('/api/vastu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: selectedRender.generatedImage,
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

  const calculateCost = async () => {
    if (!selectedRender) return;

    setShowCostPanel(true);
    setShowVastuPanel(false);
    setShowCommentsPanel(false);

    try {
      const response = await fetch('/api/cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: selectedRender.generatedImage,
          roomType: selectedRoomType,
          style: selectedStyle,
          city: selectedCity,
          currency: selectedCurrency,
          roomSize,
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

  const handleDownload = async (format: 'png' | 'jpg' | 'pdf' = 'png') => {
    if (!selectedRender) return;

    try {
      const response = await fetch(selectedRender.generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.name || 'design'}-${selectedRender.id}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Download started',
        description: `Saving as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const toggleFavorite = (renderId: string) => {
    setProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        renders: prev.renders.map((r) =>
          r.id === renderId ? { ...r, isFavorite: !r.isFavorite } : r
        ),
      };
    });
    setHasUnsavedChanges(true);
  };

  const toggleProjectStar = () => {
    setProject((prev) => prev ? { ...prev, isStarred: !prev.isStarred } : null);
    setHasUnsavedChanges(true);
  };

  // Tool definitions
  const tools = [
    { id: 'select' as ToolType, icon: <MousePointer className="h-4 w-4" />, label: 'Select (V)', shortcut: 'V' },
    { id: 'pan' as ToolType, icon: <Hand className="h-4 w-4" />, label: 'Pan (H)', shortcut: 'H' },
    { id: 'brush' as ToolType, icon: <Paintbrush className="h-4 w-4" />, label: 'Brush (B)', shortcut: 'B' },
    { id: 'eraser' as ToolType, icon: <Eraser className="h-4 w-4" />, label: 'Eraser (E)', shortcut: 'E' },
    { id: 'crop' as ToolType, icon: <Crop className="h-4 w-4" />, label: 'Crop (C)', shortcut: 'C' },
    { id: 'text' as ToolType, icon: <Type className="h-4 w-4" />, label: 'Text (T)', shortcut: 'T' },
    { id: 'shape' as ToolType, icon: <Square className="h-4 w-4" />, label: 'Shape', shortcut: '' },
    { id: 'eyedropper' as ToolType, icon: <Pipette className="h-4 w-4" />, label: 'Eyedropper', shortcut: 'I' },
  ];

  // Loading state
  if (isLoadingProject) {
    return (
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
        {/* Left sidebar skeleton */}
        <div className="w-80 border-r bg-card p-4 space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        {/* Main area skeleton */}
        <div className="flex-1 flex flex-col">
          <div className="h-14 border-b bg-card flex items-center px-4">
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Skeleton className="w-[600px] h-[400px] rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Project not found</h2>
          <p className="text-muted-foreground mt-2">This project may have been deleted or moved.</p>
          <Button className="mt-4" onClick={() => router.push('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      {/* Command Palette */}
      <CommandDialog open={showCommandPalette} onOpenChange={setShowCommandPalette}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={handleGenerate}>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Design
            </CommandItem>
            <CommandItem onSelect={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Project
            </CommandItem>
            <CommandItem onSelect={() => handleDownload('png')}>
              <Download className="h-4 w-4 mr-2" />
              Download Image
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Analysis">
            <CommandItem onSelect={analyzeVastu}>
              <Compass className="h-4 w-4 mr-2" />
              Analyze Vastu
            </CommandItem>
            <CommandItem onSelect={calculateCost}>
              <IndianRupee className="h-4 w-4 mr-2" />
              Calculate Cost
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => router.push('/projects')}>
              <FolderOpen className="h-4 w-4 mr-2" />
              All Projects
            </CommandItem>
            <CommandItem onSelect={() => router.push('/dashboard')}>
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
        {/* Left Sidebar - Tools Panel */}
        <motion.aside
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-80 border-r bg-card overflow-hidden flex flex-col"
        >
          {/* Project Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <Button variant="ghost" size="sm" onClick={() => router.push('/projects')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Projects
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleProjectStar}
                >
                  {project.isStarred ? (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowSettingsDialog(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Project Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
                      <Users className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={project.name}
                onChange={(e) => {
                  setProject((prev) => prev ? { ...prev, name: e.target.value } : null);
                  setHasUnsavedChanges(true);
                }}
                className="font-semibold text-lg border-none px-0 focus-visible:ring-0"
              />
              {hasUnsavedChanges && (
                <Badge variant="secondary" className="text-xs">Unsaved</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {project.renders.length} renders • Updated {new Date(project.updatedAt).toLocaleDateString()}
            </p>
          </div>

          {/* Tool Palette */}
          <div className="p-2 border-b flex flex-wrap gap-1">
            {tools.map((tool) => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTool === tool.id ? 'default' : 'ghost'}
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setActiveTool(tool.id)}
                  >
                    {tool.icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{tool.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            <Separator orientation="vertical" className="h-9 mx-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Undo (⌘Z)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Redo (⌘⇧Z)</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Brush Settings (when brush tool is active) */}
          {(activeTool === 'brush' || activeTool === 'eraser') && (
            <div className="p-4 border-b space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Size</Label>
                  <span className="text-xs text-muted-foreground">{brushSize[0]}px</span>
                </div>
                <Slider
                  value={brushSize}
                  onValueChange={setBrushSize}
                  min={1}
                  max={200}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Hardness</Label>
                  <span className="text-xs text-muted-foreground">{brushHardness[0]}%</span>
                </div>
                <Slider
                  value={brushHardness}
                  onValueChange={setBrushHardness}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Opacity</Label>
                  <span className="text-xs text-muted-foreground">{brushOpacity[0]}%</span>
                </div>
                <Slider
                  value={brushOpacity}
                  onValueChange={setBrushOpacity}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setMaskData(null)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear Mask
                </Button>
              </div>
            </div>
          )}

          {/* Main Tabs */}
          <ScrollArea className="flex-1">
            <Tabs value={activePanel} onValueChange={(v) => setActivePanel(v as any)} className="p-4">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="tools" className="text-xs">Transform</TabsTrigger>
                <TabsTrigger value="styles" className="text-xs">Styles</TabsTrigger>
                <TabsTrigger value="layers" className="text-xs">Renders</TabsTrigger>
                <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
              </TabsList>

              {/* Transform Tab */}
              <TabsContent value="tools" className="space-y-4 mt-0">
                {/* Mode Selection */}
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
                        onClick={() => setSelectedMode(mode.id)}
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
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Room Size */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Room Size (sq ft)</Label>
                  <Input
                    type="number"
                    value={roomSize}
                    onChange={(e) => setRoomSize(parseInt(e.target.value) || 0)}
                    placeholder="Enter room size"
                  />
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

                {/* Variations */}
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

                {/* Custom Prompt */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Custom Instructions</Label>
                  <Textarea
                    placeholder="Add specific requirements..."
                    value={additionalPrompt}
                    onChange={(e) => setAdditionalPrompt(e.target.value)}
                    className="min-h-[80px] text-sm resize-none"
                  />
                </div>
              </TabsContent>

              {/* Styles Tab */}
              <TabsContent value="styles" className="space-y-4 mt-0">
                <Input placeholder="Search styles..." className="mb-2" />
                <ScrollArea className="h-[350px]">
                  <div className="grid grid-cols-2 gap-2">
                    {DESIGN_STYLES.slice(0, 24).map((style) => (
                      <motion.button
                        key={style.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedStyle(style.id)}
                        className={cn(
                          'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                          selectedStyle === style.id
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-transparent hover:border-muted-foreground/20'
                        )}
                      >
                        <Image
                          src={style.thumbnail || '/images/styles/placeholder.jpg'}
                          alt={style.name}
                          fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <p className="text-xs text-white font-medium truncate">
                            {style.name}
                          </p>
                        </div>
                        {selectedStyle === style.id && (
                          <div className="absolute top-2 right-2">
                            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </ScrollArea>
                <Button variant="outline" size="sm" className="w-full">
                  View All 400+ Styles
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </TabsContent>

              {/* Renders/Layers Tab */}
              <TabsContent value="layers" className="space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Renders ({project.renders.length})</Label>
                  <Button variant="ghost" size="sm" className="h-7">
                    <Filter className="h-3 w-3 mr-1" />
                    Filter
                  </Button>
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {/* Original Image */}
                    {originalImage && (
                      <div
                        className={cn(
                          'relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all',
                          !selectedRender ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-muted/50'
                        )}
                        onClick={() => setSelectedRender(null)}
                      >
                        <div className="aspect-video relative">
                          <Image
                            src={originalImage}
                            alt="Original"
                            fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                          />
                        </div>
                        <div className="p-2 bg-muted/50">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">Original</span>
                            <Badge variant="outline" className="text-xs">Source</Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Generated Renders */}
                    {project.renders.map((render, index) => (
                      <motion.div
                        key={render.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          'relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all group',
                          selectedRender?.id === render.id
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-transparent hover:border-muted/50'
                        )}
                        onClick={() => setSelectedRender(render)}
                      >
                        <div className="aspect-video relative">
                          <Image
                            src={render.generatedImage}
                            alt={`Render ${index + 1}`}
                            fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                          />
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(render.id);
                              }}
                            >
                              <Heart
                                className={cn(
                                  'h-3 w-3',
                                  render.isFavorite && 'fill-red-500 text-red-500'
                                )}
                              />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDownload('png')}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
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
                        <div className="p-2 bg-muted/50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">
                              v{render.version} • {DESIGN_STYLES.find((s) => s.id === render.style)?.name || render.style}
                            </span>
                            {render.isFavorite && (
                              <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {render.vastuScore && (
                              <span className="flex items-center gap-1">
                                <Compass className="h-3 w-3" />
                                {render.vastuScore}
                              </span>
                            )}
                            <span>{new Date(render.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-4 mt-0">
                <Label className="text-sm font-medium">Activity History</Label>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {historyStack.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No activity yet</p>
                      </div>
                    ) : (
                      historyStack.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <GitBranch className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{entry.action}</p>
                            {entry.details && (
                              <p className="text-xs text-muted-foreground truncate">
                                {entry.details}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {entry.user} • {new Date(entry.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </ScrollArea>

          {/* Generate Button */}
          <div className="p-4 border-t bg-card">
            <div className="flex gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className="flex-1"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
              <Badge variant="secondary" className="gap-1 py-2">
                <Sparkles className="h-3 w-3" />
                {userCredits} credits
              </Badge>
            </div>
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
              {/* View Mode */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {[
                  { id: 'single', icon: <Maximize2 className="h-4 w-4" /> },
                  { id: 'grid', icon: <Grid3X3 className="h-4 w-4" /> },
                  { id: 'compare', icon: <SlidersHorizontal className="h-4 w-4" /> },
                  { id: 'timeline', icon: <GitBranch className="h-4 w-4" /> },
                ].map((mode) => (
                  <Tooltip key={mode.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === mode.id ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setViewMode(mode.id as any)}
                      >
                        {mode.icon}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="capitalize">{mode.id} View</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Zoom Controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setZoom((prev) => Math.max(25, prev - 25))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2 min-w-[60px]">
                      {zoom}%
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48">
                    <div className="space-y-2">
                      <Label className="text-sm">Zoom Level</Label>
                      <Slider
                        value={[zoom]}
                        onValueChange={(v) => setZoom(v[0])}
                        min={25}
                        max={400}
                        step={25}
                      />
                      <div className="flex flex-wrap gap-1 mt-2">
                        {[25, 50, 100, 150, 200].map((z) => (
                          <Button
                            key={z}
                            variant={zoom === z ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => setZoom(z)}
                          >
                            {z}%
                          </Button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setZoom((prev) => Math.min(400, prev + 25))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* View Options */}
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showGrid ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowGrid(!showGrid)}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle Grid</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showRulers ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowRulers(!showRulers)}
                    >
                      <Ruler className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle Rulers</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Analysis Buttons */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showVastuPanel ? 'default' : 'outline'}
                    size="sm"
                    onClick={analyzeVastu}
                    disabled={!selectedRender}
                    className="gap-2"
                  >
                    <Compass className="h-4 w-4" />
                    <span className="hidden lg:inline">Vastu</span>
                    {vastuScore !== null && (
                      <Badge
                        variant={
                          vastuScore >= 80
                            ? 'default'
                            : vastuScore >= 50
                              ? 'secondary'
                              : 'destructive'
                        }
                        className="ml-1"
                      >
                        {vastuScore}
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Vastu Analysis</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showCostPanel ? 'default' : 'outline'}
                    size="sm"
                    onClick={calculateCost}
                    disabled={!selectedRender}
                    className="gap-2"
                  >
                    {selectedCurrency === 'INR' ? (
                      <IndianRupee className="h-4 w-4" />
                    ) : (
                      <DollarSign className="h-4 w-4" />
                    )}
                    <span className="hidden lg:inline">Cost</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cost Estimate</p>
                </TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-6" />

              {/* Export */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!selectedRender}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDownload('png')}>
                    <FileImage className="h-4 w-4 mr-2" />
                    PNG (High Quality)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload('jpg')}>
                    <FileImage className="h-4 w-4 mr-2" />
                    JPG (Compressed)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload('pdf')}>
                    <FileImage className="h-4 w-4 mr-2" />
                    PDF with Cost Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Share */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareDialog(true)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>

              {/* Comments */}
              <Button
                variant={showCommentsPanel ? 'default' : 'ghost'}
                size="icon"
                className="h-9 w-9"
                onClick={() => {
                  setShowCommentsPanel(!showCommentsPanel);
                  setShowVastuPanel(false);
                  setShowCostPanel(false);
                }}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative overflow-hidden bg-muted/30">
            {!originalImage ? (
              /* Upload Zone */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-8 flex items-center justify-center"
              >
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'w-full max-w-2xl aspect-video rounded-2xl border-2 border-dashed',
                    'flex flex-col items-center justify-center gap-4 cursor-pointer',
                    'transition-all duration-300 hover:border-primary hover:bg-primary/5',
                    isUploading ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  )}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <div className="text-center">
                        <p className="font-medium">Uploading...</p>
                        <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
                      </div>
                      <Progress value={uploadProgress} className="w-48" />
                    </div>
                  ) : (
                    <>
                      <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Upload className="h-10 w-10 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">Upload an image to get started</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Drag and drop or click to browse
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>JPG, PNG, WebP</span>
                        <span>•</span>
                        <span>Max 10MB</span>
                      </div>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </motion.div>
            ) : (
              /* Image Display based on view mode */
              <div className="absolute inset-0 flex items-center justify-center p-8 overflow-auto">
                <AnimatePresence mode="sync">
                  {viewMode === 'single' && (
                    <motion.div
                      key="single-view"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative"
                      style={{ transform: `scale(${zoom / 100})` }}
                    >
                      {selectedRender ? (
                        <Image
                          src={selectedRender.generatedImage}
                          alt="Generated design"
                          width={1024}
                          height={768}
                          className="rounded-lg shadow-2xl"
                          priority
                        />
                      ) : (
                        <Image
                          src={originalImage}
                          alt="Original"
                          width={1024}
                          height={768}
                          className="rounded-lg shadow-xl"
                          priority
                        />
                      )}
                    </motion.div>
                  )}

                  {viewMode === 'grid' && (
                    <motion.div
                      key="grid-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full overflow-auto p-4"
                    >
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
                        {/* Original */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className={cn(
                            'relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer border-2',
                            !selectedRender ? 'border-primary' : 'border-transparent'
                          )}
                          onClick={() => setSelectedRender(null)}
                        >
                          <Image
                            src={originalImage}
                            alt="Original"
                            fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                          />
                          <Badge className="absolute top-2 left-2">Original</Badge>
                        </motion.div>

                        {project.renders.map((render) => (
                          <motion.div
                            key={render.id}
                            whileHover={{ scale: 1.02 }}
                            className={cn(
                              'relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer border-2',
                              selectedRender?.id === render.id
                                ? 'border-primary'
                                : 'border-transparent'
                            )}
                            onClick={() => setSelectedRender(render)}
                          >
                            <Image
                              src={render.generatedImage}
                              alt={`Render v${render.version}`}
                              fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                                <span className="text-xs text-white font-medium">
                                  v{render.version}
                                </span>
                                {render.vastuScore && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Compass className="h-3 w-3 mr-1" />
                                    {render.vastuScore}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {render.isFavorite && (
                              <Heart className="absolute top-2 right-2 h-4 w-4 fill-red-500 text-red-500" />
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {viewMode === 'compare' && selectedRender && (
                    <motion.div
                      key="compare-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative w-full max-w-4xl aspect-[4/3] rounded-lg overflow-hidden"
                    >
                      <div className="absolute inset-0">
                        <Image
                          src={originalImage}
                          alt="Before"
                          fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)` }}
                      >
                        <Image
                          src={selectedRender.generatedImage}
                          alt="After"
                          fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
                        style={{ left: `${comparisonPosition}%` }}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                          <ChevronLeft className="h-4 w-4 text-gray-600" />
                          <ChevronRight className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>
                      <Badge className="absolute top-4 left-4">Before</Badge>
                      <Badge className="absolute top-4 right-4">After</Badge>
                      <Slider
                        value={[comparisonPosition]}
                        onValueChange={(v) => setComparisonPosition(v[0])}
                        min={0}
                        max={100}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48"
                      />
                    </motion.div>
                  )}

                  {viewMode === 'timeline' && (
                    <motion.div
                      key="timeline-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full flex flex-col"
                    >
                      {/* Main display */}
                      <div className="flex-1 flex items-center justify-center">
                        {selectedRender ? (
                          <Image
                            src={selectedRender.generatedImage}
                            alt="Selected render"
                            width={800}
                            height={600}
                            className="rounded-lg shadow-xl max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <Image
                            src={originalImage}
                            alt="Original"
                            width={800}
                            height={600}
                            className="rounded-lg shadow-xl max-w-full max-h-full object-contain"
                          />
                        )}
                      </div>
                      {/* Timeline */}
                      <div className="h-32 border-t bg-card p-4">
                        <div className="flex items-center gap-4 h-full overflow-x-auto">
                          {/* Original */}
                          <div
                            className={cn(
                              'relative h-full aspect-video rounded-lg overflow-hidden cursor-pointer border-2 flex-shrink-0',
                              !selectedRender ? 'border-primary' : 'border-transparent'
                            )}
                            onClick={() => setSelectedRender(null)}
                          >
                            <Image
                              src={originalImage}
                              alt="Original"
                              fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover"
                            />
                            <div className="absolute bottom-1 left-1 right-1">
                              <Badge className="text-xs">Original</Badge>
                            </div>
                          </div>

                          {/* Arrow */}
                          <ChevronRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

                          {/* Renders */}
                          {project.renders.map((render, index) => (
                            <div key={render.id} className="flex items-center gap-4">
                              <div
                                className={cn(
                                  'relative h-full aspect-video rounded-lg overflow-hidden cursor-pointer border-2 flex-shrink-0',
                                  selectedRender?.id === render.id
                                    ? 'border-primary'
                                    : 'border-transparent'
                                )}
                                onClick={() => setSelectedRender(render)}
                              >
                                <Image
                                  src={render.generatedImage}
                                  alt={`v${render.version}`}
                                  fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  className="object-cover"
                                />
                                <div className="absolute bottom-1 left-1 right-1 flex justify-between">
                                  <Badge variant="secondary" className="text-xs">
                                    v{render.version}
                                  </Badge>
                                  {render.isFavorite && (
                                    <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                                  )}
                                </div>
                              </div>
                              {index < project.renders.length - 1 && (
                                <ChevronRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Generation Overlay */}
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
                        Generating {numberOfVariations} variations
                      </p>
                      <Progress value={generationProgress} className="w-48 mx-auto mt-4" />
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Right Panels */}
        <AnimatePresence>
          {/* Vastu Panel */}
          {showVastuPanel && (
            <motion.aside
              initial={{ x: 350, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 350, opacity: 0 }}
              transition={{ duration: 0.3 }}
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
                {vastuScore !== null && (
                  <>
                    {/* Score Circle */}
                    <div className="relative h-32 w-32 mx-auto mb-6">
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

                    {/* Issues */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium flex items-center justify-between">
                        Findings
                        <Badge variant="secondary">{vastuIssues.length}</Badge>
                      </h4>
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
                                <div className="mt-2 p-2 bg-primary/5 rounded text-xs">
                                  <span className="font-medium text-primary">Suggestion: </span>
                                  {issue.fix}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Button className="w-full mt-4 gap-2">
                      <Wand2 className="h-4 w-4" />
                      Auto-Fix All Issues
                    </Button>
                  </>
                )}
              </ScrollArea>
            </motion.aside>
          )}

          {/* Cost Panel */}
          {showCostPanel && (
            <motion.aside
              initial={{ x: 350, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 350, opacity: 0 }}
              transition={{ duration: 0.3 }}
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
                <div className="flex items-center gap-1">
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
                    className="h-7 w-7"
                    onClick={() => setShowCostPanel(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                {/* City & Size */}
                <div className="space-y-3 mb-4">
                  <div className="space-y-1">
                    <Label className="text-sm">City</Label>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mumbai">Mumbai</SelectItem>
                        <SelectItem value="delhi">Delhi NCR</SelectItem>
                        <SelectItem value="bangalore">Bangalore</SelectItem>
                        <SelectItem value="chennai">Chennai</SelectItem>
                        <SelectItem value="hyderabad">Hyderabad</SelectItem>
                        <SelectItem value="pune">Pune</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">Room Size (sq ft)</Label>
                    <Input
                      type="number"
                      value={roomSize}
                      onChange={(e) => setRoomSize(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={calculateCost}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recalculate
                  </Button>
                </div>

                {costBreakdown && (
                  <>
                    {/* Total */}
                    <Card className="mb-4 bg-primary/5 border-primary/20">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Estimated Total</p>
                        <p className="text-3xl font-bold text-primary">
                          {selectedCurrency === 'INR' ? '₹' : '$'}
                          {costBreakdown.total.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ≈ {selectedCurrency === 'INR' ? '₹' : '$'}
                          {costBreakdown.perSqFt.toLocaleString()} per sq ft
                        </p>
                      </CardContent>
                    </Card>

                    {/* Materials */}
                    <div className="space-y-3 mb-4">
                      <h4 className="text-sm font-medium">Materials</h4>
                      {costBreakdown.materials.map((item, index) => (
                        <div key={`material-${index}`} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{item.name}</span>
                          <span className="font-medium">
                            {selectedCurrency === 'INR' ? '₹' : '$'}
                            {item.cost.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    {/* Labor */}
                    <div className="space-y-3 mb-4">
                      <h4 className="text-sm font-medium">Labor</h4>
                      {costBreakdown.labor.map((item, index) => (
                        <div key={`labor-${index}`} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            {item.type}
                            {item.days && <span className="text-xs"> ({item.days} days)</span>}
                          </span>
                          <span className="font-medium">
                            {selectedCurrency === 'INR' ? '₹' : '$'}
                            {item.cost.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    {/* Other costs */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Overhead (10%)</span>
                        <span>
                          {selectedCurrency === 'INR' ? '₹' : '$'}
                          {costBreakdown.overhead.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">GST (18%)</span>
                        <span>
                          {selectedCurrency === 'INR' ? '₹' : '$'}
                          {costBreakdown.tax.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <Button variant="outline" className="w-full gap-2">
                        <Download className="h-4 w-4" />
                        Download Quote (PDF)
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

          {/* Comments Panel */}
          {showCommentsPanel && (
            <motion.aside
              initial={{ x: 350, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 350, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-80 border-l bg-card flex flex-col"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Comments</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCommentsPanel(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No comments yet</p>
                  <p className="text-xs mt-1">Be the first to add a comment</p>
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input placeholder="Add a comment..." className="flex-1" />
                  <Button size="icon">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Project</DialogTitle>
            <DialogDescription>
              Invite collaborators or share a public link
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Enter email address" className="flex-1" />
              <Select defaultValue="editor">
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
              <Button>Invite</Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-medium">Collaborators</Label>
              {project.collaborators.map((collab) => (
                <div key={collab.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={collab.avatar} />
                      <AvatarFallback>{collab.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{collab.name}</p>
                      <p className="text-xs text-muted-foreground">{collab.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">{collab.role}</Badge>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Public Link</p>
                <p className="text-xs text-muted-foreground">Anyone with the link can view</p>
              </div>
              <Switch />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input
                value={project.name}
                onChange={(e) => {
                  setProject((prev) => prev ? { ...prev, name: e.target.value } : null);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={project.description || ''}
                onChange={(e) => {
                  setProject((prev) => prev ? { ...prev, description: e.target.value } : null);
                  setHasUnsavedChanges(true);
                }}
                placeholder="Add a description..."
              />
            </div>
            <div className="space-y-2">
              <Label>Room Type</Label>
              <Select
                value={project.roomType}
                onValueChange={(v) => {
                  setProject((prev) => prev ? { ...prev, roomType: v } : null);
                  setSelectedRoomType(v);
                  setHasUnsavedChanges(true);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1">
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" />
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" className="h-6">
                  <PlusCircle className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}