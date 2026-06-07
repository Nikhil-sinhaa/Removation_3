// app/(app)/projects/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { BeforeAfterSlider } from '@/components/ui/before-after-slider';
import { downloadMultiRoomZip } from '@/lib/ai/download-multi-room';
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
import { TagInput } from '@/components/tags/TagInput';
import { TagCloud } from '@/components/tags/TagCloud';
import type { ITag } from '@/lib/db/models/Tag';
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
import { useLanguage } from '@/hooks/useLanguage';

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
  resultImage: string | null;
  description: string | null;
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
  processingType?: string;
  tags: string[];
}

function getProjectDetailUrl(project: Project): string {
  if (project.processingType === 'multi-room-3d') {
    return `/projects/${project.id}/multi-room-3d`;
  }
  return `/editor/${project.id}`;
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
    resultImage: null,
    description: 'Modern Minimalist style',
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
    resultImage: null,
    description: 'Scandinavian style',
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
    resultImage: null,
    description: 'Contemporary style',
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
    resultImage: null,
    description: 'Industrial style',
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
    resultImage: null,
    description: 'Luxury Modern style',
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
    resultImage: null,
    description: 'Playful Modern style',
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
    resultImage: null,
    description: 'Tropical style',
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
  { label: 'All Rooms', value: 'all', icon: LayoutGrid, key: 'all_rooms' },
  { label: 'Living Room', value: 'Living Room', icon: Home, key: 'room_living_room' },
  { label: 'Bedroom', value: 'Bedroom', icon: Bed, key: 'room_bedroom' },
  { label: 'Kitchen', value: 'Kitchen', icon: ChefHat, key: 'room_kitchen' },
  { label: 'Bathroom', value: 'Bathroom', icon: Bath, key: 'room_bathroom' },
  { label: 'Office', value: 'Office', icon: Briefcase, key: 'room_office' },
  { label: 'Dining', value: 'Dining Room', icon: Utensils, key: 'room_dining_room' },
  { label: 'Outdoor', value: 'Outdoor', icon: TreePine, key: 'outdoor_rooms' },
];

