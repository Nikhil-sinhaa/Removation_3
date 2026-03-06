// app/(app)/projects/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
// TODO: Remnant Clerk imports: useUser
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  MoreVertical,
  Clock,
  Image as ImageIcon,
  Folder,
  Star,
  Trash2,
  Edit3,
  Copy,
  Download,
  Share2,
  ChevronDown,
  SortAsc,
  Calendar,
  Tag,
  X,
  Check,
  AlertTriangle,
  Sparkles,
  Home,
  Bed,
  ChefHat,
  Bath,
  Briefcase,
  Utensils,
  TreePine,
  Compass,
  IndianRupee,
  Eye,
  ExternalLink,
  Layers,
  FolderPlus,
  Heart,
  LayoutGrid,
  ArrowUpDown,
  SlidersHorizontal,
  Loader2,
  CheckCircle2,
  Archive,
  RotateCcw,
  Settings,
  MoreHorizontal,
  Play,
  Pause,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

const cardHoverVariants = {
  rest: { scale: 1, y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
};

// Types
interface Project {
  id: string;
  name: string;
  thumbnail: string | null;
  roomType: string;
  style: string;
  rendersCount: number;
  isFavorite: boolean;
  isArchived: boolean;
  vastuScore: number | null;
  estimatedCost: number | null;
  createdAt: string;
  updatedAt: string;
  lastRenderAt: string | null;
  status: 'active' | 'processing' | 'completed';
  tags: string[];
}

type ViewMode = 'grid' | 'list';
type TabFilter = 'all' | 'favorites' | 'recent' | 'archived';
type SortOption = 'updatedAt' | 'createdAt' | 'name' | 'rendersCount' | 'vastuScore';

// Room type icons
const roomTypeIcons: Record<string, React.ElementType> = {
  'Living Room': Home,
  'Bedroom': Bed,
  'Kitchen': ChefHat,
  'Bathroom': Bath,
  'Office': Briefcase,
  'Dining Room': Utensils,
  'Outdoor': TreePine,
};

// Room type colors
const roomTypeColors: Record<string, { bg: string; text: string; gradient: string }> = {
  'Living Room': { bg: 'bg-blue-100', text: 'text-blue-700', gradient: 'from-blue-400 to-cyan-400' },
  'Bedroom': { bg: 'bg-purple-100', text: 'text-purple-700', gradient: 'from-purple-400 to-pink-400' },
  'Kitchen': { bg: 'bg-orange-100', text: 'text-orange-700', gradient: 'from-orange-400 to-red-400' },
  'Bathroom': { bg: 'bg-cyan-100', text: 'text-cyan-700', gradient: 'from-cyan-400 to-teal-400' },
  'Office': { bg: 'bg-gray-100', text: 'text-gray-700', gradient: 'from-gray-400 to-slate-400' },
  'Dining Room': { bg: 'bg-amber-100', text: 'text-amber-700', gradient: 'from-amber-400 to-yellow-400' },
  'Outdoor': { bg: 'bg-green-100', text: 'text-green-700', gradient: 'from-green-400 to-emerald-400' },
};

// Sample data
const sampleProjects: Project[] = [
  {
    id: '1',
    name: 'Living Room Makeover',
    thumbnail: null,
    roomType: 'Living Room',
    style: 'Modern Minimalist',
    rendersCount: 5,
    isFavorite: true,
    isArchived: false,
    vastuScore: 85,
    estimatedCost: 250000,
    createdAt: '2025-01-15',
    updatedAt: '2 hours ago',
    lastRenderAt: '2 hours ago',
    status: 'active',
    tags: ['modern', 'minimalist'],
  },
  {
    id: '2',
    name: 'Master Bedroom Redesign',
    thumbnail: null,
    roomType: 'Bedroom',
    style: 'Scandinavian',
    rendersCount: 3,
    isFavorite: false,
    isArchived: false,
    vastuScore: 72,
    estimatedCost: 180000,
    createdAt: '2025-01-14',
    updatedAt: '1 day ago',
    lastRenderAt: '1 day ago',
    status: 'completed',
    tags: ['scandinavian', 'cozy'],
  },
  {
    id: '3',
    name: 'Kitchen Renovation',
    thumbnail: null,
    roomType: 'Kitchen',
    style: 'Contemporary',
    rendersCount: 8,
    isFavorite: true,
    isArchived: false,
    vastuScore: 91,
    estimatedCost: 450000,
    createdAt: '2025-01-12',
    updatedAt: '3 days ago',
    lastRenderAt: '2 days ago',
    status: 'active',
    tags: ['contemporary', 'modular'],
  },
  {
    id: '4',
    name: 'Home Office Setup',
    thumbnail: null,
    roomType: 'Office',
    style: 'Industrial',
    rendersCount: 4,
    isFavorite: false,
    isArchived: false,
    vastuScore: 68,
    estimatedCost: 120000,
    createdAt: '2025-01-10',
    updatedAt: '5 days ago',
    lastRenderAt: '4 days ago',
    status: 'processing',
    tags: ['industrial', 'productivity'],
  },
  {
    id: '5',
    name: 'Bathroom Upgrade',
    thumbnail: null,
    roomType: 'Bathroom',
    style: 'Luxury Modern',
    rendersCount: 2,
    isFavorite: false,
    isArchived: false,
    vastuScore: 78,
    estimatedCost: 300000,
    createdAt: '2025-01-08',
    updatedAt: '1 week ago',
    lastRenderAt: '1 week ago',
    status: 'completed',
    tags: ['luxury', 'spa'],
  },
  {
    id: '6',
    name: 'Kids Room Design',
    thumbnail: null,
    roomType: 'Bedroom',
    style: 'Playful Modern',
    rendersCount: 6,
    isFavorite: true,
    isArchived: false,
    vastuScore: 82,
    estimatedCost: 150000,
    createdAt: '2025-01-05',
    updatedAt: '10 days ago',
    lastRenderAt: '10 days ago',
    status: 'active',
    tags: ['playful', 'colorful'],
  },
  {
    id: '7',
    name: 'Garden Patio Design',
    thumbnail: null,
    roomType: 'Outdoor',
    style: 'Tropical',
    rendersCount: 4,
    isFavorite: false,
    isArchived: true,
    vastuScore: 75,
    estimatedCost: 200000,
    createdAt: '2025-01-01',
    updatedAt: '2 weeks ago',
    lastRenderAt: '2 weeks ago',
    status: 'completed',
    tags: ['outdoor', 'tropical'],
  },
];

const roomTypeFilters = [
  { label: 'All Rooms', value: 'all', icon: LayoutGrid },
  { label: 'Living Room', value: 'Living Room', icon: Home },
  { label: 'Bedroom', value: 'Bedroom', icon: Bed },
  { label: 'Kitchen', value: 'Kitchen', icon: ChefHat },
  { label: 'Bathroom', value: 'Bathroom', icon: Bath },
  { label: 'Office', value: 'Office', icon: Briefcase },
  { label: 'Dining', value: 'Dining Room', icon: Utensils },
  { label: 'Outdoor', value: 'Outdoor', icon: TreePine },
];

const sortOptions: { label: string; value: SortOption; icon: React.ElementType }[] = [
  { label: 'Last Modified', value: 'updatedAt', icon: Clock },
  { label: 'Date Created', value: 'createdAt', icon: Calendar },
  { label: 'Name A-Z', value: 'name', icon: SortAsc },
  { label: 'Most Renders', value: 'rendersCount', icon: Layers },
  { label: 'Vastu Score', value: 'vastuScore', icon: Compass },
];

// Skeleton Components
function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

function ProjectListSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-50">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-4 w-20 hidden md:block" />
      <Skeleton className="h-4 w-16 hidden lg:block" />
      <Skeleton className="h-8 w-8" />
    </div>
  );
}

