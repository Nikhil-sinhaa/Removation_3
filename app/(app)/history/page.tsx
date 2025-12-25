// app/(app)/history/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Search,
  Filter,
  Grid3X3,
  List,
  Calendar as CalendarIcon,
  Download,
  Trash2,
  Star,
  StarOff,
  MoreHorizontal,
  Eye,
  Copy,
  Share2,
  Loader2,
  Image as ImageIcon,
  Clock,
  Sparkles,
  ArrowUpDown,
  ChevronDown,
  X,
  Check,
  AlertTriangle,
  Undo2,
  RefreshCw,
  FileImage,
  Palette,
  Home,
  Building2,
  Sofa,
  ChefHat,
  Bath,
  BedDouble,
  TreePine,
  IndianRupee,
  Compass,
  Wand2,
  Eraser,
  PaintBucket,
  Maximize,
  Replace,
  SunMoon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar  } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import  CompareSlider  from "@/components/editor/CompareSlider";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";

// Render types with icons
const renderTypes = [
  { id: "all", label: "All Types", labelHi: "सभी प्रकार", icon: Grid3X3 },
  { id: "redesign", label: "Redesign", labelHi: "रीडिज़ाइन", icon: Wand2 },
  { id: "fill-room", label: "Fill Room", labelHi: "कमरा भरें", icon: PaintBucket },
  { id: "inpaint", label: "Inpaint", labelHi: "इनपेंट", icon: Eraser },
  { id: "enhance", label: "Enhance", labelHi: "एन्हांस", icon: Maximize },
  { id: "replace", label: "Replace", labelHi: "बदलें", icon: Replace },
  { id: "outdoor", label: "Outdoor", labelHi: "आउटडोर", icon: TreePine },
  { id: "sketch", label: "Sketch to Render", labelHi: "स्केच से रेंडर", icon: FileImage },
  { id: "day-to-night", label: "Day to Night", labelHi: "दिन से रात", icon: SunMoon },
];

// Room types with icons
const roomTypes = [
  { id: "all", label: "All Rooms", labelHi: "सभी कमरे", icon: Home },
  { id: "living-room", label: "Living Room", labelHi: "लिविंग रूम", icon: Sofa },
  { id: "bedroom", label: "Bedroom", labelHi: "बेडरूम", icon: BedDouble },
  { id: "kitchen", label: "Kitchen", labelHi: "किचन", icon: ChefHat },
  { id: "bathroom", label: "Bathroom", labelHi: "बाथरूम", icon: Bath },
  { id: "office", label: "Office", labelHi: "ऑफिस", icon: Building2 },
  { id: "outdoor", label: "Outdoor", labelHi: "आउटडोर", icon: TreePine },
];

// Sort options
const sortOptions = [
  { value: "newest", label: "Newest First", labelHi: "नवीनतम पहले" },
  { value: "oldest", label: "Oldest First", labelHi: "सबसे पुराना पहले" },
  { value: "name", label: "By Name", labelHi: "नाम के अनुसार" },
  { value: "style", label: "By Style", labelHi: "स्टाइल के अनुसार" },
];

// Date filter presets
const datePresets = [
  { label: "Today", labelHi: "आज", days: 0 },
  { label: "Last 7 days", labelHi: "पिछले 7 दिन", days: 7 },
  { label: "Last 30 days", labelHi: "पिछले 30 दिन", days: 30 },
  { label: "Last 90 days", labelHi: "पिछले 90 दिन", days: 90 },
  { label: "All time", labelHi: "सभी समय", days: -1 },
];

