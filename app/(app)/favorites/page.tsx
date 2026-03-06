// app/(app)/favorites/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Search,
  Grid3X3,
  List,
  Download,
  Trash2,
  MoreHorizontal,
  Eye,
  Copy,
  Share2,
  Loader2,
  Image as ImageIcon,
  Clock,
  Sparkles,
  ArrowUpDown,
  X,
  Heart,
  FolderHeart,
  StarOff,
  Wand2,
  Filter,
  SlidersHorizontal,
  Compass,
  IndianRupee,
  Folder,
  Plus,
  Tag,
  Edit2,
  Check,
  LayoutGrid,
  Rows3,
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import CompareSlider from "@/components/editor/CompareSlider";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

// Collection/folder type
interface Collection {
  id: string;
  name: string;
  nameHi?: string;
  color: string;
  count: number;
  createdAt: string;
}

// Favorite item type
interface FavoriteItem {
  id: string;
  type: "render" | "project";
  projectId: string;
  projectName: string;
  originalImage: string;
  renderedImage: string;
  style: string;
  roomType: string;
  favoritedAt: string;
  createdAt: string;
  hasVastu: boolean;
  vastuScore: number | null;
  hasCost: boolean;
  estimatedCost: number | null;
  collections: string[];
  tags: string[];
}

// Sort options
const sortOptions = [
  { value: "recent", label: "Recently Favorited", labelHi: "हाल ही में फेवरेट" },
  { value: "oldest", label: "Oldest First", labelHi: "सबसे पुराना पहले" },
  { value: "name", label: "By Name", labelHi: "नाम के अनुसार" },
  { value: "vastu", label: "By Vastu Score", labelHi: "वास्तु स्कोर के अनुसार" },
  { value: "cost", label: "By Cost", labelHi: "लागत के अनुसार" },
];

// Collection colors
const collectionColors = [
  { name: "Red", value: "bg-red-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Yellow", value: "bg-yellow-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Pink", value: "bg-pink-500" },
];

// Mock collections
const mockCollections: Collection[] = [
  {
    id: "col-1",
    name: "Living Room Ideas",
    nameHi: "लिविंग रूम आइडियाज",
    color: "bg-blue-500",
    count: 5,
    createdAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "col-2",
    name: "Master Bedroom",
    nameHi: "मास्टर बेडरूम",
    color: "bg-purple-500",
    count: 3,
    createdAt: "2025-01-10T10:00:00Z",
  },
  {
    id: "col-3",
    name: "Kitchen Renovation",
    nameHi: "किचन रेनोवेशन",
    color: "bg-orange-500",
    count: 4,
    createdAt: "2025-01-05T10:00:00Z",
  },
];