// Stats Bar Component
function StatsBar({ projects }: { projects: Project[] }) {
  const totalProjects = projects.filter((p) => !p.isArchived).length;
  const totalRenders = projects.reduce((acc, p) => acc + p.rendersCount, 0);
  const avgVastuScore = Math.round(
    projects.filter((p) => p.vastuScore).reduce((acc, p) => acc + (p.vastuScore || 0), 0) /
      projects.filter((p) => p.vastuScore).length || 0
  );
  const favoriteCount = projects.filter((p) => p.isFavorite).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[
        { label: 'Total Projects', value: totalProjects, icon: Folder, color: 'violet' },
        { label: 'AI Renders', value: totalRenders, icon: Sparkles, color: 'pink' },
        { label: 'Avg Vastu Score', value: avgVastuScore, icon: Compass, color: 'orange' },
        { label: 'Favorites', value: favoriteCount, icon: Heart, color: 'red' },
      ].map((stat) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3"
        >
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              stat.color === 'violet' && 'bg-violet-100',
              stat.color === 'pink' && 'bg-pink-100',
              stat.color === 'orange' && 'bg-orange-100',
              stat.color === 'red' && 'bg-red-100'
            )}
          >
            <stat.icon
              className={cn(
                'w-5 h-5',
                stat.color === 'violet' && 'text-violet-600',
                stat.color === 'pink' && 'text-pink-600',
                stat.color === 'orange' && 'text-orange-600',
                stat.color === 'red' && 'text-red-600'
              )}
            />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Project Card Component
