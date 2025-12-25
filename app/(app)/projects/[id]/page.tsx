// app/(app)/projects/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Copy,
  Download,
  Share2,
  MoreVertical,
  Star,
  StarOff,
  Grid3X3,
  List,
  Filter,
  SortAsc,
  Calendar,
  Clock,
  ImageIcon,
  Sparkles,
  Home,
  IndianRupee,
  Compass,
  ChevronRight,
  Eye,
  Maximize2,
  Heart,
  ExternalLink,
  RefreshCw,
  Settings,
  FileText,
  Layers,
  Zap,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";

import { RenderGrid } from "@/components/shared/RenderGrid";
import  CompareSlider  from "@/components/editor/CompareSlider";
import { VastuScore } from "@/components/vastu/VastuScore";
import { CostBreakdown } from "@/components/cost/CostBreakdown";
import { LoadingShimmer } from "@/components/shared/LoadingShimmer";

import { useProjects } from "@/hooks/useProjects";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// Types
interface Render {
  id: string;
  originalImage: string;
  generatedImage: string;
  style: string;
  roomType: string;
  mode: string;
  prompt?: string;
  vastuScore?: number;
  estimatedCost?: {
    inr: number;
    usd: number;
  };
  isFavorite: boolean;
  createdAt: Date;
  status: "completed" | "processing" | "failed";
}