// Mock render history data
const mockRenders = [
  {
    id: "render-1",
    projectId: "proj-1",
    projectName: "Modern Living Room",
    originalImage: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    renderedImage: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800",
    type: "redesign",
    style: "Modern Minimalist",
    roomType: "living-room",
    createdAt: new Date().toISOString(),
    isFavorite: true,
    hasVastu: true,
    vastuScore: 85,
    hasCost: true,
    estimatedCost: 450000,
    status: "completed",
  },
  {
    id: "render-2",
    projectId: "proj-1",
    projectName: "Modern Living Room",
    originalImage: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    renderedImage: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800",
    type: "redesign",
    style: "Scandinavian",
    roomType: "living-room",
    createdAt: subDays(new Date(), 1).toISOString(),
    isFavorite: false,
    hasVastu: true,
    vastuScore: 72,
    hasCost: true,
    estimatedCost: 380000,
    status: "completed",
  },
  {
    id: "render-3",
    projectId: "proj-2",
    projectName: "Master Bedroom",
    originalImage: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
    renderedImage: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800",
    type: "fill-room",
    style: "Contemporary",
    roomType: "bedroom",
    createdAt: subDays(new Date(), 2).toISOString(),
    isFavorite: true,
    hasVastu: true,
    vastuScore: 91,
    hasCost: true,
    estimatedCost: 520000,
    status: "completed",
  },
  {
    id: "render-4",
    projectId: "proj-3",
    projectName: "Kitchen Renovation",
    originalImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
    renderedImage: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800",
    type: "redesign",
    style: "Industrial",
    roomType: "kitchen",
    createdAt: subDays(new Date(), 5).toISOString(),
    isFavorite: false,
    hasVastu: false,
    vastuScore: null,
    hasCost: true,
    estimatedCost: 680000,
    status: "completed",
  },
  {
    id: "render-5",
    projectId: "proj-4",
    projectName: "Bathroom Update",
    originalImage: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800",
    renderedImage: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800",
    type: "enhance",
    style: "Luxury Spa",
    roomType: "bathroom",
    createdAt: subDays(new Date(), 7).toISOString(),
    isFavorite: false,
    hasVastu: true,
    vastuScore: 78,
    hasCost: true,
    estimatedCost: 290000,
    status: "completed",
  },
  {
    id: "render-6",
    projectId: "proj-5",
    projectName: "Garden Design",
    originalImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    renderedImage: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800",
    type: "outdoor",
    style: "Tropical Paradise",
    roomType: "outdoor",
    createdAt: subDays(new Date(), 14).toISOString(),
    isFavorite: true,
    hasVastu: true,
    vastuScore: 95,
    hasCost: true,
    estimatedCost: 850000,
    status: "completed",
  },
  {
    id: "render-7",
    projectId: "proj-6",
    projectName: "Office Space",
    originalImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
    renderedImage: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800",
    type: "inpaint",
    style: "Modern Office",
    roomType: "office",
    createdAt: subDays(new Date(), 21).toISOString(),
    isFavorite: false,
    hasVastu: false,
    vastuScore: null,
    hasCost: false,
    estimatedCost: null,
    status: "completed",
  },
  {
    id: "render-8",
    projectId: "proj-7",
    projectName: "Night View",
    originalImage: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    renderedImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
    type: "day-to-night",
    style: "Ambient Lighting",
    roomType: "living-room",
    createdAt: subDays(new Date(), 30).toISOString(),
    isFavorite: false,
    hasVastu: true,
    vastuScore: 82,
    hasCost: true,
    estimatedCost: 195000,
    status: "completed",
  },
];

// Render card component
interface RenderCardProps {
  render: typeof mockRenders[0];
  isSelected: boolean;
  onSelect: (id: string) => void;
  onView: (render: typeof mockRenders[0]) => void;
  onFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  viewMode: "grid" | "list";
  language: string;
}

