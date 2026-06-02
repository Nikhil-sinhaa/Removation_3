// app/admin/renders/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Image as ImageIcon,
  Search,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Trash2,
  Flag,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  User,
  Palette,
  Home,
  Sparkles,
  IndianRupee,
  Layers,
  Zap,
  ExternalLink,
  Copy,
  Ban,
  CheckCheck,
  X,
  SlidersHorizontal,
  Grid3X3,
  List,
  LayoutGrid,
  Maximize2,
  Info,
  Share2,
  Heart,
  BarChart3,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
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
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
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

// Types
interface Render {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  userPlan: "free" | "pro" | "teams";
  type: string;
  style: string;
  roomType: string;
  status: "completed" | "processing" | "failed" | "queued";
  originalImage: string;
  generatedImage?: string;
  vastuScore?: number;
  costEstimate?: string;
  processingTime?: number;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  isFlagged: boolean;
  isDeleted: boolean;
  metadata: {
    width: number;
    height: number;
    model: string;
    prompt?: string;
  };
}

interface RenderStats {
  total: number;
  completed: number;
  processing: number;
  failed: number;
  queued: number;
  todayCount: number;
  avgProcessingTime: string;
  successRate: string;
}

// Mock Data
const mockStats: RenderStats = {
  total: 1234567,
  completed: 1198234,
  processing: 342,
  failed: 35891,
  queued: 100,
  todayCount: 8456,
  avgProcessingTime: "12.4s",
  successRate: "97.1%",
};

const renderTypes = [
  "Room Redesign",
  "Fill Empty Room",
  "Vastu Analysis",
  "Cost Estimate",
  "Inpainting",
  "Object Removal",
  "Outdoor Design",
  "Sketch to Render",
  "Style Transfer",
  "Image Enhancement",
];

const styles = [
  "Modern Minimalist",
  "Scandinavian",
  "Industrial",
  "Contemporary",
  "Traditional Indian",
  "Bohemian",
  "Japanese Zen",
  "Art Deco",
  "Rustic",
  "Coastal",
  "Mid-Century Modern",
  "Farmhouse",
];

const roomTypes = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Office",
  "Dining Room",
  "Outdoor",
  "Kids Room",
  "Studio",
];

const generateMockRenders = (count: number): Render[] => {
  const renders: Render[] = [];
  const statuses: Render["status"][] = ["completed", "completed", "completed", "completed", "processing", "failed", "queued"];
  const plans: Render["userPlan"][] = ["free", "pro", "teams"];
  const names = [
    "Priya Sharma", "John Smith", "Rahul Verma", "Emma Wilson", "Amit Patel",
    "Sarah Johnson", "Mike Chen", "Lisa Park", "Raj Malhotra", "Anna Schmidt",
    "David Lee", "Neha Gupta", "Tom Brown", "Meera Singh", "Chris Evans",
  ];

  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    const hasVastu = Math.random() > 0.7;
    const hasCost = Math.random() > 0.6;

    renders.push({
      id: `render_${i + 1}_${Date.now()}`,
      userId: `user_${Math.floor(Math.random() * 1000)}`,
      userName: name,
      userEmail: `${name.toLowerCase().replace(" ", ".")}@email.com`,
      userPlan: plans[Math.floor(Math.random() * plans.length)],
      type: renderTypes[Math.floor(Math.random() * renderTypes.length)],
      style: styles[Math.floor(Math.random() * styles.length)],
      roomType: roomTypes[Math.floor(Math.random() * roomTypes.length)],
      status,
      originalImage: `/api/placeholder/400/300`,
      generatedImage: status === "completed" ? `/api/placeholder/400/300` : undefined,
      vastuScore: hasVastu ? Math.floor(Math.random() * 40) + 60 : undefined,
      costEstimate: hasCost ? `₹${(Math.floor(Math.random() * 50) + 10).toLocaleString()},000` : undefined,
      processingTime: status === "completed" ? Math.floor(Math.random() * 20) + 5 : undefined,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      completedAt: status === "completed" ? new Date(Date.now() - Math.floor(Math.random() * 6 * 24 * 60 * 60 * 1000)).toISOString() : undefined,
      errorMessage: status === "failed" ? "Model inference timeout" : undefined,
      isFlagged: Math.random() > 0.95,
      isDeleted: false,
      metadata: {
        width: 1024,
        height: 768,
        model: "sdxl-interior-v2",
        prompt: "Modern minimalist living room with natural lighting...",
      },
    });
  }

  return renders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const mockRenders = generateMockRenders(100);