function ProjectCard({
  project,
  index,
  isSelected,
  onSelect,
  onToggleFavorite,
  onOpenMenu,
}: {
  project: Project;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenMenu: (id: string, e: React.MouseEvent) => void;
}) {
  const RoomIcon = roomTypeIcons[project.roomType] || Folder;
  const colors = roomTypeColors[project.roomType] || {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    gradient: 'from-gray-400 to-slate-400',
  };

  const getVastuColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatCost = (cost: number) => {
    if (cost >= 100000) return `₹${(cost / 100000).toFixed(1)}L`;
    if (cost >= 1000) return `₹${(cost / 1000).toFixed(0)}K`;
    return `₹${cost}`;
  };

  return (
    <motion.div
      layout
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover="hover"
      className={cn(
        'group relative bg-white rounded-2xl border overflow-hidden transition-colors',
        isSelected ? 'border-violet-400 ring-2 ring-violet-100' : 'border-gray-100 hover:border-violet-200'
      )}
    >
      {/* Selection Checkbox */}
      <div
        className={cn(
          'absolute top-3 left-3 z-10 transition-opacity',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(project.id)}
          className="h-5 w-5 bg-white/90 backdrop-blur-sm border-gray-300"
        />
      </div>

      {/* Thumbnail */}
      <Link href={`/editor/${project.id}`}>
        <div className="aspect-video relative overflow-hidden">
          {/* Gradient Background */}
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br opacity-80',
              colors.gradient
            )}
          />

          {/* Pattern Overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Center Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <RoomIcon className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileHover={{ opacity: 1, scale: 1 }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-xl">
                <Play className="w-6 h-6 text-violet-600 ml-1" />
              </div>
            </motion.div>
          </div>

          {/* Status Indicator */}
          {project.status === 'processing' && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-violet-500 text-white rounded-lg text-xs font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              Processing
            </div>
          )}

          {/* Badges Row */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            {/* Vastu Score */}
            {project.vastuScore && (
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm',
                      getVastuColor(project.vastuScore)
                    )}
                  >
                    <Compass className="w-3 h-3" />
                    {project.vastuScore}
                  </div>
                </TooltipTrigger>
                <TooltipContent>Vastu Score</TooltipContent>
              </Tooltip>
            )}

            {/* Renders Count */}
            <div className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-xs font-medium text-white flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {project.rendersCount}
            </div>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <Link href={`/editor/${project.id}`}>
              <h3 className="font-semibold text-gray-900 truncate group-hover:text-violet-600 transition-colors">
                {project.name}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn('px-2 py-0.5 rounded text-xs font-medium', colors.bg, colors.text)}>
                {project.roomType}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500 truncate">{project.style}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onToggleFavorite(project.id)}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    project.isFavorite
                      ? 'text-red-500 hover:bg-red-50'
                      : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                  )}
                >
                  <Heart className={cn('w-4 h-4', project.isFavorite && 'fill-current')} />
                </button>
              </TooltipTrigger>
              <TooltipContent>{project.isFavorite ? 'Remove from favorites' : 'Add to favorites'}</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Cost Estimate */}
        {project.estimatedCost && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
            <IndianRupee className="w-3.5 h-3.5" />
            <span>Est. {formatCost(project.estimatedCost)}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {project.updatedAt}
          </span>

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {project.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Project List Item Component
function ProjectListItem({
  project,
  isSelected,
  onSelect,
  onToggleFavorite,
}: {
  project: Project;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const RoomIcon = roomTypeIcons[project.roomType] || Folder;
  const colors = roomTypeColors[project.roomType] || {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    gradient: 'from-gray-400 to-slate-400',
  };

  const getVastuColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCost = (cost: number) => {
    if (cost >= 100000) return `₹${(cost / 100000).toFixed(1)}L`;
    if (cost >= 1000) return `₹${(cost / 1000).toFixed(0)}K`;
    return `₹${cost}`;
  };

  return (
    <motion.div
      layout
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        'group flex items-center gap-4 p-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors',
        isSelected && 'bg-violet-50/50'
      )}
    >
      {/* Checkbox */}
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onSelect(project.id)}
        className="h-4 w-4"
      />

      {/* Thumbnail */}
      <Link href={`/editor/${project.id}`}>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
            colors.gradient
          )}
        >
          <RoomIcon className="w-6 h-6 text-white" />
        </div>
      </Link>

      {/* Name & Style */}
      <div className="flex-1 min-w-0">
        <Link href={`/editor/${project.id}`}>
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-violet-600 transition-colors">
            {project.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-500 truncate">{project.style}</p>
      </div>

      {/* Room Type */}
      <div className="hidden md:block">
        <span className={cn('px-2 py-1 rounded text-xs font-medium', colors.bg, colors.text)}>
          {project.roomType}
        </span>
      </div>

      {/* Vastu Score */}
      <div className="hidden lg:flex items-center gap-1 w-16">
        {project.vastuScore && (
          <>
            <Compass className={cn('w-4 h-4', getVastuColor(project.vastuScore))} />
            <span className={cn('font-medium text-sm', getVastuColor(project.vastuScore))}>
              {project.vastuScore}
            </span>
          </>
        )}
      </div>

      {/* Cost */}
      <div className="hidden xl:block text-sm text-gray-500 w-20">
        {project.estimatedCost && formatCost(project.estimatedCost)}
      </div>

      {/* Renders */}
      <div className="hidden sm:flex items-center gap-1 text-sm text-gray-500 w-16">
        <Layers className="w-4 h-4" />
        {project.rendersCount}
      </div>

      {/* Modified */}
      <div className="text-sm text-gray-400 w-24 hidden md:block">{project.updatedAt}</div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onToggleFavorite(project.id)}
          className={cn(
            'p-2 rounded-lg transition-colors',
            project.isFavorite
              ? 'text-red-500 hover:bg-red-50'
              : 'text-gray-400 hover:bg-gray-100 opacity-0 group-hover:opacity-100'
          )}
        >
          <Heart className={cn('w-4 h-4', project.isFavorite && 'fill-current')} />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit3 className="w-4 h-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