function RenderCard({
  render,
  isSelected,
  onSelect,
  onView,
  onFavorite,
  onDelete,
  viewMode,
  language,
}: RenderCardProps) {
  const router = useRouter();
  const typeInfo = renderTypes.find((t) => t.id === render.type);
  const roomInfo = roomTypes.find((r) => r.id === render.roomType);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return language === "hi" ? "अभी" : "Just now";
    if (diffMins < 60) return language === "hi" ? `${diffMins} मिनट पहले` : `${diffMins}m ago`;
    if (diffHours < 24) return language === "hi" ? `${diffHours} घंटे पहले` : `${diffHours}h ago`;
    if (diffDays < 7) return language === "hi" ? `${diffDays} दिन पहले` : `${diffDays}d ago`;
    return format(date, "MMM d, yyyy");
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${(amount / 1000).toFixed(0)}K`;
  };

  if (viewMode === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "flex items-center gap-4 p-4 bg-card border rounded-lg hover:shadow-md transition-all group",
          isSelected && "ring-2 ring-primary"
        )}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(render.id)}
        />

        {/* Thumbnail */}
        <div
          className="relative w-24 h-16 rounded-md overflow-hidden cursor-pointer flex-shrink-0"
          onClick={() => onView(render)}
        >
          <img
            src={render.renderedImage}
            alt={render.projectName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Eye className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{render.projectName}</h3>
            {render.isFavorite && (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              {typeInfo && <typeInfo.icon className="h-3 w-3" />}
              {language === "hi" ? typeInfo?.labelHi : typeInfo?.label}
            </span>
            <span>•</span>
            <span>{render.style}</span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {render.hasVastu && render.vastuScore && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                render.vastuScore >= 80
                  ? "border-green-500 text-green-600"
                  : render.vastuScore >= 60
                  ? "border-yellow-500 text-yellow-600"
                  : "border-red-500 text-red-600"
              )}
            >
              <Compass className="h-3 w-3 mr-1" />
              {render.vastuScore}
            </Badge>
          )}
          {render.hasCost && render.estimatedCost && (
            <Badge variant="outline" className="text-xs">
              <IndianRupee className="h-3 w-3 mr-0.5" />
              {formatCurrency(render.estimatedCost)}
            </Badge>
          )}
        </div>

        {/* Time */}
        <div className="text-sm text-muted-foreground flex-shrink-0 w-24 text-right">
          {formatDate(render.createdAt)}
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(render)}>
              <Eye className="h-4 w-4 mr-2" />
              {language === "hi" ? "देखें" : "View"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/editor/${render.projectId}`)}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              {language === "hi" ? "एडिट करें" : "Edit"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFavorite(render.id)}>
              {render.isFavorite ? (
                <>
                  <StarOff className="h-4 w-4 mr-2" />
                  {language === "hi" ? "फेवरेट हटाएं" : "Remove from Favorites"}
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  {language === "hi" ? "फेवरेट करें" : "Add to Favorites"}
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              {language === "hi" ? "डाउनलोड" : "Download"}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 className="h-4 w-4 mr-2" />
              {language === "hi" ? "शेयर करें" : "Share"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(render.id)}
              className="text-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {language === "hi" ? "हटाएं" : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group relative bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all",
        isSelected && "ring-2 ring-primary"
      )}
    >
      {/* Selection checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(render.id)}
          className="bg-white/90 border-white"
        />
      </div>

      {/* Favorite button */}
      <button
        onClick={() => onFavorite(render.id)}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors"
      >
        <Star
          className={cn(
            "h-4 w-4 transition-colors",
            render.isFavorite
              ? "text-yellow-500 fill-yellow-500"
              : "text-gray-400 hover:text-yellow-500"
          )}
        />
      </button>

      {/* Image */}
      <div
        className="aspect-[4/3] relative cursor-pointer overflow-hidden"
        onClick={() => onView(render)}
      >
        <img
          src={render.renderedImage}
          alt={render.projectName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
            <Eye className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Type badge */}
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-black/60 text-white border-0">
            {typeInfo && <typeInfo.icon className="h-3 w-3 mr-1" />}
            {language === "hi" ? typeInfo?.labelHi : typeInfo?.label}
          </Badge>
        </div>

        {/* Scores */}
        <div className="absolute bottom-3 right-3 flex gap-2">
          {render.hasVastu && render.vastuScore && (
            <Badge
              className={cn(
                "border-0",
                render.vastuScore >= 80
                  ? "bg-green-500"
                  : render.vastuScore >= 60
                  ? "bg-yellow-500"
                  : "bg-red-500"
              )}
            >
              <Compass className="h-3 w-3 mr-1" />
              {render.vastuScore}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{render.projectName}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {render.style}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(render)}>
                <Eye className="h-4 w-4 mr-2" />
                {language === "hi" ? "देखें" : "View"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/editor/${render.projectId}`)}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {language === "hi" ? "एडिट करें" : "Edit"}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                {language === "hi" ? "डाउनलोड" : "Download"}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                {language === "hi" ? "कॉपी करें" : "Copy Link"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(render.id)}
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {language === "hi" ? "हटाएं" : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDate(render.createdAt)}
          </div>
          {render.hasCost && render.estimatedCost && (
            <Badge variant="secondary" className="text-xs">
              {formatCurrency(render.estimatedCost)}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const { language } = useLanguage();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [renders, setRenders] = useState<typeof mockRenders>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRenderType, setSelectedRenderType] = useState("all");
  const [selectedRoomType, setSelectedRoomType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [selectedPreset, setSelectedPreset] = useState(-1); // -1 = all time
  const [selectedRenders, setSelectedRenders] = useState<string[]>([]);
  const [viewingRender, setViewingRender] = useState<typeof mockRenders[0] | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // Load renders
  useEffect(() => {
    const loadRenders = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setRenders(mockRenders);
      setIsLoading(false);
    };
    loadRenders();
  }, []);

  // Filter and sort renders
  const filteredRenders = useMemo(() => {
    let result = [...renders];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.projectName.toLowerCase().includes(query) ||
          r.style.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (selectedRenderType !== "all") {
      result = result.filter((r) => r.type === selectedRenderType);
    }

    // Room filter
    if (selectedRoomType !== "all") {
      result = result.filter((r) => r.roomType === selectedRoomType);
    }

    // Date filter
    if (dateRange.from || selectedPreset >= 0) {
      const from = dateRange.from || (selectedPreset >= 0 ? subDays(new Date(), selectedPreset) : undefined);
      const to = dateRange.to || new Date();

      if (from) {
        result = result.filter((r) =>
          isWithinInterval(new Date(r.createdAt), {
            start: startOfDay(from),
            end: endOfDay(to),
          })
        );
      }
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name":
          return a.projectName.localeCompare(b.projectName);
        case "style":
          return a.style.localeCompare(b.style);
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [renders, searchQuery, selectedRenderType, selectedRoomType, sortBy, dateRange, selectedPreset]);

  // Handlers
  const handleSelectRender = (id: string) => {
    setSelectedRenders((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRenders.length === filteredRenders.length) {
      setSelectedRenders([]);
    } else {
      setSelectedRenders(filteredRenders.map((r) => r.id));
    }
  };

  const handleFavorite = (id: string) => {
    setRenders((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, isFavorite: !r.isFavorite } : r
      )
    );
    toast({
      title: language === "hi" ? "अपडेट किया गया" : "Updated",
      description: language === "hi" ? "फेवरेट अपडेट हो गया।" : "Favorite updated.",
    });
  };

  const handleDelete = (id: string) => {
    setRenders((prev) => prev.filter((r) => r.id !== id));
    setSelectedRenders((prev) => prev.filter((r) => r !== id));
    setDeleteConfirm(null);
    toast({
      title: language === "hi" ? "हटा दिया गया" : "Deleted",
      description: language === "hi" ? "रेंडर हटा दिया गया।" : "Render has been deleted.",
    });
  };

  const handleBulkDelete = () => {
    setRenders((prev) => prev.filter((r) => !selectedRenders.includes(r.id)));
    setSelectedRenders([]);
    setBulkDeleteConfirm(false);
    toast({
      title: language === "hi" ? "हटा दिया गया" : "Deleted",
      description: language === "hi"
        ? `${selectedRenders.length} रेंडर हटा दिए गए।`
        : `${selectedRenders.length} renders have been deleted.`,
    });
  };

  const handleBulkDownload = () => {
    toast({
      title: language === "hi" ? "डाउनलोड शुरू" : "Download Started",
      description: language === "hi"
        ? `${selectedRenders.length} रेंडर डाउनलोड हो रहे हैं।`
        : `Downloading ${selectedRenders.length} renders.`,
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRenderType("all");
    setSelectedRoomType("all");
    setDateRange({ from: undefined, to: undefined });
    setSelectedPreset(-1);
  };

  const hasActiveFilters =
    searchQuery ||
    selectedRenderType !== "all" ||
    selectedRoomType !== "all" ||
    dateRange.from ||
    selectedPreset >= 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <History className="h-6 w-6 text-primary" />
                {language === "hi" ? "हिस्ट्री" : "History"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === "hi"
                  ? `${filteredRenders.length} रेंडर${selectedRenders.length > 0 ? ` • ${selectedRenders.length} चुने गए` : ""}`
                  : `${filteredRenders.length} renders${selectedRenders.length > 0 ? ` • ${selectedRenders.length} selected` : ""}`}
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === "hi" ? "रेंडर खोजें..." : "Search renders..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Render Type Filter */}
          <Select value={selectedRenderType} onValueChange={setSelectedRenderType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={language === "hi" ? "प्रकार" : "Type"} />
            </SelectTrigger>
            <SelectContent>
              {renderTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4" />
                    {language === "hi" ? type.labelHi : type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Room Type Filter */}
          <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={language === "hi" ? "कमरा" : "Room"} />
            </SelectTrigger>
            <SelectContent>
              {roomTypes.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  <div className="flex items-center gap-2">
                    <room.icon className="h-4 w-4" />
                    {language === "hi" ? room.labelHi : room.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
               <CalendarIcon className="h-4 w-4" /> 
                {dateRange.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                  ) : (
                    format(dateRange.from, "MMM d, yyyy")
                  )
                ) : selectedPreset >= 0 ? (
                  datePresets.find((p) => p.days === selectedPreset)?.[
                    language === "hi" ? "labelHi" : "label"
                  ]
                ) : (
                  language === "hi" ? "तारीख" : "Date"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b">
                <div className="flex flex-wrap gap-2">
                  {datePresets.map((preset) => (
                    <Button
                      key={preset.days}
                      variant={selectedPreset === preset.days ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedPreset(preset.days);
                        setDateRange({ from: undefined, to: undefined });
                      }}
                    >
                      {language === "hi" ? preset.labelHi : preset.label}
                    </Button>
                  ))}
                </div>
              </div>
                <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                    setDateRange({ from: range?.from, to: range?.to });
                    setSelectedPreset(-1);
                }}
                numberOfMonths={2}
                />
            </PopoverContent>
          </Popover>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {language === "hi" ? option.labelHi : option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              {language === "hi" ? "फ़िल्टर हटाएं" : "Clear"}
            </Button>
          )}
        </div>

        {/* Bulk Actions */}
        <AnimatePresence>
          {selectedRenders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center gap-3 p-4 mb-6 bg-primary/10 border border-primary/20 rounded-lg"
            >
              <Checkbox
                checked={selectedRenders.length === filteredRenders.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="font-medium">
                {selectedRenders.length} {language === "hi" ? "चुने गए" : "selected"}
              </span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={handleBulkDownload}>
                <Download className="h-4 w-4 mr-2" />
                {language === "hi" ? "डाउनलोड" : "Download"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-600"
                onClick={() => setBulkDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {language === "hi" ? "हटाएं" : "Delete"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRenders([])}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Renders Grid/List */}
        {isLoading ? (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            )}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton
                key={i}
                className={cn(
                  viewMode === "grid" ? "aspect-[4/3] rounded-xl" : "h-20 rounded-lg"
                )}
              />
            ))}
          </div>
        ) : filteredRenders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="p-6 rounded-full bg-muted mb-6">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {hasActiveFilters
                ? language === "hi"
                  ? "कोई रेंडर नहीं मिला"
                  : "No renders found"
                : language === "hi"
                ? "अभी तक कोई रेंडर नहीं"
                : "No renders yet"}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              {hasActiveFilters
                ? language === "hi"
                  ? "अपने फ़िल्टर बदलकर देखें।"
                  : "Try adjusting your filters."
                : language === "hi"
                ? "अपना पहला डिज़ाइन बनाएं और यहां देखें।"
                : "Create your first design to see it here."}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {language === "hi" ? "फ़िल्टर हटाएं" : "Clear Filters"}
              </Button>
            ) : (
              <Button onClick={() => router.push("/editor")}>
                <Sparkles className="h-4 w-4 mr-2" />
                {language === "hi" ? "नया डिज़ाइन बनाएं" : "Create New Design"}
              </Button>
            )}
          </motion.div>
        ) : (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            )}
          >
            <AnimatePresence mode="popLayout">
              {filteredRenders.map((render) => (
                <RenderCard
                  key={render.id}
                  render={render}
                  isSelected={selectedRenders.includes(render.id)}
                  onSelect={handleSelectRender}
                  onView={setViewingRender}
                  onFavorite={handleFavorite}
                  onDelete={(id) => setDeleteConfirm(id)}
                  viewMode={viewMode}
                  language={language}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* View Render Dialog */}
      <Dialog open={!!viewingRender} onOpenChange={() => setViewingRender(null)}>
        <DialogContent className="max-w-4xl">
          {viewingRender && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingRender.projectName}</DialogTitle>
                <DialogDescription>
                  {viewingRender.style} • {format(new Date(viewingRender.createdAt), "PPP")}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <CompareSlider
                  beforeImage={viewingRender.originalImage}
                  afterImage={viewingRender.renderedImage}
                  beforeLabel={language === "hi" ? "पहले" : "Before"}
                  afterLabel={language === "hi" ? "बाद में" : "After"}
                />
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  {viewingRender.hasVastu && viewingRender.vastuScore && (
                    <Badge
                      variant="outline"
                      className={cn(
                        viewingRender.vastuScore >= 80
                          ? "border-green-500 text-green-600"
                          : viewingRender.vastuScore >= 60
                          ? "border-yellow-500 text-yellow-600"
                          : "border-red-500 text-red-600"
                      )}
                    >
                      <Compass className="h-4 w-4 mr-1" />
                      Vastu Score: {viewingRender.vastuScore}
                    </Badge>
                  )}
                  {viewingRender.hasCost && viewingRender.estimatedCost && (
                    <Badge variant="outline">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      Est. ₹{viewingRender.estimatedCost.toLocaleString()}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    {language === "hi" ? "डाउनलोड" : "Download"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setViewingRender(null);
                      router.push(`/editor/${viewingRender.projectId}`);
                    }}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    {language === "hi" ? "एडिट करें" : "Edit"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "hi" ? "रेंडर हटाएं?" : "Delete Render?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "hi"
                ? "यह कार्रवाई पूर्ववत नहीं की जा सकती।"
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "hi" ? "रद्द करें" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-500 hover:bg-red-600"
            >
              {language === "hi" ? "हटाएं" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "hi"
                ? `${selectedRenders.length} रेंडर हटाएं?`
                : `Delete ${selectedRenders.length} renders?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "hi"
                ? "यह कार्रवाई पूर्ववत नहीं की जा सकती।"
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "hi" ? "रद्द करें" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {language === "hi" ? "हटाएं" : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}