// Mock favorites data
const mockFavorites: FavoriteItem[] = [
  {
    id: "fav-1",
    type: "render",
    projectId: "proj-1",
    projectName: "Modern Living Room",
    originalImage: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    renderedImage: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800",
    style: "Modern Minimalist",
    roomType: "Living Room",
    favoritedAt: "2025-01-20T14:30:00Z",
    createdAt: "2025-01-18T10:00:00Z",
    hasVastu: true,
    vastuScore: 92,
    hasCost: true,
    estimatedCost: 450000,
    collections: ["col-1"],
    tags: ["minimal", "white", "spacious"],
  },
  {
    id: "fav-2",
    type: "render",
    projectId: "proj-2",
    projectName: "Cozy Bedroom",
    originalImage: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
    renderedImage: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800",
    style: "Scandinavian",
    roomType: "Bedroom",
    favoritedAt: "2025-01-19T10:00:00Z",
    createdAt: "2025-01-15T10:00:00Z",
    hasVastu: true,
    vastuScore: 88,
    hasCost: true,
    estimatedCost: 380000,
    collections: ["col-2"],
    tags: ["cozy", "warm", "neutral"],
  },
  {
    id: "fav-3",
    type: "render",
    projectId: "proj-3",
    projectName: "Luxury Kitchen",
    originalImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
    renderedImage: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800",
    style: "Contemporary",
    roomType: "Kitchen",
    favoritedAt: "2025-01-18T16:00:00Z",
    createdAt: "2025-01-12T10:00:00Z",
    hasVastu: true,
    vastuScore: 75,
    hasCost: true,
    estimatedCost: 720000,
    collections: ["col-3"],
    tags: ["luxury", "marble", "modern"],
  },
  {
    id: "fav-4",
    type: "render",
    projectId: "proj-4",
    projectName: "Zen Garden",
    originalImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    renderedImage: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800",
    style: "Japanese Zen",
    roomType: "Outdoor",
    favoritedAt: "2025-01-17T12:00:00Z",
    createdAt: "2025-01-10T10:00:00Z",
    hasVastu: true,
    vastuScore: 95,
    hasCost: true,
    estimatedCost: 550000,
    collections: [],
    tags: ["zen", "peaceful", "garden"],
  },
  {
    id: "fav-5",
    type: "render",
    projectId: "proj-1",
    projectName: "Modern Living Room",
    originalImage: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    renderedImage: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800",
    style: "Industrial",
    roomType: "Living Room",
    favoritedAt: "2025-01-16T09:00:00Z",
    createdAt: "2025-01-08T10:00:00Z",
    hasVastu: true,
    vastuScore: 68,
    hasCost: true,
    estimatedCost: 420000,
    collections: ["col-1"],
    tags: ["industrial", "raw", "urban"],
  },
  {
    id: "fav-6",
    type: "render",
    projectId: "proj-5",
    projectName: "Home Office",
    originalImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
    renderedImage: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800",
    style: "Modern Professional",
    roomType: "Office",
    favoritedAt: "2025-01-15T14:00:00Z",
    createdAt: "2025-01-05T10:00:00Z",
    hasVastu: true,
    vastuScore: 82,
    hasCost: true,
    estimatedCost: 280000,
    collections: [],
    tags: ["professional", "clean", "productive"],
  },
];

// Favorite Card Component
interface FavoriteCardProps {
  item: FavoriteItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onView: (item: FavoriteItem) => void;
  onUnfavorite: (id: string) => void;
  onAddToCollection: (id: string, collectionId: string) => void;
  collections: Collection[];
  viewMode: "grid" | "list";
  language: string;
}