// Main Component
export default function ProjectsPage() {
  const { user, isLoading: isLoaded } = useAuth();
  const isSignedIn = !!user;
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [tabFilter, setTabFilter] = useState<TabFilter>('all');
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Load projects
  useEffect(() => {
    const timer = setTimeout(() => {
      setProjects(sampleProjects);
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // New project on N
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setShowNewProjectModal(true);
      }

      // Toggle view on V
      if (e.key === 'v' && document.activeElement?.tagName !== 'INPUT') {
        setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'));
      }

      // Clear selection on Escape
      if (e.key === 'Escape') {
        setSelectedProjects(new Set());
        setSearchQuery('');
      }

      // Select all on Cmd/Ctrl + A
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && selectedProjects.size > 0) {
        e.preventDefault();
        setSelectedProjects(new Set(filteredProjects.map((p) => p.id)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProjects.size]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((project) => {
        // Search filter
        const matchesSearch =
          project.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          project.style.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          project.tags.some((tag) => tag.toLowerCase().includes(debouncedSearch.toLowerCase()));

        // Room type filter
        const matchesRoomType =
          selectedRoomType === 'all' || project.roomType === selectedRoomType;

        // Tab filter
        let matchesTab = true;
        if (tabFilter === 'favorites') matchesTab = project.isFavorite;
        if (tabFilter === 'archived') matchesTab = project.isArchived;
        if (tabFilter === 'all') matchesTab = !project.isArchived;

        return matchesSearch && matchesRoomType && matchesTab;
      })
      .sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'rendersCount':
            comparison = a.rendersCount - b.rendersCount;
            break;
          case 'vastuScore':
            comparison = (a.vastuScore || 0) - (b.vastuScore || 0);
            break;
          case 'createdAt':
          case 'updatedAt':
          default:
            // For demo, use render count as proxy for date
            comparison = a.rendersCount - b.rendersCount;
        }

        return sortOrder === 'desc' ? -comparison : comparison;
      });
  }, [projects, debouncedSearch, selectedRoomType, tabFilter, sortBy, sortOrder]);

  // Toggle selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Select all
  const selectAll = useCallback(() => {
    if (selectedProjects.size === filteredProjects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(filteredProjects.map((p) => p.id)));
    }
  }, [filteredProjects, selectedProjects.size]);

  // Toggle favorite
  const toggleFavorite = useCallback((id: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p))
    );
    toast({
      title: 'Updated',
      description: 'Favorite status changed',
    });
  }, [toast]);

  // Delete project
  const deleteProject = useCallback(
    (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setSelectedProjects((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setShowDeleteDialog(false);
      setProjectToDelete(null);
      toast({
        title: 'Deleted',
        description: 'Project has been deleted',
      });
    },
    [toast]
  );

  // Delete selected projects
  const deleteSelectedProjects = useCallback(() => {
    setProjects((prev) => prev.filter((p) => !selectedProjects.has(p.id)));
    setSelectedProjects(new Set());
    setShowDeleteDialog(false);
    toast({
      title: 'Deleted',
      description: `${selectedProjects.size} projects have been deleted`,
    });
  }, [selectedProjects, toast]);

  // Duplicate project
  const duplicateProject = useCallback(
    (id: string) => {
      const project = projects.find((p) => p.id === id);
      if (project) {
        const newProject: Project = {
          ...project,
          id: Date.now().toString(),
          name: `${project.name} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: 'Just now',
          isFavorite: false,
        };
        setProjects((prev) => [newProject, ...prev]);
        toast({
          title: 'Duplicated',
          description: 'Project has been duplicated',
        });
      }
    },
    [projects, toast]
  );

  // Rename project
  const renameProject = useCallback(() => {
    if (!projectToRename || !newProjectName.trim()) return;

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectToRename.id ? { ...p, name: newProjectName.trim() } : p
      )
    );
    setShowRenameModal(false);
    setProjectToRename(null);
    setNewProjectName('');
    toast({
      title: 'Renamed',
      description: 'Project has been renamed',
    });
  }, [projectToRename, newProjectName, toast]);

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto pb-8"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-500 mt-1">
              Manage and organize your interior design projects
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Keyboard Hint */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-500">
                  <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border">N</span>
                  <span>New</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Press N to create new project</TooltipContent>
            </Tooltip>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/editor"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-600/25 hover:shadow-xl hover:shadow-violet-600/30 transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                <span>New Project</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Bar */}
        {!isLoading && <StatsBar projects={projects} />}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Tabs value={tabFilter} onValueChange={(v) => setTabFilter(v as TabFilter)}>
            <TabsList className="bg-gray-100/80 p-1">
              <TabsTrigger value="all" className="data-[state=active]:bg-white">
                All Projects
                <Badge variant="secondary" className="ml-2 bg-gray-200">
                  {projects.filter((p) => !p.isArchived).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="favorites" className="data-[state=active]:bg-white">
                <Heart className="w-4 h-4 mr-1.5" />
                Favorites
                <Badge variant="secondary" className="ml-2 bg-gray-200">
                  {projects.filter((p) => p.isFavorite).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="recent" className="data-[state=active]:bg-white">
                <Clock className="w-4 h-4 mr-1.5" />
                Recent
              </TabsTrigger>
              <TabsTrigger value="archived" className="data-[state=active]:bg-white">
                <Archive className="w-4 h-4 mr-1.5" />
                Archived
                <Badge variant="secondary" className="ml-2 bg-gray-200">
                  {projects.filter((p) => p.isArchived).length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search projects, styles, tags... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-2.5 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Room Type Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              {roomTypeFilters.map((type) => {
                const Icon = type.icon;
                return (
                  <Tooltip key={type.value}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setSelectedRoomType(type.value)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                          selectedRoomType === type.value
                            ? 'bg-violet-100 text-violet-700 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{type.label}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="sm:hidden">{type.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* Sort & View Controls */}
            <div className="flex items-center gap-2">
              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <ArrowUpDown className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {sortOptions.find((o) => o.value === sortBy)?.label}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {sortOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => {
                          if (sortBy === option.value) {
                            setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                          } else {
                            setSortBy(option.value);
                            setSortOrder('desc');
                          }
                        }}
                        className={cn(sortBy === option.value && 'bg-violet-50 text-violet-700')}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {option.label}
                        {sortBy === option.value && (
                          <span className="ml-auto text-xs">
                            {sortOrder === 'desc' ? '↓' : '↑'}
                          </span>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'p-2 rounded-lg transition-all',
                        viewMode === 'grid'
                          ? 'bg-white text-violet-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      )}
                    >
                      <Grid3X3 className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Grid view (V)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'p-2 rounded-lg transition-all',
                        viewMode === 'list'
                          ? 'bg-white text-violet-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      )}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>List view (V)</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedProjects.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-4"
            >
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedProjects.size === filteredProjects.length}
                    onCheckedChange={selectAll}
                  />
                  <span className="text-sm font-medium text-violet-700">
                    {selectedProjects.size} selected
                  </span>
                  <button
                    onClick={() => setSelectedProjects(new Set())}
                    className="text-sm text-violet-600 hover:text-violet-700 underline"
                  >
                    Clear
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Archive className="w-4 h-4" />
                    Archive
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Projects Grid/List */}
        <LayoutGroup>
          {isLoading ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <ProjectCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <ProjectListSkeleton key={i} />
                ))}
              </div>
            )
          ) : filteredProjects.length > 0 ? (
            viewMode === 'grid' ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {filteredProjects.map((project, index) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      index={index}
                      isSelected={selectedProjects.has(project.id)}
                      onSelect={toggleSelection}
                      onToggleFavorite={toggleFavorite}
                      onOpenMenu={() => {}}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              >
                {/* List Header */}
                <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                  <Checkbox
                    checked={
                      selectedProjects.size > 0 &&
                      selectedProjects.size === filteredProjects.length
                    }
                    onCheckedChange={selectAll}
                    className="h-4 w-4"
                  />
                  <div className="w-12" />
                  <div className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Name
                  </div>
                  <div className="hidden md:block w-24 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Room
                  </div>
                  <div className="hidden lg:block w-16 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Vastu
                  </div>
                  <div className="hidden xl:block w-20 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Est. Cost
                  </div>
                  <div className="hidden sm:block w-16 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Renders
                  </div>
                  <div className="hidden md:block w-24 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Modified
                  </div>
                  <div className="w-20" />
                </div>

                {/* List Items */}
                <AnimatePresence mode="popLayout">
                  {filteredProjects.map((project) => (
                    <ProjectListItem
                      key={project.id}
                      project={project}
                      isSelected={selectedProjects.has(project.id)}
                      onSelect={toggleSelection}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-gray-100 p-16 text-center"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                {searchQuery || selectedRoomType !== 'all' ? (
                  <Search className="w-12 h-12 text-violet-300" />
                ) : tabFilter === 'favorites' ? (
                  <Heart className="w-12 h-12 text-violet-300" />
                ) : tabFilter === 'archived' ? (
                  <Archive className="w-12 h-12 text-violet-300" />
                ) : (
                  <FolderPlus className="w-12 h-12 text-violet-300" />
                )}
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {searchQuery
                  ? 'No matching projects'
                  : tabFilter === 'favorites'
                  ? 'No favorites yet'
                  : tabFilter === 'archived'
                  ? 'No archived projects'
                  : 'No projects yet'}
              </h3>

              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {searchQuery
                  ? `No projects matching "${searchQuery}". Try a different search term.`
                  : tabFilter === 'favorites'
                  ? 'Mark your favorite projects with a heart to see them here.'
                  : tabFilter === 'archived'
                  ? 'Archived projects will appear here.'
                  : 'Create your first project and start transforming spaces with AI-powered interior design.'}
              </p>

              {!searchQuery && tabFilter === 'all' && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/editor"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-600/25 hover:shadow-xl hover:shadow-violet-600/30 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Create Your First Project
                  </Link>
                </motion.div>
              )}

              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery('')} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Clear Search
                </Button>
              )}
            </motion.div>
          )}
        </LayoutGroup>

        {/* Results Count */}
        {!isLoading && filteredProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center text-sm text-gray-500"
          >
            Showing {filteredProjects.length} of {projects.filter((p) => !p.isArchived).length}{' '}
            projects
          </motion.div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Delete {selectedProjects.size > 1 ? 'Projects' : 'Project'}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete{' '}
                {selectedProjects.size > 1
                  ? `${selectedProjects.size} projects`
                  : 'this project'}{' '}
                and all associated renders.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteSelectedProjects}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Rename Modal */}
        <Dialog open={showRenameModal} onOpenChange={setShowRenameModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Project</DialogTitle>
              <DialogDescription>Enter a new name for your project.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                className="w-full"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRenameModal(false)}>
                Cancel
              </Button>
              <Button onClick={renameProject} disabled={!newProjectName.trim()}>
                <Check className="w-4 h-4 mr-2" />
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Keyboard Shortcuts Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-6 right-6 hidden lg:flex items-center gap-4 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg text-xs text-gray-500"
        >
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">⌘K</kbd>
            <span>Search</span>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">N</kbd>
            <span>New</span>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">V</kbd>
            <span>View</span>
          </div>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
}