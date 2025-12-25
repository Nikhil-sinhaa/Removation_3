// components/editor/HistoryPanel.tsx
"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Clock,
  Search,
  Filter,
  MoreVertical,
  Download,
  Trash2,
  Star,
  StarOff,
  Eye,
  Copy,
  RefreshCw,
  Sparkles,
  Image,
  Palette,
  Home,
  Calendar,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Heart,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface HistoryItem {
  id: string;
  projectId: string;
  projectName: string;
  originalUrl: string;
  outputUrl: string;
  thumbnailUrl?: string;
  style: string;
  roomType: string;
  createdAt: Date;
  isFavorite: boolean;
  vastuScore?: number;
  estimatedCost?: number;
  currency?: string;
  tags?: string[];
  duration?: number; // in seconds
}

interface HistoryPanelProps {
  items: HistoryItem[];
  onSelect?: (item: HistoryItem) => void;
  onDelete?: (itemId: string) => void;
  onToggleFavorite?: (itemId: string) => void;
  onDownload?: (item: HistoryItem) => void;
  onShare?: (item: HistoryItem) => void;
  onRegenerate?: (item: HistoryItem) => void;
  onClearAll?: () => void;
  isLoading?: boolean;
}

type SortBy = "date" | "style" | "room" | "favorites";
type SortOrder = "asc" | "desc";
type ViewMode = "grid" | "list";

function groupByDate(items: HistoryItem[]): Record<string, HistoryItem[]> {
  const groups: Record<string, HistoryItem[]> = {};
  
  items.forEach((item) => {
    let label: string;
    
    if (isToday(item.createdAt)) {
      label = "Today";
    } else if (isYesterday(item.createdAt)) {
      label = "Yesterday";
    } else if (isThisWeek(item.createdAt)) {
      label = "This Week";
    } else if (isThisMonth(item.createdAt)) {
      label = "This Month";
    } else {
      label = format(item.createdAt, "MMMM yyyy");
    }
    
    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(item);
  });
  
  return groups;
}