const sortOptions: { label: string; value: SortOption; icon: React.ElementType; key: string }[] = [
  { label: 'Last Modified', value: 'updatedAt', icon: Clock, key: 'proj_sort_modified' },
  { label: 'Date Created', value: 'createdAt', icon: Calendar, key: 'proj_sort_created' },
  { label: 'Name A-Z', value: 'name', icon: SortAsc, key: 'proj_sort_name' },
  { label: 'Most Renders', value: 'rendersCount', icon: Layers, key: 'proj_sort_renders' },
  { label: 'Vastu Score', value: 'vastuScore', icon: Compass, key: 'proj_sort_vastu' },
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
  const { t } = useLanguage();
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
        { label: t('proj_total_projects_count'), key: 'total', value: totalProjects, icon: Folder, color: 'violet' },
        { label: t('proj_ai_renders_count'), key: 'renders', value: totalRenders, icon: Sparkles, color: 'pink' },
        { label: t('proj_avg_vastu_score'), key: 'vastu', value: avgVastuScore, icon: Compass, color: 'orange' },
        { label: t('proj_favorites_count'), key: 'favorites', value: favoriteCount, icon: Heart, color: 'red' },
      ].map((stat) => (
        <motion.div
          key={stat.key}
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

const translateRoomType = (roomType: string, t: any) => {
  const mapping: Record<string, string> = {
    'Living Room': 'room_living_room',
    'Bedroom': 'room_bedroom',
    'Kitchen': 'room_kitchen',
    'Bathroom': 'room_bathroom',
    'Office': 'room_office',
    'Dining Room': 'room_dining_room',
    'Outdoor': 'outdoor_rooms',
  };
  const key = mapping[roomType];
  return key ? t(key) : roomType;
};

const translateStyle = (style: string, t: any) => {
  const normalized = `style_${style.toLowerCase().replace(/[\s-]/g, '_')}`;
  const translation = t(normalized);
  return translation !== normalized ? translation : style;
};

// Project Card Component
function ProjectCard({
  project,
  index,
  isSelected,
  onSelect,
  onToggleFavorite,
  onOpenMenu,
  onCompare,
  downloadingProjectId,
  onDownloadMultiRoom,
  onRename,
  onDuplicate,
  onDelete,
}: {
  project: Project;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenMenu: (id: string, e: React.MouseEvent) => void;
  onCompare?: (project: Project) => void;
  downloadingProjectId: string | null;
  onDownloadMultiRoom: (id: string, name: string) => void;
  onRename?: (project: Project) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const { t, language } = useLanguage();
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
    if (language === 'hi') {
      if (cost >= 10000000) return `₹${(cost / 10000000).toFixed(1)} करोड़`;
      if (cost >= 100000) return `₹${(cost / 100000).toFixed(1)} लाख`;
      if (cost >= 1000) return `₹${(cost / 1000).toFixed(1)} हज़ार`;
      return `₹${cost}`;
    }
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
      <Link href={getProjectDetailUrl(project)}>
        <div className="aspect-video relative overflow-hidden">
          {/* Thumbnail: real image or gradient fallback */}
          {project.thumbnail ? (
            <img
              src={project.thumbnail}
              alt={project.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <>
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-br opacity-80',
                  colors.gradient
                )}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <RoomIcon className="w-8 h-8 text-white" />
                </div>
              </div>
            </>
          )}

          {/* Result image badge (small overlay in corner) */}
          {project.resultImage && (
            <div className="absolute bottom-2 right-2 w-16 h-12 rounded-md overflow-hidden border-2 border-white shadow-lg">
              <img
                src={project.resultImage}
                alt="AI Result"
                className="w-full h-full object-cover"
              />
            </div>
          )}

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
              {t('proj_processing')}
            </div>
          )}

          {/* Download Floating Button for Multi-Room-3D */}
          {project.processingType === 'multi-room-3d' && project.status === 'completed' && (
            <a
              href={`/api/multi-room/download/${project.id}`}
              download
              onClick={(e) => e.stopPropagation()} // prevent card click
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg transition-colors z-20 animate-fade-in"
              title={t('proj_download_tooltip')}
            >
              <Download size={16} />
            </a>
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
                <TooltipContent>{t('proj_vastu_score_tooltip')}</TooltipContent>
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
            <Link href={getProjectDetailUrl(project)}>
              <h3 className="font-semibold text-gray-900 truncate group-hover:text-violet-600 transition-colors">
                {project.name}
              </h3>
            </Link>
            {project.description && (
              <p className="text-xs text-gray-500 mt-0.5 truncate italic">{project.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className={cn('px-2 py-0.5 rounded text-xs font-medium', colors.bg, colors.text)}>
                {translateRoomType(project.roomType, t)}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500 truncate">{translateStyle(project.style, t)}</span>
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
              <TooltipContent>{project.isFavorite ? t('proj_remove_fav') : t('proj_add_fav')}</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={getProjectDetailUrl(project)} className="flex items-center w-full cursor-pointer">
                    <Eye className="w-4 h-4 mr-2" />
                    {t('proj_view_details')}
                  </Link>
                </DropdownMenuItem>
                {project.thumbnail && project.resultImage && onCompare && (
                  <DropdownMenuItem onClick={() => onCompare(project)}>
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    {t('proj_compare')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onRename?.(project)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  {t('proj_action_rename')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate?.(project.id)}>
                  <Copy className="w-4 h-4 mr-2" />
                  {t('proj_action_duplicate')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Share2 className="w-4 h-4 mr-2" />
                  {t('proj_action_share')}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  {t('proj_action_export_all')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Archive className="w-4 h-4 mr-2" />
                  {t('proj_action_archive')}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={() => onDelete?.(project.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('proj_action_delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Cost Estimate */}
        {project.estimatedCost && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
            <IndianRupee className="w-3.5 h-3.5" />
            <span>{t('proj_estimated_cost_prefix', { cost: formatCost(project.estimatedCost) })}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {project.updatedAt}
          </span>

          {/* Tags */}
          <div className="mt-1" onClick={e => e.stopPropagation()}>
            <TagInput itemId={project.id} itemType="project" compact />
          </div>
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
  downloadingProjectId,
  onDownloadMultiRoom,
  onRename,
  onDuplicate,
  onDelete,
}: {
  project: Project;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  downloadingProjectId: string | null;
  onDownloadMultiRoom: (id: string, name: string) => void;
  onRename?: (project: Project) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const { t, language } = useLanguage();
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
    if (language === 'hi') {
      if (cost >= 10000000) return `₹${(cost / 10000000).toFixed(1)} करोड़`;
      if (cost >= 100000) return `₹${(cost / 100000).toFixed(1)} लाख`;
      if (cost >= 1000) return `₹${(cost / 1000).toFixed(1)} हज़ार`;
      return `₹${cost}`;
    }
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
      <Link href={getProjectDetailUrl(project)}>
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
        <Link href={getProjectDetailUrl(project)}>
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-violet-600 transition-colors">
            {project.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-500 truncate">{translateStyle(project.style, t)}</p>
      </div>

      {/* Room Type */}
      <div className="hidden md:block">
        <span className={cn('px-2 py-1 rounded text-xs font-medium', colors.bg, colors.text)}>
          {translateRoomType(project.roomType, t)}
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
        {project.processingType === 'multi-room-3d' && project.status === 'completed' && (
          <a
            href={`/api/multi-room/download/${project.id}`}
            download
            onClick={(e) => e.stopPropagation()} // prevent row click
            className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors z-10"
            title={t('proj_download_tooltip')}
          >
            <Download className="w-4 h-4" />
          </a>
        )}

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
            <DropdownMenuItem asChild>
              <Link href={getProjectDetailUrl(project)} className="flex items-center w-full cursor-pointer">
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('proj_action_open')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRename?.(project)}>
              <Edit3 className="w-4 h-4 mr-2" />
              {t('proj_action_rename')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate?.(project.id)}>
              <Copy className="w-4 h-4 mr-2" />
              {t('proj_action_duplicate')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={() => onDelete?.(project.id)}>
              <Trash2 className="w-4 h-4 mr-2" />
              {t('proj_action_delete')}
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
  const { t, language } = useLanguage();
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
  const [downloadingProjectId, setDownloadingProjectId] = useState<string | null>(null);

  // Download Handler for Multi-Room
  const handleDownloadMultiRoom = async (projectId: string, projectName: string) => {
    setDownloadingProjectId(projectId);
    toast({
      title: t('proj_preparing_download'),
      description: t('proj_gathering_photos', { name: projectName }),
    });
    try {
      const res = await fetch(`/api/multi-room/project-detail/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch project details');
      const data = await res.json();
      await downloadMultiRoomZip(data.projectId, data.photos);
      toast({
        title: t('proj_download_success_title'),
        description: t('proj_download_success_desc'),
      });
    } catch (err) {
      console.error(err);
      toast({
        title: t('proj_download_error_title'),
        description: t('proj_download_error_desc'),
        variant: 'destructive',
      });
    } finally {
      setDownloadingProjectId(null);
    }
  };

  // Modals
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');

  // Compare modal
  const [compareProject, setCompareProject] = useState<Project | null>(null);

  // Tag filter
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [tagFilteredIds, setTagFilteredIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!selectedTagId) { setTagFilteredIds(null); return; }
    fetch(`/api/tags/${selectedTagId}/items?type=project`)
      .then(r => r.json())
      .then(d => setTagFilteredIds(new Set((d.itemIds || []) as string[])))
      .catch(() => setTagFilteredIds(null));
  }, [selectedTagId]);

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Load projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/ai/history');
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        } else {
          console.error("Failed to fetch projects");
          setProjects(sampleProjects); // Fallback
        }
      } catch (err) {
        console.error("Error fetching projects", err);
        setProjects(sampleProjects); // Fallback
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjects();
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

        const matchesTag = !tagFilteredIds || tagFilteredIds.has(project.id);
        return matchesSearch && matchesRoomType && matchesTab && matchesTag;
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
  }, [projects, debouncedSearch, selectedRoomType, tabFilter, sortBy, sortOrder, tagFilteredIds]);

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
      title: t('proj_updated_toast_title'),
      description: t('proj_updated_toast_desc'),
    });
  }, [toast, t]);

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
        title: t('proj_deleted_toast_title'),
        description: t('proj_deleted_toast_desc_single'),
      });
    },
    [toast, t]
  );

  // Delete selected projects
  const deleteSelectedProjects = useCallback(() => {
    const deletedCount = selectedProjects.size;
    setProjects((prev) => prev.filter((p) => !selectedProjects.has(p.id)));
    setSelectedProjects(new Set());
    setShowDeleteDialog(false);
    toast({
      title: t('proj_deleted_toast_title'),
      description: t('proj_deleted_toast_desc_multiple', { count: deletedCount.toString() }),
    });
  }, [selectedProjects, toast, t]);

  // Duplicate project
  const duplicateProject = useCallback(
    (id: string) => {
      const project = projects.find((p) => p.id === id);
      if (project) {
        const newProject: Project = {
          ...project,
          id: Date.now().toString(),
          name: `${project.name} (${language === 'hi' ? 'कॉपी' : 'Copy'})`,
          createdAt: new Date().toISOString(),
          updatedAt: language === 'hi' ? 'अभी-अभी' : 'Just now',
          isFavorite: false,
        };
        setProjects((prev) => [newProject, ...prev]);
        toast({
          title: t('proj_duplicated_toast_title'),
          description: t('proj_duplicated_toast_desc'),
        });
      }
    },
    [projects, toast, t, language]
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
      title: t('proj_renamed_toast_title'),
      description: t('proj_renamed_toast_desc'),
    });
  }, [projectToRename, newProjectName, toast, t]);

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('proj_title')}</h1>
            <p className="text-gray-500 mt-1">
              {t('proj_subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Keyboard Hint */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-500">
                  <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border">N</span>
                  <span>{t('proj_new')}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>{language === 'hi' ? 'नया प्रोजेक्ट बनाने के लिए N दबाएं' : 'Press N to create new project'}</TooltipContent>
            </Tooltip>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/editor"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-600/25 hover:shadow-xl hover:shadow-violet-600/30 transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                <span>{t('proj_new_project')}</span>
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
                {t('proj_tab_all')}
                <Badge variant="secondary" className="ml-2 bg-gray-200">
                  {projects.filter((p) => !p.isArchived).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="favorites" className="data-[state=active]:bg-white">
                <Heart className="w-4 h-4 mr-1.5" />
                {t('proj_tab_favorites')}
                <Badge variant="secondary" className="ml-2 bg-gray-200">
                  {projects.filter((p) => p.isFavorite).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="recent" className="data-[state=active]:bg-white">
                <Clock className="w-4 h-4 mr-1.5" />
                {t('proj_tab_recent')}
              </TabsTrigger>
              <TabsTrigger value="archived" className="data-[state=active]:bg-white">
                <Archive className="w-4 h-4 mr-1.5" />
                {t('proj_tab_archived')}
                <Badge variant="secondary" className="ml-2 bg-gray-200">
                  {projects.filter((p) => p.isArchived).length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Tag Cloud Filter */}
        {selectedTagId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 flex items-center gap-2 flex-wrap"
          >
            <span className="text-sm text-gray-500">Filtered by tag:</span>
            <button
              onClick={() => setSelectedTagId(null)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200 hover:bg-violet-200 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear filter
            </button>
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mb-4"
        >
          <TagCloud
            onSelect={(tag: ITag) => setSelectedTagId(prev => prev === String(tag._id) ? null : String(tag._id))}
            selectedTagId={selectedTagId || undefined}
            showCount
          />
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
                placeholder={t('proj_search_placeholder')}
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
                        <span className="hidden sm:inline">{t(type.key as any) || type.label}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="sm:hidden">{t(type.key as any) || type.label}</TooltipContent>
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
                      {(() => {
                        const currentOption = sortOptions.find((o) => o.value === sortBy);
                        return currentOption ? (t(currentOption.key as any) || currentOption.label) : '';
                      })()}
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
                        {t(option.key as any) || option.label}
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
                  <TooltipContent>{language === 'hi' ? 'ग्रिड दृश्य (V)' : 'Grid view (V)'}</TooltipContent>
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
                  <TooltipContent>{language === 'hi' ? 'सूची दृश्य (V)' : 'List view (V)'}</TooltipContent>
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
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <Checkbox
                    checked={selectedProjects.size === filteredProjects.length}
                    onCheckedChange={selectAll}
                  />
                  <span className="text-sm font-medium text-violet-700">
                    {language === 'hi' ? `${selectedProjects.size} चयनित` : `${selectedProjects.size} selected`}
                  </span>
                  <button
                    onClick={() => setSelectedProjects(new Set())}
                    className="text-sm text-violet-600 hover:text-violet-700 underline"
                  >
                    {language === 'hi' ? 'साफ़ करें' : 'Clear'}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none">
                    <Download className="w-4 h-4" />
                    {language === 'hi' ? 'निर्यात करें' : 'Export'}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none">
                    <Archive className="w-4 h-4" />
                    {language === 'hi' ? 'संग्रह करें' : 'Archive'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2 flex-1 sm:flex-none"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                    {language === 'hi' ? 'हटाएं' : 'Delete'}
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
                      onCompare={(p) => setCompareProject(p)}
                      downloadingProjectId={downloadingProjectId}
                      onDownloadMultiRoom={handleDownloadMultiRoom}
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
                    {language === 'hi' ? 'नाम' : 'Name'}
                  </div>
                  <div className="hidden md:block w-24 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {language === 'hi' ? 'कमरा' : 'Room'}
                  </div>
                  <div className="hidden lg:block w-16 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {language === 'hi' ? 'वास्तु' : 'Vastu'}
                  </div>
                  <div className="hidden xl:block w-20 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {language === 'hi' ? 'अनुमानित लागत' : 'Est. Cost'}
                  </div>
                  <div className="hidden sm:block w-16 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {language === 'hi' ? 'रेंडर्स' : 'Renders'}
                  </div>
                  <div className="hidden md:block w-24 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {language === 'hi' ? 'संशोधित' : 'Modified'}
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
                       downloadingProjectId={downloadingProjectId}
                       onDownloadMultiRoom={handleDownloadMultiRoom}
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
                  ? (language === 'hi' ? 'कोई मेल खाने वाले प्रोजेक्ट नहीं' : 'No matching projects')
                  : tabFilter === 'favorites'
                  ? (language === 'hi' ? 'अभी तक कोई पसंदीदा नहीं' : 'No favorites yet')
                  : tabFilter === 'archived'
                  ? (language === 'hi' ? 'कोई संग्रहीत प्रोजेक्ट नहीं' : 'No archived projects')
                  : (language === 'hi' ? 'अभी तक कोई प्रोजेक्ट नहीं' : 'No projects yet')}
              </h3>

              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {searchQuery
                  ? (language === 'hi' ? `कोई प्रोजेक्ट "${searchQuery}" से मेल नहीं खाता। कोई दूसरा शब्द खोजें।` : `No projects matching "${searchQuery}". Try a different search term.`)
                  : tabFilter === 'favorites'
                  ? (language === 'hi' ? 'अपने पसंदीदा प्रोजेक्ट्स को दिल के निशान से चिह्नित करें ताकि वे यहाँ दिखाई दे सकें।' : 'Mark your favorite projects with a heart to see them here.')
                  : tabFilter === 'archived'
                  ? (language === 'hi' ? 'संग्रहीत प्रोजेक्ट यहाँ दिखाई देंगे।' : 'Archived projects will appear here.')
                  : (language === 'hi' ? 'अपना पहला प्रोजेक्ट बनाएं और एआई-संचालित इंटीरियर डिज़ाइन के साथ स्थानों को बदलना शुरू करें।' : 'Create your first project and start transforming spaces with AI-powered interior design.')}
              </p>

              {!searchQuery && tabFilter === 'all' && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/editor"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-600/25 hover:shadow-xl hover:shadow-violet-600/30 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    {language === 'hi' ? 'अपना पहला प्रोजेक्ट बनाएं' : 'Create Your First Project'}
                  </Link>
                </motion.div>
              )}

              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery('')} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  {language === 'hi' ? 'खोज साफ़ करें' : 'Clear Search'}
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
            {language === 'hi' ? (
              <>
                {projects.filter((p) => !p.isArchived).length} प्रोजेक्ट्स में से {filteredProjects.length} दिखा रहा है
              </>
            ) : (
              <>
                Showing {filteredProjects.length} of {projects.filter((p) => !p.isArchived).length}{' '}
                projects
              </>
            )}
          </motion.div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                {language === 'hi' ? (
                  <>क्या {selectedProjects.size > 1 ? 'प्रोजेक्ट्स' : 'प्रोजेक्ट'} हटाना चाहते हैं?</>
                ) : (
                  <>Delete {selectedProjects.size > 1 ? 'Projects' : 'Project'}?</>
                )}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {language === 'hi' ? (
                  <>
                    यह क्रिया पूर्ववत नहीं की जा सकती। इससे{' '}
                    {selectedProjects.size > 1
                      ? `${selectedProjects.size} प्रोजेक्ट्स`
                      : 'इस प्रोजेक्ट'}{' '}
                    और सभी संबद्ध रेंडर स्थायी रूप से हटा दिए जाएंगे।
                  </>
                ) : (
                  <>
                    This action cannot be undone. This will permanently delete{' '}
                    {selectedProjects.size > 1
                      ? `${selectedProjects.size} projects`
                      : 'this project'}{' '}
                    and all associated renders.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{language === 'hi' ? 'रद्द करें' : 'Cancel'}</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteSelectedProjects}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {language === 'hi' ? 'हटाएं' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Rename Modal */}
        <Dialog open={showRenameModal} onOpenChange={setShowRenameModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === 'hi' ? 'प्रोजेक्ट का नाम बदलें' : 'Rename Project'}</DialogTitle>
              <DialogDescription>
                {language === 'hi' ? 'अपने प्रोजेक्ट के लिए एक नया नाम दर्ज करें।' : 'Enter a new name for your project.'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder={language === 'hi' ? 'प्रोजेक्ट का नाम' : 'Project name'}
                className="w-full"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRenameModal(false)}>
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </Button>
              <Button onClick={renameProject} disabled={!newProjectName.trim()}>
                <Check className="w-4 h-4 mr-2" />
                {language === 'hi' ? 'सहेजें' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Compare Before/After Modal */}
        <Dialog open={!!compareProject} onOpenChange={(open) => !open && setCompareProject(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-violet-600" />
                {compareProject?.name} — {language === 'hi' ? 'पहले / बाद में' : 'Before / After'}
              </DialogTitle>
              <DialogDescription>
                {compareProject?.description}
              </DialogDescription>
            </DialogHeader>
            {compareProject?.thumbnail && compareProject?.resultImage && (
              <BeforeAfterSlider
                beforeImage={compareProject.thumbnail}
                afterImage={compareProject.resultImage}
                beforeLabel={language === 'hi' ? 'मूल' : 'Original'}
                afterLabel={language === 'hi' ? 'एआई पुनर्रेखांकित' : 'AI Redesigned'}
              />
            )}
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
            <span>{language === 'hi' ? 'खोजें' : 'Search'}</span>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">N</kbd>
            <span>{t('proj_new')}</span>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">V</kbd>
            <span>{language === 'hi' ? 'देखें' : 'View'}</span>
          </div>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
}