// Components
const StatCard = ({ 
  title, 
  value, 
  icon, 
  color, 
  subValue 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string;
  subValue?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2 }}
    className="relative"
  >
    <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1 ${color}`} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {subValue && (
              <p className="text-xs text-neutral-400 mt-1">{subValue}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color.replace('bg-', 'bg-opacity-20 bg-')}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const RenderStatusBadge = ({ status }: { status: Render["status"] }) => {
  const config = {
    completed: { 
      bg: "bg-green-500/10", 
      text: "text-green-400", 
      border: "border-green-500/30",
      icon: <CheckCircle2 className="w-3 h-3" />
    },
    processing: { 
      bg: "bg-amber-500/10", 
      text: "text-amber-400", 
      border: "border-amber-500/30",
      icon: <RefreshCw className="w-3 h-3 animate-spin" />
    },
    failed: { 
      bg: "bg-red-500/10", 
      text: "text-red-400", 
      border: "border-red-500/30",
      icon: <XCircle className="w-3 h-3" />
    },
    queued: { 
      bg: "bg-blue-500/10", 
      text: "text-blue-400", 
      border: "border-blue-500/30",
      icon: <Clock className="w-3 h-3" />
    },
  };

  const { bg, text, border, icon } = config[status];

  return (
    <Badge variant="outline" className={`${bg} ${text} ${border} flex items-center gap-1`}>
      {icon}
      <span className="capitalize">{status}</span>
    </Badge>
  );
};

const PlanBadge = ({ plan }: { plan: Render["userPlan"] }) => {
  const colors = {
    free: "bg-neutral-500/10 text-neutral-400 border-neutral-500/30",
    pro: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    teams: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  };

  return (
    <Badge variant="outline" className={colors[plan]}>
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </Badge>
  );
};

const RenderCard = ({ 
  render, 
  isSelected, 
  onSelect, 
  onView,
  onDelete,
  onFlag,
}: { 
  render: Render; 
  isSelected: boolean;
  onSelect: (id: string) => void;
  onView: (render: Render) => void;
  onDelete: (id: string) => void;
  onFlag: (id: string) => void;
}) => {
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className={`relative group rounded-xl border transition-all duration-200 overflow-hidden ${
        isSelected 
          ? "border-violet-500 bg-violet-500/5" 
          : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"
      }`}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(render.id)}
          className="bg-neutral-900/80 border-neutral-600"
        />
      </div>

      {/* Flagged Indicator */}
      {render.isFlagged && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-red-500 text-white">
            <Flag className="w-3 h-3 mr-1" />
            Flagged
          </Badge>
        </div>
      )}

      {/* Image Preview */}
      <div className="relative aspect-video bg-neutral-800 overflow-hidden">
        <div className="absolute inset-0 flex">
          <div className="w-1/2 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-neutral-900/50" />
            <div className="w-full h-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-neutral-600" />
            </div>
            <span className="absolute bottom-2 left-2 text-[10px] text-neutral-400 bg-neutral-900/80 px-1.5 py-0.5 rounded">
              Original
            </span>
          </div>
          <div className="w-1/2 relative">
            {render.generatedImage ? (
              <>
                <div className="w-full h-full bg-gradient-to-br from-violet-900/20 to-blue-900/20 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-violet-500/50" />
                </div>
                <span className="absolute bottom-2 right-2 text-[10px] text-neutral-400 bg-neutral-900/80 px-1.5 py-0.5 rounded">
                  Generated
                </span>
              </>
            ) : (
              <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                {render.status === "processing" ? (
                  <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                ) : render.status === "failed" ? (
                  <XCircle className="w-6 h-6 text-red-500" />
                ) : (
                  <Clock className="w-6 h-6 text-blue-500" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-neutral-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => onView(render)}>
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button size="sm" variant="outline" onClick={() => onFlag(render.id)}>
            <Flag className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Type & Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">{render.type}</span>
          <RenderStatusBadge status={render.status} />
        </div>

        {/* Style & Room */}
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Palette className="w-3 h-3" />
          <span>{render.style}</span>
          <span className="text-neutral-600">•</span>
          <Home className="w-3 h-3" />
          <span>{render.roomType}</span>
        </div>

        {/* User */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={render.userAvatar} />
              <AvatarFallback className="text-[10px] bg-gradient-to-br from-violet-600 to-blue-600">
                {render.userName.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-neutral-400">{render.userName}</span>
          </div>
          <PlanBadge plan={render.userPlan} />
        </div>

        {/* Vastu & Cost */}
        {(render.vastuScore !== undefined || render.costEstimate) && (
          <div className="flex items-center gap-3 pt-2 border-t border-neutral-800">
            {render.vastuScore !== undefined && (
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-orange-500" />
                <span className={`text-xs font-medium ${
                  render.vastuScore >= 80 ? "text-green-400" :
                  render.vastuScore >= 60 ? "text-amber-400" : "text-red-400"
                }`}>
                  {render.vastuScore}% Vastu
                </span>
              </div>
            )}
            {render.costEstimate && (
              <div className="flex items-center gap-1.5">
                <IndianRupee className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-400">{render.costEstimate}</span>
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-800">
          <span>{formatDate(render.createdAt)}</span>
          {render.processingTime && (
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {render.processingTime}s
            </span>
          )}
        </div>
      </div>

      {/* Actions Menu */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="w-8 h-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(render)}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Original
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="w-4 h-4 mr-2" />
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onFlag(render.id)}>
              <Flag className="w-4 h-4 mr-2" />
              {render.isFlagged ? "Unflag" : "Flag Content"}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-500"
              onClick={() => onDelete(render.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

const RenderTableRow = ({ 
  render, 
  isSelected, 
  onSelect, 
  onView,
  onDelete,
  onFlag,
}: { 
  render: Render; 
  isSelected: boolean;
  onSelect: (id: string) => void;
  onView: (render: Render) => void;
  onDelete: (id: string) => void;
  onFlag: (id: string) => void;
}) => {
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`border-b border-neutral-800 hover:bg-neutral-800/30 transition-colors ${
        isSelected ? "bg-violet-500/5" : ""
      }`}
    >
      <td className="p-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(render.id)}
        />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-12 rounded-lg bg-neutral-800 overflow-hidden flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-violet-900/20 to-blue-900/20 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-neutral-600" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{render.type}</p>
            <p className="text-xs text-neutral-500">{render.style}</p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <Avatar className="w-7 h-7">
            <AvatarFallback className="text-[10px] bg-gradient-to-br from-violet-600 to-blue-600">
              {render.userName.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm text-white">{render.userName}</p>
            <p className="text-xs text-neutral-500">{render.userEmail}</p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <PlanBadge plan={render.userPlan} />
      </td>
      <td className="p-4">
        <span className="text-sm text-neutral-400">{render.roomType}</span>
      </td>
      <td className="p-4">
        <RenderStatusBadge status={render.status} />
      </td>
      <td className="p-4">
        {render.vastuScore !== undefined ? (
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-orange-500" />
            <span className={`text-sm font-medium ${
              render.vastuScore >= 80 ? "text-green-400" :
              render.vastuScore >= 60 ? "text-amber-400" : "text-red-400"
            }`}>
              {render.vastuScore}%
            </span>
          </div>
        ) : (
          <span className="text-neutral-600">—</span>
        )}
      </td>
      <td className="p-4">
        {render.costEstimate ? (
          <span className="text-sm text-green-400">{render.costEstimate}</span>
        ) : (
          <span className="text-neutral-600">—</span>
        )}
      </td>
      <td className="p-4">
        {render.processingTime ? (
          <span className="text-sm text-neutral-400">{render.processingTime}s</span>
        ) : (
          <span className="text-neutral-600">—</span>
        )}
      </td>
      <td className="p-4">
        <span className="text-sm text-neutral-400">{formatDate(render.createdAt)}</span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1">
          {render.isFlagged && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Flag className="w-4 h-4 text-red-500" />
                </TooltipTrigger>
                <TooltipContent>Flagged for review</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(render)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="w-4 h-4 mr-2" />
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onFlag(render.id)}>
                <Flag className="w-4 h-4 mr-2" />
                {render.isFlagged ? "Unflag" : "Flag"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-500"
                onClick={() => onDelete(render.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </motion.tr>
  );
};

const RenderDetailsModal = ({ 
  render, 
  isOpen, 
  onClose 
}: { 
  render: Render | null; 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  if (!render) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-neutral-900 border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-violet-500" />
            Render Details
          </DialogTitle>
          <DialogDescription>
            ID: {render.id}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Images */}
          <div className="space-y-4">
            <div>
              <Label className="text-neutral-400 text-xs uppercase">Original Image</Label>
              <div className="mt-2 aspect-video bg-neutral-800 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-neutral-600" />
              </div>
            </div>
            {render.generatedImage && (
              <div>
                <Label className="text-neutral-400 text-xs uppercase">Generated Image</Label>
                <div className="mt-2 aspect-video bg-gradient-to-br from-violet-900/20 to-blue-900/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-violet-500/50" />
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-neutral-400 text-xs uppercase">Type</Label>
                <p className="text-white mt-1">{render.type}</p>
              </div>
              <div>
                <Label className="text-neutral-400 text-xs uppercase">Status</Label>
                <div className="mt-1">
                  <RenderStatusBadge status={render.status} />
                </div>
              </div>
              <div>
                <Label className="text-neutral-400 text-xs uppercase">Style</Label>
                <p className="text-white mt-1">{render.style}</p>
              </div>
              <div>
                <Label className="text-neutral-400 text-xs uppercase">Room Type</Label>
                <p className="text-white mt-1">{render.roomType}</p>
              </div>
            </div>

            <div className="border-t border-neutral-800 pt-4">
              <Label className="text-neutral-400 text-xs uppercase">User</Label>
              <div className="flex items-center gap-3 mt-2">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-to-br from-violet-600 to-blue-600">
                    {render.userName.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white">{render.userName}</p>
                  <p className="text-sm text-neutral-400">{render.userEmail}</p>
                </div>
                <PlanBadge plan={render.userPlan} />
              </div>
            </div>

            {(render.vastuScore !== undefined || render.costEstimate) && (
              <div className="border-t border-neutral-800 pt-4 grid grid-cols-2 gap-4">
                {render.vastuScore !== undefined && (
                  <div>
                    <Label className="text-neutral-400 text-xs uppercase">Vastu Score</Label>
                    <p className={`text-2xl font-bold mt-1 ${
                      render.vastuScore >= 80 ? "text-green-400" :
                      render.vastuScore >= 60 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {render.vastuScore}%
                    </p>
                  </div>
                )}
                {render.costEstimate && (
                  <div>
                    <Label className="text-neutral-400 text-xs uppercase">Cost Estimate</Label>
                    <p className="text-2xl font-bold text-green-400 mt-1">{render.costEstimate}</p>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-neutral-800 pt-4">
              <Label className="text-neutral-400 text-xs uppercase">Metadata</Label>
              <div className="mt-2 p-3 bg-neutral-800 rounded-lg text-xs font-mono text-neutral-400 space-y-1">
                <p>Model: {render.metadata.model}</p>
                <p>Resolution: {render.metadata.width} x {render.metadata.height}</p>
                {render.processingTime && <p>Processing Time: {render.processingTime}s</p>}
                <p>Created: {new Date(render.createdAt).toLocaleString()}</p>
                {render.completedAt && <p>Completed: {new Date(render.completedAt).toLocaleString()}</p>}
              </div>
            </div>

            {render.errorMessage && (
              <div className="border-t border-neutral-800 pt-4">
                <Label className="text-red-400 text-xs uppercase">Error Message</Label>
                <p className="text-red-400 mt-1 p-3 bg-red-500/10 rounded-lg text-sm">
                  {render.errorMessage}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-neutral-800 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Render
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main Component
export default function AdminRendersPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const viewParam = searchParams.get('view');

  const [isLoading, setIsLoading] = useState(true);
  const [renders, setRenders] = useState<Render[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(
    tabParam === 'flagged' || tabParam === 'processing' ? tabParam : 'all'
  );
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selectedRenders, setSelectedRenders] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "table">(
    viewParam === 'gallery' ? 'grid' : 'grid'
  );
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRender, setSelectedRender] = useState<Render | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [renderToDelete, setRenderToDelete] = useState<string | null>(null);
  const itemsPerPage = 12;

  const [stats, setStats] = useState<RenderStats>(mockStats);

  useEffect(() => {
    async function fetchRenders() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/admin/renders?limit=500');
        if (res.ok) {
          const data = await res.json();
          const mapped: Render[] = (data.renders ?? []).map((r: any) => ({
            id: r._id,
            userId: r.userId?._id ?? r.userId ?? 'unknown',
            userName: r.userId ? [(r.userId.firstName ?? ''), (r.userId.lastName ?? '')].filter(Boolean).join(' ') || r.userId.email || 'Unknown User' : 'Unknown User',
            userEmail: r.userId?.email ?? 'unknown@email.com',
            userAvatar: r.userId?.imageUrl,
            userPlan: (r.userId?.subscription?.plan ?? 'free') as 'free' | 'pro' | 'teams',
            type: r.mode ? r.mode.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Unknown',
            style: r.style ?? '',
            roomType: r.roomType ?? '',
            status: (r.status === 'starting' ? 'queued' : (r.status === 'canceled' ? 'failed' : r.status)) as Render['status'],
            originalImage: r.inputImage,
            generatedImage: r.outputImage || (r.outputUrls && r.outputUrls[0]) || r.resultUrl,
            vastuScore: r.vastuScore,
            costEstimate: r.costEstimate,
            processingTime: r.processingTime,
            createdAt: r.createdAt,
            completedAt: r.completedAt,
            errorMessage: r.error,
            isFlagged: false,
            isDeleted: false,
            metadata: {
              width: r.settings?.width ?? 1024,
              height: r.settings?.height ?? 768,
              model: r.predictionId ? 'Replicate' : 'ComfyUI',
              prompt: r.prompt,
            },
          }));
          setRenders(mapped);
          if (data.stats) {
            setStats(data.stats);
          }
        }
      } catch (e) {
        // Fallback to mock renders on error
        setRenders(mockRenders);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRenders();
  }, []);

  // Filter and sort renders
  const filteredRenders = useMemo(() => {
    let filtered = [...renders];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.userName.toLowerCase().includes(query) ||
        r.userEmail.toLowerCase().includes(query) ||
        r.type.toLowerCase().includes(query) ||
        r.style.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(r => r.type === typeFilter);
    }

    // Plan filter
    if (planFilter !== "all") {
      filtered = filtered.filter(r => r.userPlan === planFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "userName":
          comparison = a.userName.localeCompare(b.userName);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [renders, searchQuery, statusFilter, typeFilter, planFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredRenders.length / itemsPerPage);
  const paginatedRenders = filteredRenders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = () => {
    if (selectedRenders.length === paginatedRenders.length) {
      setSelectedRenders([]);
    } else {
      setSelectedRenders(paginatedRenders.map(r => r.id));
    }
  };

  const handleSelectRender = (id: string) => {
    setSelectedRenders(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleViewRender = (render: Render) => {
    setSelectedRender(render);
    setIsDetailsOpen(true);
  };

  const handleDeleteRender = (id: string) => {
    setRenderToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (renderToDelete) {
      setRenders(prev => prev.filter(r => r.id !== renderToDelete));
      setSelectedRenders(prev => prev.filter(id => id !== renderToDelete));
    }
    setIsDeleteDialogOpen(false);
    setRenderToDelete(null);
  };

  const handleFlagRender = (id: string) => {
    setRenders(prev => prev.map(r => 
      r.id === id ? { ...r, isFlagged: !r.isFlagged } : r
    ));
  };

  const handleBulkDelete = () => {
    setRenders(prev => prev.filter(r => !selectedRenders.includes(r.id)));
    setSelectedRenders([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64 bg-neutral-800" />
            <Skeleton className="h-10 w-32 bg-neutral-800" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 bg-neutral-800 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-12 bg-neutral-800 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-80 bg-neutral-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <ImageIcon className="w-8 h-8 text-violet-500" />
              Render Management
            </h1>
            <p className="text-neutral-400 mt-1">
              Monitor and manage all AI-generated renders
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-neutral-700">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button className="bg-gradient-to-r from-violet-600 to-blue-600">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <StatCard
            title="Total"
            value={stats.total}
            icon={<Layers className="w-5 h-5 text-violet-500" />}
            color="bg-violet-500"
            subValue="All time"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
            color="bg-green-500"
          />
          <StatCard
            title="Processing"
            value={stats.processing}
            icon={<RefreshCw className="w-5 h-5 text-amber-500" />}
            color="bg-amber-500"
          />
          <StatCard
            title="Failed"
            value={stats.failed}
            icon={<XCircle className="w-5 h-5 text-red-500" />}
            color="bg-red-500"
          />
          <StatCard
            title="Queued"
            value={stats.queued}
            icon={<Clock className="w-5 h-5 text-blue-500" />}
            color="bg-blue-500"
          />
          <StatCard
            title="Today"
            value={stats.todayCount}
            icon={<Activity className="w-5 h-5 text-cyan-500" />}
            color="bg-cyan-500"
          />
          <StatCard
            title="Avg Time"
            value={stats.avgProcessingTime}
            icon={<Zap className="w-5 h-5 text-yellow-500" />}
            color="bg-yellow-500"
          />
          <StatCard
            title="Success Rate"
            value={stats.successRate}
            icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
            color="bg-emerald-500"
          />
        </div>

        {/* Filters & Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <Input
                    placeholder="Search by user, email, type, style, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-neutral-800 border-neutral-700"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36 bg-neutral-800 border-neutral-700">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="queued">Queued</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40 bg-neutral-800 border-neutral-700">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {renderTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-32 bg-neutral-800 border-neutral-700">
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="teams">Teams</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-36 bg-neutral-800 border-neutral-700">
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Date</SelectItem>
                      <SelectItem value="userName">User</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                    className="border-neutral-700"
                  >
                    {sortOrder === "asc" ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                  </Button>

                  <div className="flex items-center border border-neutral-700 rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className="rounded-none"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("table")}
                      className="rounded-none"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bulk Actions */}
              <AnimatePresence>
                {selectedRenders.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-4 mt-4 pt-4 border-t border-neutral-800"
                  >
                    <span className="text-sm text-neutral-400">
                      {selectedRenders.length} selected
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setSelectedRenders([])}>
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                    <Button variant="outline" size="sm">
                      <Flag className="w-4 h-4 mr-1" />
                      Flag Selected
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Export Selected
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete Selected
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-400">
            Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredRenders.length)} of {filteredRenders.length} renders
          </span>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedRenders.length === paginatedRenders.length && paginatedRenders.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-neutral-400">Select all on page</span>
          </div>
        </div>

        {/* Renders Grid/Table */}
        {viewMode === "grid" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {paginatedRenders.map((render, index) => (
              <RenderCard
                key={render.id}
                render={render}
                isSelected={selectedRenders.includes(render.id)}
                onSelect={handleSelectRender}
                onView={handleViewRender}
                onDelete={handleDeleteRender}
                onFlag={handleFlagRender}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-neutral-800 bg-neutral-900/50 overflow-hidden">
              <ScrollArea className="w-full">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-800/50">
                      <th className="p-4 text-left">
                        <Checkbox
                          checked={selectedRenders.length === paginatedRenders.length && paginatedRenders.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="p-4 text-left text-xs font-medium text-neutral-400 uppercase">Render</th>
                      <th className="p-4 text-left text-xs font-medium text-neutral-400 uppercase">User</th>
                      <th className="p-4 text-left text-xs font-medium text-neutral-400 uppercase">Plan</th>
                      <th className="p-4 text-left text-xs font-medium text-neutral-400 uppercase">Room</th>
                      <th className="p-4 text-left text-xs font-medium text-neutral-400 uppercase">Status</th>
                      <th className="p-4 text-left text-xs font-medium text-neutral-400 uppercase">Vastu</th>
                      <th className="p-4 text-left text-xs font-medium text-neutral-400 uppercase">Cost</th>
                      <th className="p-4 text-left text-xs font-medium text-neutral-400 uppercase">Time</th>
                      <th className="p-4 text-left text-xs font-medium text-neutral-400 uppercase">Date</th>
                      <th className="p-4 text-left text-xs font-medium text-neutral-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRenders.map((render) => (
                      <RenderTableRow
                        key={render.id}
                        render={render}
                        isSelected={selectedRenders.includes(render.id)}
                        onSelect={handleSelectRender}
                        onView={handleViewRender}
                        onDelete={handleDeleteRender}
                        onFlag={handleFlagRender}
                      />
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </Card>
          </motion.div>
        )}

        {/* Empty State */}
        {filteredRenders.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <ImageIcon className="w-16 h-16 text-neutral-700 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No renders found</h3>
            <p className="text-neutral-400">Try adjusting your filters or search query</p>
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between"
          >
            <span className="text-sm text-neutral-400">
              Page {currentPage} of {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="border-neutral-700"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-neutral-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setCurrentPage(pageNum)}
                      className={currentPage === pageNum ? "bg-violet-600" : ""}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-neutral-700"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="border-neutral-700"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Render Details Modal */}
      <RenderDetailsModal
        render={selectedRender}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedRender(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Render</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this render? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-neutral-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}