function FavoriteCard({
  item,
  isSelected,
  onSelect,
  onView,
  onUnfavorite,
  onAddToCollection,
  collections,
  viewMode,
  language,
}: FavoriteCardProps) {
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${(amount / 1000).toFixed(0)}K`;
  };

  const itemCollections = collections.filter((c) =>
    item.collections.includes(c.id)
  );

  if (viewMode === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className={cn(
          "flex items-center gap-4 p-4 bg-card border rounded-lg hover:shadow-md transition-all group",
          isSelected && "ring-2 ring-primary"
        )}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(item.id)}
        />

        {/* Thumbnail */}
        <div
          className="relative w-20 h-14 rounded-md overflow-hidden cursor-pointer flex-shrink-0"
          onClick={() => onView(item)}
        >
          <img
            src={item.renderedImage}
            alt={item.projectName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Eye className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{item.projectName}</h3>
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
            <span>{item.style}</span>
            <span>•</span>
            <span>{item.roomType}</span>
          </div>
        </div>

        {/* Collections */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {itemCollections.slice(0, 2).map((col) => (
            <div
              key={col.id}
              className={cn("w-3 h-3 rounded-full", col.color)}
              title={language === "hi" ? col.nameHi : col.name}
            />
          ))}
          {itemCollections.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{itemCollections.length - 2}
            </span>
          )}
        </div>

        {/* Scores */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {item.hasVastu && item.vastuScore && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                item.vastuScore >= 80
                  ? "border-green-500 text-green-600"
                  : item.vastuScore >= 60
                    ? "border-yellow-500 text-yellow-600"
                    : "border-red-500 text-red-600"
              )}
            >
              {item.vastuScore}
            </Badge>
          )}
          {item.hasCost && item.estimatedCost && (
            <Badge variant="secondary" className="text-xs">
              {formatCurrency(item.estimatedCost)}
            </Badge>
          )}
        </div>

        {/* Time */}
        <div className="text-xs text-muted-foreground flex-shrink-0 w-20 text-right">
          {formatDistanceToNow(new Date(item.favoritedAt), { addSuffix: true })}
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(item)}>
              <Eye className="h-4 w-4 mr-2" />
              {language === "hi" ? "देखें" : "View"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/editor/${item.projectId}`)}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              {language === "hi" ? "एडिट करें" : "Edit"}
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Folder className="h-4 w-4 mr-2" />
                {language === "hi" ? "कलेक्शन में जोड़ें" : "Add to Collection"}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {collections.map((col) => (
                    <DropdownMenuItem
                      key={col.id}
                      onClick={() => onAddToCollection(item.id, col.id)}
                    >
                      <div className={cn("w-3 h-3 rounded-full mr-2", col.color)} />
                      {language === "hi" ? col.nameHi : col.name}
                      {item.collections.includes(col.id) && (
                        <Check className="h-4 w-4 ml-auto" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
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
              onClick={() => onUnfavorite(item.id)}
              className="text-red-500"
            >
              <StarOff className="h-4 w-4 mr-2" />
              {language === "hi" ? "फेवरेट हटाएं" : "Remove from Favorites"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    );
  }

  // Grid View
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
          onCheckedChange={() => onSelect(item.id)}
          className="bg-white/90 border-white"
        />
      </div>

      {/* Favorite indicator */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={() => onUnfavorite(item.id)}
          className="p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors group/star"
        >
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 group-hover/star:text-yellow-600" />
        </button>
      </div>

      {/* Collections indicators */}
      {itemCollections.length > 0 && (
        <div className="absolute top-3 left-12 z-10 flex gap-1">
          {itemCollections.slice(0, 3).map((col) => (
            <div
              key={col.id}
              className={cn("w-2.5 h-2.5 rounded-full ring-2 ring-white", col.color)}
            />
          ))}
        </div>
      )}

      {/* Image */}
      <div
        className="aspect-[4/3] relative cursor-pointer overflow-hidden"
        onClick={() => onView(item)}
      >
        <img
          src={item.renderedImage}
          alt={item.projectName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
            <Eye className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Vastu Score Badge */}
        {item.hasVastu && item.vastuScore && (
          <div className="absolute bottom-3 right-3">
            <Badge
              className={cn(
                "border-0",
                item.vastuScore >= 80
                  ? "bg-green-500"
                  : item.vastuScore >= 60
                    ? "bg-yellow-500"
                    : "bg-red-500"
              )}
            >
              <Compass className="h-3 w-3 mr-1" />
              {item.vastuScore}
            </Badge>
          </div>
        )}

        {/* Style badge */}
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-black/60 text-white border-0">{item.style}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{item.projectName}</h3>
            <p className="text-sm text-muted-foreground">{item.roomType}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(item)}>
                <Eye className="h-4 w-4 mr-2" />
                {language === "hi" ? "देखें" : "View"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/editor/${item.projectId}`)}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {language === "hi" ? "एडिट करें" : "Edit"}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                {language === "hi" ? "डाउनलोड" : "Download"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onUnfavorite(item.id)}
                className="text-red-500"
              >
                <StarOff className="h-4 w-4 mr-2" />
                {language === "hi" ? "फेवरेट हटाएं" : "Remove"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {item.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(item.favoritedAt), { addSuffix: true })}
          </div>
          {item.hasCost && item.estimatedCost && (
            <Badge variant="outline" className="text-xs">
              <IndianRupee className="h-3 w-3 mr-0.5" />
              {formatCurrency(item.estimatedCost)}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Collection Card Component
interface CollectionCardProps {
  collection: Collection;
  onSelect: (id: string) => void;
  onEdit: (collection: Collection) => void;
  onDelete: (id: string) => void;
  language: string;
}

function CollectionCard({
  collection,
  onSelect,
  onEdit,
  onDelete,
  language,
}: CollectionCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="relative bg-card border rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all group"
      onClick={() => onSelect(collection.id)}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-3 rounded-lg", collection.color)}>
          <FolderHeart className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">
            {language === "hi" ? collection.nameHi : collection.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {collection.count} {language === "hi" ? "आइटम" : "items"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(collection);
              }}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              {language === "hi" ? "एडिट करें" : "Edit"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(collection.id);
              }}
              className="text-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {language === "hi" ? "हटाएं" : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

export default function FavoritesPage() {
  const router = useRouter();
  const { language } = useLanguage();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedFavorites, setSelectedFavorites] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<FavoriteItem | null>(null);
  const [newCollectionDialog, setNewCollectionDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deleteCollectionConfirm, setDeleteCollectionConfirm] = useState<string | null>(null);

  // New collection form
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState("bg-blue-500");

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setFavorites(mockFavorites);
      setCollections(mockCollections);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Filter and sort favorites
  const filteredFavorites = useMemo(() => {
    let result = [...favorites];

    // Filter by collection
    if (selectedCollection) {
      result = result.filter((f) => f.collections.includes(selectedCollection));
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.projectName.toLowerCase().includes(query) ||
          f.style.toLowerCase().includes(query) ||
          f.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.favoritedAt).getTime() - new Date(b.favoritedAt).getTime();
        case "name":
          return a.projectName.localeCompare(b.projectName);
        case "vastu":
          return (b.vastuScore || 0) - (a.vastuScore || 0);
        case "cost":
          return (b.estimatedCost || 0) - (a.estimatedCost || 0);
        case "recent":
        default:
          return new Date(b.favoritedAt).getTime() - new Date(a.favoritedAt).getTime();
      }
    });

    return result;
  }, [favorites, selectedCollection, searchQuery, sortBy]);

  // Handlers
  const handleSelectFavorite = (id: string) => {
    setSelectedFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedFavorites.length === filteredFavorites.length) {
      setSelectedFavorites([]);
    } else {
      setSelectedFavorites(filteredFavorites.map((f) => f.id));
    }
  };

  const handleUnfavorite = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    setSelectedFavorites((prev) => prev.filter((f) => f !== id));
    toast({
      title: language === "hi" ? "फेवरेट हटाया गया" : "Removed from Favorites",
    });
  };

  const handleBulkUnfavorite = () => {
    setFavorites((prev) => prev.filter((f) => !selectedFavorites.includes(f.id)));
    setSelectedFavorites([]);
    toast({
      title: language === "hi" ? "फेवरेट हटाए गए" : "Removed from Favorites",
      description: `${selectedFavorites.length} ${language === "hi" ? "आइटम" : "items"}`,
    });
  };

  const handleAddToCollection = (itemId: string, collectionId: string) => {
    setFavorites((prev) =>
      prev.map((f) => {
        if (f.id === itemId) {
          const newCollections = f.collections.includes(collectionId)
            ? f.collections.filter((c) => c !== collectionId)
            : [...f.collections, collectionId];
          return { ...f, collections: newCollections };
        }
        return f;
      })
    );

    // Update collection count
    setCollections((prev) =>
      prev.map((c) => {
        if (c.id === collectionId) {
          const item = favorites.find((f) => f.id === itemId);
          const wasInCollection = item?.collections.includes(collectionId);
          return { ...c, count: wasInCollection ? c.count - 1 : c.count + 1 };
        }
        return c;
      })
    );

    toast({
      title: language === "hi" ? "कलेक्शन अपडेट" : "Collection Updated",
    });
  };

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;

    const newCollection: Collection = {
      id: `col-${Date.now()}`,
      name: newCollectionName,
      color: newCollectionColor,
      count: 0,
      createdAt: new Date().toISOString(),
    };

    setCollections((prev) => [...prev, newCollection]);
    setNewCollectionName("");
    setNewCollectionColor("bg-blue-500");
    setNewCollectionDialog(false);

    toast({
      title: language === "hi" ? "कलेक्शन बनाया गया" : "Collection Created",
      description: newCollectionName,
    });
  };

  const handleUpdateCollection = () => {
    if (!editingCollection || !newCollectionName.trim()) return;

    setCollections((prev) =>
      prev.map((c) =>
        c.id === editingCollection.id
          ? { ...c, name: newCollectionName, color: newCollectionColor }
          : c
      )
    );

    setNewCollectionName("");
    setNewCollectionColor("bg-blue-500");
    setEditingCollection(null);

    toast({
      title: language === "hi" ? "कलेक्शन अपडेट" : "Collection Updated",
    });
  };

  const handleDeleteCollection = (id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id));
    // Remove collection from all favorites
    setFavorites((prev) =>
      prev.map((f) => ({
        ...f,
        collections: f.collections.filter((c) => c !== id),
      }))
    );
    setDeleteCollectionConfirm(null);
    if (selectedCollection === id) {
      setSelectedCollection(null);
    }

    toast({
      title: language === "hi" ? "कलेक्शन हटाया गया" : "Collection Deleted",
    });
  };

  const selectedCollectionData = selectedCollection
    ? collections.find((c) => c.id === selectedCollection)
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                {selectedCollection && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedCollection(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    {selectedCollectionData ? (
                      <>
                        <div
                          className={cn(
                            "w-6 h-6 rounded-lg flex items-center justify-center",
                            selectedCollectionData.color
                          )}
                        >
                          <FolderHeart className="h-4 w-4 text-white" />
                        </div>
                        {language === "hi"
                          ? selectedCollectionData.nameHi
                          : selectedCollectionData.name}
                      </>
                    ) : (
                      <>
                        <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                        {language === "hi" ? "फेवरेट्स" : "Favorites"}
                      </>
                    )}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {filteredFavorites.length}{" "}
                    {language === "hi" ? "आइटम" : "items"}
                    {selectedFavorites.length > 0 &&
                      ` • ${selectedFavorites.length} ${language === "hi" ? "चुने गए" : "selected"
                      }`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Toggle */}
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
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Collections */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-28 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                  {language === "hi" ? "कलेक्शन" : "Collections"}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNewCollectionDialog(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {/* All Favorites */}
                <button
                  onClick={() => setSelectedCollection(null)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                    !selectedCollection
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  )}
                >
                  <Star
                    className={cn(
                      "h-5 w-5",
                      !selectedCollection ? "fill-current" : "text-yellow-500"
                    )}
                  />
                  <div className="flex-1">
                    <p className="font-medium">
                      {language === "hi" ? "सभी फेवरेट्स" : "All Favorites"}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {favorites.length}
                  </Badge>
                </button>

                {/* Collection Cards */}
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => setSelectedCollection(collection.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all group",
                      selectedCollection === collection.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded flex items-center justify-center",
                        collection.color
                      )}
                    >
                      <FolderHeart className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {language === "hi" ? collection.nameHi : collection.name}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {collection.count}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === "hi" ? "खोजें..." : "Search..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
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
            </div>

            {/* Bulk Actions */}
            <AnimatePresence>
              {selectedFavorites.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center gap-3 p-4 mb-6 bg-primary/10 border border-primary/20 rounded-lg"
                >
                  <Checkbox
                    checked={selectedFavorites.length === filteredFavorites.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="font-medium">
                    {selectedFavorites.length} {language === "hi" ? "चुने गए" : "selected"}
                  </span>
                  <div className="flex-1" />
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    {language === "hi" ? "डाउनलोड" : "Download"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Folder className="h-4 w-4 mr-2" />
                        {language === "hi" ? "कलेक्शन में जोड़ें" : "Add to Collection"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {collections.map((col) => (
                        <DropdownMenuItem key={col.id}>
                          <div className={cn("w-3 h-3 rounded-full mr-2", col.color)} />
                          {language === "hi" ? col.nameHi : col.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={handleBulkUnfavorite}
                  >
                    <StarOff className="h-4 w-4 mr-2" />
                    {language === "hi" ? "हटाएं" : "Remove"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFavorites([])}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Favorites Grid/List */}
            {isLoading ? (
              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "space-y-4"
                )}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className={cn(
                      viewMode === "grid" ? "aspect-[4/3] rounded-xl" : "h-20 rounded-lg"
                    )}
                  />
                ))}
              </div>
            ) : filteredFavorites.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="p-6 rounded-full bg-muted mb-6">
                  <Heart className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  {searchQuery
                    ? language === "hi"
                      ? "कोई फेवरेट नहीं मिला"
                      : "No favorites found"
                    : language === "hi"
                      ? "अभी तक कोई फेवरेट नहीं"
                      : "No favorites yet"}
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {searchQuery
                    ? language === "hi"
                      ? "अपनी खोज बदलकर देखें।"
                      : "Try adjusting your search."
                    : language === "hi"
                      ? "अपने पसंदीदा डिज़ाइन को स्टार करें।"
                      : "Star your favorite designs to see them here."}
                </p>
                {!searchQuery && (
                  <Button onClick={() => router.push("/projects")}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {language === "hi" ? "प्रोजेक्ट्स देखें" : "Browse Projects"}
                  </Button>
                )}
              </motion.div>
            ) : (
              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "space-y-4"
                )}
              >
                <AnimatePresence mode="popLayout">
                  {filteredFavorites.map((item) => (
                    <FavoriteCard
                      key={item.id}
                      item={item}
                      isSelected={selectedFavorites.includes(item.id)}
                      onSelect={handleSelectFavorite}
                      onView={setViewingItem}
                      onUnfavorite={handleUnfavorite}
                      onAddToCollection={handleAddToCollection}
                      collections={collections}
                      viewMode={viewMode}
                      language={language}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* View Item Dialog */}
      <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
        <DialogContent className="max-w-4xl">
          {viewingItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {viewingItem.projectName}
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                </DialogTitle>
                <DialogDescription>
                  {viewingItem.style} • {viewingItem.roomType}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <CompareSlider
                  beforeImage={viewingItem.originalImage}
                  afterImage={viewingItem.renderedImage}
                  beforeLabel={language === "hi" ? "पहले" : "Before"}
                  afterLabel={language === "hi" ? "बाद में" : "After"}
                />
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  {viewingItem.hasVastu && viewingItem.vastuScore && (
                    <Badge
                      variant="outline"
                      className={cn(
                        viewingItem.vastuScore >= 80
                          ? "border-green-500 text-green-600"
                          : viewingItem.vastuScore >= 60
                            ? "border-yellow-500 text-yellow-600"
                            : "border-red-500 text-red-600"
                      )}
                    >
                      <Compass className="h-4 w-4 mr-1" />
                      Vastu: {viewingItem.vastuScore}
                    </Badge>
                  )}
                  {viewingItem.hasCost && viewingItem.estimatedCost && (
                    <Badge variant="outline">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      ₹{viewingItem.estimatedCost.toLocaleString()}
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
                      setViewingItem(null);
                      router.push(`/editor/${viewingItem.projectId}`);
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

      {/* New/Edit Collection Dialog */}
      <Dialog
        open={newCollectionDialog || !!editingCollection}
        onOpenChange={(open) => {
          if (!open) {
            setNewCollectionDialog(false);
            setEditingCollection(null);
            setNewCollectionName("");
            setNewCollectionColor("bg-blue-500");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCollection
                ? language === "hi"
                  ? "कलेक्शन एडिट करें"
                  : "Edit Collection"
                : language === "hi"
                  ? "नया कलेक्शन"
                  : "New Collection"}
            </DialogTitle>
            <DialogDescription>
              {language === "hi"
                ? "अपने फेवरेट्स को व्यवस्थित करें।"
                : "Organize your favorites into collections."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{language === "hi" ? "नाम" : "Name"}</Label>
              <Input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder={language === "hi" ? "कलेक्शन का नाम" : "Collection name"}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "hi" ? "रंग" : "Color"}</Label>
              <div className="flex gap-2">
                {collectionColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewCollectionColor(color.value)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      color.value,
                      newCollectionColor === color.value
                        ? "ring-2 ring-offset-2 ring-primary"
                        : "hover:scale-110"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewCollectionDialog(false);
                setEditingCollection(null);
                setNewCollectionName("");
              }}
            >
              {language === "hi" ? "रद्द करें" : "Cancel"}
            </Button>
            <Button
              onClick={editingCollection ? handleUpdateCollection : handleCreateCollection}
              disabled={!newCollectionName.trim()}
            >
              {editingCollection
                ? language === "hi"
                  ? "अपडेट करें"
                  : "Update"
                : language === "hi"
                  ? "बनाएं"
                  : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Collection Confirmation */}
      <AlertDialog
        open={!!deleteCollectionConfirm}
        onOpenChange={() => setDeleteCollectionConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "hi" ? "कलेक्शन हटाएं?" : "Delete Collection?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "hi"
                ? "कलेक्शन हटा दिया जाएगा, लेकिन फेवरेट्स नहीं हटेंगे।"
                : "The collection will be deleted, but favorites will remain."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "hi" ? "रद्द करें" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteCollectionConfirm && handleDeleteCollection(deleteCollectionConfirm)
              }
              className="bg-red-500 hover:bg-red-600"
            >
              {language === "hi" ? "हटाएं" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}