interface Project {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  roomType: string;
  style: string;
  renders: Render[];
  vastuAnalysis?: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  costEstimate?: {
    total: { inr: number; usd: number };
    breakdown: {
      materials: { inr: number; usd: number };
      labor: { inr: number; usd: number };
      tax: { inr: number; usd: number };
    };
  };
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // State
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedRender, setSelectedRender] = useState<Render | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [activeTab, setActiveTab] = useState("renders");
  const [sortBy, setSortBy] = useState<"date" | "style" | "score">("date");
  const [filterStyle, setFilterStyle] = useState<string>("all");

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          throw new Error("Project not found");
        }
        const data = await response.json();
        setProject(data.project);
        setEditForm({
          name: data.project.name,
          description: data.project.description || "",
        });
      } catch (error) {
        console.error("Error fetching project:", error);
        toast({
          title: "Error",
          description: "Failed to load project. Please try again.",
          variant: "destructive",
        });
        // For demo, use mock data
        setProject(getMockProject(projectId));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  // Mock data for demo
  function getMockProject(id: string): Project {
    return {
      id,
      name: "Modern Living Room Renovation",
      description:
        "Complete redesign of the living room with contemporary furniture and Vastu-compliant layout.",
      thumbnail: "/images/samples/living-room-modern.jpg",
      roomType: "Living Room",
      style: "Modern Minimalist",
      renders: [
        {
          id: "render-1",
          originalImage: "/images/samples/before-1.jpg",
          generatedImage: "/images/samples/after-1.jpg",
          style: "Modern Minimalist",
          roomType: "Living Room",
          mode: "redesign",
          vastuScore: 87,
          estimatedCost: { inr: 450000, usd: 5400 },
          isFavorite: true,
          createdAt: new Date(Date.now() - 86400000),
          status: "completed",
        },
        {
          id: "render-2",
          originalImage: "/images/samples/before-1.jpg",
          generatedImage: "/images/samples/after-2.jpg",
          style: "Scandinavian",
          roomType: "Living Room",
          mode: "redesign",
          vastuScore: 92,
          estimatedCost: { inr: 380000, usd: 4560 },
          isFavorite: false,
          createdAt: new Date(Date.now() - 172800000),
          status: "completed",
        },
        {
          id: "render-3",
          originalImage: "/images/samples/before-1.jpg",
          generatedImage: "/images/samples/after-3.jpg",
          style: "Indian Contemporary",
          roomType: "Living Room",
          mode: "redesign",
          vastuScore: 95,
          estimatedCost: { inr: 520000, usd: 6240 },
          isFavorite: true,
          createdAt: new Date(Date.now() - 259200000),
          status: "completed",
        },
        {
          id: "render-4",
          originalImage: "/images/samples/before-1.jpg",
          generatedImage: "/images/samples/after-4.jpg",
          style: "Art Deco",
          roomType: "Living Room",
          mode: "redesign",
          vastuScore: 78,
          estimatedCost: { inr: 680000, usd: 8160 },
          isFavorite: false,
          createdAt: new Date(Date.now() - 345600000),
          status: "completed",
        },
      ],
      vastuAnalysis: {
        score: 88,
        issues: [
          "Main entrance faces South-West (should face East/North)",
          "Kitchen located in North-East (should be South-East)",
          "Master bedroom in South-East (should be South-West)",
        ],
        suggestions: [
          "Add a water element in North-East corner",
          "Place a mirror on the North wall to enhance energy flow",
          "Use warm colors in the South-West area",
          "Add plants in the East direction",
        ],
      },
      costEstimate: {
        total: { inr: 507500, usd: 6090 },
        breakdown: {
          materials: { inr: 280000, usd: 3360 },
          labor: { inr: 150000, usd: 1800 },
          tax: { inr: 77500, usd: 930 },
        },
      },
      isFavorite: true,
      createdAt: new Date(Date.now() - 604800000),
      updatedAt: new Date(Date.now() - 86400000),
    };
  }

  // Handlers
  const handleDelete = async () => {
    try {
      await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      toast({
        title: "Project deleted",
        description: "Your project has been permanently deleted.",
      });
      router.push("/projects");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await response.json();
      setProject(data.project);
      setIsEditOpen(false);
      toast({
        title: "Project updated",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/duplicate`, {
        method: "POST",
      });
      const data = await response.json();
      toast({
        title: "Project duplicated",
        description: "A copy of your project has been created.",
      });
      router.push(`/projects/${data.project.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleFavorite = async () => {
    if (!project) return;
    try {
      await fetch(`/api/projects/${projectId}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !project.isFavorite }),
      });
      setProject({ ...project, isFavorite: !project.isFavorite });
      toast({
        title: project.isFavorite ? "Removed from favorites" : "Added to favorites",
        description: project.isFavorite
          ? "Project removed from your favorites."
          : "Project added to your favorites.",
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleRenderFavorite = async (renderId: string) => {
    if (!project) return;
    const updatedRenders = project.renders.map((r) =>
      r.id === renderId ? { ...r, isFavorite: !r.isFavorite } : r
    );
    setProject({ ...project, renders: updatedRenders });
  };

  const handleDownloadRender = async (render: Render) => {
    try {
      const response = await fetch(render.generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project?.name}-${render.style}-${render.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Download started",
        description: "Your image is being downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Unable to download image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportAll = async () => {
    toast({
      title: "Exporting project",
      description: "Preparing your files for download...",
    });
    // Implementation would create a zip file with all renders
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: project?.name,
          text: project?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Share failed:", error);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Project link copied to clipboard.",
      });
    }
  };

  // Filter and sort renders
  const filteredRenders = project?.renders
    .filter((r) => filterStyle === "all" || r.style === filterStyle)
    .sort((a, b) => {
      if (sortBy === "date") return b.createdAt.getTime() - a.createdAt.getTime();
      if (sortBy === "style") return a.style.localeCompare(b.style);
      if (sortBy === "score") return (b.vastuScore || 0) - (a.vastuScore || 0);
      return 0;
    }) || [];

  // Get unique styles for filter
  const uniqueStyles = [...new Set(project?.renders.map((r) => r.style) || [])];

  if (isLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">Project not found</h2>
        <p className="text-muted-foreground">
          The project you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => router.push("/projects")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Breadcrumb & Header */}
        <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                <Home className="w-4 h-4" />
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/projects" className="hover:text-foreground transition-colors">
                Projects
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium truncate max-w-[200px]">
                {project.name}
              </span>
            </nav>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/projects")}
                  className="shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>

                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold truncate">
                      {project.name}
                    </h1>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleToggleFavorite}
                      className={cn(
                        "shrink-0",
                        project.isFavorite && "text-yellow-500"
                      )}
                    >
                      {project.isFavorite ? (
                        <Star className="w-5 h-5 fill-current" />
                      ) : (
                        <StarOff className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                  {project.description && (
                    <p className="text-muted-foreground mt-1 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <Badge variant="secondary">{project.roomType}</Badge>
                    <Badge variant="outline">{project.style}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Created {formatDistanceToNow(project.createdAt, { addSuffix: true })}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      {project.renders.length} renders
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share Project</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsExportOpen(true)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export All</TooltipContent>
                </Tooltip>

                <Link href={`/editor/${projectId}`}>
                  <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                    <Sparkles className="w-4 h-4" />
                    Open Editor
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDuplicate}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setIsDeleteOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Renders</p>
                      <p className="text-2xl font-bold">{project.renders.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Vastu Score</p>
                      <p className="text-2xl font-bold">
                        {project.vastuAnalysis?.score || "N/A"}
                        {project.vastuAnalysis?.score && (
                          <span className="text-sm font-normal text-muted-foreground">
                            /100
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Compass className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Est. Cost</p>
                      <p className="text-2xl font-bold">
                        ₹{((project.costEstimate?.total.inr || 0) / 100000).toFixed(1)}L
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Favorites</p>
                      <p className="text-2xl font-bold">
                        {project.renders.filter((r) => r.isFavorite).length}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <TabsList className="bg-background border">
                <TabsTrigger value="renders" className="gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Renders
                </TabsTrigger>
                <TabsTrigger value="vastu" className="gap-2">
                  <Compass className="w-4 h-4" />
                  Vastu Analysis
                </TabsTrigger>
                <TabsTrigger value="cost" className="gap-2">
                  <IndianRupee className="w-4 h-4" />
                  Cost Estimate
                </TabsTrigger>
              </TabsList>

              {activeTab === "renders" && (
                <div className="flex items-center gap-2">
                  {/* Style Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="w-4 h-4" />
                        {filterStyle === "all" ? "All Styles" : filterStyle}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setFilterStyle("all")}>
                        All Styles
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {uniqueStyles.map((style) => (
                        <DropdownMenuItem
                          key={style}
                          onClick={() => setFilterStyle(style)}
                        >
                          {style}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Sort */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <SortAsc className="w-4 h-4" />
                        Sort
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setSortBy("date")}>
                        <Clock className="w-4 h-4 mr-2" />
                        Date
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("style")}>
                        <Layers className="w-4 h-4 mr-2" />
                        Style
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("score")}>
                        <Compass className="w-4 h-4 mr-2" />
                        Vastu Score
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* View Mode */}
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="sm"
                      className="rounded-r-none"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      className="rounded-l-none"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Renders Tab */}
            <TabsContent value="renders" className="mt-0">
              <AnimatePresence mode="wait">
                {filteredRenders.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                      <ImageIcon className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No renders yet</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      Start by uploading an image and generating your first AI-powered
                      design transformation.
                    </p>
                    <Link href={`/editor/${projectId}`}>
                      <Button className="gap-2">
                        <Sparkles className="w-4 h-4" />
                        Create First Render
                      </Button>
                    </Link>
                  </motion.div>
                ) : viewMode === "grid" ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {filteredRenders.map((render, index) => (
                      <RenderCard
                        key={render.id}
                        render={render}
                        index={index}
                        onView={() => {
                          setSelectedRender(render);
                          setIsCompareOpen(true);
                        }}
                        onDownload={() => handleDownloadRender(render)}
                        onFavorite={() => handleRenderFavorite(render.id)}
                        onEdit={() => router.push(`/editor/${projectId}?render=${render.id}`)}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {filteredRenders.map((render, index) => (
                      <RenderListItem
                        key={render.id}
                        render={render}
                        index={index}
                        onView={() => {
                          setSelectedRender(render);
                          setIsCompareOpen(true);
                        }}
                        onDownload={() => handleDownloadRender(render)}
                        onFavorite={() => handleRenderFavorite(render.id)}
                        onEdit={() => router.push(`/editor/${projectId}?render=${render.id}`)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* Vastu Tab */}
            <TabsContent value="vastu" className="mt-0">
              <VastuAnalysisPanel analysis={project.vastuAnalysis} />
            </TabsContent>

            {/* Cost Tab */}
            <TabsContent value="cost" className="mt-0">
              <CostEstimatePanel estimate={project.costEstimate} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Compare Dialog */}
        <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Before / After Comparison</DialogTitle>
              <DialogDescription>
                Slide to compare the original and transformed images
              </DialogDescription>
            </DialogHeader>
            {selectedRender && (
              <div className="space-y-4">
                <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
                  <CompareSlider
                    beforeImage={selectedRender.originalImage}
                    afterImage={selectedRender.generatedImage}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge>{selectedRender.style}</Badge>
                    {selectedRender.vastuScore && (
                      <div className="flex items-center gap-1 text-sm">
                        <Compass className="w-4 h-4 text-green-500" />
                        <span>Vastu Score: {selectedRender.vastuScore}/100</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadRender(selectedRender)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsCompareOpen(false);
                        router.push(`/editor/${projectId}?render=${selectedRender.id}`);
                      }}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update your project name and description
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter project name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  placeholder="Enter project description"
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All renders and data associated with this
                project will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Project
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Export Dialog */}
        <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Project</DialogTitle>
              <DialogDescription>
                Choose what to export from this project
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={handleExportAll}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Download className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">All Renders (ZIP)</p>
                    <p className="text-sm text-muted-foreground">
                      Download all {project.renders.length} renders in a ZIP file
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">PDF Report</p>
                    <p className="text-sm text-muted-foreground">
                      Generate a detailed project report with Vastu & cost analysis
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Compass className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Vastu Report</p>
                    <p className="text-sm text-muted-foreground">
                      Download detailed Vastu analysis and recommendations
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

// Render Card Component
function RenderCard({
  render,
  index,
  onView,
  onDownload,
  onFavorite,
  onEdit,
}: {
  render: Render;
  index: number;
  onView: () => void;
  onDownload: () => void;
  onFavorite: () => void;
  onEdit: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={render.generatedImage || "/images/placeholder.jpg"}
            alt={render.style}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Top Actions */}
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="icon"
              className="w-8 h-8 bg-background/80 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                onFavorite();
              }}
            >
              <Heart
                className={cn(
                  "w-4 h-4",
                  render.isFavorite && "fill-red-500 text-red-500"
                )}
              />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="w-8 h-8 bg-background/80 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {/* Vastu Score Badge */}
          {render.vastuScore && (
            <div className="absolute top-2 left-2">
              <Badge
                className={cn(
                  "gap-1",
                  render.vastuScore >= 80
                    ? "bg-green-500"
                    : render.vastuScore >= 60
                    ? "bg-yellow-500"
                    : "bg-red-500"
                )}
              >
                <Compass className="w-3 h-3" />
                {render.vastuScore}
              </Badge>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="sm"
              className="bg-background/80 backdrop-blur-sm"
              onClick={onView}
            >
              <Eye className="w-4 h-4 mr-1" />
              Compare
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-background/80 backdrop-blur-sm"
              onClick={onEdit}
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{render.style}</p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(render.createdAt, { addSuffix: true })}
              </p>
            </div>
            {render.estimatedCost && (
              <div className="text-right">
                <p className="text-sm font-medium">
                  ₹{(render.estimatedCost.inr / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-muted-foreground">Est. Cost</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Render List Item Component
function RenderListItem({
  render,
  index,
  onView,
  onDownload,
  onFavorite,
  onEdit,
}: {
  render: Render;
  index: number;
  onView: () => void;
  onDownload: () => void;
  onFavorite: () => void;
  onEdit: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="group hover:shadow-md transition-shadow">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="relative w-32 h-24 rounded-lg overflow-hidden shrink-0">
            <Image
              src={render.generatedImage || "/images/placeholder.jpg"}
              alt={render.style}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{render.style}</p>
              <Badge variant="outline" className="shrink-0">
                {render.mode}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {render.roomType} • {formatDistanceToNow(render.createdAt, { addSuffix: true })}
            </p>
            <div className="flex items-center gap-4 mt-2">
              {render.vastuScore && (
                <div className="flex items-center gap-1 text-sm">
                  <Compass
                    className={cn(
                      "w-4 h-4",
                      render.vastuScore >= 80
                        ? "text-green-500"
                        : render.vastuScore >= 60
                        ? "text-yellow-500"
                        : "text-red-500"
                    )}
                  />
                  <span>{render.vastuScore}/100</span>
                </div>
              )}
              {render.estimatedCost && (
                <div className="flex items-center gap-1 text-sm">
                  <IndianRupee className="w-4 h-4 text-amber-500" />
                  <span>₹{(render.estimatedCost.inr / 1000).toFixed(0)}K</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" onClick={onFavorite}>
              <Heart
                className={cn(
                  "w-4 h-4",
                  render.isFavorite && "fill-red-500 text-red-500"
                )}
              />
            </Button>
            <Button variant="ghost" size="icon" onClick={onView}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDownload}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit3 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Vastu Analysis Panel
function VastuAnalysisPanel({
  analysis,
}: {
  analysis?: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
}) {
  if (!analysis) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
          <Compass className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Vastu Analysis Available</h3>
        <p className="text-muted-foreground mb-4">
          Generate a render to get Vastu Shastra analysis and recommendations.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Score Card */}
      <Card className="lg:row-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="w-5 h-5" />
            Vastu Score
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="relative w-48 h-48 mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={553}
                strokeDashoffset={553 - (553 * analysis.score) / 100}
                className={cn(
                  "transition-all duration-1000",
                  analysis.score >= 80
                    ? "text-green-500"
                    : analysis.score >= 60
                    ? "text-yellow-500"
                    : "text-red-500"
                )}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold">{analysis.score}</span>
              <span className="text-muted-foreground">/100</span>
            </div>
          </div>

          <Badge
            className={cn(
              "text-lg px-4 py-2",
              analysis.score >= 80
                ? "bg-green-500"
                : analysis.score >= 60
                ? "bg-yellow-500"
                : "bg-red-500"
            )}
          >
            {analysis.score >= 80
              ? "Excellent"
              : analysis.score >= 60
              ? "Good"
              : "Needs Improvement"}
          </Badge>
        </CardContent>
      </Card>

      {/* Issues */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-5 h-5" />
            Issues Found ({analysis.issues.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {analysis.issues.map((issue, index) => (
              <li
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Suggestions */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-500">
            <CheckCircle2 className="w-5 h-5" />
            Suggestions ({analysis.suggestions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {analysis.suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
              >
                <Zap className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// Cost Estimate Panel
function CostEstimatePanel({
  estimate,
}: {
  estimate?: {
    total: { inr: number; usd: number };
    breakdown: {
      materials: { inr: number; usd: number };
      labor: { inr: number; usd: number };
      tax: { inr: number; usd: number };
    };
  };
}) {
  const [currency, setCurrency] = useState<"inr" | "usd">("inr");

  if (!estimate) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
          <IndianRupee className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Cost Estimate Available</h3>
        <p className="text-muted-foreground mb-4">
          Generate a render to get detailed renovation cost estimates.
        </p>
      </Card>
    );
  }

  const formatCurrency = (amount: { inr: number; usd: number }) => {
    if (currency === "inr") {
      return `₹${(amount.inr / 100000).toFixed(2)}L`;
    }
    return `$${amount.usd.toLocaleString()}`;
  };

  const categories = [
    {
      name: "Materials",
      amount: estimate.breakdown.materials,
      percentage: (estimate.breakdown.materials.inr / estimate.total.inr) * 100,
      color: "bg-blue-500",
    },
    {
      name: "Labor",
      amount: estimate.breakdown.labor,
      percentage: (estimate.breakdown.labor.inr / estimate.total.inr) * 100,
      color: "bg-green-500",
    },
    {
      name: "Tax & Fees",
      amount: estimate.breakdown.tax,
      percentage: (estimate.breakdown.tax.inr / estimate.total.inr) * 100,
      color: "bg-amber-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Currency Toggle */}
      <div className="flex justify-end">
        <div className="flex items-center border rounded-lg p-1">
          <Button
            variant={currency === "inr" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setCurrency("inr")}
            className="gap-1"
          >
            <IndianRupee className="w-4 h-4" />
            INR
          </Button>
          <Button
            variant={currency === "usd" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setCurrency("usd")}
          >
            $ USD
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Total Estimated Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">
              {formatCurrency(estimate.total)}
            </div>
            <p className="text-muted-foreground">
              {currency === "inr"
                ? `~$${estimate.total.usd.toLocaleString()} USD`
                : `~₹${(estimate.total.inr / 100000).toFixed(2)} Lakhs`}
            </p>
          </CardContent>
        </Card>

        {/* Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.map((category) => (
              <div key={category.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{category.name}</span>
                  <span>{formatCurrency(category.amount)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", category.color)}
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cost Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  {categories.reduce(
                    (acc, category, index) => {
                      const startAngle = acc.offset;
                      const angle = (category.percentage / 100) * 360;
                      const x1 = 96 + 80 * Math.cos((startAngle * Math.PI) / 180);
                      const y1 = 96 + 80 * Math.sin((startAngle * Math.PI) / 180);
                      const x2 = 96 + 80 * Math.cos(((startAngle + angle) * Math.PI) / 180);
                      const y2 = 96 + 80 * Math.sin(((startAngle + angle) * Math.PI) / 180);
                      const largeArc = angle > 180 ? 1 : 0;

                      acc.paths.push(
                        <path
                          key={index}
                          d={`M 96 96 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          className={category.color.replace("bg-", "fill-")}
                        />
                      );
                      acc.offset += angle;
                      return acc;
                    },
                    { paths: [] as JSX.Element[], offset: 0 }
                  ).paths}
                </svg>
              </div>

              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category.name} className="flex items-center gap-3">
                    <div className={cn("w-4 h-4 rounded", category.color)} />
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {category.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Download Report */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">Download Detailed Cost Report</p>
              <p className="text-sm text-muted-foreground">
                Get itemized breakdown with material specifications and vendor quotes
              </p>
            </div>
          </div>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading Skeleton
function ProjectDetailSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-start gap-4">
            <Skeleton className="w-10 h-10 rounded-md" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
              <div className="flex items-center gap-3 mt-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>

        <Skeleton className="h-10 w-80 mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}