function HistoryCard({
  item,
  viewMode,
  onSelect,
  onDelete,
  onToggleFavorite,
  onDownload,
  onShare,
  onRegenerate,
}: {
  item: HistoryItem;
  viewMode: ViewMode;
  onSelect?: (item: HistoryItem) => void;
  onDelete?: (itemId: string) => void;
  onToggleFavorite?: (itemId: string) => void;
  onDownload?: (item: HistoryItem) => void;
  onShare?: (item: HistoryItem) => void;
  onRegenerate?: (item: HistoryItem) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (viewMode === "grid") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -2 }}
        className="group relative rounded-lg overflow-hidden border bg-card cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onSelect?.(item)}
      >
        {/* Image */}
        <div className="relative aspect-video">
          <img
            src={item.thumbnailUrl || item.outputUrl}
            alt={item.projectName}
            className="w-full h-full object-cover"
          />
          
          {/* Overlay */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-9 w-9"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect?.(item);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-9 w-9"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownload?.(item);
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Download</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-9 w-9"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite?.(item.id);
                        }}
                      >
                        {item.isFavorite ? (
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        ) : (
                          <Heart className="w-4 h-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Favorite Badge */}
          {item.isFavorite && (
            <div className="absolute top-2 right-2">
              <Heart className="w-5 h-5 fill-red-500 text-red-500 drop-shadow-lg" />
            </div>
          )}

          {/* Vastu Score */}
          {item.vastuScore !== undefined && (
            <div className="absolute top-2 left-2">
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs",
                  item.vastuScore >= 80 && "bg-green-500/90 text-white",
                  item.vastuScore >= 60 && item.vastuScore < 80 && "bg-yellow-500/90 text-white",
                  item.vastuScore < 60 && "bg-red-500/90 text-white"
                )}
              >
                Vastu: {item.vastuScore}
              </Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 space-y-1">
          <p className="font-medium text-sm truncate">{item.projectName}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Palette className="w-3 h-3" />
            <span className="truncate">{item.style}</span>
            <span>•</span>
            <Home className="w-3 h-3" />
            <span className="truncate">{item.roomType}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{format(item.createdAt, "MMM d, h:mm a")}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // List view
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
      onClick={() => onSelect?.(item)}
    >
      {/* Thumbnail */}
      <div className="relative w-20 h-14 rounded-md overflow-hidden bg-muted shrink-0">
        <img
          src={item.thumbnailUrl || item.outputUrl}
          alt={item.projectName}
          className="w-full h-full object-cover"
        />
        {item.isFavorite && (
          <div className="absolute top-1 right-1">
            <Heart className="w-3 h-3 fill-red-500 text-red-500" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{item.projectName}</p>
          {item.vastuScore !== undefined && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs shrink-0",
                item.vastuScore >= 80 && "border-green-500 text-green-600",
                item.vastuScore >= 60 && item.vastuScore < 80 && "border-yellow-500 text-yellow-600",
                item.vastuScore < 60 && "border-red-500 text-red-600"
              )}
            >
              {item.vastuScore}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span>{item.style}</span>
          <span>•</span>
          <span>{item.roomType}</span>
          <span>•</span>
          <span>{format(item.createdAt, "MMM d, h:mm a")}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite?.(item.id);
                }}
              >
                {item.isFavorite ? (
                  <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                ) : (
                  <Heart className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {item.isFavorite ? "Remove from favorites" : "Add to favorites"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSelect?.(item)}>
              <Eye className="w-4 h-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload?.(item)}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onShare?.(item)}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRegenerate?.(item)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this render?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The render will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete?.(item.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

export default function HistoryPanel({
  items,
  onSelect,
  onDelete,
  onToggleFavorite,
  onDownload,
  onShare,
  onRegenerate,
  onClearAll,
  isLoading = false,
}: HistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterFavorites, setFilterFavorites] = useState(false);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.projectName.toLowerCase().includes(query) ||
          item.style.toLowerCase().includes(query) ||
          item.roomType.toLowerCase().includes(query)
      );
    }

    // Filter by favorites
    if (filterFavorites) {
      result = result.filter((item) => item.isFavorite);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case "style":
          comparison = a.style.localeCompare(b.style);
          break;
        case "room":
          comparison = a.roomType.localeCompare(b.roomType);
          break;
        case "favorites":
          comparison = (a.isFavorite ? 1 : 0) - (b.isFavorite ? 1 : 0);
          break;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    return result;
  }, [items, searchQuery, sortBy, sortOrder, filterFavorites]);

  const groupedItems = useMemo(() => {
    if (sortBy === "date") {
      return groupByDate(filteredItems);
    }
    return { "All Renders": filteredItems };
  }, [filteredItems, sortBy]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">No render history</h3>
        <p className="text-sm text-muted-foreground max-w-[250px]">
          Your generated designs will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 space-y-3 border-b">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="style">Style</SelectItem>
              <SelectItem value="room">Room</SelectItem>
              <SelectItem value="favorites">Favorites</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? (
              <SortAsc className="w-4 h-4" />
            ) : (
              <SortDesc className="w-4 h-4" />
            )}
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button
            size="icon"
            variant={filterFavorites ? "default" : "outline"}
            className="h-8 w-8"
            onClick={() => setFilterFavorites(!filterFavorites)}
          >
            <Heart className={cn("w-4 h-4", filterFavorites && "fill-current")} />
          </Button>

          <div className="flex-1" />

          <div className="flex items-center border rounded-md">
            <Button
              size="icon"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              className="h-8 w-8 rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              className="h-8 w-8 rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {Object.entries(groupedItems).map(([group, groupItems]) => (
            <div key={group}>
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-sm font-medium text-muted-foreground">{group}</h4>
                <Badge variant="secondary" className="text-xs">
                  {groupItems.length}
                </Badge>
              </div>

              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-2 gap-3"
                    : "space-y-2"
                )}
              >
                <AnimatePresence mode="popLayout">
                  {groupItems.map((item) => (
                    <HistoryCard
                      key={item.id}
                      item={item}
                      viewMode={viewMode}
                      onSelect={onSelect}
                      onDelete={onDelete}
                      onToggleFavorite={onToggleFavorite}
                      onDownload={onDownload}
                      onShare={onShare}
                      onRegenerate={onRegenerate}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t bg-muted/30 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {filteredItems.length} of {items.length} renders
        </span>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive">
              Clear All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all history?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all {items.length} renders from your history. 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onClearAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}